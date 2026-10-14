import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getDriveUsageReport } from '$lib/server/services/reports';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.supabase as unknown as Db;
	const report = await getDriveUsageReport(db);
	return { report };
};
