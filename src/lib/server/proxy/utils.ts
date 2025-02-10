export async function hash(content: string) {
	const buff = new TextEncoder().encode(content);
	const hashBuffer = await crypto.subtle.digest('SHA-256', buff);

	return Array.from(new Uint8Array(hashBuffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}
