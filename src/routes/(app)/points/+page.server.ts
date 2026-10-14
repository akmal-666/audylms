import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getUserPointSummary } from '$lib/server/services/points';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	const summary = await getUserPointSummary(authedUser.id);

	return { summary, user: authedUser };
};
