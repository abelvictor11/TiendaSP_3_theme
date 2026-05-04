/**
 * fetchProductsStockFirst
 *
 * Shopify's Storefront API does NOT honor the Search & Discovery
 * "Push out-of-stock products to the end" setting for collection queries —
 * that setting only applies to search/predictive search results.
 *
 * To deliver the same UX for collections, we:
 *   1. Run a lightweight query that returns just `id` and `availableForSale`
 *      for all matching products in the collection (up to 250).
 *   2. Reorder the ID list so in-stock products come first.
 *   3. Slice the ordered list for the requested page.
 *   4. Fetch full product data for that page's IDs via `nodes(ids: ...)`.
 *
 * Why not use `available:true` / `available:false` filters for stitching?
 * Because product-level availability filters operate per-variant: a product
 * with one in-stock size and one out-of-stock size matches BOTH filters,
 * causing duplicates and miscounts. The product-level `availableForSale`
 * field is the single source of truth, so we use it client-side.
 *
 * Behavior:
 * - When the user already applied an availability filter (`available:true`
 *   or `available:false`), we skip stock-first stitching and respect the
 *   filter (caller decides this via `hasAvailabilityFilter`).
 * - When the collection has more than 250 matching products, the order
 *   for products beyond #250 is whatever Shopify returns (we still
 *   preserve in-stock-first within the first 250 — adequate for any
 *   reasonable browse-and-paginate UX).
 */
