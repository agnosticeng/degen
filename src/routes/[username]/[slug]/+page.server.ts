import { NotFound } from '$lib/server/repositories/errors';
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

const secondUser: User = {
	id: 2,
	externalId: 'qsdfghjkl',
	username: 'didierfranc',
	createdAt: new Date(1738590766 * 1000)
};

export const load = (async ({ params }) => {
	try {
		const notebook = await notebookRepository.read(params.slug, currentUser.id);

		return {
			notebook,
			isAuthor: currentUser.id === notebook.author.id,
			authenticatedUser: currentUser
		};
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.slug}` });

		console.error(e);
		throw error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
}) satisfies PageServerLoad;
