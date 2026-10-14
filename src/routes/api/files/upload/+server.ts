// ============================================================
// POST /api/files/upload
//
// Server-side file upload endpoint.
// Accepts: multipart/form-data
// Fields:
//   file        — the binary file
//   storageArea — target module storage area (e.g. 'growth-journey')
//   entityType  — drive_entity_type enum value
//   entityId    — optional UUID of the owning entity
//
// Authorization:
//   - Requires authenticated session
//   - STAFF can upload; ADMIN can upload
//   - File goes to Google Drive; metadata saved to drive_files
//
// Returns: { data: DriveFileRow, error: null } | { data: null, error: { code, message } }
// ============================================================

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth } from '$lib/server/auth';
import { uploadFile } from '$lib/server/google-drive/upload';
import { validateFile } from '$lib/server/google-drive/validation';
import { saveDriveFileMetadata } from '$lib/server/services/drive-metadata';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import {
	GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID,
	GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID,
	GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID,
	GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID,
	GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID,
	GOOGLE_DRIVE_QNA_FOLDER_ID,
	GOOGLE_DRIVE_SYSTEM_FOLDER_ID
} from '$env/static/private';
import type { DriveEntityType } from '$lib/types/database.types';
import type { StorageArea } from '$lib/server/google-drive/types';
import { Readable } from 'stream';

/** Map storage area → Drive folder ID from environment */
function getFolderIdForArea(area: StorageArea): string {
	const map: Record<StorageArea, string> = {
		'growth-journey': GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID,
		'product-knowledge': GOOGLE_DRIVE_PRODUCT_KNOWLEDGE_FOLDER_ID,
		'play-learn': GOOGLE_DRIVE_PLAY_LEARN_FOLDER_ID,
		'lets-practice': GOOGLE_DRIVE_LETS_PRACTICE_FOLDER_ID,
		'fresh-update': GOOGLE_DRIVE_FRESH_UPDATE_FOLDER_ID,
		qna: GOOGLE_DRIVE_QNA_FOLDER_ID,
		system: GOOGLE_DRIVE_SYSTEM_FOLDER_ID
	};
	const id = map[area];
	if (!id) throw new Error(`No Drive folder configured for storage area: ${area}`);
	return id;
}

const VALID_STORAGE_AREAS: StorageArea[] = [
	'growth-journey',
	'product-knowledge',
	'play-learn',
	'lets-practice',
	'fresh-update',
	'qna',
	'system'
];

const VALID_ENTITY_TYPES: DriveEntityType[] = [
	'MATERIAL',
	'CASE',
	'ASSESSMENT',
	'PRODUCT_KNOWLEDGE',
	'FRESH_UPDATE',
	'PRACTICE',
	'GAME',
	'QNA',
	'PROFILE',
	'CERTIFICATE',
	'SYSTEM'
];

export const POST: RequestHandler = async ({ request, locals }) => {
	// 1. Authenticate
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	// 2. Parse multipart form
	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json(
			{ data: null, error: { code: 'INVALID_FORM', message: 'Invalid multipart form data.' } },
			{ status: 400 }
		);
	}

	const file = formData.get('file');
	const storageArea = formData.get('storageArea') as StorageArea;
	const entityType = formData.get('entityType') as DriveEntityType;
	const entityId = formData.get('entityId') as string | null;

	// 3. Validate inputs
	if (!(file instanceof File)) {
		return json(
			{ data: null, error: { code: 'NO_FILE', message: 'No file provided.' } },
			{ status: 400 }
		);
	}
	if (!VALID_STORAGE_AREAS.includes(storageArea)) {
		return json(
			{ data: null, error: { code: 'INVALID_AREA', message: 'Invalid storageArea.' } },
			{ status: 400 }
		);
	}
	if (!VALID_ENTITY_TYPES.includes(entityType)) {
		return json(
			{ data: null, error: { code: 'INVALID_ENTITY_TYPE', message: 'Invalid entityType.' } },
			{ status: 400 }
		);
	}

	// 4. Validate file metadata
	const validation = validateFile({
		name: file.name,
		mimeType: file.type,
		sizeBytes: file.size
	});
	if (!validation.valid) {
		return json(
			{ data: null, error: { code: 'INVALID_FILE', message: validation.error } },
			{ status: 422 }
		);
	}

	// 5. Upload to Google Drive
	const folderId = getFolderIdForArea(storageArea);
	const arrayBuffer = await file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	let uploadResult;
	try {
		uploadResult = await uploadFile({
			body: Readable.from(buffer),
			name: file.name,
			mimeType: file.type,
			folderId,
			sizeBytes: file.size
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Upload failed';
		return json({ data: null, error: { code: 'UPLOAD_FAILED', message: msg } }, { status: 500 });
	}

	// 6. Save metadata to Supabase (using admin client — bypasses RLS intentionally)
	const adminSupabase = createSupabaseAdminClient();
	let driveFile;
	try {
		// Double-cast needed: admin client and server client share the same Database
		// type but differ in their generic signature (createClient vs createServerClient).
		driveFile = await saveDriveFileMetadata(
			adminSupabase as unknown as Parameters<typeof saveDriveFileMetadata>[0],
			{
				uploadResult,
				storageArea,
				entityType,
				entityId: entityId ?? undefined,
				uploadedBy: authedUser.id
			}
		);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Metadata save failed';
		return json({ data: null, error: { code: 'METADATA_FAILED', message: msg } }, { status: 500 });
	}

	return json({ data: driveFile, error: null }, { status: 201 });
};
