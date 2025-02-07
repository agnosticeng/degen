import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { withUsername } from '$lib/server/repositories/specifications/users';
import { userRepository } from '$lib/server/repositories/users';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async (e) => {
	try {
		const author = await userRepository.read(withUsername(e.params.username));
		const notebooks = await notebookRepository.list(author.id, e.locals.user?.id);

		return { author, notebooks };
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: e.message });

		console.error(e);
		error(500, { message: 'Something went wrong. please try again.' });
	}
}) satisfies PageServerLoad;
