import type { LayoutServerLoad } from './$types';

/**
 * Root layout server load.
 * Runs on every request that hits a page using this layout.
 * Resolves the session and user profile once, then makes them
 * available to all child layouts and pages via data.session / data.user.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	return { session, user };
};
