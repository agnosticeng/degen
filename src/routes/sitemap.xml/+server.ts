import { notebookRepository } from '$lib/server/repositories/notebooks';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const links = await notebookRepository.listForSitemap();
	const urls = links.map((r) => ({
		loc: new URL(`/${r.username}/${r.slug}`, url.origin).toString(),
		lastmod: r.lastModification.toISOString(),
		changefreq: 'weekly',
		priority: '0.7'
	}));

	const headers = new Headers({ 'Content-Type': 'application/xml' });
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${new URL('/', url.origin).toString()}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${urls
		.map(
			(u) => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
		)
		.join('')}
</urlset>`;

	return new Response(body, { status: 200, headers });
};
