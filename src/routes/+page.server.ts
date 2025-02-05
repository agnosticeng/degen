import { blockRepository } from '$lib/server/repositories/blocks';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { userRepository, type User } from '$lib/server/repositories/users';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const currentUser: User = {
	id: 1,
	externalId: 'azertyuio',
	username: 'yannamsellem',
	createdAt: new Date(1738187245 * 1000)
};

export const load = (async ({ url }) => {
	let id: User['id'] | undefined;
	if (url.searchParams.has('author')) id = await getAuthorId(url.searchParams.get('author')!);

	return { notebooks: await notebookRepository.list(id, currentUser.id) };
}) satisfies PageServerLoad;

async function getAuthorId(username: string): Promise<User['id'] | undefined> {
	try {
		const user = await userRepository.read(username);
		return user.id;
	} catch (e) {
		if (e instanceof NotFound) return undefined;
		console.error(e);
	}
}

export const actions = {
	create_notebook: async ({ request }) => {
		const data = await request.formData();
		const title = data.get('title');

		if (!title || typeof title !== 'string') return fail(400, { message: 'Invalid title' });

		const notebook = await notebookRepository.create({
			title: title,
			slug: title.toLowerCase().replace(/\s+/g, '-'),
			authorId: currentUser.id,
			visibility: 'private'
		});

		await blockRepository.batchCreate([
			{
				content: `# ${currentUser.username}/${notebook.title}`,
				notebookId: notebook.id,
				pinned: false,
				position: 0,
				type: 'markdown'
			}
		]);

		redirect(303, `/${currentUser.username}/${notebook.slug}`);
	}
} satisfies Actions;
