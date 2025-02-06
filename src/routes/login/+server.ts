import { auth0 } from '$lib/server/oauth';
import { generateCodeVerifier, generateState } from 'arctic';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();
	const url = auth0(event.url.origin).createAuthorizationURL(state, codeVerifier, [
		'openid',
		'profile',
		'offline_access'
	]);

	event.cookies.set('oauth_state', state, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax'
	});

	event.cookies.set('code_verifier', codeVerifier, {
		httpOnly: true,
		maxAge: 60 * 10,
		secure: import.meta.env.PROD,
		path: '/',
		sameSite: 'lax'
	});

	return new Response(null, {
		status: 302,
		headers: { Location: url.toString() }
	});
};
