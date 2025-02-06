import { deleteTokensFromCookies, getTokensFromCookies } from '$lib/server/cookies';
import { auth0 } from '$lib/server/oauth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const { idToken, refreshToken } = getTokensFromCookies(cookies);

	if (!idToken) error(401);

	if (refreshToken) {
		try {
			await auth0(url.origin).revokeToken(refreshToken);
		} catch (e) {
			console.error(e);
		}
	}

	deleteTokensFromCookies(cookies);

	return new Response(null, { status: 302, headers: { Location: '/' } });
};
