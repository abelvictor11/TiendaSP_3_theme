export const PAGINATION_SIZE = 8;

/**
 * Fallback del umbral de envío gratis (COP) — solo se usa si
 * lib/shipping.server.ts no puede leer el Automatic Discount real desde
 * Shopify Admin (token no configurado, Admin API caída, etc.). La fuente de
 * verdad real vive en Shopify Admin > Descuentos ("Envío gratis para ti"),
 * no aquí. Mantenido en 200000 para que coincida con el valor real actual y
 * el fallback sea razonable si el fetch en vivo falla.
 */
export const FREE_SHIPPING_THRESHOLD_COP = 200000;
export const DEFAULT_GRID_IMG_LOAD_EAGER_COUNT = 4;
export const ATTR_LOADING_EAGER = 'eager';

export function getImageLoadingPriority(
  index: number,
  maxEagerLoadCount = DEFAULT_GRID_IMG_LOAD_EAGER_COUNT,
) {
  return index < maxEagerLoadCount ? ATTR_LOADING_EAGER : undefined;
}
