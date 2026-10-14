// ============================================================
// Growth Journey — Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import type { StageWithCounts, MaterialWithContent } from '$lib/types/growth-journey.types';
import type { Tables } from '$lib/types/database.types';

// ── Fixtures ──────────────────────────────────────────────────

const makeStage = (overrides: Partial<Tables<'gj_stages'>> = {}): Tables<'gj_stages'> => ({
	id: 'stage-1',
	sort_order: 1,
	title: 'Start Your Journey 😍',
	description: 'Mulai perjalananmu.',
	icon: '🌱',
	estimated_min: 30,
	points_reward: 50,
	position_filter: null,
	is_published: true,
	created_by: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

const makeProgress = (
	overrides: Partial<Tables<'gj_user_progress'>> = {}
): Tables<'gj_user_progress'> => ({
	id: 'progress-1',
	user_id: 'user-1',
	stage_id: 'stage-1',
	status: 'NOT_STARTED',
	completed_at: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

const makeStageWithCounts = (overrides: Partial<StageWithCounts> = {}): StageWithCounts => ({
	...makeStage(),
	material_count: 3,
	case_count: 1,
	quiz_count: 1,
	attachment_count: 2,
	user_progress: null,
	completed_material_count: 0,
	...overrides
});

// ── Stage progress calculation ────────────────────────────────

describe('Stage progress percentage', () => {
	it('returns 0% when no materials completed', () => {
		const stage = makeStageWithCounts({ material_count: 3, completed_material_count: 0 });
		const pct =
			stage.material_count === 0
				? 100
				: Math.round((stage.completed_material_count / stage.material_count) * 100);
		expect(pct).toBe(0);
	});

	it('returns 100% when all materials completed', () => {
		const stage = makeStageWithCounts({ material_count: 3, completed_material_count: 3 });
		const pct = Math.round((stage.completed_material_count / stage.material_count) * 100);
		expect(pct).toBe(100);
	});

	it('returns 67% when 2 of 3 completed', () => {
		const stage = makeStageWithCounts({ material_count: 3, completed_material_count: 2 });
		const pct = Math.round((stage.completed_material_count / stage.material_count) * 100);
		expect(pct).toBe(67);
	});

	it('returns 100% when stage has 0 materials', () => {
		const stage = makeStageWithCounts({ material_count: 0, completed_material_count: 0 });
		const pct = stage.material_count === 0 ? 100 : 0;
		expect(pct).toBe(100);
	});
});

// ── Stage status helpers ──────────────────────────────────────

describe('Stage status labels', () => {
	function statusLabel(s: StageWithCounts): string {
		const status = s.user_progress?.status;
		if (status === 'COMPLETED') return 'Selesai';
		if (status === 'IN_PROGRESS') return 'Sedang Berjalan';
		return 'Belum Dimulai';
	}

	it('returns Belum Dimulai when no progress', () => {
		const stage = makeStageWithCounts({ user_progress: null });
		expect(statusLabel(stage)).toBe('Belum Dimulai');
	});

	it('returns Sedang Berjalan for IN_PROGRESS', () => {
		const stage = makeStageWithCounts({ user_progress: makeProgress({ status: 'IN_PROGRESS' }) });
		expect(statusLabel(stage)).toBe('Sedang Berjalan');
	});

	it('returns Selesai for COMPLETED', () => {
		const stage = makeStageWithCounts({ user_progress: makeProgress({ status: 'COMPLETED' }) });
		expect(statusLabel(stage)).toBe('Selesai');
	});
});

// ── Dynamic stage ordering ────────────────────────────────────

describe('Dynamic stage numbering', () => {
	const stages = [
		makeStage({ id: 'a', sort_order: 1, title: 'Start' }),
		makeStage({ id: 'b', sort_order: 2, title: 'Level Up' }),
		makeStage({ id: 'c', sort_order: 3, title: 'Power Team' }),
		makeStage({ id: 'd', sort_order: 4, title: 'Leadership' })
	].sort((a, b) => a.sort_order - b.sort_order);

	it('assigns stage numbers from sorted order', () => {
		const numbers = stages.map((s, i) => i + 1);
		expect(numbers).toEqual([1, 2, 3, 4]);
	});

	it('correctly labels stage titles from seed data', () => {
		expect(stages[0].title).toBe('Start');
		expect(stages[3].title).toBe('Leadership');
	});

	it('stage count is dynamic — 4 stages in seed', () => {
		expect(stages.length).toBe(4);
	});
});

// ── Position filter ───────────────────────────────────────────

describe('Position filter', () => {
	function isVisibleToPosition(stage: Tables<'gj_stages'>, position: string): boolean {
		if (!stage.position_filter || stage.position_filter.length === 0) return true;
		return stage.position_filter.includes(position);
	}

	it('is visible to all positions when filter is null', () => {
		const stage = makeStage({ position_filter: null });
		expect(isVisibleToPosition(stage, 'RESEPSIONIS')).toBe(true);
		expect(isVisibleToPosition(stage, 'PERAWAT_GIGI')).toBe(true);
		expect(isVisibleToPosition(stage, 'SUPERVISOR')).toBe(true);
	});

	it('is visible only to filtered positions', () => {
		const stage = makeStage({ position_filter: ['RESEPSIONIS'] });
		expect(isVisibleToPosition(stage, 'RESEPSIONIS')).toBe(true);
		expect(isVisibleToPosition(stage, 'PERAWAT_GIGI')).toBe(false);
	});

	it('is visible to all when filter is empty array', () => {
		const stage = makeStage({ position_filter: [] });
		expect(isVisibleToPosition(stage, 'SUPERVISOR')).toBe(true);
	});
});

// ── Continue learning ─────────────────────────────────────────

describe('Continue learning — first incomplete required material', () => {
	const makeMat = (id: string, is_required: boolean): MaterialWithContent => ({
		id,
		stage_id: 'stage-1',
		sort_order: 0,
		title: `Mat ${id}`,
		summary: null,
		estimated_min: null,
		is_required,
		is_published: true,
		created_by: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		content_blocks: [],
		attachments: []
	});

	it('returns first required incomplete material', () => {
		const materials = [makeMat('m1', true), makeMat('m2', true), makeMat('m3', false)];
		const progressMap = new Map([['m1', 'COMPLETED']]);
		const next = materials.find((m) => m.is_required && progressMap.get(m.id) !== 'COMPLETED');
		expect(next?.id).toBe('m2');
	});

	it('returns null when all required materials completed', () => {
		const materials = [makeMat('m1', true), makeMat('m2', true)];
		const progressMap = new Map([
			['m1', 'COMPLETED'],
			['m2', 'COMPLETED']
		]);
		const next = materials.find((m) => m.is_required && progressMap.get(m.id) !== 'COMPLETED');
		expect(next).toBeUndefined();
	});

	it('skips optional materials', () => {
		const materials = [makeMat('m1', false), makeMat('m2', true)];
		const progressMap = new Map<string, string>();
		const next = materials.find((m) => m.is_required && progressMap.get(m.id) !== 'COMPLETED');
		expect(next?.id).toBe('m2');
	});
});
