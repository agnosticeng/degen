import { notebookRepository } from '$lib/server/repositories/notebooks';
import { withAuthor, withId } from '$lib/server/repositories/specifications/notebooks';
import { tagsRepository, type NewTag } from '$lib/server/repositories/tags';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ request, locals, params }) => {
	if (!locals.user) error(401);

	const data = await request.json();
	if (!isValidBody(data)) error(400, 'Invalid request body');

	const notebook = await notebookRepository.read(
		withId(Number(params.id)),
		withAuthor(locals.user.id)
	);
	if (!notebook) error(404, 'Notebook not found');

	const tagNames = data.tags.map((t) => ({ name: t.name }));

	const tags = await tagsRepository.setTags(notebook.id, tagNames);
	return json({ tags });
};

interface Body {
	tags: (NewTag & { createdAt?: string })[];
}

function isValidBody(data: unknown): data is Body {
	return (
		typeof data === 'object' &&
		data !== null &&
		'tags' in data &&
		Array.isArray(data.tags) &&
		data.tags.every(
			(t) => typeof t === 'object' && t !== null && 'name' in t && typeof t.name === 'string'
		)
	);
}
