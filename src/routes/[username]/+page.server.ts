import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { withUsername } from '$lib/server/repositories/specifications/users';
import { userRepository } from '$lib/server/repositories/users';
import { error } from '@sveltejs/kit';
import { parse } from '../search.utils';
import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals, params }) => {
	try {
		const { search, tags } = parse(url.searchParams.get('q') ?? '');

		const author = await userRepository.read(withUsername(params.username));

		const visibilities: Notebook['visibility'][] = ['public'];
		if (author.id === locals.user?.id) visibilities.push('private', 'unlisted');

		const notebooks = await notebookRepository.list({
			currentUserId: locals.user?.id,
			authorId: author.id,
			visibilities,
			search,
			tags
		});

		return { author, notebooks };
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: e.message });

		console.error(e);
		error(500, { message: 'Something went wrong. please try again.' });
	}
}) satisfies PageServerLoad;
