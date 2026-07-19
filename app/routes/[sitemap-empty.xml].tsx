import type {LoaderFunctionArgs} from '@remix-run/server-runtime';

// Custom sitemap for URLs that aren't backed by a Shopify resource type
// (product/page/collection/article), so they can't come from the
// storefront-driven sub-sitemaps. Currently: the homepage and /marcas
// (see app/routes/($locale).marcas.tsx).
export async function loader({request}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const baseUrl = url.origin;

  return new Response(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/marcas</loc></url>
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `max-age=${60 * 60 * 24}`,
      },
    },
  );
}
