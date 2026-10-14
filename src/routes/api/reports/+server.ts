// ============================================================
// GET /api/reports?type=X&from=Y&to=Z&csv=1
// Returns CSV export for any report type.
// ADMIN only.
// ============================================================

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	getMaterialDetailReport,
	getGjStageSummaryReport,
	getEmployeeSummaryReport,
	getQnaReport,
	getFeedbackReport,
	getDriveUsageReport,
	toCSV
} from '$lib/server/services/reports';
import { listAuditLogs } from '$lib/server/services/admin';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const GET: RequestHandler = async ({ url, locals }) => {
	const { user } = await locals.safeGetSession();
	requireRole(user, ['ADMIN']);

	const db = locals.supabase as unknown as Db;
	const type = url.searchParams.get('type') ?? '';
	const filters = {
		from: url.searchParams.get('from') ?? undefined,
		to: url.searchParams.get('to') ?? undefined,
		department_id: url.searchParams.get('department_id') ?? undefined,
		position_id: url.searchParams.get('position_id') ?? undefined
	};

	let csv = '';
	let filename = `report-${type}-${Date.now()}.csv`;

	switch (type) {
		case 'material-detail': {
			const data = await getMaterialDetailReport(db, filters);
			csv = toCSV(data as unknown as Record<string, unknown>[]);
			filename = `material-detail-${Date.now()}.csv`;
			break;
		}
		case 'gj-summary': {
			const data = await getGjStageSummaryReport(db, filters);
			csv = toCSV(data as unknown as Record<string, unknown>[]);
			filename = `gj-summary-${Date.now()}.csv`;
			break;
		}
		case 'employee-summary': {
			const data = await getEmployeeSummaryReport(db, filters);
			csv = toCSV(data as unknown as Record<string, unknown>[]);
			filename = `employee-summary-${Date.now()}.csv`;
			break;
		}
		case 'qna': {
			const data = await getQnaReport(db, filters);
			csv = toCSV(data as unknown as Record<string, unknown>[]);
			filename = `qna-${Date.now()}.csv`;
			break;
		}
		case 'feedback': {
			const data = await getFeedbackReport(db, filters);
			csv = toCSV(data as unknown as Record<string, unknown>[]);
			filename = `feedback-${Date.now()}.csv`;
			break;
		}
		case 'drive-usage': {
			const { rows } = await getDriveUsageReport(db);
			csv = toCSV(rows as unknown as Record<string, unknown>[]);
			filename = `drive-usage-${Date.now()}.csv`;
			break;
		}
		case 'audit-logs': {
			const { logs } = await listAuditLogs(db, 1000, 0);
			csv = toCSV(logs as unknown as Record<string, unknown>[], [
				'id', 'user_id', 'action', 'table_name', 'record_id', 'ip_address', 'created_at'
			]);
			filename = `audit-log-${Date.now()}.csv`;
			break;
		}
		default:
			error(400, { message: `Unknown report type: ${type}` });
	}

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
