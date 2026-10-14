import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listPkCategories } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const categories = await listPkCategories(locals.supabase as unknown as Db);
	return { categories };
};
