// ============================================================
// hooks.server.ts
// Runs on EVERY server request.
// Responsibilities:
//   1. Create a request-scoped Supabase client
//   2. Refresh the session (rotate tokens if expired)
//   3. Expose safeGetSession() to locals for route guards
// ============================================================

import { createSupabaseServerClient } from '$lib/server/supabase';
import { type Handle } from '@sveltejs/kit';
import type { UserProfile } from '$lib/types/auth.types';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Attach the request-scoped Supabase client to locals.
	//    This client automatically reads/writes session cookies.
	event.locals.supabase = createSupabaseServerClient(event.cookies);

	/**
	 * safeGetSession()
	 *
	 * Validates the JWT by re-fetching the user from Supabase Auth
	 * (getUser() hits the Supabase server, not just decodes the JWT).
	 * This prevents session hijacking via tampered cookies.
	 *
	 * Only call this once per request — it makes a network round-trip.
	 * Results are cached via the closure; use locals.session and
	 * locals.user after the root layout runs.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) {
			return { session: null, user: null };
		}

		// Validate the JWT server-side — do not trust the client-side session alone
		const {
			data: { user: authUser },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error || !authUser) {
			return { session: null, user: null };
		}

		// Load the profile row
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select(
				`
				*,
				department:departments(*),
				position:positions(*)
			`
			)
			.eq('id', authUser.id)
			.single();

		const user: UserProfile | null = profile ? (profile as UserProfile) : null;

		return { session, user };
	};

	// 2. Resolve the request, injecting Supabase's response cookies.
	//    The filterSerializedResponseHeaders call ensures Supabase's
	//    set-cookie headers are forwarded to the browser.
	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
