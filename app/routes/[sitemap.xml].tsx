import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {getSitemapIndex} from 'app/lib/sitemap';

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  // El origin del request ES el dominio público correcto: Google siempre
  // pide este sitemap sobre tienda-sportfitness.com (el dominio submitteado
  // en Search Console), y Oxygen preserva el Host original del cliente.
  //
  // Antes se sobreescribía con shop.primaryDomain.url (Storefront API) para
  // evitar que un myshopify.dev/oxygen leakeara al sitemap — pero ese campo
  // refleja el dominio Primary del canal "Online Store" clásico de Shopify,
  // que en esta tienda es checkout.tienda-sportfitness.com (un canal
  // completamente distinto al storefront Hydrogen). Cada dominio que se
  // intentó excluir a mano (myshopify.com, luego el de checkout) confirmó
  // que la lista nunca es exhaustiva — el origin del request ya es correcto
  // por construcción y no depende de qué canal Shopify considere "Primary".
  const baseUrl = new URL(request.url).origin;

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
