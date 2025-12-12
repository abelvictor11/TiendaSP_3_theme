import {
  defer,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link} from '@remix-run/react';
import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import {Pagination, Analytics, getSeoMeta} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {SortFilter} from '~/components/SortFilter';
import FiltersSidebar from '~/components/FiltersSidebar';
import {useSearchParams, useLocation} from '@remix-run/react';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {RouteContent} from '~/sections/RouteContent';
import PageHeader from '~/components/PageHeader';
import {getProductTotalByFilter} from '~/utils/getProductTotalByFilter';
import {Empty} from '~/components/Empty';
import {FireIcon} from '@heroicons/react/24/outline';
import {getPaginationAndFiltersFromRequest} from '~/utils/getPaginationAndFiltersFromRequest';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {ProductsGrid} from '~/components/ProductsGrid';
import clsx from 'clsx';
import {Suspense} from 'react';

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  // Query the route metaobject
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-collection',
  });

  const {paginationVariables, filters, sortKey, reverse} =
    getPaginationAndFiltersFromRequest(request, 24);

  // 2. Query the colelction details
  const [{collection}] = await Promise.all([
    context.storefront.query(COLLECTION_QUERY, {
      variables: {
        ...paginationVariables,
        handle: collectionHandle,
        filters,
        sortKey,
        reverse,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  if (!collection) {
    throw new Response('collection', {status: 404});
  }

  const seo = seoPayload.collection({collection, url: request.url});

  const defaultPriceFilter = collection.productsWithDefaultFilter.filters.find(
    (filter) => filter.id === 'filter.v.price',
  );

  return defer({
    routePromise,
    collection,
    defaultPriceFilter: {
      value: defaultPriceFilter?.values[0] ?? null,
      locale,
    },
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Collection() {
  const {collection, defaultPriceFilter, routePromise} =
    useLoaderData<typeof loader>();

  const noResults = !collection.products.nodes.length;

  // Get total products from the availability filter (filter.v.availability)
  const availabilityFilter = collection.productsWithDefaultFilter.filters.find(
    (filter) => filter.id === 'filter.v.availability',
  );
  const totalProducts = noResults
    ? 0
    : getProductTotalByFilter(availabilityFilter?.values as any);

  // Get subcollections from metafield
  const subcollections = collection.subcollections?.references?.nodes || [];

  return (
    <div className="nc-PageCollection pb-20 lg:pb-28 xl:pb-32">
      {/* Subcollections Bar */}
      {subcollections.length > 0 && (
        <div className="border-b border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 sticky top-[64px] lg:top-[120px] z-30">
          <div className="container">
            <div className="flex items-center gap-2 py-3 overflow-x-auto hiddenScroll justify-center">
              <Link
                to={`/collections/${collection.handle}`}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full bg-[#e5f7fd] text-white dark:bg-white dark:text-slate-900"
              >
                All {collection.title}
              </Link>
              {subcollections.map((sub: any) => (
                <Link
                  key={sub.id}
                  to={`/collections/${sub.handle}`}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full dark:border-neutral-600  hover:bg-[#e5f7fd] dark:hover:bg-neutral-800 transition-colors"
                >
                  {sub.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container pt-6 lg:pt-8">
        <div className="space-y-6 lg:space-y-8">
          {/* HEADING */}
          <div>
            <div className="flex items-center text-sm font-medium gap-2 text-neutral-500 mb-1">
              <FireIcon className="w-5 h-5" />
              <span className="text-neutral-700 dark:text-neutral-300">
                {totalProducts} products
              </span>
            </div>
            <PageHeader
              // remove the html tags on title
              title={collection.title.replace(/(<([^>]+)>)/gi, '')}
              description={collection.description}
              hasBreadcrumb={false}
              breadcrumbText={collection.title}
            />
          </div>

          <main>
            <CollectionContent 
              collection={collection}
              defaultPriceFilter={defaultPriceFilter}
              noResults={noResults}
            />
          </main>
        </div>
      </div>

      {/* 3. Render the route's content sections */}
      <Suspense fallback={<div className="h-32" />}>
        <Await
          errorElement="There was a problem loading route's content sections"
          resolve={routePromise}
        >
          {({route}) => (
            <>
              <RouteContent
                route={route}
                className="space-y-12 sm:space-y-16 lg:space-y-20 mt-12"
              />
            </>
          )}
        </Await>
      </Suspense>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

function CollectionContent({
  collection,
  defaultPriceFilter,
  noResults,
}: {
  collection: any;
  defaultPriceFilter: any;
  noResults: boolean;
}) {
  const [params] = useSearchParams();

  const filtersFromSearchParams = [...params.entries()].reduce(
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

  const allFilterValues = collection.products.filters.flatMap((filter: Filter) => filter.values);
  const appliedFilters = filtersFromSearchParams
    .map((filter) => {
      const foundValue = allFilterValues?.find((value: any) => {
        const valueInput = JSON.parse(value.input as string) as ProductFilter;
        if (valueInput.price && filter.price) {
          return true;
        }
        return JSON.stringify(valueInput) === JSON.stringify(filter);
      });
      if (!foundValue) {
        return null;
      }
      return {
        filter,
        label: foundValue.label,
        data: foundValue,
      };
    })
    .filter((filter): filter is NonNullable<typeof filter> => filter !== null);

  return (
    <div className="flex gap-8">
      {/* Sidebar with Filters */}
      <div className="hidden lg:block">
        <FiltersSidebar
          filters={collection.products.filters as Filter[]}
          appliedFilters={appliedFilters}
          defaultPriceFilter={defaultPriceFilter}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Filters + Sort */}
        <div className="lg:hidden mb-8">
          <SortFilter
            filters={collection.products.filters as Filter[]}
            defaultPriceFilter={defaultPriceFilter}
          />
        </div>

        {/* Desktop Sort Only */}
        <div className="hidden lg:flex justify-end mb-8">
          <SortFilter
            filters={[]}
            defaultPriceFilter={defaultPriceFilter}
          />
        </div>

        {/* Products Grid */}
        {!noResults ? (
          <Pagination connection={collection.products}>
            {({
              nodes,
              isLoading,
              PreviousLink,
              previousPageUrl,
              NextLink,
              nextPageUrl,
              hasNextPage,
              hasPreviousPage,
            }) => (
              <>
                <ProductsGrid nodes={nodes} className="mt-0" />
                
                {/* Pagination Controls */}
                {(hasNextPage || hasPreviousPage) && (
                  <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
                    {/* Previous Button */}
                    {hasPreviousPage ? (
                      <a
                        href={previousPageUrl.replace(/%3D$/, '=')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 transition-colors font-medium"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>Previous</span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 text-neutral-300 cursor-not-allowed font-medium">
                        <ChevronLeftIcon className="w-5 h-5" />
                        <span>Previous</span>
                      </div>
                    )}

                    {/* Page indicator */}
                    <div className="flex items-center gap-2 px-4 py-2">
                      <span className="text-sm text-neutral-600">
                        {nodes.length} products
                      </span>
                    </div>

                    {/* Next Button */}
                    {hasNextPage ? (
                      <a
                        href={nextPageUrl.replace(/%3D$/, '=')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50 transition-colors font-medium"
                      >
                        <span>Next</span>
                        <ChevronRightIcon className="w-5 h-5" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 text-neutral-300 cursor-not-allowed font-medium">
                        <span>Next</span>
                        <ChevronRightIcon className="w-5 h-5" />
                      </div>
                    )}
                  </nav>
                )}
              </>
            )}
          </Pagination>
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

const COLLECTION_QUERY = `#graphql
  query CollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        description
        title
      }
      image {
        id
        url
        width
        height
        altText
      }
      subcollections: metafield(namespace: "custom", key: "subcollections") {
        references(first: 20) {
          nodes {
            ... on Collection {
              id
              handle
              title
            }
          }
        }
      }
      productsWithDefaultFilter:products(
        first: 0,
        filters: {},
      ) {
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
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
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
        nodes {
          ...CommonProductCard
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
   # All common fragments
   ${COMMON_PRODUCT_CARD_FRAGMENT}
` as const;
