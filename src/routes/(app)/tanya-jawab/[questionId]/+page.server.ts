import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	getQnaQuestion,
	postQnaAnswer,
	verifyQnaAnswer
} from '$lib/server/services/content-modules';
import { isAdmin } from '$lib/server/auth';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const result = await getQnaQuestion(db, params.questionId);
	if (!result) error(404, { message: 'Pertanyaan tidak ditemukan.' });
	return { ...result };
};

export const actions: Actions = {
	answer: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const body = (fd.get('body') as string)?.trim();
		if (!body) return fail(400, { error: 'Jawaban tidak boleh kosong.' });
		try {
			await postQnaAnswer(db, { question_id: params.questionId, author_id: authedUser.id, body });
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { answered: true };
	},
	verify: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		if (!isAdmin(authedUser)) error(403, { message: 'Hanya admin yang dapat verifikasi.' });
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const answerId = fd.get('answer_id') as string;
		if (!answerId) return fail(400, { error: 'ID jawaban diperlukan.' });
		await verifyQnaAnswer(db, answerId, authedUser.id);
		return { verified: true };
	}
};
