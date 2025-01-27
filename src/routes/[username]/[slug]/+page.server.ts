import { notebookRepository } from '$lib/server/repositories/notebooks';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const notebook = await notebookRepository.read(params.slug);
	if (!notebook) error(404, { message: `Notebook not found: ${params.slug}` });

	return { notebook };
}) satisfies PageServerLoad;
