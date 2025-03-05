import { deleteTokensFromCookies, getTokensFromCookies } from '$lib/server/cookies';
import { blockRepository } from '$lib/server/repositories/blocks';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { tagsRepository } from '$lib/server/repositories/tags';
import { userRepository } from '$lib/server/repositories/users';
import { fail, redirect } from '@sveltejs/kit';
import { decodeJwt } from 'jose';
import type { Actions, PageServerLoad } from './$types';

export const load = (async (e) => {
	const [notebooks, trends] = await Promise.all([
		notebookRepository.list(undefined, e.locals.user?.id),
		tagsRepository.trends(5)
	]);

	return { notebooks, trends };
}) satisfies PageServerLoad;

export const actions = {
	create_user: async ({ request, locals, cookies }) => {
		const { idToken } = getTokensFromCookies(cookies);
		if (!locals.authenticated || !idToken) return fail(401);

		let externalId: string;
		try {
			externalId = decodeJwt(idToken).sub ?? '';
			if (!externalId) throw new Error('Empty token sub');
		} catch {
			deleteTokensFromCookies(cookies);
			return fail(400, { message: 'Invalid request' });
		}

		const data = await request.formData();
		const username = data.get('username');

		if (!username || typeof username !== 'string')
			return fail(400, { message: 'Invalid username' });

		try {
			const user = await userRepository.create({ externalId, username });
			locals.user = user;
		} catch (e) {
			if (e instanceof Error && 'code' in e && e.code === 'SQLITE_CONSTRAINT') {
				return fail(400, { message: 'Username not available' });
			}

			console.error(e);
			return fail(400, { message: 'User not created' });
		}

		redirect(303, `/`);
	},
	create_notebook: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const title = data.get('title');

		if (!title || typeof title !== 'string') return fail(400, { message: 'Invalid title' });

		let notebook: Notebook;
		try {
			notebook = await notebookRepository.create({
				title: title,
				slug: title.toLowerCase().replace(/\s+/g, '-'),
				authorId: locals.user.id,
				visibility: 'private'
			});
		} catch (e) {
			if (e instanceof Error && 'code' in e && e.code === 'SQLITE_CONSTRAINT') {
				return fail(400, { message: 'Invalid name' });
			}
			console.error(e);
			return fail(500, { message: 'Something went wrong, please try again.' });
		}

		await blockRepository.batchCreate([
			{
				content: `# ${locals.user.username}/${notebook.title}`,
				notebookId: notebook.id,
				pinned: false,
				position: 0,
				type: 'markdown',
				metadata: null
			}
		]);

		redirect(303, `/${locals.user.username}/${notebook.slug}`);
	}
} satisfies Actions;