import type {
  Filter,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import type {Storefront} from '@shopify/hydrogen';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';

const STOREFRONT_MAX_NODES = 250;

interface FetchArgs {
  storefront: Storefront;
  handle: string;
  page: number;
  pageSize: number;
  filters: ProductFilter[];
  sortKey: string;
  reverse: boolean;
  country: string;
  language: string;
}

/** A single product card as returned by COMMON_PRODUCT_CARD_FRAGMENT. */
type ProductCard = Record<string, unknown> & {id: string};

interface StockMeta {
  id: string;
  availableForSale: boolean;
}

interface PagedResult {
  nodes: ProductCard[];
  filters: Filter[];
  total: number;
  totalInStock: number;
  totalOutOfStock: number;
  /** True if the collection had more than 250 matching products; total may under-count. */
  truncated: boolean;
}

/**
 * Detect whether the user has explicitly filtered by availability.
 * If so, the caller should skip stock-first stitching.
 */
export function hasAvailabilityFilter(filters: ProductFilter[]): boolean {
  return filters.some((f) => 'available' in (f as Record<string, unknown>));
}

/**
 * Sum the counts in the availability facet. Used by the caller as a
 * fallback total when stock-first stitching is bypassed.
 */
type AvailabilityFacet = Filter | undefined | null;

function sumAvailabilityFacet(facet: AvailabilityFacet): number {
  if (!facet?.values?.length) return 0;
  return facet.values.reduce((acc, v) => acc + (v.count ?? 0), 0);
}

function getCountFromAvailabilityFacet(
  facet: AvailabilityFacet,
  available: boolean,
): number {
  if (!facet?.values?.length) return 0;
  const target = facet.values.find((v) => {
    try {
      const input = JSON.parse(v.input as string) as {available?: boolean};
      return input.available === available;
    } catch {
      return false;
    }
  });
  return target?.count ?? 0;
}

/**
 * Compute the true total for the current filter set when an availability
 * filter is applied. Shopify's facet counts both values regardless (so the
 * user can toggle), so summing over-counts when one is already selected.
 */
export function getTotalProductsForAppliedFilters(
  filters: ProductFilter[],
  availabilityFacet: AvailabilityFacet,
): number {
  if (!availabilityFacet) return 0;
  const applied = filters.find(
    (f) => 'available' in (f as Record<string, unknown>),
  ) as {available?: boolean} | undefined;
  if (applied && typeof applied.available === 'boolean') {
    return getCountFromAvailabilityFacet(availabilityFacet, applied.available);
  }
  return sumAvailabilityFacet(availabilityFacet);
}

/**
 * Lightweight query: just IDs + availableForSale for ordering.
 * Also returns filters so the caller can render facets without a separate
 * trip to the API.
 */
export const COLLECTION_PRODUCT_STOCK_META_QUERY = `#graphql
  query CollectionProductStockMeta(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int!
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(
        first: $first,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        nodes {
          id
          availableForSale
        }
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
` as const;

/**
 * Fetch full product cards for a specific list of IDs while preserving
 * the order we pass in.
 */
const PRODUCTS_BY_IDS_QUERY = `#graphql
  query ProductsByIds(
    $ids: [ID!]!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      ... on Product {
        ...CommonProductCard
      }
    }
  }
  ${COMMON_PRODUCT_CARD_FRAGMENT}
` as const;

/**
 * Accept pre-fetched stock-meta collection data (avoids a round-trip when
 * the caller already ran COLLECTION_PRODUCT_STOCK_META_QUERY in parallel).
 */
export async function processStockMetaAndFetchPage(
  args: Omit<FetchArgs, 'storefront'> & {
    storefront: Storefront;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    collectionData: any;
  },
): Promise<PagedResult> {
  const {storefront, collectionData, page, pageSize, country, language} = args;
  const meta = (collectionData?.collection?.products?.nodes ?? []) as StockMeta[];

  const inStockIds: string[] = [];
  const outOfStockIds: string[] = [];
  for (const p of meta) {
    if (p.availableForSale) inStockIds.push(p.id);
    else outOfStockIds.push(p.id);
  }
  const orderedIds = [...inStockIds, ...outOfStockIds];
  const startIndex = (page - 1) * pageSize;
  const pageIds = orderedIds.slice(startIndex, startIndex + pageSize);

  const baseResult = {
    filters: collectionData?.collection?.products?.filters ?? [],
    total: orderedIds.length,
    totalInStock: inStockIds.length,
    totalOutOfStock: outOfStockIds.length,
    truncated: collectionData?.collection?.products?.pageInfo?.hasNextPage ?? false,
  };

  if (pageIds.length === 0) return {nodes: [], ...baseResult};

  const {nodes} = await storefront.query(PRODUCTS_BY_IDS_QUERY, {
    variables: {ids: pageIds, country, language},
    cache: storefront.CacheShort(),
  });

  const pageNodes = (nodes as Array<ProductCard | null>).filter(
    (n): n is ProductCard => Boolean(n),
  );
  return {nodes: pageNodes, ...baseResult};
}

/**
 * Main entry point. Returns the requested page with in-stock products
 * globally first, then out-of-stock — with no duplicates.
 */
export async function fetchProductsStockFirst(
  args: FetchArgs,
): Promise<PagedResult> {
  const {
    storefront,
    handle,
    page,
    pageSize,
    filters,
    sortKey,
    reverse,
    country,
    language,
  } = args;

  // 1. Pull the lightweight ID list with availableForSale flags.
  // CacheShort: stock state changes often, so we don't want a long TTL,
  // but a few seconds of edge cache helps absorb pagination clicks.
  const {collection} = await storefront.query(
    COLLECTION_PRODUCT_STOCK_META_QUERY,
    {
      variables: {
        handle,
        filters,
        sortKey,
        reverse,
        country,
        language,
        first: STOREFRONT_MAX_NODES,
      },
      cache: storefront.CacheShort(),
    },
  );

  if (!collection) {
    return {
      nodes: [],
      filters: [],
      total: 0,
      totalInStock: 0,
      totalOutOfStock: 0,
      truncated: false,
    };
  }

  const meta = (collection.products?.nodes ?? []) as StockMeta[];

  // 2. Partition into in-stock / out-of-stock while preserving relative order.
  const inStockIds: string[] = [];
  const outOfStockIds: string[] = [];
  for (const p of meta) {
    if (p.availableForSale) inStockIds.push(p.id);
    else outOfStockIds.push(p.id);
  }
  const orderedIds = [...inStockIds, ...outOfStockIds];

  // 3. Slice the ordered list for the current page.
  const startIndex = (page - 1) * pageSize;
  const pageIds = orderedIds.slice(startIndex, startIndex + pageSize);

  const baseResult = {
    filters: collection.products?.filters ?? [],
    total: orderedIds.length,
    totalInStock: inStockIds.length,
    totalOutOfStock: outOfStockIds.length,
    truncated: collection.products?.pageInfo?.hasNextPage ?? false,
  };

  if (pageIds.length === 0) {
    return {nodes: [], ...baseResult};
  }

  // 4. Fetch full product cards for the page's IDs.
  const {nodes} = await storefront.query(PRODUCTS_BY_IDS_QUERY, {
    variables: {ids: pageIds, country, language},
    cache: storefront.CacheShort(),
  });

  // `nodes(ids:)` preserves the order we passed in. Filter null entries
  // (in case an ID was unpublished between the two queries).
  const pageNodes = (nodes as Array<ProductCard | null>).filter(
    (n): n is ProductCard => Boolean(n),
  );

  return {nodes: pageNodes, ...baseResult};
}
