import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { getEmployeeSummaryReport } from '$lib/server/services/reports';
import { listDepartments, listPositions } from '$lib/server/services/admin';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.supabase as unknown as Db;
	const filters = {
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined,
		department_id: url.searchParams.get('department_id') ?? undefined,
		position_id: url.searchParams.get('position_id') ?? undefined
	};

	const [report, departments, positions] = await Promise.all([
		getEmployeeSummaryReport(db, filters),
		listDepartments(db),
		listPositions(db)
	]);

	return { report, departments, positions, filters };
};

// CSV export via GET ?csv=1