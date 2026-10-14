// ============================================================
// Reports Service — SERVER ONLY
// Generates all ALC reports with optional filters + CSV export.
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';

type DbClient = ReturnType<typeof createSupabaseServerClient>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (db: DbClient, table: string) => (db as any).from(table);

export interface ReportFilters {
	from?: string; // ISO date string
	to?: string;
	position_id?: string;
	department_id?: string;
}

// ── 1. Material Detail Report ─────────────────────────────────

export interface MaterialDetailRow {
	material_id: string;
	material_title: string;
	stage_title: string;
	user_id: string;
	full_name: string;
	employee_code: string | null;
	position: string | null;
	department: string | null;
	status: string;
	completed_at: string | null;
}

export async function getMaterialDetailReport(
	db: DbClient,
	filters: ReportFilters = {}
): Promise<MaterialDetailRow[]> {
	let query = q(db, 'gj_material_progress')
		.select(
			`
			material_id, status, completed_at,
			material:gj_materials(title, stage:gj_stages(title)),
			user:profiles(id, full_name, employee_code,
				position:positions(label),
				department:departments(name))
		`
		)
		.order('completed_at', { ascending: false });

	if (filters.from) query = query.gte('completed_at', filters.from);
	if (filters.to) query = query.lte('completed_at', filters.to);

	const { data } = await query;
	const rows = (data ?? []) as Array<{
		material_id: string;
		status: string;
		completed_at: string | null;
		material: { title: string; stage: { title: string } | null } | null;
		user: {
			id: string;
			full_name: string;
			employee_code: string | null;
			position: { label: string } | null;
			department: { name: string } | null;
		} | null;
	}>;

	let result = rows.map((r) => ({
		material_id: r.material_id,
		material_title: r.material?.title ?? '—',
		stage_title: r.material?.stage?.title ?? '—',
		user_id: r.user?.id ?? '',
		full_name: r.user?.full_name ?? '—',
		employee_code: r.user?.employee_code ?? null,
		position: r.user?.position?.label ?? null,
		department: r.user?.department?.name ?? null,
		status: r.status,
		completed_at: r.completed_at
	}));

	if (filters.position_id) {
		// Filter by position after join (RLS-safe)
		const { data: pos } = await q(db, 'positions')
			.select('label')
			.eq('id', filters.position_id)
			.single();
		const posLabel = (pos as { label: string } | null)?.label;
		if (posLabel) result = result.filter((r) => r.position === posLabel);
	}

	return result;
}

// ── 2. Growth Journey Summary per Stage ──────────────────────

export interface GjStageSummaryRow {
	stage_id: string;
	stage_title: string;
	sort_order: number;
	total_enrolled: number;
	total_completed: number;
	completion_rate: number;
	avg_days_to_complete: number | null;
}

export async function getGjStageSummaryReport(
	db: DbClient,
	filters: ReportFilters = {}
): Promise<GjStageSummaryRow[]> {
	const { data: stages } = await q(db, 'gj_stages')
		.select('id, title, sort_order')
		.eq('is_published', true)
		.order('sort_order');

	const stageList = (stages ?? []) as { id: string; title: string; sort_order: number }[];
	const stageIds = stageList.map((s) => s.id);
	if (stageIds.length === 0) return [];

	let progressQuery = q(db, 'gj_user_progress')
		.select('stage_id, status, completed_at, created_at')
		.in('stage_id', stageIds);

	if (filters.from) progressQuery = progressQuery.gte('created_at', filters.from);
	if (filters.to) progressQuery = progressQuery.lte('created_at', filters.to);

	const { data: progresses } = await progressQuery;
	const rows = (progresses ?? []) as {
		stage_id: string;
		status: string;
		completed_at: string | null;
		created_at: string;
	}[];

	return stageList.map((stage) => {
		const stageRows = rows.filter((r) => r.stage_id === stage.id);
		const completed = stageRows.filter((r) => r.status === 'COMPLETED');
		const withTime = completed.filter((r) => r.completed_at);
		const avgDays =
			withTime.length > 0
				? withTime.reduce((sum, r) => {
						const start = new Date(r.created_at).getTime();
						const end = new Date(r.completed_at!).getTime();
						return sum + (end - start) / (1000 * 60 * 60 * 24);
					}, 0) / withTime.length
				: null;

		return {
			stage_id: stage.id,
			stage_title: stage.title,
			sort_order: stage.sort_order,
			total_enrolled: stageRows.length,
			total_completed: completed.length,
			completion_rate:
				stageRows.length > 0 ? Math.round((completed.length / stageRows.length) * 100) : 0,
			avg_days_to_complete: avgDays !== null ? Math.round(avgDays * 10) / 10 : null
		};
	});
}

// ── 3. Summary per Employee ───────────────────────────────────

export interface EmployeeSummaryRow {
	user_id: string;
	full_name: string;
	employee_code: string | null;
	position: string | null;
	department: string | null;
	gj_stages_completed: number;
	gj_materials_completed: number;
	quizzes_passed: number;
	total_points: number;
	badges_earned: number;
	certificates: number;
	last_activity: string | null;
}

