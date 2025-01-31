import type { Block, EditionBlock } from '$lib/server/repositories/blocks';
import type { Notebook } from '$lib/server/repositories/notebooks';

export async function updateBlocks(notebook: Notebook['id'], blocks: EditionBlock[]) {
	const response = await fetch(`/api/notebooks/${notebook}/blocks`, {
		method: 'PUT',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ blocks })
	});

	if (response.ok) {
		return (await response.json()) as Block[];
	}
}
