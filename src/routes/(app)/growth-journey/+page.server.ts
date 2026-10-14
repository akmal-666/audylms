import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { listStagesForUser } from '$lib/server/services/growth-journey';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const progress = await listStagesForUser(locals.supabase as any, authedUser.id);

	return { progress, user: authedUser };
};
