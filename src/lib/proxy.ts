const PROXY_URL = 'https://proxy.agx.app/query';

export async function exec(sql: string) {
	const response = await fetch(PROXY_URL, { method: 'POST', body: sql });

	if (!response.ok) error(`HTTP Error: ${response.status}`);

	const r = await response.text();
	if (!r) error('Empty Response');

	const data: ProxyException | ProxyResponse = JSON.parse(r);

	if ('exception' in data) error(data.exception);

	return data;
}

function error(message: string): never {
	const error = new Error(message);
	error.name = 'ProxyError';
	throw error;
}

export function isProxyError(e: unknown): e is Error {
	return e instanceof Error && e.name === 'ProxyError';
}

interface ProxyException {
	meta: [];
	data: [];
	rows: 0;
	exception: string;
}

export interface ProxyResponse {
	meta: Array<ColumnDescriptor>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: Array<{ [key: string]: any }>;
	rows: number;
	statistics: {
		bytes_read: number;
		elapsed: number;
		rows_read: number;
	};
}

export interface ColumnDescriptor {
	name: string;
	type: string;
}
