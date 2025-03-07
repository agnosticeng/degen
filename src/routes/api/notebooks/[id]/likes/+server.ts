import { NotCreated, NotFound } from '$lib/server/repositories/errors';
import { likeRepository } from '$lib/server/repositories/likes';
import { notebookRepository } from '$lib/server/repositories/notebooks';
import { withId, withVisibilities } from '$lib/server/repositories/specifications/notebooks';
import { error, isHttpError, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) error(401);

	const notebookId = Number(params.id);
	const body = await request.json();
	if (!isBody(body)) error(400, { message: 'Bad request' });
	if (body.count < 1 || body.count > 10) error(400, { message: 'Invalid count parameter' });

	try {
		const notebook = await notebookRepository.read(
			withId(Number(params.id)),
			withVisibilities(['public', 'unlisted'])
		);
		if (notebook.authorId === locals.user.id)
			error(403, { message: 'User cannot like his own notebook' });

		const like = await likeRepository.like(notebookId, locals.user.id, body.count);
		return json({ like });
	} catch (e) {
		if (e instanceof NotFound) error(404, { message: 'Notebook not found' });
		if (e instanceof NotCreated) error(400, { message: 'Fail to like notebook ' + notebookId });
		if (isHttpError(e)) throw e;

		console.error(e);
		error(500, { message: 'Something went wrong' });
	}
};

interface Body {
	count: number;
}

function isBody(data: unknown): data is Body {
	return (
		typeof data === 'object' && data !== null && 'count' in data && typeof data.count === 'number'
	);
}
