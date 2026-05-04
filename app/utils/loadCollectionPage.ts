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
  getTotalProductsForAppliedFilters,
  hasAvailabilityFilter,
  COLLECTION_PRODUCT_STOCK_META_QUERY,
  processStockMetaAndFetchPage,
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
  const noAvailFilter = !hasAvailabilityFilter(filters);

  // When no availability filter is applied (common case), run the base query
  // and the stock-meta query IN PARALLEL to save ~300 ms of sequential latency.
  const stockMetaPromise = noAvailFilter
    ? storefront.query(COLLECTION_PRODUCT_STOCK_META_QUERY, {
        cache: storefront.CacheShort(),
        variables: {
          handle,
          filters,
          sortKey,
          reverse,
          country,
          language,
          first: 250,
        },
      })
    : null;

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
    noAvailFilter &&
    availabilityFacet &&
    availabilityFacet.values?.length > 0;

  let pageNodes: any[] = [];
  let pageFilters: any[] = baseCollection.products.filters;
  let stockFirstTotal: number | null = null;
  let truncated = false;

  if (useStockFirst) {
    // stockMetaPromise was started in parallel above; await its result now
    const stockMetaData = await stockMetaPromise;
    const result = await processStockMetaAndFetchPage({
      storefront,
      collectionData: stockMetaData,
      handle,
      page,
      pageSize,
      filters,
      sortKey,
      reverse,
      country,
      language,
    });
    pageNodes = result.nodes;
    if (result.filters.length) pageFilters = result.filters;
    stockFirstTotal = result.truncated ? null : result.total;
    truncated = result.truncated;
    if (truncated) {
      // eslint-disable-next-line no-console
      console.warn(
        `[loadCollectionPage] collection "${handle}" has more than 250 ` +
          `products; stock-first ordering applies only to the first 250.`,
      );
    }
  } else {
    // Cursor-based pagination — used when the user has already filtered by
    // availability or when there's no availability facet.
    let afterCursor: string | null = null;
    if (page > 1) {
      const skipCount = (page - 1) * pageSize;
      const {collection: cursorCollection} = await storefront.query(
        collectionQuery,
        {
          variables: {
            first: skipCount,
            handle,
            filters,
            sortKey,
            reverse,
            country,
            language,
          },
        },
      );
      afterCursor = cursorCollection?.products?.pageInfo?.endCursor || null;
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

  const totalProducts =
    stockFirstTotal ??
    getTotalProductsForAppliedFilters(filters, availabilityFacet);

  return {
    collection,
    products: pageNodes,
    totalProducts,
    currentPage: page,
    pageSize,
    truncated,
  };
}
