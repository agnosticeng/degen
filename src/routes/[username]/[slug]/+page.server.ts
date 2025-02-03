import { notebookRepository } from '$lib/server/repositories/notebooks';
import type { User } from '$lib/server/repositories/users';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const currentUser: User = {
	id: 1,
	externalId: 'azertyuio',
	username: 'yannamsellem',
	createdAt: new Date(1738187245 * 1000)
};

export const load = (async ({ params }) => {
	const notebook = await notebookRepository.read(params.slug, currentUser.id);

	if (!notebook) error(404, { message: `Notebook not found: ${params.slug}` });

	return {
		notebook,
		isAuthor: currentUser.id === notebook.author.id,
		authenticatedUser: currentUser
	};
}) satisfies PageServerLoad;
