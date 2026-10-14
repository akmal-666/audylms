import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	// user is guaranteed non-null here by the (app) layout guard
	return { user };
};
