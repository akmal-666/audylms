import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getProgressReport } from '$lib/server/services/admin';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.supabase as unknown as Db;
	const report = await getProgressReport(db);
	return { report };
};
