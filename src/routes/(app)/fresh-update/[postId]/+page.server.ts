import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getFuPost, markFuPostRead } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const result = await getFuPost(db, params.postId, authedUser.id);
	if (!result) error(404, { message: 'Artikel tidak ditemukan.' });
	// Mark read on view (fire-and-forget)
	void markFuPostRead(db, authedUser.id, params.postId);
	return { ...result };
};
