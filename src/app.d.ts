// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session } from '@supabase/supabase-js';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import type { UserProfile } from '$lib/types/auth.types';

declare global {
	namespace App {
		interface Locals {
			supabase: ReturnType<typeof createSupabaseServerClient>;
			safeGetSession: () => Promise<{ session: Session | null; user: UserProfile | null }>;
			session: Session | null;
			user: UserProfile | null;
		}
		interface PageData {
			session: Session | null;
			user: UserProfile | null;
		}
		interface Error {
			message: string;
			code?: string;
		}
		// interface Platform {}
	}
}

export {};
