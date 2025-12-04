import type { Cookies } from '@sveltejs/kit';
import type { OAuth2Tokens } from 'arctic';

const ID_TOKEN_COOKIE_NAME = 'id_token';
const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

export function getTokensFromCookies(cookies: Cookies) {
	return {
		idToken: cookies.get(ID_TOKEN_COOKIE_NAME) ?? null,
		refreshToken: cookies.get(REFRESH_TOKEN_COOKIE_NAME) ?? null
	};
}

export function setTokensIntoCookies(cookies: Cookies, tokens: OAuth2Tokens) {
	cookies.set(ID_TOKEN_COOKIE_NAME, tokens.idToken(), {
		httpOnly: true,
		path: '/',
		secure: import.meta.env.PROD,
		sameSite: 'lax'
	});

	if (tokens.hasRefreshToken()) {
		cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken(), {
			httpOnly: true,
			path: '/',
			secure: import.meta.env.PROD,
			sameSite: 'lax'
		});
	}
}

export function deleteTokensFromCookies(cookies: Cookies) {
	cookies.delete(ID_TOKEN_COOKIE_NAME, { path: '/' });
	cookies.delete(REFRESH_TOKEN_COOKIE_NAME, { path: '/' });
}
