export function error(message: string): never {
	const error = new Error(message);
	error.name = 'ProxyError';
	throw error;
}
