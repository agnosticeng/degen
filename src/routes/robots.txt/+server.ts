import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return new Response(
		`User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: OAI-SearchBot
Disallow: /

User-agent: *
Disallow:

Sitemap: ${new URL('/sitemap.xml', url.origin).toString()}`,
		{ status: 200, headers: { 'Content-Type': 'text/plain' } }
	);
};
