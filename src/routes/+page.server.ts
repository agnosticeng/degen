import { bucket } from '$lib/server/bucket';
import { deleteTokensFromCookies, getTokensFromCookies } from '$lib/server/cookies';
import { blockRepository } from '$lib/server/repositories/blocks';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { userRepository } from '$lib/server/repositories/users';
import { fail, redirect } from '@sveltejs/kit';
import { decodeJwt } from 'jose';
import _ from 'lodash';
import type { Actions, PageServerLoad } from './$types';
import { parse } from './search.utils';

export const load = (async ({ url, locals, parent }) => {
	const { trends } = await parent();

	const q = url.searchParams.get('q') ?? '';
	const { tags, search } = parse(
		q,
		trends.map((t) => t.name)
	);

	let page = parseInt(url.searchParams.get('page') ?? '1', 10);
	if (Number.isNaN(page) || page <= 0) page = 1;

	const { notebooks, pagination } = await notebookRepository.list(
		{
			search,
			tags,
			visibilities: ['public'],
			currentUserId: locals.user?.id
		},
		{ current: page }
	);

	return { notebooks, trends, pagination };
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
				slug: _.kebabCase(title),
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
	},
	update_profile_picture: async ({ request, locals }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();

		const image = data.get('picture');

		if (!(image instanceof File)) return fail(400, { message: 'Missing file' });

		const ext = image.name.split('.').pop() ?? '';
		const filename = [locals.user.username, ext].filter(Boolean).join('.');
		await bucket.upload(filename, image);

		locals.user = await userRepository.update({ id: locals.user.id });
		return { user: locals.user };
	}
} satisfies Actions;
