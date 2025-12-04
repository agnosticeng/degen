import {
	deleteTokensFromCookies,
	getTokensFromCookies,
	setTokensIntoCookies
} from '$lib/server/cookies';
import { auth0, getTokenDetails } from '$lib/server/oauth';
import { NotFound } from '$lib/server/repositories/errors';
import { withExternalId } from '$lib/server/repositories/specifications/users';
import { userRepository } from '$lib/server/repositories/users';
import type { Handle } from '@sveltejs/kit';

export const handle = async function ({ event, resolve }) {
	event.locals.user = null;
	event.locals.authenticated = false;

	try {
		const { idToken, refreshToken } = getTokensFromCookies(event.cookies);

		if (idToken === null) throw new Error('Authentication required');

		const { payload, expired, valid } = await getTokenDetails(idToken);

		if (!valid) throw new Error('Invalid token');
		if (expired && !refreshToken) throw new Error('Token expired');
		if (expired && refreshToken) {
			const tokens = await auth0(event.url.origin).refreshAccessToken(refreshToken);
			setTokensIntoCookies(event.cookies, tokens);
		}

		event.locals.authenticated = true;
		event.locals.user = await userRepository.read(withExternalId(payload.sub!));
	} catch (e) {
		if (!(e instanceof NotFound)) {
			console.error(e);

			event.locals.authenticated = false;
			event.locals.user = null;
			deleteTokensFromCookies(event.cookies);
		}
	}

	return resolve(event);
} satisfies Handle;
