// ============================================================
// Quiz Page — Employee
//
// SECURITY:
//   - Quiz data loaded via getQuizForEmployee() which strips is_correct.
//   - Submission goes through submitQuizAttempt() — server-side scoring.
//   - Correct answers never reach the browser before submission.
// ============================================================

import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import {
	getQuizForEmployee,
	startQuizAttempt,
	submitQuizAttempt,
	abandonQuizAttempt,
	getAttemptResult
} from '$lib/server/services/assessment';
import { onQuizSubmitted } from '$lib/server/services/rewards-integration';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const quiz = await getQuizForEmployee(locals.supabase as any, params.quizId, authedUser.id);

	if (!quiz || quiz.stage_id !== params.stageId) {
		error(404, { message: 'Kuis tidak ditemukan.' });
	}

	// If a specific attempt result is being viewed
	const viewAttempt = url.searchParams.get('attempt');
	let attemptResult = null;
	if (viewAttempt) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		attemptResult = await getAttemptResult(locals.supabase as any, viewAttempt, authedUser.id);
	}

	return {
		quiz,
		stageId: params.stageId,
		attemptResult,
		user: authedUser
	};
};

export const actions: Actions = {
	/** Start a new attempt — creates IN_PROGRESS record */
	start: async ({ locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const attempt = await startQuizAttempt(locals.supabase as any, params.quizId, authedUser.id);
		return { attemptId: attempt.id };
	},

	/** Submit answers — server scores, locks attempt, returns result */
	submit: async ({ request, locals, params }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);

		const formData = await request.formData();
		const attemptId = formData.get('attempt_id') as string;

		if (!attemptId) {
			error(400, { message: 'ID percobaan tidak ditemukan.' });
		}

		// Parse answers: form fields named q_{questionId} = optionId
		const answers: Array<{ question_id: string; option_id: string }> = [];
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('q_') && typeof value === 'string' && value) {
				answers.push({ question_id: key.slice(2), option_id: value });
			}
		}

		let result;
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			result = await submitQuizAttempt(locals.supabase as any, attemptId, authedUser.id, answers);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Gagal mengirim jawaban.';
			return { error: msg };
		}

		// Fire-and-forget rewards (non-fatal)
		void onQuizSubmitted(
			authedUser.id,
			params.quizId,
			result.attempt.id,
			result.score,
			result.passed,
			result.correct_answers
		);

		// Redirect to the result view
		redirect(
			303,
			`/growth-journey/${params.stageId}/quiz/${params.quizId}?attempt=${result.attempt.id}`
		);
	},

	/** Abandon an in-progress attempt */
	abandon: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);

		const formData = await request.formData();
		const attemptId = formData.get('attempt_id') as string;
		if (!attemptId) return { success: false };

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await abandonQuizAttempt(locals.supabase as any, attemptId, authedUser.id);
		return { success: true };
	}
};
