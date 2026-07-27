import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getSitemap} from 'app/lib/sitemap';

export async function loader({
  request,
  params,
  context: {storefront},
}: LoaderFunctionArgs) {
  const response = await getSitemap({
    storefront,
    request,
    params,
    // Single-market, single-language store (Colombia/es-CO only, confirmed
    // via Shopify Admin: exactly one enabled Market) -- no locales means no
    // hreflang alternate tags. The countries.ts-derived locale list this
    // used to pass in was 38 fake /en-XX markets Shopify Admin doesn't have
    // configured, plus a hardcoded 'en-us' self-tag for the default locale
    // that mislabeled this Spanish-language site as English-US.
    locales: [],
    // El origin del request ES el dominio público correcto (Google siempre
    // pide estos sitemaps sobre tienda-sportfitness.com, el dominio
    // submitteado en Search Console, y Oxygen preserva el Host original del
    // cliente) — no hace falta ninguna query extra a shop.primaryDomain.
    //
    // Antes se sobreescribía baseUrl con shop.primaryDomain.url para evitar
    // que un myshopify.com/oxygen leakeara al sitemap, excluyendo ese caso a
    // mano. Mal: ese campo refleja el dominio Primary del canal "Online
    // Store" clásico de Shopify, que en esta tienda es
    // checkout.tienda-sportfitness.com (un canal distinto al storefront
    // Hydrogen) — así que cada URL del sitemap (productos, colecciones,
    // páginas) apuntaba al dominio de checkout. Confirmado en producción:
    // Search Console solo tenía 728 páginas indexadas de miles descubiertas.
    // Agregar una exclusión más (el dominio de checkout) hizo que ESTE caso
    // funcionara, pero el patrón sigue siendo fragil — cualquier futuro
    // canal/dominio "Primary" distinto lo rompería de nuevo. baseUrl (del
    // request) ya es correcto por construcción, sin depender de qué dominio
    // Shopify considere Primary.
    getLink: ({type, baseUrl, handle, locale}) => {
      // 'en-us' representa el locale por defecto (sin prefijo de ruta, ver
      // countries.ts: key 'default' → sin path prefix). Los demás locales
      // (ej. '/en-au') ya incluyen su propio '/' inicial.
      if (!locale || locale === 'en-us') return `${baseUrl}/${type}/${handle}`;
      return `${baseUrl}${locale}/${type}/${handle}`;
    },
  });

  response.headers.set('Oxygen-Cache-Control', `max-age=${60 * 60 * 24}`);
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
