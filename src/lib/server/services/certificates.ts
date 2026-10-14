// ============================================================
// Certificate Service — SERVER ONLY
//
// Flow:
//   1. Check eligibility (stage/all-stages completed)
//   2. Check no duplicate certificate exists
//   3. Load HTML template from certificate_templates
//   4. Inject user/achievement data into template
//   5. Generate PDF via puppeteer-core + chromium
//   6. Upload PDF to Google Drive (99 - System → Certificates)
//   7. Save drive_files metadata row
//   8. Save certificates row with drive_file_id + verification_code
//
// Security:
//   - Employees can only access their own certificates (RLS)
//   - Verification endpoint is public but only exposes minimal data
//   - PDF stored in Drive; streamed via server-side /api/files/:id/stream
// ============================================================

import { createSupabaseAdminClient } from '$lib/server/supabase';
import { uploadFile } from '$lib/server/google-drive/upload';
import { findOrCreateFolder } from '$lib/server/google-drive/folders';
import { saveDriveFileMetadata } from '$lib/server/services/drive-metadata';
import { GOOGLE_DRIVE_SYSTEM_FOLDER_ID } from '$env/static/private';
import type { Tables } from '$lib/types/database.types';
import { Readable } from 'stream';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (client: ReturnType<typeof createSupabaseAdminClient>, table: string) => (client as any).from(table);

// ── Certificate generation ───────────────────────────────────

export interface IssueCertificateParams {
	userId: string;
	userFullName: string;
	entityType: string; // e.g. 'GJ_STAGE' | 'GJ_ALL_STAGES'
	entityId?: string; // stage UUID or null for all-stages
	entityLabel: string; // human-readable label in the cert
	templateName?: string; // defaults to 'Growth Journey Stage'
}

/**
 * Issue a certificate. Idempotent — if a certificate already exists
 * for this user + entityType + entityId, returns the existing one.
 */
export async function issueCertificate(
	params: IssueCertificateParams
): Promise<Tables<'certificates'>> {
	const admin = createSupabaseAdminClient();

	// 1. Check for existing certificate
	const existing = await getCertificate(params.userId, params.entityType, params.entityId);
	if (existing) return existing;

	// 2. Load template
	const templateName = params.templateName ?? 'Growth Journey Stage';
	const { data: template } = await q(admin, 'certificate_templates')
		.select('*')
		.eq('name', templateName)
		.eq('is_active', true)
		.maybeSingle();

	// 3. Build HTML — substitute placeholders
	const issuedDate = new Date().toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	// Generate verification code
	const verificationCode = generateVerificationCode();

	let html =
		(template as Tables<'certificate_templates'> | null)?.html_template ?? buildDefaultHtml();
	html = html
		.replace(/\{\{employee_name\}\}/g, escapeHtml(params.userFullName))
		.replace(/\{\{entity_label\}\}/g, escapeHtml(params.entityLabel))
		.replace(/\{\{issued_date\}\}/g, issuedDate)
		.replace(/\{\{verification_code\}\}/g, verificationCode);

	// 4. Generate PDF
	let pdfBuffer: Buffer;
	try {
		pdfBuffer = await generatePDF(html);
	} catch (err) {
		// PDF generation failed — still issue certificate without PDF
		console.error('Certificate PDF generation failed:', err);
		pdfBuffer = Buffer.alloc(0);
	}

	// 5. Upload PDF to Drive (if generated)
	let driveFileRow: Tables<'drive_files'> | null = null;

	if (pdfBuffer.length > 0 && GOOGLE_DRIVE_SYSTEM_FOLDER_ID) {
		try {
			// Find/create Certificates subfolder
			const certFolder = await findOrCreateFolder('Certificates', GOOGLE_DRIVE_SYSTEM_FOLDER_ID);

			const fileName = `cert_${params.userId.slice(0, 8)}_${Date.now()}.pdf`;
			const uploadResult = await uploadFile(
				{
					body: Readable.from(pdfBuffer),
					name: fileName,
					mimeType: 'application/pdf',
					folderId: certFolder.id,
					sizeBytes: pdfBuffer.length
				},
				pdfBuffer.length + 1024 // generous max (certs are always small)
			);

			driveFileRow = await saveDriveFileMetadata(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				admin as unknown as any,
				{
					uploadResult,
					storageArea: 'system',
					entityType: 'CERTIFICATE',
					entityId: undefined,
					uploadedBy: params.userId
				}
			);
		} catch (err) {
			console.error('Certificate Drive upload failed:', err);
		}
	}

	// 6. Save certificate row
	const { data: cert, error } = await q(admin, 'certificates')
		.insert({
			user_id: params.userId,
			entity_type: params.entityType,
			entity_id: params.entityId ?? null,
			entity_label: params.entityLabel,
			template_id: (template as Tables<'certificate_templates'> | null)?.id ?? null,
			drive_file_id: driveFileRow?.id ?? null,
			verification_code: verificationCode
		})
		.select()
		.single();

	if (error) {
		// If unique constraint violated — another process issued it concurrently
		if (error.code === '23505') {
			const existing2 = await getCertificate(params.userId, params.entityType, params.entityId);
			if (existing2) return existing2;
		}
		throw new Error(`Certificate issuance failed: ${error.message}`);
	}

	return cert as Tables<'certificates'>;
}

