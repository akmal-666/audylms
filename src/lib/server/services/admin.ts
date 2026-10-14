// ============================================================
// Admin Service — SERVER ONLY
// Shared admin operations: users, departments, positions,
// audit logging, file management, progress/reports.
// ============================================================

import { createSupabaseAdminClient } from '$lib/server/supabase';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import type { Tables, TablesInsert, TablesUpdate } from '$lib/types/database.types';

type DbClient = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: DbClient | ReturnType<typeof createSupabaseAdminClient>, table: string) => (db as any).from(table);

// ── Users ────────────────────────────────────────────────────

export interface UserListItem extends Tables<'profiles'> {
	department: Pick<Tables<'departments'>, 'id' | 'name'> | null;
	position: Pick<Tables<'positions'>, 'id' | 'label' | 'name'> | null;
}

export async function listAllUsers(db: DbClient): Promise<UserListItem[]> {
	const { data } = await q(db, 'profiles')
		.select('*, department:departments(id,name), position:positions(id,name,label)')
		.order('full_name');
	return (data ?? []) as UserListItem[];
}

export async function getUserById(db: DbClient, id: string): Promise<UserListItem | null> {
	const { data } = await q(db, 'profiles')
		.select('*, department:departments(id,name), position:positions(id,name,label)')
		.eq('id', id)
		.single();
	return (data as UserListItem) ?? null;
}

export async function updateUser(
	db: DbClient,
	id: string,
	update: TablesUpdate<'profiles'>
): Promise<Tables<'profiles'>> {
	const { data, error } = await q(db, 'profiles').update(update).eq('id', id).select().single();
	if (error) throw new Error(error.message);
	return data as Tables<'profiles'>;
}

export async function deactivateUser(db: DbClient, id: string): Promise<void> {
	await q(db, 'profiles').update({ is_active: false }).eq('id', id);
}

// ── Departments ───────────────────────────────────────────────

export async function listDepartments(db: DbClient): Promise<Tables<'departments'>[]> {
	const { data } = await q(db, 'departments').select('*').order('name');
	return (data ?? []) as Tables<'departments'>[];
}

export async function upsertDepartment(
	db: DbClient,
	data: TablesInsert<'departments'>
): Promise<Tables<'departments'>> {
	const { data: row, error } = await q(db, 'departments')
		.upsert(data, { onConflict: 'name' })
		.select()
		.single();
	if (error) throw new Error(error.message);
	return row as Tables<'departments'>;
}

// ── Positions ─────────────────────────────────────────────────

export async function listPositions(db: DbClient): Promise<Tables<'positions'>[]> {
	const { data } = await q(db, 'positions').select('*').order('label');
	return (data ?? []) as Tables<'positions'>[];
}

// ── Audit Logging ─────────────────────────────────────────────

export async function writeAuditLog(params: {
	userId: string | null;
	action: string;
	tableName?: string;
	recordId?: string;
	oldData?: unknown;
	newData?: unknown;
	ipAddress?: string;
	userAgent?: string;
}): Promise<void> {
	const admin = createSupabaseAdminClient();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	await (admin as any).from('audit_logs').insert({
		user_id: params.userId,
		action: params.action,
		table_name: params.tableName ?? null,
		record_id: params.recordId ?? null,
		old_data: params.oldData ?? null,
		new_data: params.newData ?? null,
		ip_address: params.ipAddress ?? null,
		user_agent: params.userAgent ?? null
	});
}

export async function listAuditLogs(
	db: DbClient,
	limit = 100,
	offset = 0
): Promise<{ logs: Tables<'audit_logs'>[]; total: number }> {
	const { data, count } = await q(db, 'audit_logs')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range(offset, offset + limit - 1);
	return { logs: (data ?? []) as Tables<'audit_logs'>[], total: count ?? 0 };
}

// ── Drive Files Manager ───────────────────────────────────────

export interface DriveFileRow extends Tables<'drive_files'> {
	uploader: Pick<Tables<'profiles'>, 'id' | 'full_name'> | null;
	reference_count: number;
}

export async function listDriveFiles(
	db: DbClient,
	options: {
		storageArea?: string;
		entityType?: string;
		limit?: number;
		offset?: number;
		search?: string;
	} = {}
): Promise<{ files: DriveFileRow[]; total: number }> {
	let base = q(db, 'drive_files')
		.select('*, uploader:profiles!drive_files_uploaded_by_fkey(id,full_name)', { count: 'exact' })
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	if (options.storageArea) base = base.eq('storage_area', options.storageArea);
	if (options.entityType) base = base.eq('entity_type', options.entityType);
	if (options.search) base = base.ilike('name', `%${options.search}%`);

	const limit = options.limit ?? 50;
	const offset = options.offset ?? 0;
	base = base.range(offset, offset + limit - 1);

	const { data, count } = await base;
	const files = (data ?? []) as DriveFileRow[];

	// Get reference counts for each file
	const fileIds = files.map((f) => f.id);
	const counts: Record<string, number> = {};
	if (fileIds.length > 0) {
		// Check across all attachment tables
		const tables = [
			'gj_attachments',
			'gj_case_attachments',
			'gj_question_attachments',
			'gj_material_content',
			'pk_sections',
			'fu_attachments',
			'qna_attachments',
			'lp_practices'
		];
		for (const table of tables) {
			const { data: refs } = await q(db, table)
				.select('drive_file_id')
				.in('drive_file_id', fileIds);
			for (const r of (refs ?? []) as { drive_file_id: string }[]) {
				counts[r.drive_file_id] = (counts[r.drive_file_id] ?? 0) + 1;
			}
		}
	}

	return {
		files: files.map((f) => ({ ...f, reference_count: counts[f.id] ?? 0 })),
		total: count ?? 0
	};
}

