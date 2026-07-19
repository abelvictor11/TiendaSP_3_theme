import type {LoaderFunctionArgs} from '@remix-run/server-runtime';
import {CITIES} from '~/data/cities';

// Custom sitemap for URLs that aren't backed by a Shopify resource type
// (product/page/collection/article), so they can't come from the
// storefront-driven sub-sitemaps. Currently: the homepage, /marcas (see
// app/routes/($locale).marcas.tsx), and the `/ciudad/:city.html` landing
// pages (see app/data/cities.ts) — adding a city there automatically adds
// it here, no changes needed in this file.
export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const baseUrl = url.origin;

  const cityUrls = CITIES.map(
    (city) => `  <url><loc>${baseUrl}/ciudad/${city.slug}.html</loc></url>`,
  ).join('\n');

  return new Response(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/marcas</loc></url>
${cityUrls}
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `max-age=${60 * 60 * 24}`,
      },
    },
  );
}
