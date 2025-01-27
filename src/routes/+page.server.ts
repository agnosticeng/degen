import { notebookRepository } from '$lib/server/repositories/notebooks';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async (e) => {
	return { notebooks: await notebookRepository.list(1) };
}) satisfies PageServerLoad;

export const actions = {
	create_notebook: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name');

		if (!name || typeof name !== 'string') return fail(400, { message: 'Invalid name' });

		const notebook = await notebookRepository.create(
			{ name, slug: name.toLowerCase().replace(/\s+/g, '-'), contents: [] },
			{ id: 1, providerId: '', username: 'yannamsellem' }
		);

		redirect(303, `/${notebook.author}/${notebook.slug}/edit`);
	}
} satisfies Actions;
