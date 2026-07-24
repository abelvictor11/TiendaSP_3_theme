import {FREE_SHIPPING_THRESHOLD_COP} from '~/lib/const';

// El umbral real vive en Shopify Admin como un Automatic Discount de tipo
// "Free Shipping" (hoy: "Envío gratis para ti", gid://shopify/DiscountAutomaticNode/1284426989645,
// minimumRequirement.greaterThanOrEqualToSubtotal = 200000 COP) — NO como una
// regla de shipping rate (esas son por peso, no por subtotal). Leemos ese
// discount vía Admin API en vez de hardcodear el número, para que un cambio
// en Shopify Admin > Descuentos se refleje en el carrito sin un deploy.
// FREE_SHIPPING_THRESHOLD_COP queda solo como fallback si el Admin API falla
// o el token no está configurado (nunca debe romper el render del carrito).

const CACHE_KEY = 'https://cache.internal/free-shipping-threshold';
const CACHE_TTL_SECONDS = 60 * 60; // el valor casi nunca cambia; 1h evita pegarle al Admin API en cada request

// Sin el magic comment `#graphql`: esta consulta es del Admin API, no del
// Storefront API, y el codegen del proyecto (.graphqlrc.yml) valida cualquier
// template `#graphql` contra el schema de Storefront — con el tag puesto
// falla con "Cannot query field discountNodes on type QueryRoot" aunque el
// query es válido contra Admin. Mismo patrón ya usado en
// routes/($locale).pages.contact.tsx para su mutation de Admin API.
const FREE_SHIPPING_DISCOUNTS_QUERY = `
  query FreeShippingDiscounts($first: Int!) {
    discountNodes(first: $first) {
      edges {
        node {
          discount {
            __typename
            ... on DiscountAutomaticFreeShipping {
              status
              minimumRequirement {
                __typename
                ... on DiscountMinimumSubtotal {
                  greaterThanOrEqualToSubtotal {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function getFreeShippingThreshold(context: {
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}): Promise<number> {
  try {
    const cache = await caches.open('hydrogen');
    const cached = await cache.match(CACHE_KEY);
    if (cached) {
      const value = await cached.json();
      if (typeof value === 'number' && value > 0) return value;
    }
  } catch {
    // Cache API no disponible (p.ej. entorno local sin Miniflare) — seguimos con el fetch en vivo
  }

  const {env, waitUntil} = context;
  const storeDomain = env.PUBLIC_SHOPIFY_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;
  const adminToken = env.ADMIN_API_ACCESS_TOKEN;

  if (!adminToken || !storeDomain) {
    return FREE_SHIPPING_THRESHOLD_COP;
  }

  try {
    const response = await fetch(
      `https://${storeDomain}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({
          query: FREE_SHIPPING_DISCOUNTS_QUERY,
          variables: {first: 20},
        }),
      },
    );

    const data: any = await response.json();
    const edges = data?.data?.discountNodes?.edges ?? [];

    const activeFreeShipping = edges
      .map((edge: any) => edge?.node?.discount)
      .find(
        (discount: any) =>
          discount?.__typename === 'DiscountAutomaticFreeShipping' &&
          discount?.status === 'ACTIVE' &&
          discount?.minimumRequirement?.__typename ===
            'DiscountMinimumSubtotal',
      );

    const amount = Number(
      activeFreeShipping?.minimumRequirement?.greaterThanOrEqualToSubtotal
        ?.amount,
    );

    const threshold =
      Number.isFinite(amount) && amount > 0
        ? amount
        : FREE_SHIPPING_THRESHOLD_COP;

    try {
      const cache = await caches.open('hydrogen');
      waitUntil(
        cache.put(
          CACHE_KEY,
          new Response(JSON.stringify(threshold), {
            headers: {'Cache-Control': `max-age=${CACHE_TTL_SECONDS}`},
          }),
        ),
      );
    } catch {
      // best-effort — un fallo de escritura en cache no debe tumbar la respuesta
    }

    return threshold;
  } catch (error) {
    console.error(
      'getFreeShippingThreshold: Admin API fetch failed, using fallback',
      error,
    );
    return FREE_SHIPPING_THRESHOLD_COP;
  }
}
