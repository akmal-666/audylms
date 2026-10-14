// ============================================================
// Auth helper unit tests
// ============================================================

import { describe, it, expect, vi } from 'vitest';
import { isAdmin, isStaff } from '$lib/server/auth';
import type { UserProfile } from '$lib/types/auth.types';

// Mock redirect and error from @sveltejs/kit
vi.mock('@sveltejs/kit', () => ({
	redirect: vi.fn((status: number, location: string) => {
		throw { status, location, type: 'redirect' };
	}),
	error: vi.fn((status: number, body: unknown) => {
		throw { status, body, type: 'error' };
	})
}));

// ──────────────────────────────────────────────
// Test fixtures
// ──────────────────────────────────────────────

const makeUser = (overrides: Partial<UserProfile> = {}): UserProfile => ({
	id: 'user-1',
	employee_code: 'ALC-001',
	full_name: 'Test User',
	username: 'testuser',
	email: 'test@alc.dev',
	phone: null,
	department_id: null,
	position_id: null,
	role: 'STAFF',
	avatar_url: null,
	is_active: true,
	last_login_at: null,
	created_at: new Date().toISOString(),
	updated_at: new Date().toISOString(),
	...overrides
});

const adminUser = makeUser({ role: 'ADMIN' });
const staffUser = makeUser({ role: 'STAFF' });

// ──────────────────────────────────────────────
// isAdmin
// ──────────────────────────────────────────────

describe('isAdmin()', () => {
	it('returns true for ADMIN role', () => {
		expect(isAdmin(adminUser)).toBe(true);
	});

	it('returns false for STAFF role', () => {
		expect(isAdmin(staffUser)).toBe(false);
	});

	it('returns false for null user', () => {
		expect(isAdmin(null)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// isStaff
// ──────────────────────────────────────────────

describe('isStaff()', () => {
	it('returns true for STAFF role', () => {
		expect(isStaff(staffUser)).toBe(true);
	});

	it('returns false for ADMIN role', () => {
		expect(isStaff(adminUser)).toBe(false);
	});

	it('returns false for null user', () => {
		expect(isStaff(null)).toBe(false);
	});
});

// ──────────────────────────────────────────────
// requireAuth
// ──────────────────────────────────────────────

import { requireAuth, requireRole, requireActiveAccount } from '$lib/server/auth';

describe('requireAuth()', () => {
	it('returns the user when authenticated', () => {
		const result = requireAuth(staffUser);
		expect(result).toEqual(staffUser);
	});

	it('throws redirect when user is null', () => {
		expect(() => requireAuth(null)).toThrow();
	});
});

// ──────────────────────────────────────────────
// requireRole
// ──────────────────────────────────────────────

describe('requireRole()', () => {
	it('returns user when role matches', () => {
		const result = requireRole(adminUser, ['ADMIN']);
		expect(result.role).toBe('ADMIN');
	});

	it('throws error when role does not match', () => {
		expect(() => requireRole(staffUser, ['ADMIN'])).toThrow();
	});

	it('accepts multiple roles', () => {
		const result = requireRole(staffUser, ['ADMIN', 'STAFF']);
		expect(result.role).toBe('STAFF');
	});

	it('throws redirect when user is null', () => {
		expect(() => requireRole(null, ['ADMIN'])).toThrow();
	});
});

// ──────────────────────────────────────────────
// requireActiveAccount
// ──────────────────────────────────────────────

describe('requireActiveAccount()', () => {
	it('returns user when account is active', () => {
		const result = requireActiveAccount(staffUser);
		expect(result.is_active).toBe(true);
	});

	it('throws redirect when account is inactive', () => {
		const inactiveUser = makeUser({ is_active: false });
		expect(() => requireActiveAccount(inactiveUser)).toThrow();
	});

	it('throws redirect when user is null', () => {
		expect(() => requireActiveAccount(null)).toThrow();
	});
});
