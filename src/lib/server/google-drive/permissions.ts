// ============================================================
// Google Drive — File Permissions
// SERVER ONLY
//
// NOTE: For Shared Drives with a service account, most content
// should inherit permissions from the drive. These functions
// are for cases where per-file permission overrides are needed.
// ============================================================

import { getDriveClient } from './client';

export type PermissionRole = 'reader' | 'commenter' | 'writer' | 'fileOrganizer' | 'organizer';
export type PermissionType = 'user' | 'group' | 'domain' | 'anyone';

export interface DrivePermission {
	id: string;
	type: PermissionType;
	role: PermissionRole;
	emailAddress?: string;
}

/**
 * Grant a permission on a file.
 */
export async function createPermission(
	fileId: string,
	role: PermissionRole,
	type: PermissionType,
	emailAddress?: string
): Promise<DrivePermission> {
	const drive = getDriveClient();

	const res = await drive.permissions.create({
		fileId,
		requestBody: { role, type, emailAddress },
		fields: 'id, type, role, emailAddress',
		supportsAllDrives: true
	});

	return {
		id: res.data.id ?? '',
		type: (res.data.type as PermissionType) ?? type,
		role: (res.data.role as PermissionRole) ?? role,
		emailAddress: res.data.emailAddress ?? undefined
	};
}

/**
 * Remove a permission from a file.
 */
export async function deletePermission(fileId: string, permissionId: string): Promise<void> {
	const drive = getDriveClient();
	await drive.permissions.delete({ fileId, permissionId, supportsAllDrives: true });
}

/**
 * List all permissions on a file.
 */
export async function listPermissions(fileId: string): Promise<DrivePermission[]> {
	const drive = getDriveClient();

	const res = await drive.permissions.list({
		fileId,
		fields: 'permissions(id, type, role, emailAddress)',
		supportsAllDrives: true
	});

	return (res.data.permissions ?? []).map((p) => ({
		id: p.id ?? '',
		type: (p.type as PermissionType) ?? 'user',
		role: (p.role as PermissionRole) ?? 'reader',
		emailAddress: p.emailAddress ?? undefined
	}));
}
