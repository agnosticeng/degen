import { NotDeleted } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		await notebookRepository.delete(Number(params.id), 1 /** Current User ID */);
		return new Response(null, { status: 204 });
	} catch (e) {
		if (e instanceof NotDeleted) error(400, { message: e.message });
		console.error(e);
		error(500, { message: e instanceof Error ? e.message : 'Notebook not deleted' });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	if (!isBody(data)) error(400, 'Invalid request body');

	const notebook = await notebookRepository.read(Number(params.id), 1 /** Current User ID */);
	if (!notebook) error(404, 'Notebook not found');
	const { author, likes, blocks, ...previous } = notebook;

	const updated = await notebookRepository.update(
		{ ...previous, visibility: data.visibility },
		1 /** Current User ID */
	);

	return json({ notebook: updated });
};

interface Body {
	visibility: Notebook['visibility'];
}

function isBody(data: unknown): data is Body {
	return (
		typeof data === 'object' &&
		data !== null &&
		'visibility' in data &&
		typeof data.visibility === 'string' &&
		['private', 'public', 'unlisted'].includes(data.visibility)
	);
}
