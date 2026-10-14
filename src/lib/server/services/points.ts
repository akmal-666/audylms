// ============================================================
// Points Service — SERVER ONLY
//
// All point awards happen server-side.
// Idempotency key prevents duplicate awards.
// append-only ledger (point_transactions) — never updated.
// ============================================================

import { createSupabaseAdminClient } from '$lib/server/supabase';
import type { Tables, PointEventType } from '$lib/types/database.types';

// Use admin client (bypasses RLS) — point awards are always server-side
function getAdmin() {
	return createSupabaseAdminClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (client: ReturnType<typeof createSupabaseAdminClient>, table: string) => (client as any).from(table);

// ── Core award function ──────────────────────────────────────

/**
 * Award (or deduct) points to a user.
 *
 * IDEMPOTENCY: if a transaction with the same idempotency_key
 * already exists for this user, this call is a no-op and
 * returns null (not an error).
 *
 * Format for idempotency_key:
 *   '{EVENT_TYPE}:{entity_id}'        — for entity-based events
 *   '{EVENT_TYPE}:{user_id}:{ref}'    — for user-level events
 */
export async function awardPoints(params: {
	userId: string;
	eventType: PointEventType;
	points: number;
	entityType?: string;
	entityId?: string;
	idempotencyKey: string;
	notes?: string;
}): Promise<Tables<'point_transactions'> | null> {
	const admin = getAdmin();

	const { data, error } = await q(admin, 'point_transactions')
		.insert({
			user_id: params.userId,
			event_type: params.eventType,
			points: params.points,
			entity_type: params.entityType ?? null,
			entity_id: params.entityId ?? null,
			idempotency_key: params.idempotencyKey,
			notes: params.notes ?? null
		})
		.select()
		.single();

	if (error) {
		// Unique constraint violation = already awarded (idempotent)
		if (error.code === '23505') return null;
		throw new Error(`Points award failed: ${error.message}`);
	}

	return data as Tables<'point_transactions'>;
}

// ── Rule-based award ─────────────────────────────────────────

/**
 * Award points based on a configured point_rules row.
 * Looks up the base_points for the event_type from DB.
 * Falls back to the provided fallback if rule not found.
 */
export async function awardPointsByRule(params: {
	userId: string;
	eventType: PointEventType;
	entityType?: string;
	entityId?: string;
	idempotencyKey: string;
	fallbackPoints?: number;
	notes?: string;
}): Promise<Tables<'point_transactions'> | null> {
	const admin = getAdmin();

	const { data: rule } = await q(admin, 'point_rules')
		.select('base_points')
		.eq('event_type', params.eventType)
		.eq('is_active', true)
		.maybeSingle();

	const points =
		(rule as { base_points: number } | null)?.base_points ?? params.fallbackPoints ?? 0;
	if (points === 0) return null;

	return awardPoints({ ...params, points });
}

// ── Specific event helpers ────────────────────────────────────

export async function awardMaterialCompletion(userId: string, materialId: string) {
	return awardPointsByRule({
		userId,
		eventType: 'MATERIAL_COMPLETE',
		entityType: 'gj_materials',
		entityId: materialId,
		idempotencyKey: `MATERIAL_COMPLETE:${materialId}:${userId}`,
		fallbackPoints: 10
	});
}

export async function awardCaseCompletion(userId: string, caseId: string) {
	return awardPointsByRule({
		userId,
		eventType: 'CASE_COMPLETE',
		entityType: 'gj_cases',
		entityId: caseId,
		idempotencyKey: `CASE_COMPLETE:${caseId}:${userId}`,
		fallbackPoints: 15
	});
}

export async function awardQuizPass(userId: string, quizId: string, attemptId: string) {
	return awardPointsByRule({
		userId,
		eventType: 'QUIZ_PASS',
		entityType: 'gj_quizzes',
		entityId: quizId,
		idempotencyKey: `QUIZ_PASS:${attemptId}`,
		fallbackPoints: 25
	});
}

export async function awardQuizPerfect(userId: string, quizId: string, attemptId: string) {
	return awardPointsByRule({
		userId,
		eventType: 'QUIZ_PERFECT',
		entityType: 'gj_quizzes',
		entityId: quizId,
		idempotencyKey: `QUIZ_PERFECT:${attemptId}`,
		fallbackPoints: 50
	});
}

export async function awardQuizQuestions(userId: string, attemptId: string, correctCount: number) {
	if (correctCount === 0) return null;
	const admin = getAdmin();
	const { data: rule } = await q(admin, 'point_rules')
		.select('base_points')
		.eq('event_type', 'QUESTION_CORRECT')
		.eq('is_active', true)
		.maybeSingle();

	const perQuestion = (rule as { base_points: number } | null)?.base_points ?? 2;
	const total = correctCount * perQuestion;
	if (total === 0) return null;

	return awardPoints({
		userId,
		eventType: 'QUESTION_CORRECT',
		entityType: 'gj_quiz_attempts',
		entityId: attemptId,
		points: total,
		idempotencyKey: `QUESTION_CORRECT:${attemptId}`,
		notes: `${correctCount} correct answers × ${perQuestion} pts`
	});
}

// ── Balance queries ───────────────────────────────────────────

/**
 * Get the total points balance for a user.
 * Computed from the sum of all point_transactions.
 */
export async function getUserPointBalance(userId: string): Promise<number> {
	const admin = getAdmin();
	const { data } = await q(admin, 'point_transactions').select('points').eq('user_id', userId);

	return ((data ?? []) as { points: number }[]).reduce((sum, row) => sum + row.points, 0);
}

/**
 * Get recent point transactions for a user (for display).
 */
export async function getUserPointHistory(
	userId: string,
	limit = 20
): Promise<Tables<'point_transactions'>[]> {
	const admin = getAdmin();
	const { data } = await q(admin, 'point_transactions')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit);

	return (data ?? []) as Tables<'point_transactions'>[];
}

