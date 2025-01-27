import DOMPurify from 'isomorphic-dompurify';
import { Marked, type MarkedExtension, type Renderer } from 'marked';

export async function transform(
	markdown: string,
	{
		walkTokens,
		...renderer
	}: Partial<Renderer> & { walkTokens?: MarkedExtension['walkTokens']; async?: boolean } = {}
) {
	const marked = new Marked({
		async: true,
		renderer,
		walkTokens,
		gfm: true,
		hooks: {
			postprocess(html) {
				return DOMPurify.sanitize(html);
			}
		}
	});

	return (await marked.parse(markdown)) ?? '';
}
