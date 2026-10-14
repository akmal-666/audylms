import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	getUserById,
	updateUser,
	listDepartments,
	listPositions,
	writeAuditLog
} from '$lib/server/services/admin';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ params, locals }) => {
	const db = locals.supabase as unknown as Db;
	const [user, departments, positions] = await Promise.all([
		getUserById(db, params.id),
		listDepartments(db),
		listPositions(db)
	]);
	if (!user) error(404, { message: 'Pengguna tidak ditemukan.' });
	return { user, departments, positions };
};

export const actions: Actions = {
	save: async ({ request, locals, params }) => {
		const { user: admin } = await locals.safeGetSession();
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const full_name = (fd.get('full_name') as string)?.trim();
		const employee_code = (fd.get('employee_code') as string)?.trim() || null;
		const role = fd.get('role') as 'ADMIN' | 'STAFF';
		const department_id = (fd.get('department_id') as string) || null;
		const position_id = (fd.get('position_id') as string) || null;
		const is_active = fd.get('is_active') === 'on';
		if (!full_name) return fail(400, { error: 'Nama wajib diisi.' });
		try {
			const old = await getUserById(db, params.id);
			await updateUser(db, params.id, {
				full_name,
				employee_code,
				role,
				department_id,
				position_id,
				is_active
			});
			await writeAuditLog({
				userId: admin?.id ?? null,
				action: 'USER_UPDATED',
				tableName: 'profiles',
				recordId: params.id,
				oldData: old,
				newData: { full_name, role, is_active }
			});
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Gagal menyimpan.' });
		}
		return { saved: true };
	}
};
