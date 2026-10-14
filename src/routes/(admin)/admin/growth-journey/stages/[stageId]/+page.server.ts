import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { updateStage } from '$lib/server/services/growth-journey';
import type { Tables } from '$lib/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, table: string) => db.from(table);

export const load: PageServerLoad = async ({ params, locals }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { data: stage } = await q(locals.supabase as any, 'gj_stages')
		.select('*')
		.eq('id', params.stageId)
		.single();

	if (!stage) error(404, { message: 'Stage tidak ditemukan.' });

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const { data: materials } = await q(locals.supabase as any, 'gj_materials')
		.select('*')
		.eq('stage_id', params.stageId)
		.order('sort_order');

	return {
		stage: stage as Tables<'gj_stages'>,
		materials: (materials ?? []) as Tables<'gj_materials'>[]
	};
};

export const actions: Actions = {
	updateStage: async ({ request, locals, params }) => {
		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		if (!title) return fail(400, { error: 'Judul wajib diisi.' });

		const description = (fd.get('description') as string)?.trim() || null;
		const icon = (fd.get('icon') as string)?.trim() || null;
		const sortOrder = parseInt(fd.get('sort_order') as string) || 0;
		const estimatedMin = parseInt(fd.get('estimated_min') as string) || null;
		const pointsReward = parseInt(fd.get('points_reward') as string) || 0;
		const isPublished = fd.get('is_published') === 'on';
		const positionFilterRaw = fd.get('position_filter') as string;
		const positionFilter = positionFilterRaw
			? positionFilterRaw
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean)
			: null;

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await updateStage(locals.supabase as any, params.stageId, {
				title,
				description,
				icon,
				sort_order: sortOrder,
				estimated_min: estimatedMin,
				points_reward: pointsReward,
				is_published: isPublished,
				position_filter: positionFilter
			});
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Gagal menyimpan.' });
		}

		return { saved: true };
	}
};
