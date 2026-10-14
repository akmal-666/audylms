// Public certificate verification — no authentication required.
import type { PageServerLoad } from './$types';
import { verifyCertificate } from '$lib/server/services/certificates';

export const load: PageServerLoad = async ({ params }) => {
	const result = await verifyCertificate(params.code);
	return { result, code: params.code };
};
