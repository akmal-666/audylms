// ============================================================
// Auth & RBAC Types
// ============================================================

/** Primary authorization roles. Controls what a user CAN DO. */
export type Role = 'ADMIN' | 'STAFF';

/**
 * Positions within the dental clinic.
 * Controls CONTENT FILTERING — not authorization.
 * A user with any role can hold any position.
 */
export type Position = 'RESEPSIONIS' | 'PERAWAT_GIGI' | 'SUPERVISOR';

/** Department record */
export interface Department {
	id: string;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
}

/** Position record (lookup table) */
export interface PositionRecord {
	id: string;
	name: Position;
	label: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
}

/**
 * Fully-resolved user profile.
 * This is what is stored in locals.user and passed to page data.
 * Combines auth.users with the profiles table.
 */
export interface UserProfile {
	id: string;
	employee_code: string | null;
	full_name: string;
	username: string | null;
	email: string;
	phone: string | null;
	department_id: string | null;
	position_id: string | null;
	role: Role;
	avatar_url: string | null;
	is_active: boolean;
	last_login_at: string | null;
	created_at: string;
	updated_at: string;
	// Resolved relations (joined)
	department?: Department | null;
	position?: PositionRecord | null;
}

/** Minimal session user — available before profile is fully loaded */
export interface SessionUser {
	id: string;
	email: string;
	role: Role;
}

/** System settings */
export interface SystemSettings {
	id: string;
	key: string;
	value: string;
	description: string | null;
	is_public: boolean;
	updated_by: string | null;
	updated_at: string;
}

/** Human-readable labels for display */
export const ROLE_LABELS: Record<Role, string> = {
	ADMIN: 'Administrator',
	STAFF: 'Staff'
};

export const POSITION_LABELS: Record<Position, string> = {
	RESEPSIONIS: 'Resepsionis',
	PERAWAT_GIGI: 'Perawat Gigi',
	SUPERVISOR: 'Supervisor'
};
