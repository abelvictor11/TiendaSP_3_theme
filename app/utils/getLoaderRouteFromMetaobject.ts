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
  // Defaults to CacheShort() (1s fresh / 9s stale-while-revalidate) on
  // every caller, including filter/pagination-heavy routes (collections,
  // search) and the PDP. Some section types this query can return
  // (SectionProductsSlider, SectionProductShowcase, SectionProductCarousel)
  // embed CommonProductCard -- live price/availableForSale data -- so this
  // isn't risk-free, but a 9s worst-case staleness window on that data is
  // bounded and small. Override per call site only if a specific route
  // genuinely needs stricter freshness than that.
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
    cache: cacheStrategy || storefront.CacheShort(),
  });

  return {route};
};
