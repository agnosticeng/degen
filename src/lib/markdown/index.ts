import { codeToHtml, createCssVariablesTheme } from 'shiki';
import { transform } from './utils';

const theme = createCssVariablesTheme({
	name: 'css-variables',
	variablePrefix: '--hl-'
});

export async function renderMarkdown(body: string) {
	const codes = new Map<string, string>();

	return await transform(body, {
		async walkTokens(token) {
			if (token.type === 'code') {
				const source = adjust_tab_indentation(token.text, token.lang ?? '');

				let html = '<div class="code-block">';

				html += await codeToHtml(source, { lang: token.lang, theme });

				html += '</div>';

				codes.set(token.text, html);
			}
		},
		code(token) {
			return codes.get(token.text) ?? '';
		}
	});
}

/**
 * `marked` replaces tabs with four spaces, which is unhelpful.
 * This function turns them back into tabs (plus leftover spaces for e.g. `\t * some JSDoc`)
 */
function adjust_tab_indentation(source: string, language: string) {
	return source.replace(/^((?: {4})+)/gm, (match, spaces) => {
		if (language === 'yaml') return match;

		return '\t'.repeat(spaces.length / 4) + ' '.repeat(spaces.length % 4);
	});
}
