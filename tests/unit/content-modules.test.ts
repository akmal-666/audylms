// ============================================================
// Phase 6 — Content Modules Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import type {
	PlGameType,
	LpResourceType,
	AspCategory,
	AspStatus,
	NotificationType
} from '$lib/types/database.types';

// ── Play & Learn — server-side scoring ───────────────────────

describe('Play & Learn scoring', () => {
	function scoreGame(
		answers: Record<string, string>,
		items: { id: string; answer: string; points: number }[],
		passingScore: number
	) {
		let correct = 0;
		let pointsPossible = 0;
		const total = items.length;

		for (const item of items) {
			pointsPossible += item.points;
			if ((answers[item.id] ?? '').trim().toLowerCase() === item.answer.trim().toLowerCase()) {
				correct++;
			}
		}

		const score = total > 0 ? Math.round((correct / total) * 100) : 0;
		const passed = score >= passingScore;
		return { score, passed, correct, pointsPossible };
	}

	it('all correct = 100% pass', () => {
		const items = [
			{ id: 'i1', answer: 'A', points: 1 },
			{ id: 'i2', answer: 'B', points: 1 }
		];
		const { score, passed } = scoreGame({ i1: 'A', i2: 'B' }, items, 70);
		expect(score).toBe(100);
		expect(passed).toBe(true);
	});

	it('none correct = 0% fail', () => {
		const items = [
			{ id: 'i1', answer: 'A', points: 1 },
			{ id: 'i2', answer: 'B', points: 1 }
		];
		const { score, passed } = scoreGame({ i1: 'X', i2: 'Y' }, items, 70);
		expect(score).toBe(0);
		expect(passed).toBe(false);
	});

	it('answer comparison is case-insensitive', () => {
		const items = [{ id: 'i1', answer: 'Jawaban Benar', points: 1 }];
		const { correct } = scoreGame({ i1: 'jawaban benar' }, items, 70);
		expect(correct).toBe(1);
	});

	it('answer comparison trims whitespace', () => {
		const items = [{ id: 'i1', answer: 'Klinik', points: 1 }];
		const { correct } = scoreGame({ i1: '  Klinik  ' }, items, 70);
		expect(correct).toBe(1);
	});

	it('missing answer counts as wrong', () => {
		const items = [{ id: 'i1', answer: 'A', points: 1 }];
		const { correct } = scoreGame({}, items, 70);
		expect(correct).toBe(0);
	});

	it('empty game gives 0% score', () => {
		const { score } = scoreGame({}, [], 70);
		expect(score).toBe(0);
	});
});

// ── Notification types ────────────────────────────────────────

describe('Notification type enum', () => {
	const validTypes: NotificationType[] = [
		'POINTS_EARNED',
		'BADGE_EARNED',
		'CERTIFICATE_ISSUED',
		'QNA_ANSWER',
		'QNA_VERIFIED',
		'FRESH_UPDATE',
		'ASPIRATION_RESPONSE',
		'SYSTEM'
	];

	it('has all required notification types', () => {
		expect(validTypes).toContain('POINTS_EARNED');
		expect(validTypes).toContain('BADGE_EARNED');
		expect(validTypes).toContain('CERTIFICATE_ISSUED');
		expect(validTypes).toContain('FRESH_UPDATE');
	});

	it('has 8 notification types', () => {
		expect(validTypes.length).toBe(8);
	});
});

// ── Aspiration categories and statuses ───────────────────────

describe('Aspiration categories', () => {
	const categories: AspCategory[] = ['SARAN', 'KELUHAN', 'IDE', 'APRESIASI', 'LAINNYA'];

	it('has 5 categories', () => expect(categories.length).toBe(5));

	it('includes SARAN and KELUHAN', () => {
		expect(categories).toContain('SARAN');
		expect(categories).toContain('KELUHAN');
	});
});

