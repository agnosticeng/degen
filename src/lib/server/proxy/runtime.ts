import { env } from '$env/dynamic/private';
import { Signer } from '@agnosticeng/sign';
import { error } from './error';
import type { Execution, QuerySearch } from './types';

export class AsyncRuntime {
	#baseUrl: string;
	#secret: string;

	#signer: Signer;

	constructor(url: string, secret: string) {
		this.#baseUrl = url;
		this.#secret = secret;
		this.#signer = new Signer(secret);
	}

	async search(queries: QuerySearch[], quotaKey: string = 'public') {
		const url = new URL('/v1/async/search', this.#baseUrl);
		url.searchParams.set('quota-key', quotaKey);

		const headers = new Headers({
			Authorization: this.#secret,
			'Content-Type': 'application/json'
		});

		const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(queries) });

		if (!response.ok) {
			console.error(await response.text());
			error('Request failed');
		}

		return (await response.json()) as Execution[][];
	}

	async createExecution(
		queryId: string,
		content: string | { sql: string; secrets: { key: string; value: string }[] },
		quotaKey: string = 'public'
	) {
		const url = new URL('/v1/async/executions', this.#baseUrl);
		url.searchParams.set('quota-key', quotaKey);
		url.searchParams.set('query-id', queryId);

		const headers = new Headers({
			Authorization: env.PROXY_SECRET,
			'Content-Type': typeof content === 'string' ? 'text/plain' : 'application/json'
		});

		console.time(`Create Execution ${queryId}`);
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: typeof content === 'string' ? content : JSON.stringify(content)
		});
		console.timeEnd(`Create Execution ${queryId}`);

		if (!response.ok) {
			console.error(await response.text());
			error('Failed to create execution');
		}
	}

	async getResultURL(executionId: Execution['id']) {
		const url = new URL(`/v1/async/executions/${executionId}/result`, this.#baseUrl);
		const expiration = (Math.floor(Date.now() / 1000) + 3600).toString();
		const signature = await this.#signer.sign(`${executionId}`, expiration);

		url.searchParams.set('signature', signature);
		url.searchParams.set('expiration', expiration);

		return url.toString();
	}
}
