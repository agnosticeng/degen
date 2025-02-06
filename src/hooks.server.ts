import {
	deleteTokensFromCookies,
	getTokensFromCookies,
	setTokensIntoCookies
} from '$lib/server/cookies';
import { auth0, verifyJWT } from '$lib/server/oauth';
import { NotFound } from '$lib/server/repositories/errors';
import { UserExternalIdSpecification } from '$lib/server/repositories/specifications';
import { userRepository } from '$lib/server/repositories/users';
import type { Handle } from '@sveltejs/kit';

const TWO_HOURS = 1000 * 60 * 60 * 2;

export const handle = async function ({ event, resolve }) {
	const { idToken, refreshToken } = getTokensFromCookies(event.cookies);

	if (idToken === null) {
		event.locals.user = null;
		event.locals.authenticated = false;
		return resolve(event);
	}

	event.locals.authenticated = true;

	try {
		const decoded = await verifyJWT(idToken);
		const exp = (decoded.exp ?? 0) * 1000;
		if (Date.now() >= exp) throw new Error('Token Expired');

		if (Date.now() >= exp - TWO_HOURS && refreshToken) {
			const tokens = await auth0(event.url.origin).refreshAccessToken(refreshToken);
			setTokensIntoCookies(event.cookies, tokens);
		}

		event.locals.user = await userRepository
			.read(new UserExternalIdSpecification(decoded.sub!))
			.catch((e) => {
				if (e instanceof NotFound) return null;
				throw e;
			});
	} catch (e) {
		console.error(e);

		event.locals.authenticated = false;
		event.locals.user = null;
		deleteTokensFromCookies(event.cookies);
	}

	return resolve(event);
} satisfies Handle;
