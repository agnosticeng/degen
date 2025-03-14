import {
	blockRepository,
	type Block,
	type BlockToUpdate,
	type EditionBlock,
	type NewBlock
} from '$lib/server/repositories/blocks';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { withAuthor, withId } from '$lib/server/repositories/specifications/notebooks';
import { error, json } from '@sveltejs/kit';
import * as _ from 'lodash';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401);

	const data = await request.json();
	if (!isBody(data)) error(400, 'Invalid request body');
	const { blocks } = data;

	const notebook = await notebookRepository.read(
		withId(Number(params.id)),
		withAuthor(locals.user.id)
	);
	if (!notebook) error(404, 'Notebook not found');

	const blockIDs = notebook.blocks.map((b) => b.id);

	const toUpdate: BlockToUpdate[] = [];
	const toCreate: NewBlock[] = [];
	for (const block of blocks) {
		if (block.id) {
			const index = blockIDs.indexOf(block.id);
			if (index !== -1) {
				blockIDs.splice(index, 1);
				const existing = notebook.blocks.find((b) => b.id);
				if (!CompareBlock(existing!, block as Block)) toUpdate.push(block as BlockToUpdate);
			}
		} else toCreate.push({ ...block, notebookId: notebook.id });
	}

	await Promise.all([
		blockRepository.batchCreate(toCreate),
		blockRepository.batchUpdate(toUpdate),
		blockRepository.batchDelete(blockIDs)
	]);

	return json({ blocks: await blockRepository.list(notebook.id) });
};

interface Body {
	blocks: EditionBlock[];
}

function isBody(data: unknown): data is Body {
	return (
		typeof data === 'object' &&
		data !== null &&
		'blocks' in data &&
		Array.isArray(data.blocks) &&
		(data.blocks.length === 0 || data.blocks.every(isEditionBlock))
	);
}

function isEditionBlock(o: unknown): o is EditionBlock {
	return (
		typeof o === 'object' &&
		o !== null &&
		'content' in o &&
		typeof o.content === 'string' &&
		'type' in o &&
		typeof o.type === 'string' &&
		(o.type === 'markdown' || o.type === 'sql') &&
		'position' in o &&
		typeof o.position === 'number' &&
		'pinned' in o &&
		typeof o.pinned === 'boolean'
	);
}

function CompareBlock(a: Block, b: Block) {
	return (
		a.id === b.id &&
		a.content === b.content &&
		a.position === b.position &&
		a.pinned === b.pinned &&
		a.type === b.type &&
		_.isEqual(a.metadata, b.metadata)
	);
}
