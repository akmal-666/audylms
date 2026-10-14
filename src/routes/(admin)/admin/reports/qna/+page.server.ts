import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getQnaReport } from '$lib/server/services/reports';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.supabase as unknown as Db;
	const filters = {
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined
	};
	const report = await getQnaReport(db, filters);
	return { report, filters };
};
