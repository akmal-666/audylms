// ============================================================
// Rewards Integration — SERVER ONLY
//
// Orchestrates points + badges + certificates after learning events.
// Called from route action handlers after DB mutations complete.
// Failures are non-fatal — logged but never surface to the user.
// ============================================================

import {
	awardMaterialCompletion,
	awardCaseCompletion,
	awardQuizPass,
	awardQuizPerfect,
	awardQuizQuestions,
	getUserPointBalance
} from './points';
import { evaluateBadges } from './badges';
import { issueCertificate } from './certificates';
import { createSupabaseAdminClient } from '$lib/server/supabase';
import type { Tables } from '$lib/types/database.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const q = (client: ReturnType<typeof createSupabaseAdminClient>, table: string) => (client as any).from(table);

// ── After material completion ─────────────────────────────────

export async function onMaterialCompleted(userId: string, materialId: string): Promise<void> {
	try {
		await awardMaterialCompletion(userId, materialId);
		const total = await getUserPointBalance(userId);
		await evaluateBadges(userId, { totalPoints: total });
	} catch (err) {
		console.error('[rewards] onMaterialCompleted failed:', err);
	}
}

// ── After case completion ─────────────────────────────────────

export async function onCaseCompleted(userId: string, caseId: string): Promise<void> {
	try {
		await awardCaseCompletion(userId, caseId);
		const total = await getUserPointBalance(userId);
		await evaluateBadges(userId, { totalPoints: total });
	} catch (err) {
		console.error('[rewards] onCaseCompleted failed:', err);
	}
}

// ── After quiz submission ─────────────────────────────────────

export async function onQuizSubmitted(
	userId: string,
	quizId: string,
	attemptId: string,
	score: number,
	passed: boolean,
	correctCount: number
): Promise<void> {
	try {
		if (passed) await awardQuizPass(userId, quizId, attemptId);
		if (score === 100) await awardQuizPerfect(userId, quizId, attemptId);
		await awardQuizQuestions(userId, attemptId, correctCount);

		const total = await getUserPointBalance(userId);
		await evaluateBadges(userId, {
			totalPoints: total,
			quizPerfect: score === 100
		});
	} catch (err) {
		console.error('[rewards] onQuizSubmitted failed:', err);
	}
}

// ── After stage completion ────────────────────────────────────

export async function onStageCompleted(
	userId: string,
	stageId: string,
	stageTitle: string
): Promise<Tables<'certificates'> | null> {
	try {
		const total = await getUserPointBalance(userId);

		// Check if all stages are now complete
		const admin = createSupabaseAdminClient();
		const { data: allStages } = await q(admin, 'gj_stages').select('id').eq('is_published', true);

		const { data: completedStages } = await q(admin, 'gj_user_progress')
			.select('stage_id')
			.eq('user_id', userId)
			.eq('status', 'COMPLETED');

		const allIds = new Set(((allStages ?? []) as { id: string }[]).map((s) => s.id));
		const completedIds = new Set(
			((completedStages ?? []) as { stage_id: string }[]).map((s) => s.stage_id)
		);
		const allComplete = allIds.size > 0 && [...allIds].every((id) => completedIds.has(id));

		await evaluateBadges(userId, {
			totalPoints: total,
			stageId,
			allStagesComplete: allComplete
		});

		// Issue stage certificate
		const { data: profile } = await q(admin, 'profiles')
			.select('full_name')
			.eq('id', userId)
			.single();

		const fullName = (profile as { full_name: string } | null)?.full_name ?? 'Karyawan';

		const cert = await issueCertificate({
			userId,
			userFullName: fullName,
			entityType: 'GJ_STAGE',
			entityId: stageId,
			entityLabel: stageTitle
		});

		// If all stages done → issue graduation certificate
		if (allComplete) {
			await issueCertificate({
				userId,
				userFullName: fullName,
				entityType: 'GJ_ALL_STAGES',
				entityLabel: 'Growth Journey — Semua Stage'
			});
		}

		return cert;
	} catch (err) {
		console.error('[rewards] onStageCompleted failed:', err);
		return null;
	}
}
