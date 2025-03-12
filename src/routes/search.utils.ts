const TAGS_REGEXP = /#([^\s]+)/g;

export function parse(q: string) {
	return {
		tags: Array.from(q.matchAll(TAGS_REGEXP), (m) => m[1]),
		search: q.replace(TAGS_REGEXP, '').trim()
	};
}

export function getTagHref(url: URL, name: string) {
	let q = url.searchParams.get('q');
	if (q?.includes(`#${name}`)) q = q.replace(`#${name}`, '').trim();
	else q = (q ?? '').concat(' ', `#${name}`).trim();

	if (q) url.searchParams.set('q', q);
	else url.searchParams.delete('q');

	return url.toString();
}
