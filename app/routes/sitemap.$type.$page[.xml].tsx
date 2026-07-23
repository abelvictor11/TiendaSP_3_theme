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
  context: {storefront, env},
}: LoaderFunctionArgs) {
  // Obtener el dominio principal del shop para asegurar que el sitemap
  // use siempre el dominio correcto (no el myshopify.com de Oxygen).
  //
  // shop.primaryDomain refleja el dominio Primary del canal "Online Store"
  // clásico de Shopify — que en esta tienda es checkout.tienda-sportfitness.com
  // (ver misma nota en entry.server.tsx sobre CDN de medios), NO el dominio
  // del storefront Hydrogen (tienda-sportfitness.com). Sin este segundo
  // filtro, cada URL del sitemap (productos, colecciones, páginas) apuntaba
  // al dominio de checkout — confirmado en producción: Search Console solo
  // tenía 728 páginas indexadas de miles descubiertas, con la inmensa
  // mayoría de <loc> del sitemap resolviendo al dominio equivocado.
  let canonicalBase: string | null = null;
  try {
    const {shop} = await storefront.query(SHOP_PRIMARY_DOMAIN_QUERY, {
      cache: storefront.CacheLong(),
    });
    const primaryUrl = shop?.primaryDomain?.url;
    const checkoutDomain = env.PUBLIC_CHECKOUT_DOMAIN;
    const isMyshopify = primaryUrl?.includes('myshopify.com');
    const isCheckoutDomain =
      checkoutDomain && primaryUrl?.includes(checkoutDomain);
    if (primaryUrl && !isMyshopify && !isCheckoutDomain) {
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
      // 'en-us' representa el locale por defecto (sin prefijo de ruta, ver
      // countries.ts: key 'default' → sin path prefix). Los demás locales
      // (ej. '/en-au') ya incluyen su propio '/' inicial.
      if (!locale || locale === 'en-us') return `${base}/${type}/${handle}`;
      return `${base}${locale}/${type}/${handle}`;
    },
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
