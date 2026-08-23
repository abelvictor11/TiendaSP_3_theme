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
 * La mitad "purchase" del journey no necesita ruta propia aquí: AttributionOS
 * recibe orders/paid + refunds/create directamente por webhooks de Shopify
 * (registrados 2026-08-23) — este componente solo cubre pageviews.
 */
export const ATTRIBUTION_OS_SHOP_ID = '2';
export const ATTRIBUTION_OS_COLLECT_URL =
  'https://attributionos.io/api/pixel/collect';
