const TAGS_REGEXP = /#([^\s]+)/g;

export function parse(q: string) {
	return {
		tags: Array.from(q.matchAll(TAGS_REGEXP), (m) => m[1]),
		search: q.replace(TAGS_REGEXP, '').trim()
	};
}
