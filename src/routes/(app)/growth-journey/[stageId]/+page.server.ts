import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	getStageDetail,
	markMaterialCompleted,
	markMaterialInProgress,
	updateStageProgress
} from '$lib/server/services/growth-journey';
import { onStageCompleted, onMaterialCompleted } from '$lib/server/services/rewards-integration';

// Shared cast — server client has a different generic shape than what
// the service functions expect; cast through unknown once here.
type DbClient = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	const db = locals.supabase as unknown as DbClient;
	const stage = await getStageDetail(db, params.stageId, authedUser.id);

	if (!stage) {
		error(404, { message: 'Stage tidak ditemukan.' });
	}

	return { stage, user: authedUser };
};

export const actions: Actions = {
	startMaterial: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const data = await request.formData();
		const materialId = data.get('materialId') as string;
		if (!materialId) return { success: false };

		const db = locals.supabase as unknown as DbClient;
		await markMaterialInProgress(db, authedUser.id, materialId);
		await updateStageProgress(db, authedUser.id, params.stageId);
		return { success: true };
	},

	completeMaterial: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const data = await request.formData();
		const materialId = data.get('materialId') as string;
		if (!materialId) return { success: false };

		const db = locals.supabase as unknown as DbClient;
		await markMaterialCompleted(db, authedUser.id, materialId);
		await updateStageProgress(db, authedUser.id, params.stageId);

		// Check if the stage just reached COMPLETED status; if so, issue rewards + cert.
		const stageDetail = await getStageDetail(db, params.stageId, authedUser.id);
		if (stageDetail?.user_progress?.status === 'COMPLETED') {
			void onStageCompleted(authedUser.id, params.stageId, stageDetail.title);
		} else {
			void onMaterialCompleted(authedUser.id, materialId);
		}

		return { success: true };
	}
};
