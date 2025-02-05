import { verifyJWT } from '$lib/server/oauth';
import { UserExternalIdSpecification } from '$lib/server/repositories/specifications';
import { userRepository } from '$lib/server/repositories/users';
import type { Handle } from '@sveltejs/kit';

export const handle = async function ({ event, resolve }) {
	const idToken = event.cookies.get('id_token') ?? null;

	if (idToken === null) {
		event.locals.user = null;
		return resolve(event);
	}

	try {
		const decoded = await verifyJWT(idToken);
		const exp = (decoded.exp ?? 0) * 1000;
		if (exp < Date.now()) throw new Error('Token Expired');

		event.locals.user = await userRepository.read(new UserExternalIdSpecification(decoded.sub!));
	} catch (e) {
		console.error(e);
		event.locals.user = null;
		event.cookies.delete('id_token', { path: '/' });
	}

	return resolve(event);
} satisfies Handle;
