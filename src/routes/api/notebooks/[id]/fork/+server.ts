import { blockRepository } from '$lib/server/repositories/blocks';
import { NotFound } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { or } from '$lib/server/repositories/specifications/logical';
import {
	withAuthor,
	withId,
	withVisibilities
} from '$lib/server/repositories/specifications/notebooks';
import { tagsRepository } from '$lib/server/repositories/tags';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) error(401);

	const body: { visibility: Notebook['visibility'] } = await request.json();
	if (!['private', 'public', 'unlisted'].includes(body.visibility))
		error(400, 'Invalid request body');

	try {
		const parent = await notebookRepository.read(
			withId(Number(params.id)),
			or(withVisibilities(['public', 'unlisted']), withAuthor(locals.user.id))
		);

		const fork = await notebookRepository.create({
			authorId: locals.user.id,
			forkOfId: parent.id,
			slug: [parent.slug, Date.now().toString(16).slice(-6), 'fork'].join('--'),
			title: parent.title,
			visibility: body.visibility
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

		await tagsRepository.setTags(
			fork.id,
			parent.tags.map((t) => ({ name: t.name }))
		);

		return json({ notebook: { ...fork, author: locals.user } });
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: `Notebook not found: ${params.id}` });

		console.error(e);
		error(500, { message: e instanceof Error ? e.message : 'Something went wrong' });
	}
};
