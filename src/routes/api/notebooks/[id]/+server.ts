import { notebookRepository } from '$lib/server/repositories/notebooks';
import { queryRepository } from '$lib/server/repositories/queries';
import { error, json } from '@sveltejs/kit';
import { Lexer } from 'marked';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request }) => {
	const data = await request.json();
	if (!isBody(data)) error(400, 'Invalid JSON provided');

	const notebook = await notebookRepository.read(Number(params.id));
	if (!notebook) error(404, 'Notebook not found');

	// check if user is the author

	const requests = extractSQLRequests(data.contents);

	const queryIds = notebook.queries.map((q) => q.id);

	const queriesToUpdate: { id: number; sql: string }[] = [];
	const queriesToCreate: { sql: string; notebookId: number }[] = [];
	for (let sql of requests) {
		const id = parseInt(sql.match(/^--\s*query_id:\s*(\d+)/)?.[1] ?? '', 10);
		sql = sql.replace(/^--\s*query_id:\s*(\d+)\n/, '');
		const index = queryIds.indexOf(id);
		if (index !== -1) {
			queryIds.splice(index, 1);
			const query = notebook.queries.find((q) => q.id === id);
			if (query!.sql !== sql) queriesToUpdate.push({ id, sql });
		} else queriesToCreate.push({ sql, notebookId: notebook.id });
	}

	const updatedQueries = await queryRepository.batchUpdate(queriesToUpdate);
	const createdQueries = await queryRepository.batchCreate(queriesToCreate);
	await queryRepository.batchDelete(queryIds);

	const queries = [...updatedQueries, ...createdQueries];

	const contents = data.contents.map((md) => {
		const lexer = new Lexer();
		const tokens = lexer.lex(md);
		return tokens
			.map((token) => {
				if (token.type === 'code' && token.lang === 'sql') {
					const sql = token.text.replace(/^--\s*query_id:\s*(\d+)\n/, '');
					const query = queries.find((q) => q.sql === sql);
					if (query?.id) {
						return `\`\`\`sql\n-- query_id: ${query.id}\n${sql}\n\`\`\``;
					}
				}
				return token.raw;
			})
			.join('');
	});

	await notebookRepository.update({ ...notebook, contents });
	const updated = await notebookRepository.read(notebook.id);

	return json(updated);
};

interface Body {
	contents: string[];
}

function isBody(data: unknown): data is Body {
	return (
		typeof data === 'object' &&
		data !== null &&
		'contents' in data &&
		Array.isArray(data.contents) &&
		(data.contents.length === 0 || data.contents.every((v) => typeof v === 'string'))
	);
}

function extractSQLRequests(contents: string[]) {
	const lexer = new Lexer();
	const tokens = lexer.lex(contents.join('\n'));
	return tokens.reduce<string[]>((acc, token) => {
		if (token.type === 'code' && token.lang === 'sql') acc.push(token.text);
		return acc;
	}, []);
}
