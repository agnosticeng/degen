import { verifyJWT } from '$lib/server/oauth';
import { NotFound } from '$lib/server/repositories/errors';
import { UserExternalIdSpecification } from '$lib/server/repositories/specifications';
import { userRepository } from '$lib/server/repositories/users';
import type { Handle } from '@sveltejs/kit';

export const handle = async function ({ event, resolve }) {
	const idToken = event.cookies.get('id_token') ?? null;

	if (idToken === null) {
		event.locals.user = null;
		event.locals.authenticated = false;
		return resolve(event);
	}

	event.locals.authenticated = true;

	try {
		const decoded = await verifyJWT(idToken);
		const exp = (decoded.exp ?? 0) * 1000;
		if (exp < Date.now()) throw new Error('Token Expired');

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
