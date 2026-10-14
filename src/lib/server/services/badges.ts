// ============================================================
// Badge Engine — SERVER ONLY
//
// Checks badge criteria and awards badges.
// Idempotent: UNIQUE (user_id, badge_id) prevents duplicates.
// Called after any event that could trigger a badge.
// ============================================================

import { createSupabaseAdminClient } from '$lib/server/supabase';
import type { Tables } from '$lib/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (client: ReturnType<typeof createSupabaseAdminClient>, table: string) => (client as any).from(table);

// ── Core award function ──────────────────────────────────────

/**
 * Award a badge to a user (idempotent).
 * Returns null if already awarded.
 */
export async function awardBadge(
	userId: string,
	badgeId: string,
	awardedBy?: string,
	notes?: string
): Promise<Tables<'user_badges'> | null> {
	const admin = createSupabaseAdminClient();

	const { data, error } = await q(admin, 'user_badges')
		.insert({
			user_id: userId,
			badge_id: badgeId,
			awarded_by: awardedBy ?? null,
			notes: notes ?? null
		})
		.select()
		.single();

	if (error) {
		if (error.code === '23505') return null; // already awarded
		throw new Error(`Badge award failed: ${error.message}`);
	}
	return data as Tables<'user_badges'>;
}

/**
 * Check and award all applicable badges for a user.
 * Called after any scoring event.
 * Returns list of newly awarded badges.
 */
export async function evaluateBadges(
	userId: string,
	context: {
		totalPoints?: number;
		stageId?: string;
		allStagesComplete?: boolean;
		quizPerfect?: boolean;
	}
): Promise<Tables<'user_badges'>[]> {
	const admin = createSupabaseAdminClient();
	const awarded: Tables<'user_badges'>[] = [];

	// Load all active badges not yet earned by this user
	const { data: allBadges } = await q(admin, 'badges').select('*').eq('is_active', true);

	const { data: earnedBadges } = await q(admin, 'user_badges')
		.select('badge_id')
		.eq('user_id', userId);

	const earnedIds = new Set(
		((earnedBadges ?? []) as { badge_id: string }[]).map((b) => b.badge_id)
	);

	const candidates = ((allBadges ?? []) as Tables<'badges'>[]).filter((b) => !earnedIds.has(b.id));

	for (const badge of candidates) {
		const shouldAward = checkBadgeCriteria(badge, context);
		if (shouldAward) {
			const result = await awardBadge(userId, badge.id);
			if (result) awarded.push(result);
		}
	}

	return awarded;
}

function checkBadgeCriteria(
	badge: Tables<'badges'>,
	context: {
		totalPoints?: number;
		stageId?: string;
		allStagesComplete?: boolean;
		quizPerfect?: boolean;
	}
): boolean {
	const cv = badge.criteria_value as Record<string, unknown> | null;

	switch (badge.criteria_type) {
		case 'POINTS_THRESHOLD': {
			const threshold = (cv?.points as number) ?? 0;
			return (context.totalPoints ?? 0) >= threshold;
		}
		case 'STAGE_COMPLETE': {
			const requiredStage = cv?.stage_id as string | undefined;
			return !!(requiredStage && context.stageId === requiredStage);
		}
		case 'ALL_STAGES_COMPLETE':
			return context.allStagesComplete === true;
		case 'PERFECT_QUIZ':
			return context.quizPerfect === true;
		case 'QUIZ_STREAK':
		case 'MANUAL':
		default:
			return false;
	}
}

/**
 * Get all badges earned by a user.
 */
export async function getUserBadges(
	userId: string
): Promise<Array<Tables<'user_badges'> & { badge: Tables<'badges'> }>> {
	const admin = createSupabaseAdminClient();

	const { data } = await q(admin, 'user_badges')
		.select('*, badge:badges(*)')
		.eq('user_id', userId)
		.order('awarded_at', { ascending: false });

	return (data ?? []) as Array<Tables<'user_badges'> & { badge: Tables<'badges'> }>;
}

/**
 * Get the badge catalogue.
 */
export async function getBadgeCatalogue(): Promise<Tables<'badges'>[]> {
	const admin = createSupabaseAdminClient();
	const { data } = await q(admin, 'badges').select('*').eq('is_active', true).order('created_at');
	return (data ?? []) as Tables<'badges'>[];
}
