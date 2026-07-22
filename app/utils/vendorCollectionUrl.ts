import {normalizeBrandKey} from './brandKey';

/**
 * Derives the Shopify collection URL for a product's vendor, assuming a
 * VENDOR-rule smart collection exists at /collections/<normalized-vendor>
 * (confirmed for the store's main brands: csfitness, evolution, k6, movifit,
 * sportfitness, ufc). Same normalization as SectionBrandsTicker's brand
 * links, so a vendor name and its collection handle need not be formatted
 * identically. Returns null when there's no vendor to link.
 */
export function getVendorCollectionUrl(
  vendor: string | null | undefined,
): string | null {
  if (!vendor) return null;
  const key = normalizeBrandKey(vendor);
  if (!key) return null;
  return `/collections/${key}`;
}
