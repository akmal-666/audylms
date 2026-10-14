// ============================================================
// Browser Supabase Client
// ============================================================
// This module is safe to import in both client and server code.
// On the server, use src/lib/server/supabase.ts instead when
// you need a request-scoped client with cookie auth.
// ============================================================

import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import type { Database } from '$lib/types/database.types';

/**
 * Creates the browser-side Supabase client.
 * Call once per component/page — SvelteKit will SSR the initial data
 * via the server layout, so this is mainly used for client-side
 * interactivity (realtime, storage uploads, etc.).
 */
export function createSupabaseBrowserClient() {
	return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
