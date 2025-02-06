import DOMPurify from 'dompurify';
import { Marked, type MarkedExtension, type Renderer } from 'marked';

export async function transform(
	markdown: string,
	{
		walkTokens,
		purify = true,
		...renderer
	}: Partial<Renderer> & { walkTokens?: MarkedExtension['walkTokens']; purify?: boolean } = {}
) {
	const marked = new Marked({
		async: true,
		renderer,
		walkTokens,
		gfm: true,
		hooks: {
			postprocess(html) {
				if (purify) {
					return DOMPurify().sanitize(html);
				}

				return html;
			}
		}
	});

	return (await marked.parse(markdown)) ?? '';
}
