import type { Block, EditionBlock } from '$lib/server/repositories/blocks';
import type { Notebook } from '$lib/server/repositories/notebooks';

export async function updateBlocks(id: Notebook['id'], blocks: EditionBlock[]) {
	const response = await fetch(`/api/notebooks/${id}/blocks`, {
		method: 'PUT',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ blocks })
	});

	if (response.ok) {
		const body = (await response.json()) as { blocks: Block[] };
		return body.blocks.map((b) => ({
			...b,
			createdAt: new Date(b.createdAt),
			updatedAt: new Date(b.updatedAt)
		}));
	}
}

export async function updateVisibility(id: Notebook['id'], visibility: Notebook['visibility']) {
	const response = await fetch(`/api/notebooks/${id}`, {
		method: 'PUT',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ visibility })
	});

	if (response.ok) {
		const body = (await response.json()) as {
			notebook: Notebook & { updatedAt: string; createdAt: string };
		};
		return {
			...body.notebook,
			createdAt: new Date(body.notebook.createdAt),
			updatedAt: new Date(body.notebook.updatedAt)
		};
	}
}

export async function deleteNotebook(id: Notebook['id']) {
	const response = await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
	return response.ok;
}
