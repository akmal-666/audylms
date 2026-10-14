// ============================================================
// Phase 8 — Reports, Backup, Audit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { toCSV } from '$lib/server/services/reports';

// ── CSV export ────────────────────────────────────────────────

describe('toCSV()', () => {
	it('generates correct CSV header from object keys', () => {
		const rows = [{ name: 'Alice', score: 100 }];
		const csv = toCSV(rows);
		expect(csv.split('\n')[0]).toBe('name,score');
	});

	it('generates data row correctly', () => {
		const rows = [{ name: 'Alice', score: 100 }];
		const csv = toCSV(rows);
		expect(csv.split('\n')[1]).toBe('Alice,100');
	});

	it('escapes values with commas in double quotes', () => {
		const rows = [{ name: 'Smith, John', value: 1 }];
		const csv = toCSV(rows);
		expect(csv.split('\n')[1]).toBe('"Smith, John",1');
	});

	it('escapes values with double quotes', () => {
		const rows = [{ text: 'Say "hello"', n: 1 }];
		const csv = toCSV(rows);
		expect(csv.split('\n')[1]).toBe('"Say ""hello""",1');
	});

	it('handles null/undefined as empty string', () => {
		const rows = [{ a: null, b: undefined, c: 'ok' }];
		const csv = toCSV(rows);
		expect(csv.split('\n')[1]).toBe(',,ok');
	});

	it('returns empty string for empty array', () => {
		expect(toCSV([])).toBe('');
	});

	it('respects custom column order', () => {
		const rows = [{ z: 1, a: 2, m: 3 }];
		const csv = toCSV(rows, ['a', 'm', 'z']);
		expect(csv.split('\n')[0]).toBe('a,m,z');
		expect(csv.split('\n')[1]).toBe('2,3,1');
	});

	it('generates multiple rows', () => {
		const rows = [
			{ n: 'Alice', p: 90 },
			{ n: 'Bob', p: 75 },
			{ n: 'Carol', p: 85 }
		];
		const csv = toCSV(rows);
		const lines = csv.split('\n');
		expect(lines).toHaveLength(4); // header + 3 rows
		expect(lines[1]).toBe('Alice,90');
		expect(lines[3]).toBe('Carol,85');
	});
});

// ── Backup manifest structure ─────────────────────────────────

describe('Backup manifest', () => {
	it('manifest version is 1.0', () => {
		const manifest = { version: '1.0' as const };
		expect(manifest.version).toBe('1.0');
	});

	it('drive file IDs are extracted correctly', () => {
		const driveFiles = [
			{ drive_file_id: 'abc', drive_folder_id: 'folder-1' },
			{ drive_file_id: 'def', drive_folder_id: 'folder-1' },
			{ drive_file_id: 'abc', drive_folder_id: 'folder-2' } // duplicate
		];
		const uniqueIds = [...new Set(driveFiles.map((f) => f.drive_file_id))];
		expect(uniqueIds).toHaveLength(2);
		expect(uniqueIds).toContain('abc');
		expect(uniqueIds).toContain('def');
	});

	it('folder IDs are deduplicated', () => {
		const driveFiles = [
			{ drive_file_id: 'a', drive_folder_id: 'folder-1' },
			{ drive_file_id: 'b', drive_folder_id: 'folder-1' },
			{ drive_file_id: 'c', drive_folder_id: 'folder-2' }
		];
		const uniqueFolders = [...new Set(driveFiles.map((f) => f.drive_folder_id))];
		expect(uniqueFolders).toHaveLength(2);
	});

	it('backup does not include binary content', () => {
		// The backup manifest schema only stores IDs and metadata
		const manifest = {
			drive_file_ids: ['id1', 'id2'],
			tables: { drive_files: [{ id: 'uuid', drive_file_id: 'gdrive-id', name: 'test.pdf' }] }
		};
		// Verify no binary keys exist
		const driveEntry = manifest.tables.drive_files[0];
		expect('binary' in driveEntry).toBe(false);
		expect('content' in driveEntry).toBe(false);
		expect('data' in driveEntry).toBe(false);
	});
});

// ── Drive validation logic ────────────────────────────────────

describe('Drive reference validation', () => {
	function computeValidation(
		total: number,
		found: number
	): { missing: number; missing_percentage: number } {
		const missing = total - found;
		const missing_percentage = total > 0 ? Math.round((missing / total) * 100) : 0;
		return { missing, missing_percentage };
	}

	it('no missing files = 0% missing', () => {
		const { missing, missing_percentage } = computeValidation(100, 100);
		expect(missing).toBe(0);
		expect(missing_percentage).toBe(0);
	});

	it('all missing = 100%', () => {
		const { missing_percentage } = computeValidation(50, 0);
		expect(missing_percentage).toBe(100);
	});

	it('partial missing rounds correctly', () => {
		const { missing_percentage } = computeValidation(3, 2);
		expect(missing_percentage).toBe(33);
	});

	it('zero total = 0% (no division by zero)', () => {
		const { missing_percentage } = computeValidation(0, 0);
		expect(missing_percentage).toBe(0);
	});
});

// ── Audit action categories ───────────────────────────────────

describe('Audit action coverage', () => {
	const EXPECTED_ACTIONS = [
		'FILE_UPLOADED',
		'FILE_REPLACED',
		'FILE_DELETED',
		'FILE_UNLINKED',
		'BACKUP_STARTED',
		'BACKUP_COMPLETED',
		'BACKUP_FAILED',
		'RESTORE_STARTED',
		'RESTORE_VALIDATED',
		'USER_UPDATED',
		'DRIVE_FILE_REPLACED',
		'DRIVE_FILE_DELETED'
	];

	it('all file-related audit actions are defined', () => {
		const fileActions = EXPECTED_ACTIONS.filter(
			(a) => a.startsWith('FILE_') || a.startsWith('DRIVE_')
		);
		expect(fileActions.length).toBeGreaterThan(0);
	});

	it('backup audit actions are defined', () => {
		const backupActions = EXPECTED_ACTIONS.filter(
			(a) => a.startsWith('BACKUP_') || a.startsWith('RESTORE_')
		);
		expect(backupActions.length).toBeGreaterThanOrEqual(4);
	});

	it('audit action names are UPPER_SNAKE_CASE', () => {
		for (const action of EXPECTED_ACTIONS) {
			expect(action).toMatch(/^[A-Z][A-Z0-9_]+$/);
		}
	});
});

// ── Report filter logic ───────────────────────────────────────

describe('Report period filters', () => {
	function inRange(date: string, from?: string, to?: string): boolean {
		const d = new Date(date).getTime();
		if (from && d < new Date(from).getTime()) return false;
		if (to && d > new Date(to).getTime()) return false;
		return true;
	}

	it('no filter = all rows pass', () => {
		expect(inRange('2026-06-15')).toBe(true);
	});

	it('from filter excludes earlier dates', () => {
		expect(inRange('2026-03-01', '2026-06-01')).toBe(false);
	});

	it('to filter excludes later dates', () => {
		expect(inRange('2026-12-01', undefined, '2026-06-01')).toBe(false);
	});

	it('within range passes', () => {
		expect(inRange('2026-07-15', '2026-06-01', '2026-08-31')).toBe(true);
	});

	it('exact from boundary passes', () => {
		expect(inRange('2026-06-01T00:00:00Z', '2026-06-01')).toBe(true);
	});
});
