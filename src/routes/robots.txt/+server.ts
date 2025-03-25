import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return new Response(
		`User-agent: *
Disallow: 

Sitemap: ${new URL('/sitemap.xml', url.origin).toString()}`,
		{ status: 200, headers: { 'Content-Type': 'text/plain' } }
	);
};
