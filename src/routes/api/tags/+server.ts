import { tagsRepository } from '$lib/server/repositories/tags';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ tags: await tagsRepository.all() });
};
