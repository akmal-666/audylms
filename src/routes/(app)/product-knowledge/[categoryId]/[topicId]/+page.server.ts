import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getPkTopicWithSections, markPkTopicRead } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const result = await getPkTopicWithSections(db, params.topicId, authedUser.id);
	if (!result) error(404, { message: 'Topik tidak ditemukan.' });
	return { ...result, categoryId: params.categoryId };
};

export const actions: Actions = {
	markRead: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		await markPkTopicRead(db, authedUser.id, params.topicId);
		return { done: true };
	}
};
