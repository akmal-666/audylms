import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	listDriveFiles,
	softDeleteDriveFileAdmin,
	replaceDriveFile
} from '$lib/server/services/admin';
import { uploadFile } from '$lib/server/google-drive/upload';
import { validateFile } from '$lib/server/google-drive/validation';
import { saveDriveFileMetadata } from '$lib/server/services/drive-metadata';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { searchFiles } from '$lib/server/google-drive/files';
import { GOOGLE_DRIVE_ROOT_FOLDER_ID } from '$env/static/private';
import { Readable } from 'stream';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.supabase as unknown as Db;
	const search = url.searchParams.get('q') ?? undefined;
	const storageArea = url.searchParams.get('area') ?? undefined;
	const page = parseInt(url.searchParams.get('page') ?? '0');

	const { files, total } = await listDriveFiles(db, {
		search,
		storageArea,
		limit: 50,
		offset: page * 50
	});
	return { files, total, search, storageArea, page };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Tidak terautentikasi.' });
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const fileId = fd.get('file_id') as string;
		if (!fileId) return fail(400, { error: 'ID file diperlukan.' });
		try {
			const result = await softDeleteDriveFileAdmin(db, fileId, user.id);
			return { deleted: true, ...result };
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Gagal menghapus.' });
		}
	},

	replace: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Tidak terautentikasi.' });
		const db = locals.supabase as unknown as Db;
		let fd: FormData;
		try {
			fd = await request.formData();
		} catch {
			return fail(400, { error: 'Form tidak valid.' });
		}

		const oldFileId = fd.get('old_file_id') as string;
		const file = fd.get('file') as File | null;
		if (!oldFileId || !file || file.size === 0)
			return fail(400, { error: 'File dan ID lama diperlukan.' });

		// Get old file metadata for folder info
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const { data: oldFile } = await (db as any)
			.from('drive_files')
			.select('*')
			.eq('id', oldFileId)
			.single();
		if (!oldFile) return fail(404, { error: 'File lama tidak ditemukan.' });

		const validation = validateFile({ name: file.name, mimeType: file.type, sizeBytes: file.size });
		if (!validation.valid) return fail(422, { error: validation.error });

		try {
			const buf = Buffer.from(await file.arrayBuffer());
			const uploadResult = await uploadFile({
				body: Readable.from(buf),
				name: file.name,
				mimeType: file.type,
				folderId: oldFile.drive_folder_id ?? GOOGLE_DRIVE_ROOT_FOLDER_ID,
				sizeBytes: file.size
			});
			const adminClient = createSupabaseAdminClient();
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newDriveFile = await saveDriveFileMetadata(adminClient as unknown as any, {
				uploadResult,
				storageArea: oldFile.storage_area,
				entityType: oldFile.entity_type,
				entityId: oldFile.entity_id,
				uploadedBy: user.id
			});
			await replaceDriveFile(
				db,
				oldFileId,
				newDriveFile as Parameters<typeof replaceDriveFile>[2],
				user.id
			);
			return { replaced: true, newFileId: newDriveFile.id };
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Gagal mengganti file.' });
		}
	},

	search: async ({ request }) => {
		const fd = await request.formData();
		const query = (fd.get('q') as string)?.trim();
		if (!query || !GOOGLE_DRIVE_ROOT_FOLDER_ID) return { driveResults: [] };
		try {
			const { files } = await searchFiles({
				query,
				folderId: GOOGLE_DRIVE_ROOT_FOLDER_ID,
				pageSize: 20
			});
			return { driveResults: files };
		} catch {
			return { driveResults: [] };
		}
	}
};
