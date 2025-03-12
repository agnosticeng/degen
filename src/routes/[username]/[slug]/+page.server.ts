import { search } from '$lib/server/proxy';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { or } from '$lib/server/repositories/specifications/logical';
import {
	withAuthor,
	withSlug,
	withVisibilities
} from '$lib/server/repositories/specifications/notebooks';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals, url }) => {
	try {
		const notebook = await notebookRepository.read(
			withSlug(params.slug),
			or(
				withVisibilities(['public', 'unlisted']),
				...(locals.user ? [withAuthor(locals.user.id)] : [])
			)
		);

		const blocks = await search(notebook.blocks, locals.user?.id ?? 'public', url.hostname);

		return {
			notebook: { ...notebook, blocks },
			isEditable: locals.user?.id === notebook.author.id
		};
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.slug}` });

		console.error('PageLoad:', e);
		throw error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
}) satisfies PageServerLoad;
