import type { LayoutServerLoad } from './$types';

export const load = (async (e) => {
	return { user: e.locals.user };
}) satisfies LayoutServerLoad;
