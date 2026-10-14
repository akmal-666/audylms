import type { LayoutServerLoad } from './$types';
import { requireRole } from '$lib/server/auth';

/**
 * Admin layout guard.
 * All routes under (admin)/ require ADMIN role.
 * Any other authenticated user gets a 403.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	// requireRole handles the redirect/error internally
	requireRole(user, ['ADMIN']);

	return { session, user };
};
