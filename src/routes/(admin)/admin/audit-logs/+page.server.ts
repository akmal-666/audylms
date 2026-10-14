import type { PageServerLoad } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import { listAuditLogs, writeAuditLog } from '$lib/server/services/admin';
import {  } from '$lib/server/services/reports';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ url, locals }) => {
	const db = locals.supabase as unknown as Db;
	const page = parseInt(url.searchParams.get('page') ?? '0');
	const action = url.searchParams.get('action') ?? undefined;
	const { user } = await locals.safeGetSession();

	// Log the admin accessing audit logs
	if (user) {
		void writeAuditLog({ userId: user.id, action: 'AUDIT_LOG_VIEWED', ipAddress: undefined });
	}

	const { logs, total } = await listAuditLogs(db, 100, page * 100);
	const filtered = action ? logs.filter((l) => l.action.includes(action.toUpperCase())) : logs;

	return { logs: filtered, total, page, action };
};