export async function getEmployeeSummaryReport(
	db: DbClient,
	filters: ReportFilters = {}
): Promise<EmployeeSummaryRow[]> {
	let userQuery = q(db, 'profiles')
		.select('id, full_name, employee_code, position:positions(label), department:departments(name)')
		.eq('is_active', true)
		.eq('role', 'STAFF')
		.order('full_name');

	if (filters.department_id) userQuery = userQuery.eq('department_id', filters.department_id);
	if (filters.position_id) userQuery = userQuery.eq('position_id', filters.position_id);

	const { data: users } = await userQuery;
	const userList = (users ?? []) as Array<{
		id: string;
		full_name: string;
		employee_code: string | null;
		position: { label: string } | null;
		department: { name: string } | null;
	}>;

	if (userList.length === 0) return [];
	const userIds = userList.map((u) => u.id);

	// Fetch aggregates
	const [gjStage, gjMat, quizPass, points, badges, certs] = await Promise.all([
		q(db, 'gj_user_progress').select('user_id').in('user_id', userIds).eq('status', 'COMPLETED'),
		q(db, 'gj_material_progress')
			.select('user_id')
			.in('user_id', userIds)
			.eq('status', 'COMPLETED'),
		q(db, 'gj_quiz_attempts')
			.select('user_id')
			.in('user_id', userIds)
			.eq('passed', true)
			.eq('status', 'COMPLETED'),
		q(db, 'point_transactions').select('user_id, points').in('user_id', userIds),
		q(db, 'user_badges').select('user_id').in('user_id', userIds),
		q(db, 'certificates').select('user_id').in('user_id', userIds)
	]);

	// Last activity
	const { data: lastActivities } = await q(db, 'gj_material_progress')
		.select('user_id, completed_at')
		.in('user_id', userIds)
		.not('completed_at', 'is', null)
		.order('completed_at', { ascending: false });

	// Build maps
	const countMap = (rows: { user_id: string }[], key = 'user_id') => {
		const m = new Map<string, number>();
		for (const r of rows)
			m.set(
				r[key as keyof typeof r] as string,
				(m.get(r[key as keyof typeof r] as string) ?? 0) + 1
			);
		return m;
	};

	const stageMap = countMap((gjStage.data ?? []) as { user_id: string }[]);
	const matMap = countMap((gjMat.data ?? []) as { user_id: string }[]);
	const quizMap = countMap((quizPass.data ?? []) as { user_id: string }[]);
	const badgeMap = countMap((badges.data ?? []) as { user_id: string }[]);
	const certMap = countMap((certs.data ?? []) as { user_id: string }[]);

	const ptMap = new Map<string, number>();
	for (const p of (points.data ?? []) as { user_id: string; points: number }[]) {
		ptMap.set(p.user_id, (ptMap.get(p.user_id) ?? 0) + p.points);
	}

	const lastActMap = new Map<string, string>();
	for (const a of (lastActivities.data ?? []) as { user_id: string; completed_at: string }[]) {
		if (!lastActMap.has(a.user_id)) lastActMap.set(a.user_id, a.completed_at);
	}

	return userList.map((u) => ({
		user_id: u.id,
		full_name: u.full_name,
		employee_code: u.employee_code,
		position: u.position?.label ?? null,
		department: u.department?.name ?? null,
		gj_stages_completed: stageMap.get(u.id) ?? 0,
		gj_materials_completed: matMap.get(u.id) ?? 0,
		quizzes_passed: quizMap.get(u.id) ?? 0,
		total_points: ptMap.get(u.id) ?? 0,
		badges_earned: badgeMap.get(u.id) ?? 0,
		certificates: certMap.get(u.id) ?? 0,
		last_activity: lastActMap.get(u.id) ?? null
	}));
}

// ── 4. Q&A Report ─────────────────────────────────────────────

export interface QnaReportRow {
	question_id: string;
	title: string;
	author: string;
	answer_count: number;
	is_resolved: boolean;
	has_verified_answer: boolean;
	view_count: number;
	created_at: string;
}

export async function getQnaReport(
	db: DbClient,
	filters: ReportFilters = {}
): Promise<QnaReportRow[]> {
	let query = q(db, 'qna_questions')
		.select('id, title, view_count, is_resolved, created_at, author:profiles(full_name)')
		.eq('is_published', true)
		.order('created_at', { ascending: false });

	if (filters.from) query = query.gte('created_at', filters.from);
	if (filters.to) query = query.lte('created_at', filters.to);

	const { data } = await query;
	const questions = (data ?? []) as Array<{
		id: string;
		title: string;
		view_count: number;
		is_resolved: boolean;
		created_at: string;
		author: { full_name: string } | null;
	}>;

	if (questions.length === 0) return [];
	const qIds = questions.map((q) => q.id);

	const { data: answers } = await q(db, 'qna_answers')
		.select('question_id, is_verified')
		.in('question_id', qIds);
	const ansRows = (answers ?? []) as { question_id: string; is_verified: boolean }[];

	const ansCountMap = new Map<string, number>();
	const verifiedMap = new Set<string>();
	for (const a of ansRows) {
		ansCountMap.set(a.question_id, (ansCountMap.get(a.question_id) ?? 0) + 1);
		if (a.is_verified) verifiedMap.add(a.question_id);
	}

	return questions.map((q) => ({
		question_id: q.id,
		title: q.title,
		author: q.author?.full_name ?? '—',
		answer_count: ansCountMap.get(q.id) ?? 0,
		is_resolved: q.is_resolved,
		has_verified_answer: verifiedMap.has(q.id),
		view_count: q.view_count,
		created_at: q.created_at
	}));
}

