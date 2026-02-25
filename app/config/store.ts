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
    'https://cdn.shopify.com/s/files/1/0680/3200/4294/files/ciclospecial.svg?v=1749518126',

  /** Favicon URL — can be .svg, .png, or .ico */
  faviconUrl:
    'https://cdn.shopify.com/s/files/1/0680/3200/4294/files/favicon.png?v=1751495721',

  /** Sticky header mini logo — SVG markup or text fallback */
  stickyLogoText: '',
  stickyLogoSvg: `<svg viewBox="0 0 81.814 39" xmlns="http://www.w3.org/2000/svg"><g><path style="fill:#FF0000;" d="M17.951,3.864c0,0-9.4,12.992-16.085,22.228c1.61,2.248,6.483,9.045,6.483,9.045h48.965L79.948,3.864H17.951z"/><path style="fill:#FFFFFF;" d="M33.367,26.175H14.592c3.182-4.397,6.792-9.383,9.665-13.353h46.593c4.169-5.759,0.695-0.961,4.864-6.72H19.131c-2.977,4.114-9.466,13.082-14.452,19.966c0.473,0.664,4.031,5.623,4.893,6.826h18.933l4.864-6.72H33.367z"/><path style="fill:#FFFFFF;" d="M30.778,32.898h25.546l12.144-16.783H50.669c0.441-0.609,0.889-1.229,1.345-1.858H41.852c-1.93,2.666-4.103,5.666-6.218,8.589h17.923c-0.819,1.131-1.627,2.25-2.412,3.332H35.637l-4.862,6.72H30.778z"/></g></svg>`,
} as const;
