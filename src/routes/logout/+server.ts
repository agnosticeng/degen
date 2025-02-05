import { auth0 } from '$lib/server/oauth';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const idToken = cookies.get('id_token') ?? null;

	if (!idToken) error(401);

	try {
		await auth0(url.origin).revokeToken(idToken);

		cookies.delete('id_token', { path: '/' });
	} catch (e) {
		console.error(e);
	}

	return new Response(null, { status: 302, headers: { Location: '/' } });
};
