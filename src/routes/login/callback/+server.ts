import { setTokensIntoCookies } from '$lib/server/cookies';
import { auth0 } from '$lib/server/oauth';
import type { RequestHandler } from '@sveltejs/kit';
import { type OAuth2Tokens } from 'arctic';

export const GET: RequestHandler = async (event) => {
	const storedState = event.cookies.get('oauth_state') ?? null;
	const codeVerifier = event.cookies.get('code_verifier') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

	const redirectTo = event.cookies.get('redirect_after_login') ?? null;

	if (event.url.searchParams.get('error') === 'access_denied') {
		return new Response(null, {
			status: 304,
			headers: { Location: '/?auth_failed=access_denied' }
		});
	}

	if (storedState === null || codeVerifier === null || code === null || state === null) {
		return new Response('Please restart the process.', { status: 400 });
	}

	if (storedState !== state) {
		return new Response('Please restart the process.', { status: 400 });
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await auth0(event.url.origin).validateAuthorizationCode(code, codeVerifier);
	} catch {
		return new Response('Please restart the process.', { status: 400 });
	}

	event.cookies.delete('oauth_state', { path: '/' });
	event.cookies.delete('code_verifier', { path: '/' });
	event.cookies.delete('redirect_after_login', { path: '/' });

	setTokensIntoCookies(event.cookies, tokens);

	return new Response(null, { status: 302, headers: { Location: redirectTo ?? '/' } });
};
