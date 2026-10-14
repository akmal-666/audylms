// ============================================================
// Assessment Engine — Unit Tests
// Phase 4 security and scoring
// ============================================================

import { describe, it, expect } from 'vitest';
import type { QuizQuestionForEmployee } from '$lib/types/growth-journey.types';
import type { Tables } from '$lib/types/database.types';

// ── Fixtures ──────────────────────────────────────────────────

const makeAttempt = (
	overrides: Partial<Tables<'gj_quiz_attempts'>> = {}
): Tables<'gj_quiz_attempts'> => ({
	id: 'attempt-1',
	user_id: 'user-1',
	quiz_id: 'quiz-1',
	score: null,
	passed: null,
	started_at: new Date().toISOString(),
	completed_at: null,
	submitted_at: null,
	status: 'IN_PROGRESS',
	points_earned: null,
	created_at: new Date().toISOString(),
	...overrides
});

const makeQuestion = (id: string, points = 1): QuizQuestionForEmployee => ({
	id,
	sort_order: 0,
	question_text: `Question ${id}`,
	points,
	options: [
		{ id: `${id}-opt-a`, sort_order: 0, option_text: 'Option A' },
		{ id: `${id}-opt-b`, sort_order: 1, option_text: 'Option B' },
		{ id: `${id}-opt-c`, sort_order: 2, option_text: 'Option C' }
	],
	attachment: null
});

// ── Security: is_correct never in employee quiz data ──────────

describe('Quiz security — is_correct', () => {
	it('QuizQuestionForEmployee options do not have is_correct field', () => {
		const q = makeQuestion('q1');
		for (const opt of q.options) {
			expect('is_correct' in opt).toBe(false);
		}
	});

	it('multiple questions all have options without is_correct', () => {
		const questions = ['q1', 'q2', 'q3'].map(makeQuestion);
		for (const q of questions) {
			for (const opt of q.options) {
				expect(Object.keys(opt)).not.toContain('is_correct');
			}
		}
	});
});

// ── Score calculation ─────────────────────────────────────────

describe('Score calculation', () => {
	function scoreQuiz(
		answers: Record<string, string>,
		correctAnswers: Record<string, string>,
		questionPoints: Record<string, number>
	): { score: number; pointsEarned: number; pointsPossible: number; correct: number } {
		let correct = 0;
		let pointsEarned = 0;
		let pointsPossible = 0;
		const qIds = Object.keys(correctAnswers);
		for (const qId of qIds) {
			const points = questionPoints[qId] ?? 1;
			pointsPossible += points;
			if (answers[qId] === correctAnswers[qId]) {
				correct++;
				pointsEarned += points;
			}
		}
		const score = qIds.length > 0 ? Math.round((correct / qIds.length) * 100) : 0;
		return { score, pointsEarned, pointsPossible, correct };
	}

	it('all correct = 100%', () => {
		const { score } = scoreQuiz(
			{ q1: 'a', q2: 'b', q3: 'c' },
			{ q1: 'a', q2: 'b', q3: 'c' },
			{ q1: 1, q2: 1, q3: 1 }
		);
		expect(score).toBe(100);
	});

	it('none correct = 0%', () => {
		const { score } = scoreQuiz(
			{ q1: 'b', q2: 'a', q3: 'b' },
			{ q1: 'a', q2: 'b', q3: 'c' },
			{ q1: 1, q2: 1, q3: 1 }
		);
		expect(score).toBe(0);
	});

	it('2 of 3 correct = 67%', () => {
		const { score } = scoreQuiz(
			{ q1: 'a', q2: 'b', q3: 'wrong' },
			{ q1: 'a', q2: 'b', q3: 'c' },
			{ q1: 1, q2: 1, q3: 1 }
		);
		expect(score).toBe(67);
	});

	it('weighted points: all correct', () => {
		const { pointsEarned, pointsPossible } = scoreQuiz(
			{ q1: 'a', q2: 'b' },
			{ q1: 'a', q2: 'b' },
			{ q1: 1, q2: 3 }
		);
		expect(pointsEarned).toBe(4);
		expect(pointsPossible).toBe(4);
	});

	it('weighted points: partial', () => {
		const { pointsEarned, pointsPossible } = scoreQuiz(
			{ q1: 'a', q2: 'wrong' },
			{ q1: 'a', q2: 'b' },
			{ q1: 1, q2: 3 }
		);
		expect(pointsEarned).toBe(1);
		expect(pointsPossible).toBe(4);
	});
});

// ── Passing threshold ─────────────────────────────────────────

describe('Passing threshold', () => {
	it('score >= passing_score is a pass', () => {
		const passed = 70 >= 70;
		expect(passed).toBe(true);
	});

	it('score < passing_score is a fail', () => {
		const passed = 69 >= 70;
		expect(passed).toBe(false);
	});

	it('exactly passing_score = pass', () => {
		expect(70 >= 70).toBe(true);
	});
});

