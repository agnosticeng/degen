import { notebookRepository } from '$lib/server/repositories/notebooks';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const notebook = await notebookRepository.read(params.slug);
	if (!notebook) error(404, { message: `Notebook not found: ${params.slug}` });

	if (notebook.createdAt.getTime() === notebook.updatedAt.getTime() && !notebook.contents.length) {
		notebook.contents.push(`# @${notebook.author}/${notebook.name}`);
	}

	return { notebook };
}) satisfies PageServerLoad;
