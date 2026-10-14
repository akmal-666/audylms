// ============================================================
// Type / constant tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { ROLE_LABELS, POSITION_LABELS } from '$lib/types/auth.types';

describe('ROLE_LABELS', () => {
	it('has a label for ADMIN', () => {
		expect(ROLE_LABELS['ADMIN']).toBe('Administrator');
	});

	it('has a label for STAFF', () => {
		expect(ROLE_LABELS['STAFF']).toBe('Staff');
	});
});

describe('POSITION_LABELS', () => {
	it('has a label for RESEPSIONIS', () => {
		expect(POSITION_LABELS['RESEPSIONIS']).toBe('Resepsionis');
	});

	it('has a label for PERAWAT_GIGI', () => {
		expect(POSITION_LABELS['PERAWAT_GIGI']).toBe('Perawat Gigi');
	});

	it('has a label for SUPERVISOR', () => {
		expect(POSITION_LABELS['SUPERVISOR']).toBe('Supervisor');
	});
});
