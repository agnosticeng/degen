import type { EditionBlock } from '$lib/server/repositories/blocks';

export function areSameBlocks(left: EditionBlock[], right: EditionBlock[]) {
	if (left.length !== right.length) return false;
	return left.every((l, i) => areSameBlock(l, right[i]));
}

function areSameBlock(a: EditionBlock, b: EditionBlock) {
	return (
		is(a, b, 'id') &&
		is(a, b, 'content') &&
		is(a, b, 'notebookId') &&
		is(a, b, 'pinned') &&
		is(a, b, 'position') &&
		is(a, b, 'type')
	);
}

function is<T, K extends keyof T>(a: T, b: T, key: K) {
	return typeof a[key] === typeof b[key] && a[key] === b[key];
}
