import type { Tag } from '$lib/server/repositories/tags';

export async function getAlltags() {
	const response = await fetch('/api/tags', { method: 'GET' });

	if (response.ok) {
		const data = (await response.json()) as {
			tags: (Omit<Tag, 'createdAt'> & { createdAt: string })[];
		};
		return data.tags.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
	}
}
