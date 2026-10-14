// ============================================================
// Server-side Supabase Client Factory
// SERVER ONLY — never import from client-side code.
// ============================================================

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import type { Cookies } from '@sveltejs/kit';
import type { Database } from '$lib/types/database.types';

/**
 * Creates a request-scoped Supabase server client that reads and writes
 * session cookies. This is the primary client for all server-side
 * operations (load functions, form actions, API routes).
 *
 * Uses the anon/publishable key — RLS is enforced by the database.
 */
export function createSupabaseServerClient(cookies: Cookies) {
	return createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll() {
				return cookies.getAll();
			},
			setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, { ...(options as Parameters<Cookies['set']>[2]), path: '/' });
				});
			}
		}
	});
}

/**
 * Creates a Supabase admin client with the service role key.
 * Bypasses RLS — use ONLY for administrative server-side operations
 * that cannot be performed with the user's own credentials.
 *
 * NEVER expose this client or its key to the browser.
 */
export function createSupabaseAdminClient() {
	return createClient<Database>(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
