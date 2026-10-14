import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	createMaterial,
	addContentBlock,
	attachFileToMaterial
} from '$lib/server/services/growth-journey';
import { uploadFile } from '$lib/server/google-drive/upload';
import { validateFile, mimeTypeToAttachmentType } from '$lib/server/google-drive/validation';
import { saveDriveFileMetadata } from '$lib/server/services/drive-metadata';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import { GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID } from '$env/static/private';
import { Readable } from 'stream';

export const load: PageServerLoad = async ({ params }) => {
	return { stageId: params.stageId };
};

export const actions: Actions = {
	default: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		if (!user) redirect(303, '/login');

		let formData: FormData;
		try {
			formData = await request.formData();
		} catch {
			return fail(400, { error: 'Form data tidak valid.' });
		}

		const title = (formData.get('title') as string)?.trim();
		const summary = (formData.get('summary') as string)?.trim() || null;
		const sortOrder = parseInt(formData.get('sort_order') as string) || 0;
		const estimatedMin = parseInt(formData.get('estimated_min') as string) || null;
		const isRequired = formData.get('is_required') === 'on';
		const isPublished = formData.get('is_published') === 'on';
		const richText = (formData.get('rich_text') as string)?.trim() || null;

		if (!title) return fail(400, { error: 'Judul materi wajib diisi.' });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const material = await createMaterial(locals.supabase as any, {
			stage_id: params.stageId,
			title,
			summary,
			sort_order: sortOrder,
			estimated_min: estimatedMin,
			is_required: isRequired,
			is_published: isPublished,
			created_by: user.id
		});

		if (richText) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await addContentBlock(locals.supabase as any, {
				material_id: material.id,
				sort_order: 0,
				content_type: 'RICH_TEXT',
				body: richText
			});
		}

		const files = formData.getAll('files') as File[];
		const adminClient = createSupabaseAdminClient();

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (!file || file.size === 0) continue;
			const validation = validateFile({
				name: file.name,
				mimeType: file.type,
				sizeBytes: file.size
			});
			if (!validation.valid || !GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID) continue;

			try {
				const buf = Buffer.from(await file.arrayBuffer());
				const uploadResult = await uploadFile({
					body: Readable.from(buf),
					name: file.name,
					mimeType: file.type,
					folderId: GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID,
					sizeBytes: file.size
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const driveFile = await saveDriveFileMetadata(adminClient as unknown as any, {
					uploadResult,
					storageArea: 'growth-journey',
					entityType: 'MATERIAL',
					entityId: material.id,
					uploadedBy: user.id
				});
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				await attachFileToMaterial(locals.supabase as any, {
					material_id: material.id,
					drive_file_id: driveFile.id,
					attachment_type: mimeTypeToAttachmentType(file.type),
					display_name: file.name,
					sequence: i
				});
			} catch {
				// Skip failed file silently
			}
		}

		redirect(303, `/admin/growth-journey/stages/${params.stageId}`);
	}
};
