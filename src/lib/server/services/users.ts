// ============================================================
// Users Service
// SERVER ONLY — never import from client code.
// ============================================================

import type { createSupabaseServerClient } from '$lib/server/supabase';
import type { UserProfile } from '$lib/types/auth.types';

// Use ReturnType so the DbClient type stays in sync with
// whatever @supabase/ssr's createServerClient returns.
type DbClient = ReturnType<typeof createSupabaseServerClient>;

/**
 * Fetch a full user profile with joined department and position.
 */
export async function getUserProfile(
	supabase: DbClient,
	userId: string
): Promise<UserProfile | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select(
			`
			*,
			department:departments(*),
			position:positions(*)
		`
		)
		.eq('id', userId)
		.single();

	if (error || !data) return null;
	return data as unknown as UserProfile;
}

/**
 * Update last_login_at timestamp for a user.
 * Called after successful authentication.
 */
export async function updateLastLogin(supabase: DbClient, userId: string): Promise<void> {
	// Cast to any at the query builder level — the SSR client's inferred
	// generic collapses the update arg to `never` due to the 3-param
	// SupabaseClient<Db,Schema,Schema> shape from @supabase/ssr.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const q = supabase.from('profiles') as any;
	await q.update({ last_login_at: new Date().toISOString() }).eq('id', userId);
}

/**
 * Fetch all active users. Admin only.
 */
export async function listUsers(supabase: DbClient): Promise<UserProfile[]> {
	const { data, error } = await supabase
		.from('profiles')
		.select(
			`
			*,
			department:departments(*),
			position:positions(*)
		`
		)
		.eq('is_active', true)
		.order('full_name');

	if (error || !data) return [];
	return data as unknown as UserProfile[];
}

/**
 * Fetch all departments.
 */
export async function listDepartments(supabase: DbClient) {
	const { data } = await supabase
		.from('departments')
		.select('*')
		.eq('is_active', true)
		.order('name');
	return data ?? [];
}

/**
 * Fetch all positions.
 */
export async function listPositions(supabase: DbClient) {
	const { data } = await supabase
		.from('positions')
		.select('*')
		.eq('is_active', true)
		.order('label');
	return data ?? [];
}
