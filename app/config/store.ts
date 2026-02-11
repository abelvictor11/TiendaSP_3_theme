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
    'https://cdn.shopify.com/s/files/1/0646/1761/1341/files/logo-tienda-fitness_black.svg?v=1753220388',

  /** Favicon URL — can be .svg, .png, or .ico */
  faviconUrl:
    'https://cdn.shopify.com/s/files/1/0646/1761/1341/files/favicon_2c6a6e00-a71f-413b-b4fd-04b50fc88593.png?v=1753220388',

  /** Sticky header mini logo — text fallback when no SVG path is available */
  stickyLogoText: 'TF',
} as const;
