import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getMaterialDetailReport } from '$lib/server/services/reports';
import { listPositions } from '$lib/server/services/admin';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.supabase as unknown as Db;
	const filters = {
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined,
		position_id: url.searchParams.get('position_id') ?? undefined
	};
	const [report, positions] = await Promise.all([
		getMaterialDetailReport(db, filters),
		listPositions(db)
	]);
	return { report, positions, filters };
};
