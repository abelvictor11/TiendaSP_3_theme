/**
 * fetchProductsStockFirst
 *
 * Shopify's Storefront API does NOT honor the Search & Discovery
 * "Push out-of-stock products to the end" setting for collection queries —
 * that setting only applies to search/predictive search results.
 *
 * To deliver the same UX for collections, we run two parallel queries
 * (in-stock first, out-of-stock second) and stitch them together while
 * preserving page-based pagination.
 *
 * Behavior:
 * - When the user already applied an availability filter (`available:true`
 *   or `available:false`), we skip the stitching and just respect the filter.
 * - When sort is anything other than the default ("featured" / no sort param),
 *   we still apply stock-first because the user usually expects in-stock
 *   results to appear before sold-out ones regardless of sort. Disable this
 *   by passing `applyOnDefaultSortOnly: true`.
 *
 * Returns the same shape that the existing loaders use: a `nodes` array
 * for the current page plus the filters from one of the queries.
 */
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';

interface FetchPageArgs {
  storefront: {
    query: (query: string, options: {variables: Record<string, unknown>}) => Promise<any>;
  };
  query: string;
  handle: string;
  page: number;
  pageSize: number;
  filters: ProductFilter[];
  sortKey: string;
  reverse: boolean;
  country: string;
  language: string;
}

interface PagedResult {
  nodes: any[];
  filters: any[];
  totalInStock: number;
  totalOutOfStock: number;
}

/**
 * Detect whether the user has explicitly filtered by availability.
 * If so, we skip the stock-first stitching.
 */
export function hasAvailabilityFilter(filters: ProductFilter[]): boolean {
  return filters.some((f) => 'available' in (f as Record<string, unknown>));
}

/**
 * Fetch a single page of products from a collection with a specific
 * availability filter, using cursor-based pagination internally.
 */
async function fetchSingleAvailabilitySlice(
  args: FetchPageArgs & {available: boolean; sliceOffset: number; sliceSize: number},
): Promise<{nodes: any[]; filters: any[]}> {
  const {
    storefront,
    query,
    handle,
    sliceOffset,
    sliceSize,
    sortKey,
    reverse,
    country,
    language,
  } = args;

  // Combine user filters with the availability filter
  const combinedFilters: ProductFilter[] = [
    ...args.filters.filter((f) => !('available' in (f as Record<string, unknown>))),
    {available: args.available} as ProductFilter,
  ];

  // Get the cursor at sliceOffset (skip that many products)
  let afterCursor: string | null = null;
  if (sliceOffset > 0) {
    const {collection: cursorCollection} = await storefront.query(query, {
      variables: {
        first: sliceOffset,
        handle,
        filters: combinedFilters,
        sortKey,
        reverse,
        country,
        language,
      },
    });
    afterCursor = cursorCollection?.products?.pageInfo?.endCursor || null;
    // If there's no cursor, the collection has fewer products than sliceOffset
    if (!afterCursor) return {nodes: [], filters: []};
  }

  const {collection} = await storefront.query(query, {
    variables: {
      first: sliceSize,
      after: afterCursor,
      handle,
      filters: combinedFilters,
      sortKey,
      reverse,
      country,
      language,
    },
  });

  return {
    nodes: collection?.products?.nodes ?? [],
    filters: collection?.products?.filters ?? [],
  };
}

/**
 * Get a count of products matching a filter by reading the filter facet.
 * Cheaper than counting nodes — Shopify returns the count for free in the
 * filter facet values. We use the `availability` filter facet specifically.
 */
export function getCountFromAvailabilityFacet(
  filters: any[],
  available: boolean,
): number {
  const facet = filters.find((f: any) => f.id === 'filter.v.availability');
  if (!facet) return 0;
  // Shopify uses values like {label: 'En existencia', count: 20, input: '{"available":true}'}
  const target = facet.values.find((v: any) => {
    try {
      const input = JSON.parse(v.input) as {available?: boolean};
      return input.available === available;
    } catch {
      return false;
    }
  });
  return target?.count ?? 0;
}

/**
 * Compute the true total product count for the current filter set,
 * accounting for an applied availability filter.
 *
 * Why: Shopify's availability facet shows the would-be count for each
 * value (so users can toggle), even when one of them is already applied.
 * Summing both values therefore over-counts when the user has filtered
 * by availability — we should only count the value that's actually applied.
 */
export function getTotalProductsForAppliedFilters(
  filters: ProductFilter[],
  availabilityFacet: any,
): number {
  if (!availabilityFacet?.values?.length) return 0;
  const appliedAvailability = filters.find(
    (f) => 'available' in (f as Record<string, unknown>),
  ) as {available?: boolean} | undefined;
  if (appliedAvailability && typeof appliedAvailability.available === 'boolean') {
    return getCountFromAvailabilityFacet(
      [availabilityFacet],
      appliedAvailability.available,
    );
  }
  return availabilityFacet.values.reduce(
    (acc: number, v: any) => acc + (v.count ?? 0),
    0,
  );
}

/**
 * Main entry point. Fetches the requested page with in-stock products first,
 * then out-of-stock, treating the union as a single ordered list.
 */
export async function fetchProductsStockFirst(
  args: FetchPageArgs & {
    /** The pre-fetched availability facet from the unfiltered query */
    availabilityFacet: any;
  },
): Promise<PagedResult> {
  const {page, pageSize, availabilityFacet} = args;

  const totalInStock = getCountFromAvailabilityFacet([availabilityFacet], true);
  const totalOutOfStock = getCountFromAvailabilityFacet(
    [availabilityFacet],
    false,
  );

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  // Case 1: This page is fully within the in-stock range
  if (endIndex <= totalInStock) {
    const result = await fetchSingleAvailabilitySlice({
      ...args,
      available: true,
      sliceOffset: startIndex,
      sliceSize: pageSize,
    });
    return {
      nodes: result.nodes,
      filters: result.filters,
      totalInStock,
      totalOutOfStock,
    };
  }

  // Case 2: This page is fully within the out-of-stock range
  if (startIndex >= totalInStock) {
    const result = await fetchSingleAvailabilitySlice({
      ...args,
      available: false,
      sliceOffset: startIndex - totalInStock,
      sliceSize: pageSize,
    });
    return {
      nodes: result.nodes,
      filters: result.filters,
      totalInStock,
      totalOutOfStock,
    };
  }

  // Case 3: Page straddles the boundary — fetch the tail of in-stock and
  // the head of out-of-stock in parallel, then concatenate.
  const inStockNeeded = totalInStock - startIndex;
  const outOfStockNeeded = pageSize - inStockNeeded;

  const [inStockResult, outOfStockResult] = await Promise.all([
    fetchSingleAvailabilitySlice({
      ...args,
      available: true,
      sliceOffset: startIndex,
      sliceSize: inStockNeeded,
    }),
    fetchSingleAvailabilitySlice({
      ...args,
      available: false,
      sliceOffset: 0,
      sliceSize: outOfStockNeeded,
    }),
  ]);

  return {
    nodes: [...inStockResult.nodes, ...outOfStockResult.nodes],
    // Use whichever result has filters (in-stock query for facet labels)
    filters: inStockResult.filters.length
      ? inStockResult.filters
      : outOfStockResult.filters,
    totalInStock,
    totalOutOfStock,
  };
}
