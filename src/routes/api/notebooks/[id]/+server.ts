import { NotDeleted, NotUpdated } from '$lib/server/repositories/errors';
import { notebookRepository, type Notebook } from '$lib/server/repositories/notebooks';
import { withAuthor, withId } from '$lib/server/repositories/specifications/notebooks';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import * as _ from 'lodash';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) error(401);

	try {
		await notebookRepository.delete(Number(params.id), locals.user.id);
		return new Response(null, { status: 204 });
	} catch (e) {
		if (e instanceof NotDeleted) error(400, { message: e.message });
		console.error(e);
		error(500, { message: e instanceof Error ? e.message : 'Notebook not deleted' });
	}
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401);

	const data = await request.json();
	if (!isBody(data)) error(400, 'Invalid request body');

	const notebook = await notebookRepository.read(
		withId(Number(params.id)),
		withAuthor(locals.user.id)
	);
	if (!notebook) error(404, 'Notebook not found');
	const { author, likes, blocks, ...previous } = notebook;

	try {
		const updated = await notebookRepository.update(
			{ ...previous, visibility: data.visibility, title: data.title, slug: _.kebabCase(data.slug) },
			locals.user.id
		);

		return json({ notebook: updated });
	} catch (e) {
		if (e instanceof NotUpdated) error(400, e.message);
		error(500, 'Something went wrong');
	}
};

interface Body {
	visibility: Notebook['visibility'];
	title: Notebook['title'];
	slug: Notebook['slug'];
}

function isBody(data: unknown): data is Body {
	return (
		typeof data === 'object' &&
		data !== null &&
		'visibility' in data &&
		typeof data.visibility === 'string' &&
		['private', 'public', 'unlisted'].includes(data.visibility) &&
		'title' in data &&
		typeof data.title === 'string' &&
		'slug' in data &&
		typeof data.slug === 'string'
	);
}
