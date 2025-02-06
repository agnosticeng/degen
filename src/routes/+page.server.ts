import { blockRepository } from '$lib/server/repositories/blocks';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { UserUsernameSpecification } from '$lib/server/repositories/specifications';
import { userRepository, type User } from '$lib/server/repositories/users';
import { fail, redirect } from '@sveltejs/kit';
import { decodeJwt } from 'jose';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ url }) => {
	let id: User['id'] | undefined;
	if (url.searchParams.has('author')) id = await getAuthorId(url.searchParams.get('author')!);
	return { notebooks: await notebookRepository.list(id) };
}) satisfies PageServerLoad;

async function getAuthorId(username: string): Promise<User['id'] | undefined> {
	try {
		const user = await userRepository.read(new UserUsernameSpecification(username));
		return user.id;
	} catch (e) {
		if (e instanceof NotFound) return undefined;
		console.error(e);
	}
}

export const actions = {
	create_user: async ({ request, locals, cookies }) => {
		const idToken = cookies.get('id_token') ?? null;
		if (!locals.authenticated || !idToken) return fail(401);

		let externalId: string;
		try {
			externalId = decodeJwt(idToken).sub ?? '';
			if (!externalId) throw new Error('Empty token sub');
		} catch {
			cookies.delete('id_token', { path: '/' });
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

		const notebook = await notebookRepository.create({
			title: title,
			slug: title.toLowerCase().replace(/\s+/g, '-'),
			authorId: locals.user.id,
			visibility: 'private'
		});

		await blockRepository.batchCreate([
			{
				content: `# ${locals.user.username}/${notebook.title}`,
				notebookId: notebook.id,
				pinned: false,
				position: 0,
				type: 'markdown'
			}
		]);

		redirect(303, `/${locals.user.username}/${notebook.slug}`);
	}
} satisfies Actions;
