// ============================================================
// Server Auth Helpers
// SERVER ONLY — do not import from client code.
// ============================================================

import { redirect, error } from '@sveltejs/kit';
import type { Role } from '$lib/types/auth.types';
import type { UserProfile } from '$lib/types/auth.types';

/**
 * Asserts a session exists. Redirects to /login if not.
 * Use in +layout.server.ts and +page.server.ts load functions.
 *
 * @returns The authenticated user profile
 */
export function requireAuth(user: UserProfile | null, redirectTo = '/login'): UserProfile {
	if (!user) {
		redirect(303, redirectTo);
	}
	return user;
}

/**
 * Asserts the user has one of the required roles.
 * Returns 403 if the role doesn't match.
 *
 * @param user - The authenticated user
 * @param roles - Allowed roles
 */
export function requireRole(user: UserProfile | null, roles: Role[]): UserProfile {
	if (!user) {
		redirect(303, '/login');
	}
	if (!roles.includes(user.role)) {
		error(403, {
			message: 'Anda tidak memiliki akses ke halaman ini.'
		});
	}
	return user;
}

/**
 * Check if user is active. Inactive accounts are treated as logged-out.
 */
export function requireActiveAccount(user: UserProfile | null): UserProfile {
	if (!user) {
		redirect(303, '/login');
	}
	if (!user.is_active) {
		redirect(303, '/login?error=account_inactive');
	}
	return user;
}

/**
 * Returns true if the user has ADMIN role.
 */
export function isAdmin(user: UserProfile | null): boolean {
	return user?.role === 'ADMIN';
}

/**
 * Returns true if the user has STAFF role.
 */
export function isStaff(user: UserProfile | null): boolean {
	return user?.role === 'STAFF';
}
