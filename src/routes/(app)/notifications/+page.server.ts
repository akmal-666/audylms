import type { PageServerLoad, Actions } from './$types';
import { requireAuth } from '$lib/server/auth';
import type { createSupabaseServerClient } from '$lib/server/supabase';
import {
	getUserNotifications,
	markNotificationRead,
	markAllNotificationsRead
} from '$lib/server/services/content-modules';
type Db = ReturnType<typeof createSupabaseServerClient>;

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);
	const db = locals.supabase as unknown as Db;
	const { notifications, unread_count } = await getUserNotifications(db, authedUser.id, 50);
	return { notifications, unread_count };
};

export const actions: Actions = {
	markRead: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (id) await markNotificationRead(db, id, authedUser.id);
		return { done: true };
	},
	markAllRead: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		const authedUser = requireAuth(user);
		const db = locals.supabase as unknown as Db;
		await markAllNotificationsRead(db, authedUser.id);
		return { done: true };
	}
};
