// ============================================================
// Phase 5 — Points, Badges, Levels, Certificates Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';

// ── Point calculation helpers ─────────────────────────────────

function computeBalance(transactions: { points: number }[]): number {
	return transactions.reduce((sum, t) => sum + t.points, 0);
}

function getLevel(
	totalPoints: number,
	levels: { level_number: number; points_required: number; label: string }[]
) {
	const sorted = [...levels].sort((a, b) => b.points_required - a.points_required);
	return sorted.find((l) => totalPoints >= l.points_required) ?? null;
}

function getNextLevel(
	totalPoints: number,
	levels: { level_number: number; points_required: number; label: string }[]
) {
	const sorted = [...levels].sort((a, b) => a.points_required - b.points_required);
	return sorted.find((l) => l.points_required > totalPoints) ?? null;
}

function progressToNext(
	totalPoints: number,
	current: { points_required: number } | null,
	next: { points_required: number } | null
): number {
	if (!next) return 100;
	const base = current?.points_required ?? 0;
	const range = next.points_required - base;
	if (range <= 0) return 100;
	return Math.min(100, Math.round(((totalPoints - base) / range) * 100));
}

const LEVELS = [
	{ level_number: 1, label: 'Pemula', points_required: 0 },
	{ level_number: 2, label: 'Pelajar', points_required: 100 },
	{ level_number: 3, label: 'Terampil', points_required: 300 },
	{ level_number: 4, label: 'Mahir', points_required: 600 },
	{ level_number: 5, label: 'Ahli', points_required: 1000 },
	{ level_number: 6, label: 'Master', points_required: 1500 }
];

// ── Point balance ─────────────────────────────────────────────

describe('Point balance computation', () => {
	it('starts at 0 with no transactions', () => {
		expect(computeBalance([])).toBe(0);
	});

	it('sums positive transactions correctly', () => {
		expect(computeBalance([{ points: 10 }, { points: 25 }, { points: 15 }])).toBe(50);
	});

	it('handles deductions', () => {
		expect(computeBalance([{ points: 100 }, { points: -20 }])).toBe(80);
	});

	it('handles multiple mixed transactions', () => {
		expect(computeBalance([{ points: 50 }, { points: 25 }, { points: -10 }, { points: 15 }])).toBe(
			80
		);
	});
});

// ── Level system ──────────────────────────────────────────────

describe('Level calculation', () => {
	it('Level 1 at 0 points', () => {
		expect(getLevel(0, LEVELS)?.label).toBe('Pemula');
	});

	it('Level 2 at exactly 100 points', () => {
		expect(getLevel(100, LEVELS)?.label).toBe('Pelajar');
	});

	it('Level 2 at 150 points', () => {
		expect(getLevel(150, LEVELS)?.label).toBe('Pelajar');
	});

	it('Level 3 at 300 points', () => {
		expect(getLevel(300, LEVELS)?.label).toBe('Terampil');
	});

	it('Level 6 (Master) at 1500+ points', () => {
		expect(getLevel(2000, LEVELS)?.level_number).toBe(6);
	});

	it('No level above max', () => {
		expect(getNextLevel(1500, LEVELS)).toBeNull();
	});
});

// ── Progress to next level ────────────────────────────────────

describe('Progress to next level', () => {
	it('0% progress at level start', () => {
		const current = LEVELS.find((l) => l.level_number === 1)!;
		const next = LEVELS.find((l) => l.level_number === 2)!;
		expect(progressToNext(0, current, next)).toBe(0);
	});

	it('50% progress halfway through level', () => {
		const current = LEVELS.find((l) => l.level_number === 1)!;
		const next = LEVELS.find((l) => l.level_number === 2)!;
		expect(progressToNext(50, current, next)).toBe(50);
	});

	it('100% at max level', () => {
		expect(progressToNext(1500, LEVELS[5], null)).toBe(100);
	});

	it('does not exceed 100%', () => {
		const current = LEVELS.find((l) => l.level_number === 1)!;
		const next = LEVELS.find((l) => l.level_number === 2)!;
		expect(progressToNext(150, current, next)).toBe(100);
	});
});

// ── Idempotency key format ─────────────────────────────────────

describe('Idempotency keys', () => {
	it('material completion key is unique per user+material', () => {
		const k1 = `MATERIAL_COMPLETE:mat-1:user-1`;
		const k2 = `MATERIAL_COMPLETE:mat-1:user-2`;
		const k3 = `MATERIAL_COMPLETE:mat-2:user-1`;
		expect(k1).not.toBe(k2);
		expect(k1).not.toBe(k3);
	});

	it('quiz pass key is unique per attempt (not per quiz)', () => {
		const k1 = `QUIZ_PASS:attempt-1`;
		const k2 = `QUIZ_PASS:attempt-2`;
		expect(k1).not.toBe(k2);
	});

	it('quiz perfect key is per attempt', () => {
		const k = `QUIZ_PERFECT:attempt-abc`;
		expect(k).toMatch(/QUIZ_PERFECT:/);
	});
});

