import type { Block, EditionBlock } from '$lib/server/repositories/blocks';
import type { Like } from '$lib/server/repositories/likes';
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

export async function update(
	id: Notebook['id'],
	{
		visibility,
		title,
		slug
	}: { visibility: Notebook['visibility']; title: Notebook['title']; slug: Notebook['slug'] }
) {
	const response = await fetch(`/api/notebooks/${id}`, {
		method: 'PUT',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ visibility, title, slug })
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

	const error = (await response.json().catch(() => ({ message: response.statusText }))) as {
		message: string;
	};

	throw new Error(error.message);
}

export async function deleteNotebook(id: Notebook['id']) {
	const response = await fetch(`/api/notebooks/${id}`, { method: 'DELETE' });
	return response.ok;
}

export async function like(id: Notebook['id'], count: number) {
	const response = await fetch(`/api/notebooks/${id}/likes`, {
		method: 'POST',
		headers: { 'Content-type': 'application/json' },
		body: JSON.stringify({ count })
	});

	if (response.ok) {
		const body = (await response.json()) as {
			like: Like & { updatedAt: string; createdAt: string };
		};
		return {
			...body.like,
			createdAt: new Date(body.like.createdAt),
			updatedAt: new Date(body.like.updatedAt)
		};
	}
}
