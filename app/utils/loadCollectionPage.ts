/**
 * Shared loader logic for collection pages.
 *
 * Both `/collections/:handle` and `/collections/:handle/:childHandle` need
 * the same pipeline: fetch metadata → decide stock-first stitching →
 * either stitch in-stock first or do cursor pagination → return a
 * collection-shaped object plus pagination totals.
 *
 * The two routes use different GraphQL queries (the parent one also
 * fetches subcollections), so the query string is injected.
 */
import type {
  Filter,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import type {Storefront} from '@shopify/hydrogen';
import {
  fetchProductsStockFirst,
  getTotalProductsForAppliedFilters,
  hasAvailabilityFilter,
} from '~/utils/fetchProductsStockFirst';

export const COLLECTION_PAGE_SIZE = 24;

interface LoadCollectionPageArgs {
  storefront: Storefront;
  handle: string;
  collectionQuery: string;
  filters: ProductFilter[];
  sortKey: string;
  reverse: boolean;
  page: number;
  pageSize?: number;
}

interface LoadCollectionPageResult {
  collection: any;
  products: any[];
  totalProducts: number;
  currentPage: number;
  pageSize: number;
  truncated: boolean;
}

export async function loadCollectionPage(
  args: LoadCollectionPageArgs,
): Promise<LoadCollectionPageResult> {
  const {
    storefront,
    handle,
    collectionQuery,
    filters,
    sortKey,
    reverse,
    page,
    pageSize = COLLECTION_PAGE_SIZE,
  } = args;

  const country = storefront.i18n.country;
  const language = storefront.i18n.language;

  // Fetch metadata + 1 product so we can read the availability facet
  // before deciding whether to stitch.
  const {collection: baseCollection} = await storefront.query(collectionQuery, {
    variables: {
      first: 1,
      handle,
      filters,
      sortKey,
      reverse,
      country,
      language,
    },
  });

  if (!baseCollection) {
    throw new Response('collection', {status: 404});
  }

  const availabilityFacet = baseCollection.products.filters.find(
    (f: Filter) => f.id === 'filter.v.availability',
  );
  const useStockFirst =
    !hasAvailabilityFilter(filters) &&
    availabilityFacet &&
    availabilityFacet.values?.length > 0;

  let currentPage = page;
  let cursorTotal: number | null = null;
  let pageNodes: any[] = [];
  let pageFilters: any[] = baseCollection.products.filters;
  let stockFirstTotal: number | null = null;
  let truncated = false;
  // Track if we're using cursor pagination (for large collections or filtered)
  let useCursorPagination = false;

  if (useStockFirst) {
    const result = await fetchProductsStockFirst({
      storefront,
      handle,
      page,
      pageSize,
      filters,
      sortKey,
      reverse,
      country,
      language,
    });

    // If collection has more than 250 products (truncated), fall back to
    // cursor-based pagination to show ALL products instead of just 250.
    // Stock-first ordering won't apply, but users can see everything.
    if (result.truncated) {
      // eslint-disable-next-line no-console
      console.info(
        `[loadCollectionPage] collection "${handle}" has more than 250 ` +
          `products; using cursor pagination to show all products.`,
      );
      useCursorPagination = true;
    } else {
      currentPage = Math.min(
        page,
        Math.max(1, Math.ceil(result.total / pageSize)),
      );
      const effectiveResult =
        currentPage === page
          ? result
          : await fetchProductsStockFirst({
              storefront,
              handle,
              page: currentPage,
              pageSize,
              filters,
              sortKey,
              reverse,
              country,
              language,
            });
      pageNodes = effectiveResult.nodes;
      if (result.filters.length) pageFilters = result.filters;
      stockFirstTotal = result.total;
      truncated = false;
    }
  } else {
    useCursorPagination = true;
  }

  if (useCursorPagination) {
    // Cursor-based pagination — used when the user has already filtered by
    // availability, when there's no availability facet, or when collection
    // has more than 250 products.
    if (availabilityFacet) {
      cursorTotal = getTotalProductsForAppliedFilters(
        filters,
        availabilityFacet,
      );
    } else {
      // A shop can hide the availability facet. Count matching products so
      // numbered navigation still exposes every page in that configuration.
      cursorTotal = 0;
      let countCursor: string | null = null;
      let hasMore = true;
      while (hasMore) {
        const result: {collection: any} = await storefront.query(
          collectionQuery,
          {
            variables: {
              first: 250,
              after: countCursor,
              handle,
              filters,
              sortKey,
              reverse,
              country,
              language,
            },
          },
        );
        cursorTotal += result.collection?.products?.nodes?.length ?? 0;
        const info = result.collection?.products?.pageInfo;
        hasMore = Boolean(
          info?.hasNextPage && info.endCursor && info.endCursor !== countCursor,
        );
        countCursor = info?.endCursor ?? null;
      }
    }
    currentPage = Math.min(
      page,
      Math.max(1, Math.ceil(cursorTotal / pageSize)),
    );
    let afterCursor: string | null = null;

    if (currentPage > 1) {
      // Shopify limits `first` to 250, so we need to chain multiple requests
      // to reach pages beyond 250 products.
      const skipCount = (currentPage - 1) * pageSize;
      const MAX_PER_REQUEST = 250;
      let skipped = 0;

      while (skipped < skipCount) {
        const toSkip = Math.min(MAX_PER_REQUEST, skipCount - skipped);
        const {collection: cursorCollection}: {collection: any} =
          await storefront.query(collectionQuery, {
            variables: {
              first: toSkip,
              after: afterCursor,
              handle,
              filters,
              sortKey,
              reverse,
              country,
              language,
            },
          });
        afterCursor = cursorCollection?.products?.pageInfo?.endCursor || null;
        skipped += toSkip;

        // If no more pages, break early
        if (!cursorCollection?.products?.pageInfo?.hasNextPage) {
          break;
        }
      }
    }

    const {collection: pagedCollection} = await storefront.query(
      collectionQuery,
      {
        variables: {
          first: pageSize,
          after: afterCursor,
          handle,
          filters,
          sortKey,
          reverse,
          country,
          language,
        },
      },
    );
    pageNodes = pagedCollection?.products?.nodes ?? [];
    if (pagedCollection?.products?.filters?.length) {
      pageFilters = pagedCollection.products.filters;
    }
  }

  const collection = {
    ...baseCollection,
    products: {
      ...baseCollection.products,
      nodes: pageNodes,
      filters: pageFilters,
    },
  };

  const totalProducts = stockFirstTotal ?? cursorTotal ?? 0;

  return {
    collection,
    products: pageNodes,
    totalProducts,
    currentPage,
    pageSize,
    truncated,
  };
}