// ── 5. Feedback / Aspirasi Report ─────────────────────────────

export interface FeedbackReportRow {
	id: string;
	category: string;
	title: string;
	author: string;
	is_anonymous: boolean;
	status: string;
	has_response: boolean;
	created_at: string;
	responded_at: string | null;
}

export async function getFeedbackReport(
	db: DbClient,
	filters: ReportFilters = {}
): Promise<FeedbackReportRow[]> {
	let query = q(db, 'asp_submissions')
		.select(
			'id, category, title, is_anonymous, status, admin_response, responded_at, created_at, author:profiles(full_name)'
		)
		.order('created_at', { ascending: false });

	if (filters.from) query = query.gte('created_at', filters.from);
	if (filters.to) query = query.lte('created_at', filters.to);

	const { data } = await query;
	return (
		(data ?? []) as Array<{
			id: string;
			category: string;
			title: string;
			is_anonymous: boolean;
			status: string;
			admin_response: string | null;
			responded_at: string | null;
			created_at: string;
			author: { full_name: string } | null;
		}>
	).map((r) => ({
		id: r.id,
		category: r.category,
		title: r.title,
		author: r.is_anonymous ? 'Anonim' : (r.author?.full_name ?? '—'),
		is_anonymous: r.is_anonymous,
		status: r.status,
		has_response: !!r.admin_response,
		created_at: r.created_at,
		responded_at: r.responded_at
	}));
}

// ── 6. Drive Attachment Usage Report ─────────────────────────

export interface DriveUsageRow {
	file_id: string;
	drive_file_id: string;
	name: string;
	mime_type: string;
	storage_area: string;
	entity_type: string;
	uploader: string;
	size_bytes: number | null;
	created_at: string;
	drive_folder_id: string | null;
	reference_count?: number;
}

export interface DriveUsageSummary {
	rows: DriveUsageRow[];
	total_files: number;
	total_size_bytes: number;
	by_type: Record<string, number>;
	by_module: Record<string, number>;
}

export async function getDriveUsageReport(db: DbClient): Promise<DriveUsageSummary> {
	const { data } = await q(db, 'drive_files')
		.select(
			'id, drive_file_id, name, mime_type, storage_area, entity_type, size_bytes, created_at, drive_folder_id, uploader:profiles!drive_files_uploaded_by_fkey(full_name)'
		)
		.is('deleted_at', null)
		.order('created_at', { ascending: false });

	const rows = (
		(data ?? []) as Array<{
			id: string;
			drive_file_id: string;
			name: string;
			mime_type: string;
			storage_area: string;
			entity_type: string;
			size_bytes: number | null;
			created_at: string;
			drive_folder_id: string | null;
			uploader: { full_name: string } | null;
		}>
	).map((r): DriveUsageRow => ({
		file_id: r.id,
		drive_file_id: r.drive_file_id,
		name: r.name,
		mime_type: r.mime_type,
		storage_area: r.storage_area,
		entity_type: r.entity_type,
		uploader: r.uploader?.full_name ?? '—',
		size_bytes: r.size_bytes,
		created_at: r.created_at,
		drive_folder_id: r.drive_folder_id
	}));

	const totalSize = rows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);

	const byType: Record<string, number> = {};
	const byModule: Record<string, number> = {};
	for (const r of rows) {
		const ext = r.mime_type.split('/')[0] ?? 'other';
		byType[ext] = (byType[ext] ?? 0) + 1;
		byModule[r.storage_area] = (byModule[r.storage_area] ?? 0) + 1;
	}

	return {
		rows,
		total_files: rows.length,
		total_size_bytes: totalSize,
		by_type: byType,
		by_module: byModule
	};
}

// ── CSV export utility ────────────────────────────────────────

export function toCSV(rows: Record<string, unknown>[], columns?: string[]): string {
	if (rows.length === 0) return '';
	const cols = columns ?? Object.keys(rows[0]);
	const escape = (v: unknown) => {
		const s = v == null ? '' : String(v);
		return s.includes(',') || s.includes('"') || s.includes('\n')
			? `"${s.replace(/"/g, '""')}"`
			: s;
	};
	const header = cols.join(',');
	const body = rows.map((r) => cols.map((c) => escape(r[c])).join(','));
	return [header, ...body].join('\n');
}
