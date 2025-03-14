import { NotCreated, NotDeleted } from '$lib/server/repositories/errors';
import { secretRepository } from '$lib/server/repositories/secrets';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	if (!locals.user) error(404, 'Not found');
	return { secrets: await secretRepository.list(locals.user.id) };
}) satisfies PageServerLoad;

export const actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const name = formData.get('secret_name');
		const value = formData.get('secret_value');

		if (!name || typeof name !== 'string') return fail(400, { message: 'Invalid name' });
		if (!value || typeof value !== 'string') return fail(400, { message: 'Invalid value' });

		try {
			return { secret: await secretRepository.create(locals.user.id, { name, value }) };
		} catch (e) {
			if (e instanceof NotCreated) return fail(400, { message: e.message });
			console.error(e);
			return fail(500);
		}
	},
	delete: async ({ locals, request }) => {
		if (!locals.user) return fail(401);

		const formData = await request.formData();
		const _id = formData.get('secret_id');
		if (!_id || typeof _id !== 'string') return fail(400, { message: 'Missing id' });

		const id = parseInt(_id, 10);
		if (isNaN(id)) return fail(400, { message: 'Invalid id' });

		try {
			await secretRepository.delete(locals.user.id, id);
		} catch (e) {
			if (e instanceof NotDeleted) return fail(404, { message: e.message });

			console.error(e);
			return fail(500);
		}
	}
} satisfies Actions;
