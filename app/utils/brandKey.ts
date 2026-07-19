/**
 * Normalize a brand/collection display name (or Shopify collection handle)
 * into a comparable key: lowercase, trailing numeric suffix stripped (e.g.
 * a metaobject named "UFC-1" becomes "ufc"), non-alphanumeric characters
 * removed. Used to match a Shopify collection handle against a brand
 * metaobject's `name` field without depending on them being formatted
 * identically.
 */
export function normalizeBrandKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[-\s]?\d+$/, '')
    .replace(/[^a-z0-9]/g, '');
}
