import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getSitemap} from 'app/lib/sitemap';
import {countries} from '~/data/countries';

const locales = Object.keys(countries).filter((k) => k !== 'default');
locales.unshift('en-us');

const SHOP_PRIMARY_DOMAIN_QUERY = `#graphql
  query ShopPrimaryDomain {
    shop {
      primaryDomain {
        url
      }
    }
  }
` as const;

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  // Obtener el dominio principal del shop para asegurar que el sitemap
  // use siempre el dominio correcto (no el myshopify.com de Oxygen)
  let canonicalBase: string | null = null;
  try {
    const {shop} = await storefront.query(SHOP_PRIMARY_DOMAIN_QUERY, {
      cache: storefront.CacheLong(),
    });
    const primaryUrl = shop?.primaryDomain?.url;
    if (primaryUrl && !primaryUrl.includes('myshopify.com')) {
      canonicalBase = primaryUrl.replace(/\/$/, ''); // quitar trailing slash
    }
  } catch {
    // Si falla, usar el request.url de respaldo
  }

  const response = await getSitemap({
    storefront,
    request,
    params,
    locales,
    getLink: ({type, baseUrl, handle, locale}) => {
      // Usar el dominio canónico en lugar del baseUrl derivado del request
      const base = canonicalBase ?? baseUrl;
      if (!locale) return `${base}/${type}/${handle}`;
      return `${base}${locale}/${type}/${handle}`;
    },
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
