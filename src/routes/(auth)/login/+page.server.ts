import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { updateLastLogin } from '$lib/server/services/users';

/**
 * Redirect already-authenticated users away from the login page.
 */
export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { user } = await safeGetSession();
	if (user) {
		redirect(303, '/dashboard');
	}
	return {};
};

export const actions: Actions = {
	/**
	 * Email + password sign-in.
	 * On success: updates last_login_at and redirects to /dashboard.
	 * On failure: returns a typed fail() with a user-facing message.
	 */
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		// Basic server-side validation
		if (!email || !password) {
			return fail(400, {
				email,
				error: 'Email dan password wajib diisi.'
			});
		}

		const { data, error } = await supabase.auth.signInWithPassword({
			email: email.trim().toLowerCase(),
			password
		});

		if (error || !data.session) {
			// Return generic message to avoid user enumeration
			return fail(400, {
				email,
				error: 'Email atau password tidak valid. Silakan coba lagi.'
			});
		}

		// Update last login timestamp
		await updateLastLogin(supabase, data.user.id);

		redirect(303, '/dashboard');
	}
};
