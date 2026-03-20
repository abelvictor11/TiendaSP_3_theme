/**
 * Store-specific configuration.
 *
 * Each branch (cyclewear, bicimarket, tienda-fitness, etc.) maintains its own
 * version of this file so that logos, favicons, and other brand assets never
 * collide when merging shared code changes.
 *
 * To avoid merge conflicts, add this file to your merge strategy:
 *   git config merge.ours.driver true
 *   echo "app/config/store.ts merge=ours" >> .gitattributes
 */

export const storeConfig = {
  /** Main header logo */
  logoUrl:
    'https://cdn.shopify.com/s/files/1/0646/1761/1341/files/tienda_fitness_logo_main.svg?v=1773773848',

  /** Favicon URL — can be .svg, .png, or .ico */
  faviconUrl:
    'https://cdn.shopify.com/s/files/1/0646/1761/1341/files/favicon_42028dc7-aefa-464d-baa2-f8f7f7decb3c.png?v=1773773875',

  /** Sticky header mini logo — text fallback when no SVG path is available */
  stickyLogoText: 'TF',
} as const;
