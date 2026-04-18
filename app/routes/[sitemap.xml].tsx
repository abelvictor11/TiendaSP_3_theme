import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getSitemapIndex} from 'app/lib/sitemap';

const SHOP_PRIMARY_DOMAIN_QUERY = `#graphql
  query ShopPrimaryDomainIndex {
    shop {
      primaryDomain {
        url
      }
    }
  }
` as const;

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  // Usar el dominio canónico del shop, no el myshopify.com de Oxygen
  let baseUrl = new URL(request.url).origin;
  try {
    const {shop} = await storefront.query(SHOP_PRIMARY_DOMAIN_QUERY, {
      cache: storefront.CacheLong(),
    });
    const primaryUrl = shop?.primaryDomain?.url;
    if (primaryUrl && !primaryUrl.includes('myshopify.com')) {
      baseUrl = primaryUrl.replace(/\/$/, '');
    }
  } catch {
    // Fallback al origin del request
  }

  const response = await getSitemapIndex({
    storefront,
    request,
    types: ['products', 'pages', 'collections', 'articles'],
    customUrls: [`${baseUrl}/sitemap-empty.xml`],
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
