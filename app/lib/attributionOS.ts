/**
 * Constantes compartidas de AttributionOS (self-hosted en attributionos.io
 * desde la migración fuera de Replit, 2026-08).
 *
 * shopId=2 corresponde a tienda-sportfitness en la base de datos de
 * AttributionOS (shopId=1 es cyclewear). El endpoint es público y sin API
 * key: valida Origin/Referer contra los dominios registrados del shop
 * (www.tienda-sportfitness.com está registrado como storefront_domain, y
 * el matching acepta apex/www/subdominios — fix del 2026-08-23).
 *
 * La mitad "purchase" del journey SÍ dependía de una ruta propia aquí,
 * contrario a lo que decía este comentario antes (IDATTROS-51): AttributionOS
 * recibe la orden completa por orders/paid, pero sin el visitor id en el
 * pedido no hay forma de saber qué visita la originó. Ese enlace lo agrega
 * app/lib/aosCartLink.ts, escribiendo _aos_vid como cart attribute — ver ese
 * archivo. Sin él, pageviews y purchase quedaban registrados por separado sin
 * ninguna conexión entre ambos.
 */
export const ATTRIBUTION_OS_SHOP_ID = '2';
export const ATTRIBUTION_OS_COLLECT_URL =
  'https://attributionos.io/api/pixel/collect';
