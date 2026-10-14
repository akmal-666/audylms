import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getGameForEmployee, submitGame } from '$lib/server/services/content-modules';
import { awardPoints } from '$lib/server/services/points';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const result = await getGameForEmployee(db, params.gameId);
	if (!result) error(404, { message: 'Game tidak ditemukan.' });
	return { ...result };
};

export const actions: Actions = {
	submit: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const answers: Record<string, string> = {};
		for (const [k, v] of fd.entries()) {
			if (k.startsWith('item_')) answers[k.slice(5)] = v as string;
		}
		const result = await submitGame(db, authedUser.id, params.gameId, answers);
		if (result.passed && result.points_earned > 0) {
			void awardPoints({
				userId: authedUser.id,
				eventType: 'GAME_COMPLETE',
				points: result.points_earned,
				entityType: 'pl_games',
				entityId: params.gameId,
				idempotencyKey: `GAME_COMPLETE:${params.gameId}:${authedUser.id}:${Date.now()}`
			});
		}
		return { result };
	}
};
