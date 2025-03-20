import { env } from '$env/dynamic/private';
import type { Block } from '../repositories/blocks';
import type { Secret } from '../repositories/secrets';
import type { User } from '../repositories/users';
import { hash } from './hash';
import { AsyncRuntime } from './runtime';
import type { Execution, ExecutionWithResultURL, QuerySearch } from './types';

if (!env.PROXY_URL) throw new Error('PROXY_URL is not set');
if (!env.PROXY_SECRET) throw new Error('PROXY_SECRET is not set');

const proxy = new AsyncRuntime(env.PROXY_URL, env.PROXY_SECRET);

export async function getBlocksWithExecutions(
	blocks: Block[],
	secrets: Secret[],
	quotaKey: User['id'] | 'public',
	prefix = ''
): Promise<Prettify<Block & { executions?: ExecutionWithResultURL[] }>[]> {
	const queries = await Promise.all(
		blocks.filter(isValidBlock).map((b) => toQuerySearch(b, prefix))
	);

	const searchs = await proxy.search(queries, `${quotaKey}`);
	const executions = await Promise.all(searchs.flat().map(toExecutionWithResultURL));

	const toCreate: Parameters<(typeof proxy)['createExecution']>[] = [];
	const now = Date.now();
	const one_hour = 1000 * 60 * 60;

	const blocksWithExecutions = blocks.map((block) => {
		if (!isValidBlock(block)) return block;

		const queryId = toQueryId(block, prefix);
		const createArgs: (typeof toCreate)[number] = [
			queryId,
			contentWithSecrets(block.content, secrets),
			`${quotaKey}`
		];

		const _executions = executions
			.filter((e) => e.query_id === queryId)
			.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

		if (!_executions.length) {
			toCreate.push(createArgs);
			return { ...block, executions: [] };
		}

		const last = _executions.findLast(
			(e) => e.status === 'SUCCEEDED' || e.status === 'PENDING' || e.status === 'RUNNING'
		);
		if (!last || now - last.created_at.getTime() > one_hour) toCreate.push(createArgs);

		return { ...block, executions: _executions };
	});

	if (toCreate.length) await Promise.all(toCreate.map((args) => proxy.createExecution(...args)));

	return blocksWithExecutions;
}

function isValidBlock(block: Block) {
	return block.type === 'sql' && !!block.content.length;
}

async function toQuerySearch(block: Block, prefix: string): Promise<QuerySearch> {
	return {
		query_id: toQueryId(block, prefix),
		query_hash: await hash(block.content),
		limit: 5,
		sort_by: 'CREATED_AT',
		statuses: ['SUCCEEDED', 'FAILED', 'PENDING', 'RUNNING']
	};
}

function toQueryId(block: Block, prefix: string) {
	return [prefix, block.id].join('/');
}

async function toExecutionWithResultURL(e: Execution): Promise<ExecutionWithResultURL> {
	if (e.status === 'SUCCEEDED')
		return {
			...e,
			created_at: new Date(e.created_at),
			result_url: await proxy.getResultURL(e.id)
		};

	return { ...e, created_at: new Date(e.created_at) };
}

function contentWithSecrets(sql: string, secrets: Secret[]) {
	const usedSecretNames = getSecretNamesFromSQL(sql);
	return {
		sql,
		secrets: secrets
			.filter((secret) => usedSecretNames.includes(secret.name))
			.map((secret) => ({ key: secret.name, value: secret.value }))
	};
}

function getSecretNamesFromSQL(sql: string) {
	const keys = Array.from(sql.matchAll(/{([a-zA-z][a-zA-z0-9-_]*): ?String}/g), (m) => m[1]);
	return Array.from(new Set(keys));
}

export * from './types';
