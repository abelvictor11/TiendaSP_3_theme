/**
 * Derives the Shopify collection URL for a product's vendor, assuming a
 * VENDOR-rule smart collection exists at /collections/<normalized-vendor>
 * (confirmed for the store's main brands: csfitness, evolution, k6, movifit,
 * sportfitness, ufc). Returns null when there's no vendor to link.
 *
 * Deliberately NOT reusing brandKey.ts's normalizeBrandKey() here — that
 * helper strips a trailing numeric *suffix* (e.g. a metaobject named
 * "UFC-1" → "ufc"), which is correct for its own use case (matching brand
 * metaobjects against inconsistent naming) but wrong here: a vendor name's
 * trailing digit can be part of the actual brand, e.g. "K6" → "k6", not
 * "k". Stripping it would send every K6 product's brand link to the wrong
 * (non-existent) /collections/k.
 */
export function getVendorCollectionUrl(
  vendor: string | null | undefined,
): string | null {
  if (!vendor) return null;
  const key = vendor
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  if (!key) return null;
  return `/collections/${key}`;
}
