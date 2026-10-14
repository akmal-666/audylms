// ============================================================
// Google Drive — File Metadata & Management
// SERVER ONLY
// ============================================================

import { getDriveClient } from './client';
import type { DriveFileMetadata, SearchFilesParams } from './types';

const FILE_FIELDS =
	'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, parents, createdTime, modifiedTime';

function mapToMetadata(f: Record<string, unknown>): DriveFileMetadata {
	return {
		id: (f.id as string) ?? '',
		name: (f.name as string) ?? '',
		mimeType: (f.mimeType as string) ?? '',
		size: f.size != null ? Number(f.size) : null,
		webViewLink: (f.webViewLink as string) ?? null,
		webContentLink: (f.webContentLink as string) ?? null,
		thumbnailLink: (f.thumbnailLink as string) ?? null,
		parents: (f.parents as string[]) ?? [],
		createdTime: (f.createdTime as string) ?? null,
		modifiedTime: (f.modifiedTime as string) ?? null
	};
}

/**
 * Get metadata for a single file by its Drive ID.
 */
export async function getFileMetadata(fileId: string): Promise<DriveFileMetadata | null> {
	const drive = getDriveClient();
	try {
		const res = await drive.files.get({
			fileId,
			fields: FILE_FIELDS,
			supportsAllDrives: true
		});
		return mapToMetadata(res.data as Record<string, unknown>);
	} catch {
		return null;
	}
}

/**
 * List files in a folder (non-recursive, non-trashed).
 */
export async function listFiles(
	folderId: string,
	params: SearchFilesParams = {}
): Promise<{ files: DriveFileMetadata[]; nextPageToken: string | null }> {
	const drive = getDriveClient();

	const conditions = [`'${folderId}' in parents`, 'trashed = false'];
	if (params.mimeTypes?.length) {
		const mimeQ = params.mimeTypes.map((m) => `mimeType = '${m}'`).join(' or ');
		conditions.push(`(${mimeQ})`);
	}
	if (params.query) {
		conditions.push(`name contains '${params.query.replace(/'/g, "\\'")}'`);
	}

	const res = await drive.files.list({
		q: conditions.join(' and '),
		fields: `nextPageToken, files(${FILE_FIELDS})`,
		supportsAllDrives: true,
		includeItemsFromAllDrives: true,
		pageSize: params.pageSize ?? 100,
		pageToken: params.pageToken
	});

	return {
		files: (res.data.files ?? []).map((f) => mapToMetadata(f as Record<string, unknown>)),
		nextPageToken: res.data.nextPageToken ?? null
	};
}

/**
 * Full-text search across a folder subtree.
 */
export async function searchFiles(
	params: SearchFilesParams
): Promise<{ files: DriveFileMetadata[]; nextPageToken: string | null }> {
	const drive = getDriveClient();

	const conditions: string[] = ['trashed = false'];
	if (params.folderId) {
		conditions.push(`'${params.folderId}' in parents`);
	}
	if (params.query) {
		conditions.push(`fullText contains '${params.query.replace(/'/g, "\\'")}'`);
	}
	if (params.mimeTypes?.length) {
		const mimeQ = params.mimeTypes.map((m) => `mimeType = '${m}'`).join(' or ');
		conditions.push(`(${mimeQ})`);
	}

	const res = await drive.files.list({
		q: conditions.join(' and '),
		fields: `nextPageToken, files(${FILE_FIELDS})`,
		supportsAllDrives: true,
		includeItemsFromAllDrives: true,
		pageSize: params.pageSize ?? 50,
		pageToken: params.pageToken
	});

	return {
		files: (res.data.files ?? []).map((f) => mapToMetadata(f as Record<string, unknown>)),
		nextPageToken: res.data.nextPageToken ?? null
	};
}

/**
 * Move a file from one folder to another.
 */
export async function moveFile(
	fileId: string,
	newFolderId: string,
	currentFolderId: string
): Promise<DriveFileMetadata> {
	const drive = getDriveClient();

	const res = await drive.files.update({
		fileId,
		addParents: newFolderId,
		removeParents: currentFolderId,
		fields: FILE_FIELDS,
		supportsAllDrives: true
	});

	return mapToMetadata(res.data as Record<string, unknown>);
}

/**
 * Permanently delete a file from Drive.
 * For soft-delete, update the drive_files row's deleted_at instead.
 */
export async function deleteFile(fileId: string): Promise<void> {
	const drive = getDriveClient();
	await drive.files.delete({ fileId, supportsAllDrives: true });
}

/**
 * Get the web view URL for a file (open in Drive viewer).
 */
export function getFileWebViewLink(webViewLink: string | null): string | null {
	return webViewLink;
}

/**
 * Get the web content link (direct download URL).
 * NOTE: Direct download URLs require the user to be signed into Google.
 * For private/authenticated access use the server-side download endpoint.
 */
export function getFileDownloadLink(webContentLink: string | null): string | null {
	return webContentLink;
}