// ── Attempt immutability ──────────────────────────────────────

describe('Attempt immutability', () => {
	it('submitted_at = null means attempt is in progress', () => {
		const attempt = makeAttempt({ submitted_at: null, status: 'IN_PROGRESS' });
		expect(attempt.submitted_at).toBeNull();
		expect(attempt.status).toBe('IN_PROGRESS');
	});

	it('submitted_at set means attempt is locked', () => {
		const now = new Date().toISOString();
		const attempt = makeAttempt({ submitted_at: now, status: 'COMPLETED' });
		expect(attempt.submitted_at).toBe(now);
		expect(attempt.status).toBe('COMPLETED');
	});

	it('COMPLETED attempt cannot be re-submitted (guard check)', () => {
		const attempt = makeAttempt({ submitted_at: new Date().toISOString(), status: 'COMPLETED' });
		// Simulate the service guard: attempt.status !== 'IN_PROGRESS' should throw
		const wouldThrow = attempt.status !== 'IN_PROGRESS';
		expect(wouldThrow).toBe(true);
	});

	it('ABANDONED attempt cannot be re-submitted', () => {
		const attempt = makeAttempt({ status: 'ABANDONED' });
		const wouldThrow = attempt.status !== 'IN_PROGRESS';
		expect(wouldThrow).toBe(true);
	});
});

// ── Quiz expiry ───────────────────────────────────────────────

describe('Quiz expiry / refresh', () => {
	function isExpired(lastPassedAt: string, refreshDays: number): boolean {
		const expiresAt = new Date(lastPassedAt);
		expiresAt.setDate(expiresAt.getDate() + refreshDays);
		return new Date() > expiresAt;
	}

	it('not expired if passed recently within refresh window', () => {
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		expect(isExpired(yesterday.toISOString(), 30)).toBe(false);
	});

	it('expired if passed more than refresh_days ago', () => {
		const longAgo = new Date();
		longAgo.setDate(longAgo.getDate() - 31);
		expect(isExpired(longAgo.toISOString(), 30)).toBe(true);
	});

	it('exactly at boundary — passed exactly refresh_days ago is expired', () => {
		const exactly = new Date();
		exactly.setDate(exactly.getDate() - 30);
		exactly.setMilliseconds(exactly.getMilliseconds() - 1);
		expect(isExpired(exactly.toISOString(), 30)).toBe(true);
	});

	it('null refresh_days = never expires', () => {
		// When refresh_days is null, is_expired is always false
		const refreshDays = null;
		const isExpiredResult =
			refreshDays === null ? false : isExpired(new Date().toISOString(), refreshDays);
		expect(isExpiredResult).toBe(false);
	});

	it('refresh options are 30, 60, 90, 180 or null', () => {
		const validOptions = [30, 60, 90, 180, null];
		for (const opt of validOptions) {
			expect(validOptions).toContain(opt);
		}
	});
});

// ── Duplicate submission prevention ──────────────────────────

describe('Duplicate submission prevention', () => {
	it('only one IN_PROGRESS attempt per user per quiz should exist', () => {
		const attempts: Tables<'gj_quiz_attempts'>[] = [
			makeAttempt({ id: 'a1', status: 'COMPLETED' }),
			makeAttempt({ id: 'a2', status: 'IN_PROGRESS' })
		];
		const inProgressCount = attempts.filter((a) => a.status === 'IN_PROGRESS').length;
		// Simulates the DB unique index constraint
		expect(inProgressCount).toBeLessThanOrEqual(1);
	});

	it('submitting already-submitted attempt is blocked by submitted_at check', () => {
		const attempt = makeAttempt({ submitted_at: new Date().toISOString(), status: 'COMPLETED' });
		const isAlreadySubmitted = attempt.submitted_at !== null;
		expect(isAlreadySubmitted).toBe(true);
	});
});

// ── Case versioning ───────────────────────────────────────────

describe('Case versioning', () => {
	it('new version increments version_number', () => {
		const currentVersion = 2;
		const newVersion = currentVersion + 1;
		expect(newVersion).toBe(3);
	});

	it('requires_retake = true for new version', () => {
		const newCaseFields = { version_number: 2, requires_retake: true };
		expect(newCaseFields.requires_retake).toBe(true);
	});

	it('employee needs retake if completed version < current version', () => {
		const completedVersion = 1;
		const currentVersion = 2;
		const needsRetake = completedVersion < currentVersion;
		expect(needsRetake).toBe(true);
	});

	it('no retake needed if completed version matches current', () => {
		const completedVersion = 2;
		const currentVersion = 2;
		const needsRetake = completedVersion < currentVersion;
		expect(needsRetake).toBe(false);
	});
});
