import {type SortParam} from '~/components/SortMenu';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {type ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {getSortValuesFromParam} from './getSortValuesFromParam';

export const getPaginationAndFiltersFromRequest = (
  request: Request,
  pageBy = 12,
) => {
  const searchParams = new URL(request.url).searchParams;

  // Page-based pagination: ?page=2 means fetch page 2
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const paginationVariables = {
    first: pageBy,
    last: null as number | null,
    startCursor: null as string | null,
    endCursor: null as string | null,
  };

  const {sortKey, reverse, onSale} = getSortValuesFromParam(
    searchParams.get('sort') as SortParam,
  );
  const filters = [...searchParams.entries()].reduce(
    (filters, [key, value]) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.substring(FILTER_URL_PREFIX.length);
        filters.push({
          [filterKey]: JSON.parse(value),
        });
      }
      return filters;
    },
    [] as ProductFilter[],
  );

  return {paginationVariables, filters, sortKey, reverse, onSale, page};
};
