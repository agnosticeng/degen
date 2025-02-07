import type { LayoutServerLoad } from './$types';

export const load = (async (e) => {
	return { user: e.locals.user, authenticated: e.locals.authenticated };
}) satisfies LayoutServerLoad;
