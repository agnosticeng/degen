import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals }) => {
	try {
		const notebook = await notebookRepository.read(params.slug, locals.user?.id);

		return {
			notebook,
			isAuthor: locals.user?.id === notebook.author.id
		};
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.slug}` });

		console.error('PageLoad:', e);
		throw error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
}) satisfies PageServerLoad;
