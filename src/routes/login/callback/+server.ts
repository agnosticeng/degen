import { auth0 } from '$lib/server/oauth';
import { userRepository } from '$lib/server/repositories/users';
import type { RequestHandler } from '@sveltejs/kit';
import { decodeIdToken, type OAuth2Tokens } from 'arctic';

export const GET: RequestHandler = async (event) => {
	const storedState = event.cookies.get('oauth_state') ?? null;
	const codeVerifier = event.cookies.get('code_verifier') ?? null;
	const code = event.url.searchParams.get('code');
	const state = event.url.searchParams.get('state');

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
	} catch (e) {
		return new Response('Please restart the process.', { status: 400 });
	}

	event.cookies.delete('oauth_state', { path: '/' });
	event.cookies.delete('code_verifier', { path: '/' });

	const claims = parseClaims(decodeIdToken(tokens.idToken()));

	if (!claims) return new Response('Please restart the process.', { status: 400 });

	await userRepository.create(claims);

	event.cookies.set('id_token', tokens.idToken(), {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax',
		expires: tokens.accessTokenExpiresAt()
	});

	if (tokens.hasRefreshToken()) {
		event.cookies.set('refresh_token', tokens.refreshToken(), {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD,
			sameSite: 'lax',
			expires: tokens.accessTokenExpiresAt()
		});
	}

	return new Response(null, {
		status: 302,
		headers: { Location: '/' }
	});
};

function parseClaims(claims: unknown) {
	if (!claims || typeof claims !== 'object') return null;
	const username =
		'nickname' in claims && typeof claims.nickname === 'string' ? claims.nickname : '';
	if (!username) return null;
	const externalId = 'sub' in claims && typeof claims.sub === 'string' ? claims.sub : '';
	if (!externalId) return null;

	return { username, externalId };
}
