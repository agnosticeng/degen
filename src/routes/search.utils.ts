const TAGS_REGEXP = /#([^\s]+)/g;

export function parse(q: string, includes: string[] = []) {
	const tags = Array.from(q.matchAll(TAGS_REGEXP), (m) => m[1]);

	return {
		tags: includes.length ? tags.filter((t) => includes.includes(t)) : tags,
		search: q
			.replace(TAGS_REGEXP, (t) => {
				if (includes.length) {
					if (includes.includes(t.slice(1))) return '';
					return t;
				}
				return '';
			})
			.trim()
	};
}

export function getTagHref(url: URL, tagName: string) {
	let q = url.searchParams.get('q') ?? '';
	const { tags } = parse(q);
	if (tags.includes(tagName)) q = q.replace(`#${tagName}`, '').trim();
	else q = q.concat(' ', `#${tagName}`).trim();

	if (q) url.searchParams.set('q', q);
	else url.searchParams.delete('q');

	return url.toString();
}
