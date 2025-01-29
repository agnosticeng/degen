import DOMPurify from 'isomorphic-dompurify';
import { Marked, type MarkedExtension, type Renderer } from 'marked';

export async function transform(
	markdown: string,
	{
		walkTokens,
		...renderer
	}: Partial<Renderer> & { walkTokens?: MarkedExtension['walkTokens'] } = {}
) {
	const marked = new Marked({
		async: true,
		renderer,
		walkTokens,
		gfm: true,
		hooks: {
			postprocess(html) {
				return DOMPurify.sanitize(html, {
					ADD_TAGS: ['code-block'],
					ADD_ATTR: ['code', 'language']
				});
			}
		}
	});

	return (await marked.parse(markdown)) ?? '';
}
