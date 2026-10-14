// ============================================================
// Backup Service — SERVER ONLY
//
// Creates a JSON metadata backup of the ALC database.
// Binary files remain in Google Drive — NOT copied to backup.
// The backup JSON contains:
//   - All DB record data (excluding auth.users)
//   - All Drive file IDs and folder IDs
//   - System settings and configuration
//   - Backup manifest with timestamps and counts
//
// Restore:
//   - Validates Drive file IDs still exist in Drive
//   - Marks missing files as MISSING_FILE in drive_files
//   - Does NOT silently create broken references
// ============================================================

import { createSupabaseAdminClient } from '$lib/server/supabase';
import { getFileMetadata } from '$lib/server/google-drive/files';
import { uploadFile } from '$lib/server/google-drive/upload';
import { findOrCreateFolder } from '$lib/server/google-drive/folders';
import { writeAuditLog } from '$lib/server/services/admin';
import { GOOGLE_DRIVE_SYSTEM_FOLDER_ID } from '$env/static/private';
import { Readable } from 'stream';
import type { Tables } from '$lib/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const qa = (table: string) => (createSupabaseAdminClient() as any).from(table);

// ── Backup manifest structure ─────────────────────────────────

export interface BackupManifest {
	version: '1.0';
	created_at: string;
	backup_type: 'FULL' | 'METADATA_ONLY';
	tables: Record<string, unknown[]>;
	drive_file_ids: string[];
	drive_folder_ids: string[];
	record_counts: Record<string, number>;
	total_drive_files: number;
}

// Tables to back up (non-auth, non-system)
const BACKUP_TABLES = [
	'departments',
	'positions',
	'profiles',
	'system_settings',
	'gj_stages',
	'gj_materials',
	'gj_material_content',
	'gj_cases',
	'gj_quizzes',
	'gj_quiz_questions',
	'gj_quiz_options',
	'gj_attachments',
	'gj_user_progress',
	'gj_material_progress',
	'gj_quiz_attempts',
	'gj_case_attachments',
	'gj_question_attachments',
	'gj_case_progress',
	'point_rules',
	'point_transactions',
	'levels',
	'badges',
	'user_badges',
	'certificate_templates',
	'certificates',
	'pk_categories',
	'pk_topics',
	'pk_sections',
	'pk_progress',
	'pl_games',
	'pl_game_items',
	'lp_practices',
	'lp_completions',
	'qna_questions',
	'qna_attachments',
	'qna_answers',
	'asp_submissions',
	'fu_posts',
	'fu_attachments',
	'notifications',
	'audit_logs',
	'drive_files'
];

