// ============================================================
// Drive Metadata Service
// SERVER ONLY
//
// Bridges Google Drive (binary storage) with Supabase (metadata).
// All Drive file references stored in the database go through here.
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';
import type { TablesInsert, TablesUpdate, Tables } from '$lib/types/database.types';
import type { UploadResult } from '$lib/server/google-drive/types';
import { mimeTypeToAttachmentType } from '$lib/server/google-drive/validation';
import type { DriveEntityType, AttachmentType } from '$lib/types/database.types';

type DbClient = ReturnType<typeof createSupabaseServerClient>;
type DriveFileRow = Tables<'drive_files'>;
type MaterialAttachmentRow = Tables<'material_attachments'>;

// ──────────────────────────────────────────────────────────────
// drive_files
// ──────────────────────────────────────────────────────────────

/**
 * Save file metadata to drive_files after a successful Drive upload.
 */
export async function saveDriveFileMetadata(
	supabase: DbClient,
	params: {
		uploadResult: UploadResult;
		storageArea: string;
		entityType: DriveEntityType;
		entityId?: string;
		uploadedBy: string;
	}
): Promise<DriveFileRow> {
	const { uploadResult: r, storageArea, entityType, entityId, uploadedBy } = params;

	const insert: TablesInsert<'drive_files'> = {
		drive_file_id: r.driveFileId,
		drive_folder_id: r.folderId ?? undefined,
		name: r.name,
		mime_type: r.mimeType,
		size_bytes: r.sizeBytes ?? undefined,
		web_view_url: r.webViewLink ?? undefined,
		web_content_url: r.webContentLink ?? undefined,
		thumbnail_url: r.thumbnailLink ?? undefined,
		storage_area: storageArea,
		entity_type: entityType,
		entity_id: entityId ?? undefined,
		uploaded_by: uploadedBy
	};

	// Use admin client cast — this runs server-side and bypasses RLS intentionally
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('drive_files') as any;
	const { data, error } = await q.insert(insert).select().single();

	if (error) throw new Error(`Failed to save drive file metadata: ${error.message}`);
	return data as DriveFileRow;
}

/**
 * Get a drive_files row by its Supabase UUID.
 */
export async function getDriveFileById(
	supabase: DbClient,
	id: string
): Promise<DriveFileRow | null> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('drive_files') as any;
	const { data } = await q.select('*').eq('id', id).is('deleted_at', null).single();
	return (data as DriveFileRow) ?? null;
}

/**
 * Get a drive_files row by its Google Drive fileId.
 */
export async function getDriveFileByDriveId(
	supabase: DbClient,
	driveFileId: string
): Promise<DriveFileRow | null> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('drive_files') as any;
	const { data } = await q
		.select('*')
		.eq('drive_file_id', driveFileId)
		.is('deleted_at', null)
		.single();
	return (data as DriveFileRow) ?? null;
}

/**
 * List all drive_files for a given entity.
 */
export async function listDriveFilesForEntity(
	supabase: DbClient,
	entityType: DriveEntityType,
	entityId: string
): Promise<DriveFileRow[]> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('drive_files') as any;
	const { data } = await q
		.select('*')
		.eq('entity_type', entityType)
		.eq('entity_id', entityId)
		.is('deleted_at', null)
		.order('created_at');
	return (data as DriveFileRow[]) ?? [];
}

/**
 * Soft-delete a drive_files row (does NOT delete the file from Drive).
 * Call deleteFile() from google-drive/files.ts separately if needed.
 */
export async function softDeleteDriveFile(supabase: DbClient, id: string): Promise<void> {
	const update: TablesUpdate<'drive_files'> = {
		deleted_at: new Date().toISOString()
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('drive_files') as any;
	await q.update(update).eq('id', id);
}

// ──────────────────────────────────────────────────────────────
// material_attachments
// ──────────────────────────────────────────────────────────────

/**
 * Attach a drive_files row to a material.
 */
export async function addMaterialAttachment(
	supabase: DbClient,
	params: {
		materialId: string;
		driveFileRowId: string;
		mimeType: string;
		displayName?: string;
		sequence?: number;
	}
): Promise<MaterialAttachmentRow> {
	const attachmentType: AttachmentType = mimeTypeToAttachmentType(params.mimeType);

	const insert: TablesInsert<'material_attachments'> = {
		material_id: params.materialId,
		drive_file_id: params.driveFileRowId,
		attachment_type: attachmentType,
		display_name: params.displayName ?? undefined,
		sequence: params.sequence ?? 0
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('material_attachments') as any;
	const { data, error } = await q.insert(insert).select().single();

	if (error) throw new Error(`Failed to add material attachment: ${error.message}`);
	return data as MaterialAttachmentRow;
}

/**
 * Get all attachments for a material, with drive_files joined.
 */
export async function getMaterialAttachments(
	supabase: DbClient,
	materialId: string
): Promise<Array<MaterialAttachmentRow & { drive_file: DriveFileRow }>> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('material_attachments') as any;
	const { data } = await q
		.select('*, drive_file:drive_files(*)')
		.eq('material_id', materialId)
		.order('sequence');

	return (data ?? []) as Array<MaterialAttachmentRow & { drive_file: DriveFileRow }>;
}
