import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listFuPosts } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const { posts, total } = await listFuPosts(db, 20, 0);
	return { posts, total };
};
