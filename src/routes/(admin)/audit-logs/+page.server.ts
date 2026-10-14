import type { PageServerLoad } from './$types';
import type { Tables } from '$lib/types/database.types';

export type AuditLog = Tables<'audit_logs'>;

export const load = (async ({ locals: { supabase } }) => {
	const { data } = await supabase
		.from('audit_logs')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(100);

	return {
		logs: (data ?? []) as AuditLog[]
	};
}) satisfies PageServerLoad;
