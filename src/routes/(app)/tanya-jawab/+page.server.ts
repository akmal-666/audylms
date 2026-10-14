import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listQnaQuestions } from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: any, t: string) => db.from(t);

export const load: PageServerLoad = async ({ url, locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const resolved = url.searchParams.get('filter') === 'resolved' ? true : undefined;
	const { questions, total } = await listQnaQuestions(db, { limit: 30, resolved });
	return { questions, total };
};

export const actions: Actions = {
	ask: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const title = (fd.get('title') as string)?.trim();
		const body = (fd.get('body') as string)?.trim() || null;
		if (!title) return { error: 'Judul pertanyaan wajib diisi.' };
		const { data, error } = await q(db, 'qna_questions')
			.insert({ author_id: authedUser.id, title, body })
			.select()
			.single();
		if (error) return { error: error.message };
		return { created: data.id };
	}
};
