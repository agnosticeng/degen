import { env } from '$env/dynamic/private';
import { Signer } from '@agnosticeng/sign';
import type { Block } from '../repositories/blocks';
import type { User } from '../repositories/users';
import type { Execution, ExecutionWithResultURL, QuerySearch } from './types';
import { hash } from './utils';

if (!env.PROXY_URL) throw new Error('PROXY_URL is not set');
if (!env.PROXY_SECRET) throw new Error('PROXY_SECRET is not set');

const signer = new Signer(env.PROXY_SECRET);

export async function search(
	blocks: Block[],
	quota_key: User['id'] | 'public',
	prefix = ''
): Promise<Prettify<Block & { executions?: ExecutionWithResultURL[] }>[]> {
	const queries = await Promise.all(
		blocks.filter((b) => b.type === 'sql').map((b) => blockToQuerySearch(b, prefix))
	);

	const url = new URL(env.PROXY_URL);
	url.pathname = '/v1/async/search';
	url.searchParams.set('quota-key', `${quota_key}`);
	const headers = new Headers();
	headers.set('Content-Type', 'application/json');
	headers.set('Authorization', env.PROXY_SECRET);

	const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(queries) });
	if (!response.ok) {
		console.error(await response.text());
		error('Request failed');
	}

	const json: Execution[][] = await response.json();

	const now = Date.now();
	const one_hour = 1000 * 60 * 60;

	const executions = queries.map((q) => {
		const executions = (json.find((e) => e.every((e) => e.query_id === q.query_id)) ?? [])
			.map((e) => ({ ...e, created_at: new Date(e.created_at) }))
			.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
		return [queryIdToId(q.query_id, prefix), executions] as const;
	});

	await Promise.all(
		executions.map(async ([id, executions]) => {
			const block = blocks.find((b) => b.id === id);
			if (!block) error('Block not found');
			const createArgs = [block.content, toQueryId(block, prefix), quota_key] as const;

			if (!executions.length) return create(...createArgs);

			const last = executions.findLast((b) => b.status === 'SUCCEEDED');
			if (!last) return create(...createArgs);

			if (now - new Date(last.created_at).getTime() > one_hour) return create(...createArgs);
		})
	);

	const executionsMap = Object.fromEntries(executions);

	return Promise.all(
		blocks.map(async (b) => {
			if (b.type === 'markdown') return b;

			const executions = await Promise.all(
				executionsMap[b.id]?.map(async (e) => ({ ...e, result_url: await getResultUrl(e.id) })) ??
					[]
			);

			return { ...b, executions };
		})
	);
}

async function blockToQuerySearch(block: Block, prefix: string): Promise<QuerySearch> {
	return {
		query_id: toQueryId(block, prefix),
		query_hash: await hash(block.content),
		limit: 5,
		sort_by: 'CREATED_AT',
		statuses: ['SUCCEEDED', 'FAILED']
	};
}

function toQueryId(block: Block, prefix: string) {
	return [prefix, block.id].join('/');
}

function queryIdToId(queryId: string, prefix: string): Block['id'] {
	return Number(queryId.replace(`${prefix}/`, ''));
}

function error(message: string): never {
	const error = new Error(message);
	error.name = 'ProxyError';
	throw error;
}

async function getResultUrl(execution: number): Promise<string> {
	const url = new URL(env.PROXY_URL);

	const expiration = (Math.floor(Date.now() / 1000) + 3600).toString();
	const signature = await signer.sign(`${execution}`, expiration);

	url.pathname = `/v1/async/executions/${execution}/result`;
	url.searchParams.set('signature', signature);
	url.searchParams.set('expiration', expiration);

	return url.toString();
}

async function create(sql: string, query_id: string, quota_key: User['id'] | 'public') {
	const url = new URL(env.PROXY_URL);
	url.pathname = '/v1/async/executions';
	url.searchParams.set('quota-key', `${quota_key}`);
	url.searchParams.set('query-id', query_id);

	const headers = new Headers();
	headers.set('Content-Type', 'text/plain');
	headers.set('Authorization', env.PROXY_SECRET);

	const response = await fetch(url, { method: 'POST', headers, body: sql });

	if (response.ok) return;

	error('Fail to create Execution');
}

export * from './types';
export { hash } from './utils';
