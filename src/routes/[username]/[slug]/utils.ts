import type { EditionBlock } from '$lib/server/repositories/blocks';
import * as _ from 'lodash';

export function areSameBlocks(left: EditionBlock[], right: EditionBlock[]) {
	if (left.length !== right.length) return false;
	return left.every((l, i) => areSameBlock(l, right[i]));
}

function areSameBlock(a: EditionBlock, b: EditionBlock) {
	return (
		Object.is(a.id, b.id) &&
		Object.is(a.content, b.content) &&
		Object.is(a.notebookId, b.notebookId) &&
		Object.is(a.pinned, b.pinned) &&
		Object.is(a.position, b.position) &&
		Object.is(a.type, b.type) &&
		_.isEqual(a.metadata, b.metadata)
	);
}
