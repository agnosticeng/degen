import { getBlocksWithExecutions } from '$lib/server/proxy';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { secretRepository } from '$lib/server/repositories/secrets';
import { or } from '$lib/server/repositories/specifications/logical';
import {
	withAuthor,
	withSlug,
	withVisibilities
} from '$lib/server/repositories/specifications/notebooks';
import { viewRepository } from '$lib/server/repositories/views';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params, locals, url, getClientAddress }) => {
	try {
		const notebook = await notebookRepository.read(
			withSlug(params.slug),
			or(
				withVisibilities(['public', 'unlisted']),
				...(locals.user ? [withAuthor(locals.user.id)] : [])
			)
		);

		const blocks = await getBlocksWithExecutions(
			notebook.blocks,
			await secretRepository.list(notebook.authorId),
			locals.user?.id ?? 'public',
			url.hostname
		).catch((e) => {
			console.error(e);
			return notebook.blocks;
		});

		await viewRepository.addView({
			clientIPAddress: getClientAddress(),
			notebookId: notebook.id
		});

		return {
			notebook: { ...notebook, blocks },
			isEditable: locals.user?.id === notebook.author.id
		};
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.slug}` });

		console.error(e);
		throw error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
}) satisfies PageServerLoad;
