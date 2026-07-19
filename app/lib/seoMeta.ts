import {getSeoMeta, type SeoConfig} from '@shopify/hydrogen';

/**
 * Wraps Hydrogen's `getSeoMeta` to add `og:type` and `twitter:card`, which
 * `SeoConfig`/`getSeoMeta` don't support natively — the switch statement in
 * `getSeoMeta` (node_modules/@shopify/hydrogen/dist/development/index.js,
 * `src/seo/getSeoMeta.ts`) only recognizes the keys `title`, `description`,
 * `url`, `handle`, `media`, `jsonLd`, `alternates`, and `robots` on the
 * `SeoConfig` object; there's no `type`/`twitter` key it will pick up.
 *
 * This is intentionally NOT in `seo.server.ts`: Remix's `meta` export runs
 * on the client during client-side navigations (not just during SSR), so it
 * can't import a `.server.ts` module. This file stays isomorphic-safe so
 * every route's `meta` export can call it directly.
 */
export function getSeoMetaTags(
  seoInputs: Array<SeoConfig | undefined>,
  ogType: 'website' | 'product' = 'website',
): ReturnType<typeof getSeoMeta> {
  return [
    ...(getSeoMeta(...seoInputs) ?? []),
    {property: 'og:type', content: ogType},
    {name: 'twitter:card', content: 'summary_large_image'},
  ];
}