export async function softDeleteDriveFileAdmin(
	db: DbClient,
	fileId: string,
	adminUserId: string
): Promise<{ deleted_from_drive: boolean; only_unlinked: boolean }> {
	// 1. Check reference count
	const { files } = await listDriveFiles(db, { limit: 1 });
	const file = files.find((f) => f.id === fileId);
	const refCount = file?.reference_count ?? 0;

	if (refCount > 0) {
		// Still referenced — only soft-delete the metadata row, leave Drive file
		await q(db, 'drive_files').update({ deleted_at: new Date().toISOString() }).eq('id', fileId);
		await writeAuditLog({
			userId: adminUserId,
			action: 'DRIVE_FILE_UNLINKED',
			tableName: 'drive_files',
			recordId: fileId
		});
		return { deleted_from_drive: false, only_unlinked: true };
	}

	// No references — soft-delete
	await q(db, 'drive_files').update({ deleted_at: new Date().toISOString() }).eq('id', fileId);
	await writeAuditLog({
		userId: adminUserId,
		action: 'DRIVE_FILE_DELETED',
		tableName: 'drive_files',
		recordId: fileId
	});
	return { deleted_from_drive: true, only_unlinked: false };
}

export async function replaceDriveFile(
	db: DbClient,
	oldFileId: string,
	newFileRow: TablesInsert<'drive_files'>,
	adminUserId: string
): Promise<Tables<'drive_files'>> {
	// Insert new file metadata
	const { data: newFile, error } = await q(db, 'drive_files').insert(newFileRow).select().single();
	if (error) throw new Error(error.message);

	// Soft-delete old file
	await q(db, 'drive_files').update({ deleted_at: new Date().toISOString() }).eq('id', oldFileId);

	await writeAuditLog({
		userId: adminUserId,
		action: 'DRIVE_FILE_REPLACED',
		tableName: 'drive_files',
		recordId: oldFileId,
		newData: { new_file_id: (newFile as Tables<'drive_files'>).id }
	});

	return newFile as Tables<'drive_files'>;
}

// ── Progress / Reports ────────────────────────────────────────

export interface UserProgressSummary {
	user: Pick<Tables<'profiles'>, 'id' | 'full_name' | 'employee_code' | 'role'>;
	position: Pick<Tables<'positions'>, 'label'> | null;
	gj_completed_stages: number;
	gj_total_stages: number;
	total_points: number;
	badge_count: number;
	certificate_count: number;
}

export async function getProgressReport(db: DbClient): Promise<UserProgressSummary[]> {
	const { data: users } = await q(db, 'profiles')
		.select('id, full_name, employee_code, role, position:positions(label)')
		.eq('is_active', true)
		.order('full_name');

	if (!users || users.length === 0) return [];

	const userIds = (users as { id: string }[]).map((u) => u.id);

	// GJ stage progress
	const { data: gjProgress } = await q(db, 'gj_user_progress')
		.select('user_id, status')
		.in('user_id', userIds)
		.eq('status', 'COMPLETED');

	// Total stages
	const { count: totalStages } = await q(db, 'gj_stages')
		.select('id', { count: 'exact', head: true })
		.eq('is_published', true);

	// Points
	const { data: pointRows } = await q(db, 'point_transactions')
		.select('user_id, points')
		.in('user_id', userIds);

	// Badges
	const { data: badgeRows } = await q(db, 'user_badges').select('user_id').in('user_id', userIds);

	// Certificates
	const { data: certRows } = await q(db, 'certificates').select('user_id').in('user_id', userIds);

	// Build maps
	const gjMap = new Map<string, number>();
	for (const p of (gjProgress ?? []) as { user_id: string }[]) {
		gjMap.set(p.user_id, (gjMap.get(p.user_id) ?? 0) + 1);
	}

	const pointsMap = new Map<string, number>();
	for (const p of (pointRows ?? []) as { user_id: string; points: number }[]) {
		pointsMap.set(p.user_id, (pointsMap.get(p.user_id) ?? 0) + p.points);
	}

	const badgeMap = new Map<string, number>();
	for (const b of (badgeRows ?? []) as { user_id: string }[]) {
		badgeMap.set(b.user_id, (badgeMap.get(b.user_id) ?? 0) + 1);
	}

	const certMap = new Map<string, number>();
	for (const c of (certRows ?? []) as { user_id: string }[]) {
		certMap.set(c.user_id, (certMap.get(c.user_id) ?? 0) + 1);
	}

	return (
		users as Array<
			Pick<Tables<'profiles'>, 'id' | 'full_name' | 'employee_code' | 'role'> & {
				position: Pick<Tables<'positions'>, 'label'> | null;
			}
		>
	).map((u) => ({
		user: { id: u.id, full_name: u.full_name, employee_code: u.employee_code, role: u.role },
		position: u.position,
		gj_completed_stages: gjMap.get(u.id) ?? 0,
		gj_total_stages: totalStages ?? 0,
		total_points: pointsMap.get(u.id) ?? 0,
		badge_count: badgeMap.get(u.id) ?? 0,
		certificate_count: certMap.get(u.id) ?? 0
	}));
}

// ── System Settings ───────────────────────────────────────────

export async function getSystemSettings(db: DbClient): Promise<Tables<'system_settings'>[]> {
	const { data } = await q(db, 'system_settings').select('*').order('key');
	return (data ?? []) as Tables<'system_settings'>[];
}

export async function upsertSystemSetting(
	db: DbClient,
	key: string,
	value: string,
	updatedBy: string
): Promise<void> {
	await q(db, 'system_settings').upsert(
		{ key, value, updated_by: updatedBy },
		{ onConflict: 'key' }
	);
}
