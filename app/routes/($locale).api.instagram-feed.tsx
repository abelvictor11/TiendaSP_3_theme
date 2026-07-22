import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getInstagramFeed} from '~/lib/instafeed.server';

export const loader = async ({request, context: {env}}: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit')) || 8;

  // Sin la key configurada todavía (Instafeed instalado pero pendiente de
  // env var en Oxygen), devuelve vacío en vez de romper la home.
  if (!env.INSTAFEED_API_KEY || !env.PUBLIC_SHOPIFY_STORE_DOMAIN) {
    return json({posts: []});
  }

  try {
    const posts = await getInstagramFeed({
      apiKey: env.INSTAFEED_API_KEY,
      account: env.PUBLIC_SHOPIFY_STORE_DOMAIN,
      limit,
    });

    return json({posts}, {headers: {'Cache-Control': 'public, max-age=900'}});
  } catch (error) {
    // Un feed social caído no debe tumbar la home — se registra y se
    // devuelve vacío, igual que el fallback de falta de configuración.
    // eslint-disable-next-line no-console
    console.error('[instagram-feed] Instafeed API error:', error);
    return json({posts: []});
  }
};

// no-op
export default function Index() {
  return null;
}
