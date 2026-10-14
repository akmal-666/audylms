import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listLpPractices, markPracticeComplete } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, t: string) => db.from(t);

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const [practices, { data: completions }] = await Promise.all([
		listLpPractices(db),
		q(db, 'lp_completions').select('practice_id').eq('user_id', authedUser.id)
	]);
	const completedIds = new Set(
		(completions ?? []).map((c: { practice_id: string }) => c.practice_id)
	);
	return { practices: practices.map((p) => ({ ...p, is_completed: completedIds.has(p.id) })) };
};

export const actions: Actions = {
	complete: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const practiceId = fd.get('practice_id') as string;
		if (!practiceId) return { success: false };
		await markPracticeComplete(db, authedUser.id, practiceId);
		return { success: true };
	}
};
