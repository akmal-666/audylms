import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { submitAspiration } from '$lib/server/services/content-modules';
import type { AspCategory } from '$lib/types/database.types';
type Db = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, t: string) => db.from(t);

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const { data: mine } = await q(db, 'asp_submissions')
		.select('*')
		.eq('author_id', authedUser.id)
		.eq('is_anonymous', false)
		.order('created_at', { ascending: false })
		.limit(20);
	return { mine: mine ?? [] };
};

export const actions: Actions = {
	submit: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		const body = (fd.get('body') as string)?.trim();
		const category = (fd.get('category') as AspCategory) ?? 'SARAN';
		const isAnonymous = fd.get('is_anonymous') === 'on';
		if (!title || !body) return fail(400, { error: 'Judul dan isi wajib diisi.' });
		try {
			await submitAspiration(db, {
				title,
				body,
				category,
				author_id: isAnonymous ? null : authedUser.id,
				is_anonymous: isAnonymous
			});
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { submitted: true };
	}
};
