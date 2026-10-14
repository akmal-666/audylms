import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
type Db = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, t: string) => db.from(t);

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.supabase as unknown as Db;

	const [stages, pkCats, plGames, lpPractices, fuPosts] = await Promise.all([
		q(db, 'gj_stages').select('id, sort_order, title, is_published').order('sort_order'),
		q(db, 'pk_categories').select('id, title, is_published').order('sort_order'),
		q(db, 'pl_games').select('id, title, game_type, is_published').order('title'),
		q(db, 'lp_practices').select('id, title, resource_type, is_published').order('sort_order'),
		q(db, 'fu_posts')
			.select('id, title, is_published, published_at')
			.order('published_at', { ascending: false })
			.limit(20)
	]);

	return {
		stages: stages.data ?? [],
		pk_categories: pkCats.data ?? [],
		pl_games: plGames.data ?? [],
		lp_practices: lpPractices.data ?? [],
		fu_posts: fuPosts.data ?? []
	};
};