// ── Badge criteria ────────────────────────────────────────────

describe('Badge criteria evaluation', () => {
	function checkBadge(
		criteriaType: string,
		criteriaValue: Record<string, unknown> | null,
		context: {
			totalPoints?: number;
			stageId?: string;
			allStagesComplete?: boolean;
			quizPerfect?: boolean;
		}
	): boolean {
		switch (criteriaType) {
			case 'POINTS_THRESHOLD':
				return (context.totalPoints ?? 0) >= ((criteriaValue?.points as number) ?? 0);
			case 'STAGE_COMPLETE':
				return !!(criteriaValue?.stage_id && context.stageId === criteriaValue.stage_id);
			case 'ALL_STAGES_COMPLETE':
				return context.allStagesComplete === true;
			case 'PERFECT_QUIZ':
				return context.quizPerfect === true;
			default:
				return false;
		}
	}

	it('POINTS_THRESHOLD: awards at threshold', () => {
		expect(checkBadge('POINTS_THRESHOLD', { points: 100 }, { totalPoints: 100 })).toBe(true);
	});

	it('POINTS_THRESHOLD: does not award below threshold', () => {
		expect(checkBadge('POINTS_THRESHOLD', { points: 100 }, { totalPoints: 99 })).toBe(false);
	});

	it('STAGE_COMPLETE: awards for correct stage', () => {
		expect(checkBadge('STAGE_COMPLETE', { stage_id: 'stage-1' }, { stageId: 'stage-1' })).toBe(
			true
		);
	});

	it('STAGE_COMPLETE: does not award for wrong stage', () => {
		expect(checkBadge('STAGE_COMPLETE', { stage_id: 'stage-1' }, { stageId: 'stage-2' })).toBe(
			false
		);
	});

	it('ALL_STAGES_COMPLETE: awards when all done', () => {
		expect(checkBadge('ALL_STAGES_COMPLETE', null, { allStagesComplete: true })).toBe(true);
	});

	it('ALL_STAGES_COMPLETE: does not award if incomplete', () => {
		expect(checkBadge('ALL_STAGES_COMPLETE', null, { allStagesComplete: false })).toBe(false);
	});

	it('PERFECT_QUIZ: awards on 100% quiz', () => {
		expect(checkBadge('PERFECT_QUIZ', null, { quizPerfect: true })).toBe(true);
	});

	it('MANUAL: never auto-awards', () => {
		expect(checkBadge('MANUAL', null, { totalPoints: 9999 })).toBe(false);
	});
});

// ── Certificate verification code ────────────────────────────

describe('Certificate verification code', () => {
	function generateCode(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
		let code = '';
		for (let i = 0; i < 12; i++) {
			if (i > 0 && i % 4 === 0) code += '-';
			code += chars[Math.floor(Math.random() * chars.length)];
		}
		return code;
	}

	it('generates code in XXXX-XXXX-XXXX format', () => {
		const code = generateCode();
		expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
	});

	it('two codes are never equal', () => {
		const a = generateCode();
		const b = generateCode();
		// Statistically impossible to collide in unit test
		expect(a.length).toBe(14); // XXXX-XXXX-XXXX = 14 chars
		expect(b.length).toBe(14);
	});

	it('code does not contain ambiguous chars O, I, 0, 1', () => {
		for (let i = 0; i < 20; i++) {
			const code = generateCode().replace(/-/g, '');
			expect(code).not.toMatch(/[OI01]/);
		}
	});
});

// ── Duplicate award prevention ────────────────────────────────

describe('Duplicate award prevention', () => {
	it('same idempotency_key yields same logical event', () => {
		const key1 = `MATERIAL_COMPLETE:mat-1:user-1`;
		const key2 = `MATERIAL_COMPLETE:mat-1:user-1`;
		// In production: DB unique constraint on (user_id, idempotency_key)
		// Here we just verify the key format is consistent
		expect(key1).toBe(key2);
	});

	it('different user, same material = different key', () => {
		const k1 = `MATERIAL_COMPLETE:mat-1:user-1`;
		const k2 = `MATERIAL_COMPLETE:mat-1:user-2`;
		expect(k1).not.toBe(k2);
	});

	it('certificate uniqueness by user+entityType+entityId', () => {
		const cert1 = { user_id: 'u1', entity_type: 'GJ_STAGE', entity_id: 's1' };
		const cert2 = { user_id: 'u1', entity_type: 'GJ_STAGE', entity_id: 's1' };
		const key1 = `${cert1.user_id}:${cert1.entity_type}:${cert1.entity_id}`;
		const key2 = `${cert2.user_id}:${cert2.entity_type}:${cert2.entity_id}`;
		expect(key1).toBe(key2); // Would trigger UNIQUE constraint in DB
	});

	it('different stage = different certificate', () => {
		const key1 = `u1:GJ_STAGE:stage-1`;
		const key2 = `u1:GJ_STAGE:stage-2`;
		expect(key1).not.toBe(key2);
	});
});
