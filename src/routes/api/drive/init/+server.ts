// ============================================================
// POST /api/drive/init
//
// Admin-only: Initialise the Google Drive folder structure.
// Idempotent — finds existing folders, creates missing ones.
//
// Returns the folder ID map so the admin can update env vars.
// ============================================================

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';
import { initialiseFolderStructure } from '$lib/server/google-drive/folders';
import { GOOGLE_DRIVE_ROOT_FOLDER_ID } from '$env/static/private';

export const POST: RequestHandler = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	requireRole(user, ['ADMIN']);

	if (!GOOGLE_DRIVE_ROOT_FOLDER_ID) {
		error(500, { message: 'GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.' });
	}

	try {
		const folderMap = await initialiseFolderStructure(GOOGLE_DRIVE_ROOT_FOLDER_ID);
		return json({
			data: {
				rootFolderId: GOOGLE_DRIVE_ROOT_FOLDER_ID,
				folders: folderMap,
				instructions:
					'Copy the folder IDs above into your .env.local / Vercel environment variables.'
			},
			error: null
		});
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Drive init failed';
		error(500, { message: msg });
	}
};
