import { blockRepository } from '$lib/server/repositories/blocks';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { or } from '$lib/server/repositories/specifications/logical';
import {
	withAuthor,
	withId,
	withVisibilities
} from '$lib/server/repositories/specifications/notebooks';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) error(401);

	try {
		const parent = await notebookRepository.read(
			withId(Number(params.id)),
			or(withVisibilities(['public', 'unlisted']), withAuthor(locals.user.id))
		);

		const fork = await notebookRepository.create({
			authorId: locals.user.id,
			forkedFrom: parent.id,
			slug: [parent.slug, Date.now().toString(16).slice(-6), 'forked'].join('--'),
			title: parent.title,
			visibility: 'private'
		});

		await blockRepository.batchCreate(
			parent.blocks.map((b) => ({
				content: b.content,
				metadata: b.metadata,
				notebookId: fork.id,
				pinned: b.pinned,
				position: b.position,
				type: b.type
			}))
		);

		return json({ notebook: fork });
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.id}` });

		console.error(e);
		error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
};
