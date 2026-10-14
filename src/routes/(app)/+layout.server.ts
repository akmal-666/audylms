import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { requireActiveAccount } from '$lib/server/auth';

/**
 * App shell layout guard.
 * All routes under (app)/ require authentication.
 * Unauthenticated users are redirected to /login.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url }) => {
	const { session, user } = await safeGetSession();

	if (!session || !user) {
		const loginUrl = `/login?redirectTo=${encodeURIComponent(url.pathname)}`;
		redirect(303, loginUrl);
	}

	// Block inactive accounts
	requireActiveAccount(user);

	return { session, user };
};
