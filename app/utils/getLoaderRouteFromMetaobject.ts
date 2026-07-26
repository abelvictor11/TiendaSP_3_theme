import type {LoaderFunctionArgs} from '@remix-run/server-runtime';
import type {CachingStrategy} from '@shopify/hydrogen';
import {ROUTE_CONTENT_QUERY} from '~/sections/RouteContent';
import {getPaginationAndFiltersFromRequest} from '~/utils/getPaginationAndFiltersFromRequest';

export const getLoaderRouteFromMetaobject = async ({
  params,
  context,
  request,
  handle = '',
  pageBy = 8,
  cacheStrategy,
}: LoaderFunctionArgs & {
  handle: string;
  pageBy?: number;
  // Defaults to no caching, since this same query also drives
  // filter/pagination-heavy routes (collections, search) and the PDP,
  // where every request should see current inventory/pricing. Pure
  // marketing-content routes (homepage, /stores, /home-2, /news) opt into
  // a short cache explicitly at the call site instead.
  cacheStrategy?: CachingStrategy;
}) => {
  const {storefront} = context;

  if (!handle) {
    throw new Error('Route handle is required');
  }

  const {filters, paginationVariables, sortKey, reverse} =
    getPaginationAndFiltersFromRequest(request, pageBy);

  // 2. Query the home route metaobject
  const {route} = await storefront.query(ROUTE_CONTENT_QUERY, {
    variables: {
      ...paginationVariables,
      handle,
      filters,
      sortKey,
      reverse,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
    cache: cacheStrategy || storefront.CacheNone(),
  });

  return {route};
};