/**
 * Determine the current level for a given point total.
 */
export async function getUserLevel(totalPoints: number): Promise<Tables<'levels'> | null> {
	const admin = getAdmin();
	const { data } = await q(admin, 'levels')
		.select('*')
		.lte('points_required', totalPoints)
		.order('points_required', { ascending: false })
		.limit(1);

	return ((data ?? []) as Tables<'levels'>[])[0] ?? null;
}

/**
 * Get the next level threshold (null if at max level).
 */
export async function getNextLevel(totalPoints: number): Promise<Tables<'levels'> | null> {
	const admin = getAdmin();
	const { data } = await q(admin, 'levels')
		.select('*')
		.gt('points_required', totalPoints)
		.order('points_required', { ascending: true })
		.limit(1);

	return ((data ?? []) as Tables<'levels'>[])[0] ?? null;
}

/**
 * Full point summary for a user: balance, level, history.
 */
export interface UserPointSummary {
	total_points: number;
	current_level: Tables<'levels'> | null;
	next_level: Tables<'levels'> | null;
	progress_to_next: number; // percentage 0-100
	recent_history: Tables<'point_transactions'>[];
}

export async function getUserPointSummary(userId: string): Promise<UserPointSummary> {
	const [total, history] = await Promise.all([
		getUserPointBalance(userId),
		getUserPointHistory(userId, 10)
	]);

	const [currentLevel, nextLevel] = await Promise.all([getUserLevel(total), getNextLevel(total)]);

	let progressToNext = 100;
	if (nextLevel && currentLevel) {
		const range = nextLevel.points_required - currentLevel.points_required;
		const earned = total - currentLevel.points_required;
		progressToNext = range > 0 ? Math.min(100, Math.round((earned / range) * 100)) : 100;
	} else if (nextLevel) {
		progressToNext =
			nextLevel.points_required > 0
				? Math.min(100, Math.round((total / nextLevel.points_required) * 100))
				: 100;
	}

	return {
		total_points: total,
		current_level: currentLevel,
		next_level: nextLevel,
		progress_to_next: progressToNext,
		recent_history: history
	};
}
