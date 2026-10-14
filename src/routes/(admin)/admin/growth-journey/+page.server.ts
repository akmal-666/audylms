import type { PageServerLoad } from './$types';
import { listAllStages } from '$lib/server/services/growth-journey';

export const load: PageServerLoad = async ({ locals }) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const stages = await listAllStages(locals.supabase as any);
	return { stages };
};
