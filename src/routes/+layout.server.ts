import { tagsRepository } from '$lib/server/repositories/tags';
import type { LayoutServerLoad } from './$types';

export const load = (async (e) => {
	return {
		user: e.locals.user,
		authenticated: e.locals.authenticated,
		trends: await tagsRepository.trends()
	};
}) satisfies LayoutServerLoad;
