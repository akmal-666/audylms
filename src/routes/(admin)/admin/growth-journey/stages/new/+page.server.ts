import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createStage, listAllStages } from '$lib/server/services/growth-journey';

export const load: PageServerLoad = async ({ locals }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const stages = await listAllStages(locals.supabase as any);
	return { nextOrder: stages.length + 1 };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) redirect(303, '/login');

		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
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

		if (!title) return fail(400, { error: 'Judul wajib diisi.' });

		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			await createStage(locals.supabase as any, {
				title,
				description,
				icon,
				sort_order: sortOrder,
				estimated_min: estimatedMin,
				points_reward: pointsReward,
				is_published: isPublished,
				position_filter: positionFilter,
				created_by: user.id
			});
		} catch (err) {
			return fail(500, { error: err instanceof Error ? err.message : 'Gagal menyimpan stage.' });
		}

		redirect(303, '/admin/growth-journey');
	}
};
