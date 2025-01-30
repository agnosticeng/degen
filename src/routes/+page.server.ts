import { notebookRepository } from '$lib/server/repositories/notebooks';
import type { User } from '$lib/server/repositories/users';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const currentUser: User = {
	id: 1,
	externalId: 'azertyuio',
	username: 'yannamsellem',
	createdAt: new Date(1738187245 * 1000)
};

export const load = (async (e) => {
	return { notebooks: await notebookRepository.list(currentUser.id) };
}) satisfies PageServerLoad;

export const actions = {
	create_notebook: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string') return fail(400, { message: 'Invalid name' });

		const notebook = await notebookRepository.create({
			title: name,
			slug: name.toLowerCase().replace(/\s+/g, '-'),
			authorId: currentUser.id,
			visibility: 'private'
		});

		redirect(303, `/${currentUser.username}/${notebook.slug}`);
	}
} satisfies Actions;
