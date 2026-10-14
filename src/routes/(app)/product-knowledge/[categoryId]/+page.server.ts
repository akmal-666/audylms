import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listPkTopics } from '$lib/server/services/content-modules';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, t: string) => db.from(t);
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const { data: category } = await q(db, 'pk_categories')
		.select('*')
		.eq('id', params.categoryId)
		.eq('is_published', true)
		.single();
	if (!category) error(404, { message: 'Kategori tidak ditemukan.' });
	const topics = await listPkTopics(db, params.categoryId);
	return { category, topics };
};
