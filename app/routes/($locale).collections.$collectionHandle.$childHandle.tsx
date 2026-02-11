import {
  defer,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {Await, useLoaderData, Link, useParams} from '@remix-run/react';
import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import {Analytics, getSeoMeta} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {SortFilter} from '~/components/SortFilter';
import FiltersSidebar from '~/components/FiltersSidebar';
import {useSearchParams, useLocation} from '@remix-run/react';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {PaginationBar} from '~/components/PaginationBar';
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
  const {collectionHandle, childHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');
  invariant(childHandle, 'Missing childHandle param');

  // Query the route metaobject
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-collection',
  });

  const PAGE_SIZE = 24;
  const {filters, sortKey, reverse, page} =
    getPaginationAndFiltersFromRequest(request, PAGE_SIZE);

  const fetchCount = page * PAGE_SIZE;

  // Query the child collection and parent collection (for subcollections bar) in parallel
  const [{collection: childCollection}, {collection: parentCollection}] =
    await Promise.all([
      context.storefront.query(CHILD_COLLECTION_QUERY, {
        variables: {
          first: fetchCount,
          handle: childHandle,
          filters,
          sortKey,
          reverse,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
      context.storefront.query(PARENT_COLLECTION_QUERY, {
        variables: {
          handle: collectionHandle,
          country: context.storefront.i18n.country,
          language: context.storefront.i18n.language,
        },
      }),
    ]);

  if (!childCollection) {
    throw new Response('collection', {status: 404});
  }

  const seo = seoPayload.collection({collection: childCollection, url: request.url});

  const defaultPriceFilter =
    childCollection.productsWithDefaultFilter.filters.find(
      (filter: any) => filter.id === 'filter.v.price',
    );

  // Slice products to only the current page
  const startIndex = (page - 1) * PAGE_SIZE;
  const slicedNodes = childCollection.products.nodes.slice(startIndex, startIndex + PAGE_SIZE);

  // Get subcollections from parent
  const subcollections =
    parentCollection?.subcollections?.references?.nodes || [];

  return defer({
    routePromise,
    collection: childCollection,
    products: slicedNodes,
    currentPage: page,
    pageSize: PAGE_SIZE,
    parentCollection,
    subcollections,
    parentHandle: collectionHandle,
    childHandle,
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

export default function ChildCollection() {
  const {
    collection,
    products,
    currentPage,
    pageSize,
    parentCollection,
    subcollections,
    parentHandle,
    childHandle,
    defaultPriceFilter,
    routePromise,
  } = useLoaderData<typeof loader>();

  const noResults = !products.length;

  // Get filtered total from the filtered products query
  const availabilityFilter =
    collection.products.filters.find(
      (filter: any) => filter.id === 'filter.v.availability',
    );
  const totalProducts = noResults
    ? 0
    : getProductTotalByFilter(availabilityFilter?.values as any);

  return (
    <div className="nc-PageCollection pb-20 lg:pb-28 xl:pb-32">
      {/* Subcollections Bar */}
      {subcollections.length > 0 && (
        <div
          id="subcollections-bar"
          className="nc-SubcollectionsBar border-b border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        >
          <div className="container">
            <div className="flex items-center gap-2 py-3 overflow-x-auto hiddenScroll justify-center">
              <Link
                to={`/collections/${parentHandle}`}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full dark:border-neutral-600 hover:bg-[#e5f7fd] dark:hover:bg-neutral-800 transition-colors"
              >
                All {parentCollection?.title || parentHandle}
              </Link>
              {subcollections.map((sub: any) => (
                <Link
                  key={sub.id}
                  to={`/collections/${parentHandle}/${sub.handle}`}
                  className={clsx(
                    'flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full dark:border-neutral-600 transition-colors',
                    sub.handle === childHandle
                      ? 'bg-[#e5f7fd] dark:bg-white dark:text-slate-900'
                      : 'hover:bg-[#e5f7fd] dark:hover:bg-neutral-800',
                  )}
                >
                  {sub.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid px-6 pt-6 lg:pt-8">
        <div className="space-y-6 lg:space-y-8">
          {/* HEADING */}
          <div>
            <div className="flex items-center text-sm font-medium gap-2 text-neutral-500 mb-1">
              <FireIcon className="w-5 h-5" />
              <span className="text-neutral-700 dark:text-neutral-300">
                {totalProducts} productos
              </span>
            </div>
            <PageHeader
              title={collection.title.replace(/(<([^>]+)>)/gi, '')}
              description={collection.description}
              hasBreadcrumb={false}
              breadcrumbText={collection.title}
            />
          </div>

          <main>
            <ChildCollectionContent
              collection={collection}
              products={products}
              currentPage={currentPage}
              pageSize={pageSize}
              totalProducts={totalProducts}
              defaultPriceFilter={defaultPriceFilter}
              noResults={noResults}
            />
          </main>
        </div>
      </div>

      {/* Route content sections */}
      <Suspense fallback={<div className="h-32" />}>
        <Await
          errorElement="There was a problem loading route's content sections"
          resolve={routePromise}
        >
          {({route}) => (
            <RouteContent
              route={route}
              className="space-y-12 sm:space-y-16 lg:space-y-20 mt-12"
            />
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

function ChildCollectionContent({
  collection,
  products,
  currentPage,
  pageSize,
  totalProducts,
  defaultPriceFilter,
  noResults,
}: {
  collection: any;
  products: any[];
  currentPage: number;
  pageSize: number;
  totalProducts: number;
  defaultPriceFilter: any;
  noResults: boolean;
}) {
  const [params] = useSearchParams();
  const isOnSaleFilter = params.get('sort') === 'on-sale';

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

  const allFilterValues = collection.products.filters.flatMap(
    (filter: Filter) => filter.values,
  );
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

  // Filter products on sale if on-sale sort is active
  const displayNodes = isOnSaleFilter
    ? products.filter((product: any) => {
        const compareAt = product.compareAtPriceRange?.minVariantPrice?.amount;
        const price = product.priceRange?.minVariantPrice?.amount;
        return compareAt && price && Number(compareAt) > Number(price);
      })
    : products;

  return (
    <div className="flex gap-8">
      {/* Sidebar with Filters */}
      <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
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
          <>
            <ProductsGrid
              nodes={displayNodes as any}
              className="mt-0"
            />

            <PaginationBar
              totalProducts={totalProducts}
              pageSize={pageSize}
              currentPage={currentPage}
            />
          </>
        ) : (
          <Empty description="No se encontraron productos en esta colección." />
        )}
      </div>
    </div>
  );
}

const CHILD_COLLECTION_QUERY = `#graphql
  query ChildCollectionDetails(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys!
    $reverse: Boolean
    $first: Int!
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
      }
    }
  }
  ${COMMON_PRODUCT_CARD_FRAGMENT}
` as const;

const PARENT_COLLECTION_QUERY = `#graphql
  query ParentCollectionForSubcollections(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      subcollections: metafield(namespace: "custom", key: "coleccion_hija") {
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
    }
  }
` as const;
