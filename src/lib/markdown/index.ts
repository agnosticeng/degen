import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import './markdown.css';

export async function renderMarkdown(body: string) {
	const marked = new Marked({
		renderer: {
			link({ href, title, tokens }) {
				const text = this.parser.parseInline(tokens);

				if (!href) return text;

				let out = '<a rel="external" href="' + encodeURI(href).replace(/%25/g, '%') + '"';
				if (title) {
					out += ' title="' + title + '"';
				}
				out += '>' + text + '</a>';
				return out;
			}
		}
	});

	return DOMPurify.sanitize(await marked.parse(body));
}
