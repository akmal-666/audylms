// ============================================================
// Google Drive — Types / Constants Unit Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import {
	ALLOWED_MIME_TYPES,
	ALL_ALLOWED_MIME_TYPES,
	MODULE_FOLDERS,
	STORAGE_AREA_ENV_MAP,
	DEFAULT_MAX_FILE_SIZE_BYTES
} from '$lib/server/google-drive/types';

describe('ALLOWED_MIME_TYPES', () => {
	it('has IMAGE category', () => {
		expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/jpeg');
		expect(ALLOWED_MIME_TYPES.IMAGE).toContain('image/png');
	});

	it('has VIDEO category', () => {
		expect(ALLOWED_MIME_TYPES.VIDEO).toContain('video/mp4');
	});

	it('has PDF category', () => {
		expect(ALLOWED_MIME_TYPES.PDF).toContain('application/pdf');
	});
});

describe('ALL_ALLOWED_MIME_TYPES', () => {
	it('is a flat array containing all MIME types', () => {
		expect(ALL_ALLOWED_MIME_TYPES).toContain('image/jpeg');
		expect(ALL_ALLOWED_MIME_TYPES).toContain('application/pdf');
		expect(ALL_ALLOWED_MIME_TYPES).toContain('video/mp4');
	});
});

describe('MODULE_FOLDERS', () => {
	it('has exactly 7 module folders', () => {
		expect(MODULE_FOLDERS).toHaveLength(7);
	});

	it('includes growth-journey', () => {
		expect(MODULE_FOLDERS.some((f) => f.storageArea === 'growth-journey')).toBe(true);
	});

	it('includes system', () => {
		expect(MODULE_FOLDERS.some((f) => f.storageArea === 'system')).toBe(true);
	});

	it('each folder has name, storageArea, envKey', () => {
		for (const folder of MODULE_FOLDERS) {
			expect(folder.name).toBeTruthy();
			expect(folder.storageArea).toBeTruthy();
			expect(folder.envKey).toBeTruthy();
		}
	});
});

describe('STORAGE_AREA_ENV_MAP', () => {
	it('maps growth-journey to correct env key', () => {
		expect(STORAGE_AREA_ENV_MAP['growth-journey']).toBe('GOOGLE_DRIVE_GROWTH_JOURNEY_FOLDER_ID');
	});

	it('maps all 7 storage areas', () => {
		expect(Object.keys(STORAGE_AREA_ENV_MAP)).toHaveLength(7);
	});
});

describe('DEFAULT_MAX_FILE_SIZE_BYTES', () => {
	it('is exactly 3 MB', () => {
		expect(DEFAULT_MAX_FILE_SIZE_BYTES).toBe(3 * 1024 * 1024);
	});
});
