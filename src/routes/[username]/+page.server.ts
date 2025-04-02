import { parseBy, parseDir } from '$lib/cmpnt/OrderBy.svelte';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { withUsername } from '$lib/server/repositories/specifications/users';
import { userRepository } from '$lib/server/repositories/users';
import { error } from '@sveltejs/kit';
import { parse } from '../search.utils';
import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals, params, parent }) => {
	try {
		const { trends } = await parent();
		const { search, tags } = parse(
			url.searchParams.get('q') ?? '',
			trends.map((t) => t.name)
		);

		const author = await userRepository.read(withUsername(params.username));

		const visibilities: Notebook['visibility'][] = ['public'];
		if (author.id === locals.user?.id) visibilities.push('private', 'unlisted');

		let page = parseInt(url.searchParams.get('page') ?? '1', 10);
		if (Number.isNaN(page) || page <= 0) page = 1;

		const by = parseBy(url.searchParams.get('by'));
		const direction = parseDir(url.searchParams.get('dir'));

		const { notebooks, pagination } = await notebookRepository.list(
			{
				currentUserId: locals.user?.id,
				authorId: author.id,
				visibilities,
				search,
				tags,
				sorting: { by, direction }
			},
			{ current: page }
		);

		return { author, notebooks, pagination };
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: e.message });

		console.error(e);
		error(500, { message: 'Something went wrong. please try again.' });
	}
}) satisfies PageServerLoad;
