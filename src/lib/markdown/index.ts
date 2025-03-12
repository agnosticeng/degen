import { marked } from 'marked';
import './markdown.css';

export async function renderMarkdown(body: string) {
	return marked.parse(body);
}