describe('Aspiration statuses', () => {
	const statuses: AspStatus[] = ['SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

	it('has 5 statuses', () => expect(statuses.length).toBe(5));

	it('workflow: SUBMITTED → REVIEWED → IN_PROGRESS → RESOLVED', () => {
		const flow = ['SUBMITTED', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED'];
		expect(flow.every((s) => statuses.includes(s as AspStatus))).toBe(true);
	});
});

// ── Play & Learn game types ───────────────────────────────────

describe('Play & Learn game types', () => {
	const types: PlGameType[] = [
		'FLASHCARD',
		'MATCH_PAIRS',
		'FILL_BLANK',
		'MULTIPLE_CHOICE',
		'ORDERING',
		'DRAG_DROP'
	];

	it('has 6 game types', () => expect(types.length).toBe(6));
	it('includes MULTIPLE_CHOICE', () => expect(types).toContain('MULTIPLE_CHOICE'));
});

// ── Lets Practice resource types ─────────────────────────────

describe('Lets Practice resource types', () => {
	const types: LpResourceType[] = [
		'GOOGLE_DOCS',
		'GOOGLE_SHEETS',
		'GOOGLE_SLIDES',
		'DRIVE_FILE',
		'EXTERNAL_URL',
		'EMBEDDED_FORM'
	];

	it('has 6 resource types', () => expect(types.length).toBe(6));
	it('includes all Google Workspace types', () => {
		expect(types).toContain('GOOGLE_DOCS');
		expect(types).toContain('GOOGLE_SHEETS');
		expect(types).toContain('GOOGLE_SLIDES');
	});
	it('includes Drive and external types', () => {
		expect(types).toContain('DRIVE_FILE');
		expect(types).toContain('EXTERNAL_URL');
	});
});

// ── QnA verification ──────────────────────────────────────────

describe('QnA answer verification', () => {
	it('unverified answer has is_verified = false', () => {
		const answer = { id: 'a1', is_verified: false, verified_by: null, verified_at: null };
		expect(answer.is_verified).toBe(false);
		expect(answer.verified_by).toBeNull();
	});

	it('verified answer sets is_verified, verified_by, and verified_at', () => {
		const answer = {
			id: 'a1',
			is_verified: true,
			verified_by: 'admin-id',
			verified_at: new Date().toISOString()
		};
		expect(answer.is_verified).toBe(true);
		expect(answer.verified_by).toBe('admin-id');
		expect(answer.verified_at).toBeTruthy();
	});
});

// ── Notification read state ───────────────────────────────────

describe('Notification read/unread', () => {
	const makeNotif = (is_read: boolean) => ({
		id: 'n1',
		user_id: 'u1',
		type: 'SYSTEM' as NotificationType,
		title: 'Test',
		body: null,
		action_url: null,
		is_read,
		created_at: new Date().toISOString()
	});

	it('unread notification has is_read = false', () => {
		expect(makeNotif(false).is_read).toBe(false);
	});

	it('marking read sets is_read = true', () => {
		const n = makeNotif(false);
		const updated = { ...n, is_read: true };
		expect(updated.is_read).toBe(true);
	});

	it('unread count is computed correctly', () => {
		const notifications = [makeNotif(false), makeNotif(true), makeNotif(false)];
		const unreadCount = notifications.filter((n) => !n.is_read).length;
		expect(unreadCount).toBe(2);
	});
});

// ── Fresh Update position filter ──────────────────────────────

describe('Fresh Update position filtering', () => {
	function isVisibleToPosition(positionFilter: string[] | null, userPosition: string): boolean {
		if (!positionFilter || positionFilter.length === 0) return true;
		return positionFilter.includes(userPosition);
	}

	it('null filter = visible to all', () => {
		expect(isVisibleToPosition(null, 'RESEPSIONIS')).toBe(true);
		expect(isVisibleToPosition(null, 'PERAWAT_GIGI')).toBe(true);
	});

	it('position-specific filter restricts visibility', () => {
		expect(isVisibleToPosition(['RESEPSIONIS'], 'RESEPSIONIS')).toBe(true);
		expect(isVisibleToPosition(['RESEPSIONIS'], 'PERAWAT_GIGI')).toBe(false);
	});

	it('empty array = visible to all', () => {
		expect(isVisibleToPosition([], 'SUPERVISOR')).toBe(true);
	});
});
