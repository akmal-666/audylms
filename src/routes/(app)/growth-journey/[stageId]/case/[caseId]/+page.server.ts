import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getCaseWithAttachments, markCaseCompleted } from '$lib/server/services/assessment';
import type { createSupabaseServerClient } from '$lib/server/supabase';

type DbClient = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	const gjCase = await getCaseWithAttachments(
		locals.supabase as unknown as DbClient,
		params.caseId,
		authedUser.id
	);

	if (!gjCase || gjCase.stage_id !== params.stageId) {
		error(404, { message: 'Studi kasus tidak ditemukan.' });
	}

	return { gjCase, stageId: params.stageId, user: authedUser };
};

export const actions: Actions = {
	complete: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);

		const gjCase = await getCaseWithAttachments(
			locals.supabase as unknown as DbClient,
			params.caseId,
			authedUser.id
		);
		if (!gjCase) error(404, { message: 'Studi kasus tidak ditemukan.' });

		await markCaseCompleted(
			locals.supabase as unknown as DbClient,
			params.caseId,
			authedUser.id,
			gjCase.version_number
		);
		return { completed: true };
	}
};
