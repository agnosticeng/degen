import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { withAuthor, withVisibilities } from '$lib/server/repositories/specifications/notebooks';
import { withUsername } from '$lib/server/repositories/specifications/users';
import { tagsRepository } from '$lib/server/repositories/tags';
import { userRepository } from '$lib/server/repositories/users';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, params }) => {
	try {
		const author = await userRepository.read(withUsername(params.username));

		const visibilities: Notebook['visibility'][] = ['public'];
		if (author.id === locals.user?.id) visibilities.push('private', 'unlisted');
		const notebooks = await notebookRepository.list(
			withAuthor(author.id),
			withVisibilities(visibilities)
		);

		const trends = await tagsRepository.trends(5);

		return {
			author,
			notebooks: notebooks.map(({ likes, ...notebook }) => ({
				...notebook,
				likes: likes.reduce((acc, l) => acc + l.count, 0),
				userLike: likes.find((l) => l.userId === locals.user?.id)?.count ?? 0
			})),
			trends
		};
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: e.message });

		console.error(e);
		error(500, { message: 'Something went wrong. please try again.' });
	}
}) satisfies PageServerLoad;
