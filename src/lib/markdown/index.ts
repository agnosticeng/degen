import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './markdown.css';

export async function renderMarkdown(body: string) {
	return DOMPurify.sanitize(await marked.parse(body));
}
