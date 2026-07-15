import type {
  ProductCollectionSortKeys,
  SearchSortKeys,
} from '@shopify/hydrogen/storefront-api-types';
import type {SortParam} from '~/components/SortMenu';

export function getSortValuesFromParam(sortParam: SortParam | null): {
  sortKey: ProductCollectionSortKeys | SearchSortKeys;
  reverse: boolean;
  onSale?: boolean;
} {
  switch (sortParam) {
    case 'price-high-low':
      return {
        sortKey: 'PRICE',
        reverse: true,
      };
    case 'price-low-high':
      return {
        sortKey: 'PRICE',
        reverse: false,
      };
    case 'best-selling':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
      };
    case 'newest':
      return {
        sortKey: 'CREATED',
        reverse: true,
      };
    case 'featured':
      return {
        // COLLECTION_DEFAULT respects the sort the merchant configured in
        // Shopify Admin AND any re-ranking rules from Search & Discovery
        // (e.g. "push out-of-stock products to the end").
        sortKey: 'COLLECTION_DEFAULT',
        reverse: false,
      };
    case 'on-sale':
      return {
        sortKey: 'BEST_SELLING',
        reverse: false,
        onSale: true,
      };
    default:
      // Default sort = whatever the merchant set in Admin for the collection,
      // with Search & Discovery re-ranking applied (out-of-stock at the end,
      // boosted/buried products, etc.). Previously was RELEVANCE which only
      // applies to search, not collections, and bypasses the re-ranking.
      return {
        sortKey: 'COLLECTION_DEFAULT',
        reverse: false,
      };
  }
}
