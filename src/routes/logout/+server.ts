import { auth0 } from '$lib/server/oauth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const idToken = cookies.get('id_token') ?? null;
	const refreshToken = cookies.get('refresh_token') ?? null;

	if (!idToken) error(401);

	if (refreshToken) {
		try {
			await auth0(url.origin).revokeToken(refreshToken);
		} catch (e) {
			console.error(e);
		}
	}

	cookies.delete('id_token', { path: '/' });
	cookies.delete('refresh_token', { path: '/' });

	return new Response(null, { status: 302, headers: { Location: '/' } });
};
