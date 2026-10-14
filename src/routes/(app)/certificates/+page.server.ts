import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/server/auth';
import { getUserCertificates } from '$lib/server/services/certificates';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	const authedUser = requireAuth(user);

	const certificates = await getUserCertificates(authedUser.id);

	return { certificates, user: authedUser };
};