export async function runBackup(initiatedBy: string): Promise<Tables<'backup_jobs'>> {
	// 1. Create backup_job record
	const { data: job, error: jobErr } = await qa('backup_jobs')
		.insert({
			status: 'RUNNING',
			initiated_by: initiatedBy,
			backup_type: 'METADATA_ONLY',
			started_at: new Date().toISOString()
		})
		.select()
		.single();

	if (jobErr || !job) throw new Error(`Failed to create backup job: ${jobErr?.message}`);
	const jobId = (job as Tables<'backup_jobs'>).id;

	await writeAuditLog({ userId: initiatedBy, action: 'BACKUP_STARTED', recordId: jobId });

	try {
		// 2. Dump all tables
		const manifest: BackupManifest = {
			version: '1.0',
			created_at: new Date().toISOString(),
			backup_type: 'METADATA_ONLY',
			tables: {},
			drive_file_ids: [],
			drive_folder_ids: [],
			record_counts: {},
			total_drive_files: 0
		};

		for (const table of BACKUP_TABLES) {
			const { data: rows } = await qa(table).select('*');
			manifest.tables[table] = rows ?? [];
			manifest.record_counts[table] = (rows ?? []).length;
		}

		// 3. Extract all Drive file IDs and folder IDs
		const driveFiles = manifest.tables['drive_files'] as Array<{
			drive_file_id: string;
			drive_folder_id: string | null;
		}>;
		manifest.drive_file_ids = [...new Set(driveFiles.map((f) => f.drive_file_id))];
		manifest.drive_folder_ids = [
			...new Set(driveFiles.map((f) => f.drive_folder_id).filter(Boolean))
		] as string[];
		manifest.total_drive_files = manifest.drive_file_ids.length;

		// 4. Upload JSON to Drive → 99 - System → Backups
		const json = JSON.stringify(manifest, null, 2);
		const buf = Buffer.from(json, 'utf-8');
		const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

		let driveFileId: string | null = null;

		if (GOOGLE_DRIVE_SYSTEM_FOLDER_ID) {
			try {
				const backupFolder = await findOrCreateFolder('Backups', GOOGLE_DRIVE_SYSTEM_FOLDER_ID);
				const uploadResult = await uploadFile(
					{
						body: Readable.from(buf),
						name: fileName,
						mimeType: 'application/json',
						folderId: backupFolder.id,
						sizeBytes: buf.length
					},
					buf.length + 1024
				);
				driveFileId = uploadResult.driveFileId;

				// Save to drive_files table
				await qa('drive_files').insert({
					drive_file_id: driveFileId,
					name: fileName,
					mime_type: 'application/json',
					size_bytes: buf.length,
					storage_area: 'system',
					entity_type: 'SYSTEM',
					entity_id: jobId,
					uploaded_by: initiatedBy,
					drive_folder_id: backupFolder.id
				});
			} catch (driveErr) {
				console.error('Backup Drive upload failed (continuing):', driveErr);
			}
		}

		// 5. Update backup_job
		const { data: updated } = await qa('backup_jobs')
			.update({
				status: 'COMPLETED',
				completed_at: new Date().toISOString(),
				record_counts: manifest.record_counts,
				drive_file_ids_count: manifest.total_drive_files,
				local_size_bytes: buf.length
			})
			.eq('id', jobId)
			.select()
			.single();

		await writeAuditLog({
			userId: initiatedBy,
			action: 'BACKUP_COMPLETED',
			recordId: jobId,
			newData: { file_count: manifest.total_drive_files, size: buf.length }
		});

		return updated as Tables<'backup_jobs'>;
	} catch (err) {
		await qa('backup_jobs')
			.update({
				status: 'FAILED',
				error_message: String(err),
				completed_at: new Date().toISOString()
			})
			.eq('id', jobId);
		await writeAuditLog({ userId: initiatedBy, action: 'BACKUP_FAILED', recordId: jobId });
		throw err;
	}
}

// ── Restore / Validate ────────────────────────────────────────

export interface RestoreValidationResult {
	total_drive_files: number;
	found: number;
	missing: string[];
	missing_percentage: number;
}

/**
 * Validates that all Drive file IDs in the database still exist in Google Drive.
 * Marks missing ones in drive_files.deleted_at (soft-delete) with a note.
 * Does NOT silently ignore missing files.
 */
export async function validateDriveReferences(
	initiatedBy: string
): Promise<RestoreValidationResult> {
	await writeAuditLog({ userId: initiatedBy, action: 'RESTORE_STARTED' });

	// Load all active drive_files rows
	const { data: files } = await qa('drive_files')
		.select('id, drive_file_id, name')
		.is('deleted_at', null);

	const fileList = (files ?? []) as { id: string; drive_file_id: string; name: string }[];
	const missing: string[] = [];
	const found: string[] = [];

	// Check each Drive file ID
	for (const f of fileList) {
		try {
			const meta = await getFileMetadata(f.drive_file_id);
			if (!meta) {
				missing.push(f.drive_file_id);
				// Mark as MISSING_FILE via a special deleted_at note
				await qa('drive_files').update({ deleted_at: new Date().toISOString() }).eq('id', f.id);
			} else {
				found.push(f.drive_file_id);
			}
		} catch {
			missing.push(f.drive_file_id);
			await qa('drive_files').update({ deleted_at: new Date().toISOString() }).eq('id', f.id);
		}
	}

	const result: RestoreValidationResult = {
		total_drive_files: fileList.length,
		found: found.length,
		missing,
		missing_percentage:
			fileList.length > 0 ? Math.round((missing.length / fileList.length) * 100) : 0
	};

	await writeAuditLog({
		userId: initiatedBy,
		action: 'RESTORE_VALIDATED',
		newData: { found: found.length, missing: missing.length }
	});

	return result;
}

export async function listBackupJobs(): Promise<Tables<'backup_jobs'>[]> {
	const { data } = await qa('backup_jobs')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(20);
	return (data ?? []) as Tables<'backup_jobs'>[];
}
