// ============================================================
// Google Drive — Folder Operations
// SERVER ONLY
// ============================================================

import { getDriveClient } from './client';
import type { DriveFileMetadata } from './types';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

/**
 * Find a folder by name inside a parent folder.
 * Returns the first match, or null if not found.
 *
 * Uses supportsAllDrives so it works with Shared Drives.
 */
export async function findFolder(
	name: string,
	parentFolderId: string
): Promise<DriveFileMetadata | null> {
	const drive = getDriveClient();

	const safeN = name.replace(/'/g, "\\'");
	const q = [
		`name = '${safeN}'`,
		`mimeType = '${FOLDER_MIME}'`,
		`'${parentFolderId}' in parents`,
		`trashed = false`
	].join(' and ');

	const res = await drive.files.list({
		q,
		fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime)',
		supportsAllDrives: true,
		includeItemsFromAllDrives: true,
		pageSize: 1
	});

	const files = res.data.files ?? [];
	if (files.length === 0) return null;

	const f = files[0];
	return {
		id: f.id ?? '',
		name: f.name ?? '',
		mimeType: f.mimeType ?? FOLDER_MIME,
		size: null,
		webViewLink: null,
		webContentLink: null,
		thumbnailLink: null,
		parents: f.parents ?? [],
		createdTime: f.createdTime ?? null,
		modifiedTime: f.modifiedTime ?? null
	};
}

/**
 * Get a folder by its Drive ID.
 */
export async function getFolder(folderId: string): Promise<DriveFileMetadata | null> {
	const drive = getDriveClient();

	try {
		const res = await drive.files.get({
			fileId: folderId,
			fields: 'id, name, mimeType, parents, createdTime, modifiedTime',
			supportsAllDrives: true
		});

		const f = res.data;
		return {
			id: f.id ?? '',
			name: f.name ?? '',
			mimeType: f.mimeType ?? FOLDER_MIME,
			size: null,
			webViewLink: null,
			webContentLink: null,
			thumbnailLink: null,
			parents: f.parents ?? [],
			createdTime: f.createdTime ?? null,
			modifiedTime: f.modifiedTime ?? null
		};
	} catch {
		return null;
	}
}

/**
 * Create a folder inside a parent folder.
 * Returns the newly created folder metadata.
 */
export async function createFolder(
	name: string,
	parentFolderId: string
): Promise<DriveFileMetadata> {
	const drive = getDriveClient();

	const res = await drive.files.create({
		requestBody: {
			name,
			mimeType: FOLDER_MIME,
			parents: [parentFolderId]
		},
		fields: 'id, name, mimeType, parents, createdTime, modifiedTime',
		supportsAllDrives: true
	});

	const f = res.data;
	return {
		id: f.id ?? '',
		name: f.name ?? '',
		mimeType: f.mimeType ?? FOLDER_MIME,
		size: null,
		webViewLink: null,
		webContentLink: null,
		thumbnailLink: null,
		parents: f.parents ?? [],
		createdTime: f.createdTime ?? null,
		modifiedTime: f.modifiedTime ?? null
	};
}

/**
 * Find an existing folder or create it if not found.
 * This is the idempotent "ensure folder exists" operation.
 * Should be used for all folder setup operations.
 */
export async function findOrCreateFolder(
	name: string,
	parentFolderId: string
): Promise<DriveFileMetadata> {
	const existing = await findFolder(name, parentFolderId);
	if (existing) return existing;
	return createFolder(name, parentFolderId);
}

/**
 * Initialise the full ALC folder structure inside the root folder.
 * Idempotent — reuses existing folders, only creates missing ones.
 *
 * Returns a map of storageArea → folderId.
 */
export async function initialiseFolderStructure(
	rootFolderId: string
): Promise<Record<string, string>> {
	const { MODULE_FOLDERS } = await import('./types');

	const result: Record<string, string> = {};

	for (const mod of MODULE_FOLDERS) {
		const folder = await findOrCreateFolder(mod.name, rootFolderId);
		result[mod.storageArea] = folder.id;
	}

	return result;
}
