import { notebookRepository } from '$lib/server/repositories/notebooks';
import type { PageServerLoad } from './$types';

export const load = (async (e) => {
	return { notebooks: await notebookRepository.list() };
}) satisfies PageServerLoad;
