import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * Root page — redirect authenticated users to dashboard,
 * unauthenticated users to login.
 */
export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (user) {
		redirect(303, '/dashboard');
	}
	redirect(303, '/login');
};
