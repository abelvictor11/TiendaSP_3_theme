import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import type {Filter} from '@shopify/hydrogen/storefront-api-types';
import {getSeoMeta} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {routeHeaders} from '~/data/cache';
import {SortFilter} from '~/components/SortFilter';
import FiltersSidebar from '~/components/FiltersSidebar';
import {useSearchParams} from '@remix-run/react';
import type {ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {FILTER_URL_PREFIX} from '~/components/SortFilter';
import {PaginationBar} from '~/components/PaginationBar';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import PageHeader from '~/components/PageHeader';
import {getProductTotalByFilter} from '~/utils/getProductTotalByFilter';
import {Empty} from '~/components/Empty';
import {FireIcon} from '@heroicons/react/24/outline';
import {getPaginationAndFiltersFromRequest} from '~/utils/getPaginationAndFiltersFromRequest';
import {ProductsGrid} from '~/components/ProductsGrid';

export const headers = routeHeaders;

export async function loader({request, context}: LoaderFunctionArgs) {
  const locale = context.storefront.i18n;
  const PAGE_SIZE = 24;

  const {filters, sortKey, reverse, page} =
    getPaginationAndFiltersFromRequest(request, PAGE_SIZE);

  const fetchCount = page * PAGE_SIZE;

  const {collection} = await context.storefront.query(ALL_PRODUCTS_COLLECTION_QUERY, {
    variables: {
      first: fetchCount,
      handle: 'all',
      filters,
      sortKey,
      reverse,
      country: context.storefront.i18n.country,
      language: context.storefront.i18n.language,
    },
  });

  if (!collection) {
    throw new Response('Collection not found', {status: 404});
  }

  // Slice products to only the current page
  const startIndex = (page - 1) * PAGE_SIZE;
  const slicedNodes = collection.products.nodes.slice(startIndex, startIndex + PAGE_SIZE);

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      ...collection,
      title: 'Todos los productos',
      description: collection.description || 'Todos los productos de la tienda',
      seo: {
        title: 'Todos los productos',
        description: 'Todos los productos de la tienda',
      },
    },
  });

  const defaultPriceFilter = collection.productsWithDefaultFilter.filters.find(
    (filter: Filter) => filter.id === 'filter.v.price',
  );

  return defer({
    collection,
    products: slicedNodes,
    currentPage: page,
    pageSize: PAGE_SIZE,
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

export default function AllProducts() {
  const {collection, products, currentPage, pageSize, defaultPriceFilter} =
    useLoaderData<typeof loader>();

  const noResults = !products.length;

  // Get filtered total from the filtered products query
  const availabilityFilter = collection.products.filters.find(
    (filter: Filter) => filter.id === 'filter.v.availability',
  );
  const totalProducts = noResults
    ? 0
    : getProductTotalByFilter(availabilityFilter?.values as any);

  return (
    <div className="nc-PageCollection pb-20 lg:pb-28 xl:pb-32">
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
              title="Todos los productos"
              hasBreadcrumb={false}
              breadcrumbText="Todos los productos"
            />
          </div>

          <main>
            <AllProductsContent
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
    </div>
  );
}

function AllProductsContent({
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
            <ProductsGrid nodes={displayNodes as any} className="mt-0" />

            <PaginationBar
              totalProducts={totalProducts}
              pageSize={pageSize}
              currentPage={currentPage}
            />
          </>
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

const ALL_PRODUCTS_COLLECTION_QUERY = `#graphql
  query AllProductsCollection(
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
