import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getUserBadges, getBadgeCatalogue } from '$lib/server/services/badges';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	const [earned, catalogue] = await Promise.all([
		getUserBadges(authedUser.id),
		getBadgeCatalogue()
	]);

	const earnedIds = new Set(earned.map((b) => b.badge_id));

	return {
		earned,
		catalogue: catalogue.map((b) => ({ ...b, is_earned: earnedIds.has(b.id) })),
		user: authedUser
	};
};