// ── Queries ──────────────────────────────────────────────────

export async function getCertificate(
	userId: string,
	entityType: string,
	entityId?: string
): Promise<Tables<'certificates'> | null> {
	const admin = createSupabaseAdminClient();

	const query = q(admin, 'certificates')
		.select('*')
		.eq('user_id', userId)
		.eq('entity_type', entityType);

	const result = entityId
		? await query.eq('entity_id', entityId).maybeSingle()
		: await query.is('entity_id', null).maybeSingle();

	return (result.data as Tables<'certificates'>) ?? null;
}

export async function getUserCertificates(
	userId: string
): Promise<Array<Tables<'certificates'> & { drive_file: Tables<'drive_files'> | null }>> {
	const admin = createSupabaseAdminClient();

	const { data } = await q(admin, 'certificates')
		.select('*, drive_file:drive_files(*)')
		.eq('user_id', userId)
		.order('issued_at', { ascending: false });

	return (data ?? []) as Array<
		Tables<'certificates'> & { drive_file: Tables<'drive_files'> | null }
	>;
}

/**
 * Verify a certificate by its verification_code.
 * Returns minimal public data only — no user PII.
 */
export async function verifyCertificate(verificationCode: string): Promise<{
	valid: boolean;
	entity_label?: string;
	issued_at?: string;
	verification_code?: string;
}> {
	const admin = createSupabaseAdminClient();

	const { data } = await q(admin, 'certificates')
		.select('entity_label, issued_at, verification_code')
		.eq('verification_code', verificationCode)
		.maybeSingle();

	if (!data) return { valid: false };

	const cert = data as Pick<
		Tables<'certificates'>,
		'entity_label' | 'issued_at' | 'verification_code'
	>;
	return {
		valid: true,
		entity_label: cert.entity_label,
		issued_at: cert.issued_at,
		verification_code: cert.verification_code
	};
}

// ── PDF generation ────────────────────────────────────────────

async function generatePDF(html: string): Promise<Buffer> {
	// Dynamic import — puppeteer-core is a heavy dependency
	const puppeteer = await import('puppeteer-core');

	// On Vercel, use @sparticuz/chromium for the executable path.
	// Locally, fall back to any installed Chrome/Chromium.
	let executablePath: string | undefined;
	try {
		const chromium = await import('@sparticuz/chromium');
		executablePath = await chromium.default.executablePath();
	} catch {
		// Local dev fallback — let puppeteer find Chrome automatically
		executablePath = undefined;
	}

	const launchOptions: Parameters<typeof puppeteer.default.launch>[0] = {
		headless: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
	};

	if (executablePath) {
		launchOptions.executablePath = executablePath;
	}

	const browser = await puppeteer.default.launch(launchOptions);

	try {
		const page = await browser.newPage();
		await page.setContent(html, { waitUntil: 'networkidle0' });
		const pdf = await page.pdf({
			format: 'A4',
			landscape: true,
			printBackground: true,
			margin: { top: '0', right: '0', bottom: '0', left: '0' }
		});
		return Buffer.from(pdf);
	} finally {
		await browser.close();
	}
}

// ── Helpers ───────────────────────────────────────────────────

function generateVerificationCode(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let code = '';
	for (let i = 0; i < 12; i++) {
		if (i > 0 && i % 4 === 0) code += '-';
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code; // Format: XXXX-XXXX-XXXX
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function buildDefaultHtml(): string {
	return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Sertifikat</title>
<style>
  body{font-family:'Arial',sans-serif;margin:0;padding:0;background:#fff;}
  .cert{width:842px;height:595px;padding:60px;box-sizing:border-box;
    border:8px solid #1C50A7;display:flex;flex-direction:column;
    align-items:center;justify-content:center;text-align:center;}
  h1{color:#1C50A7;font-size:34px;margin:0 0 8px;}
  h2{color:#163d82;font-size:20px;margin:0 0 20px;}
  .name{font-size:28px;font-weight:700;color:#1a1f2e;margin:14px 0;}
  .body{font-size:14px;color:#4b5563;line-height:1.6;max-width:580px;}
  .date{font-size:13px;color:#6b7280;margin-top:20px;}
  .code{font-size:11px;color:#9ca3af;margin-top:6px;font-family:monospace;}
</style></head>
<body><div class="cert">
  <h1>Audy Learning Centre</h1>
  <h2>Sertifikat Penyelesaian</h2>
  <p class="body">Dengan bangga diberikan kepada</p>
  <div class="name">{{employee_name}}</div>
  <p class="body">Atas keberhasilan menyelesaikan<br><strong>{{entity_label}}</strong></p>
  <div class="date">Diterbitkan pada {{issued_date}}</div>
  <div class="code">Kode: {{verification_code}}</div>
</div></body></html>`;
}
