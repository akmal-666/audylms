import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { runBackup, validateDriveReferences, listBackupJobs } from '$lib/server/services/backup';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const jobs = await listBackupJobs();
	return { jobs, user };
};

export const actions: Actions = {
	backup: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Tidak terautentikasi.' });
		try {
			const job = await runBackup(user.id);
			return { job_id: job.id, status: job.status };
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Backup gagal.' });
		}
	},
	validate: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: 'Tidak terautentikasi.' });
		try {
			const result = await validateDriveReferences(user.id);
			return { validation: result };
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : 'Validasi gagal.' });
		}
	}
};
