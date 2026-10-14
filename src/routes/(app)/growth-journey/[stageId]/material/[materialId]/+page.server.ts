import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import {
	getMaterialWithContent,
	markMaterialCompleted,
	markMaterialInProgress,
	updateStageProgress
} from '$lib/server/services/growth-journey';
import { onMaterialCompleted } from '$lib/server/services/rewards-integration';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const material = await getMaterialWithContent(locals.supabase as any, params.materialId);
	if (!material || material.stage_id !== params.stageId) {
		error(404, { message: 'Materi tidak ditemukan.' });
	}

	// Mark as in-progress on first view
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await markMaterialInProgress(locals.supabase as any, authedUser.id, material.id);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await updateStageProgress(locals.supabase as any, authedUser.id, params.stageId);

	return { material, stageId: params.stageId, user: authedUser };
};

export const actions: Actions = {
	complete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await markMaterialCompleted(locals.supabase as any, authedUser.id, params.materialId);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await updateStageProgress(locals.supabase as any, authedUser.id, params.stageId);
		// Fire-and-forget rewards (non-fatal if fails)
		void onMaterialCompleted(authedUser.id, params.materialId);
		return { completed: true };
	}
};
