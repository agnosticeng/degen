import { auth0, verifyJWT } from '$lib/server/oauth';
import { NotFound } from '$lib/server/repositories/errors';
import { UserExternalIdSpecification } from '$lib/server/repositories/specifications';
import { userRepository } from '$lib/server/repositories/users';
import type { Handle } from '@sveltejs/kit';

const TWO_HOURS = 1000 * 60 * 60 * 2;

export const handle = async function ({ event, resolve }) {
	const idToken = event.cookies.get('id_token') ?? null;
	const refreshToken = event.cookies.get('refresh_token') ?? null;

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
		event.cookies.delete('id_token', { path: '/' });
	}

	return resolve(event);
} satisfies Handle;
