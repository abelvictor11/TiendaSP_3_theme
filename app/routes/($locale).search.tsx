import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {Await, Link, useLoaderData, useSearchParams} from '@remix-run/react';
import {Analytics, getSeoMeta} from '@shopify/hydrogen';
import {seoPayload} from '~/lib/seo.server';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import {
  type SearchSortKeys,
  type Filter,
  type ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import {MagnifyingGlassIcon} from '~/components/Icons/MyIcons';
import {Empty} from '~/components/Empty';
import {SortFilter, FILTER_URL_PREFIX} from '~/components/SortFilter';
import FiltersSidebar from '~/components/FiltersSidebar';
import {RouteContent} from '~/sections/RouteContent';
import {getPaginationAndFiltersFromRequest} from '~/utils/getPaginationAndFiltersFromRequest';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {ProductsGrid} from '~/components/ProductsGrid';
import {PaginationBar} from '~/components/PaginationBar';
import {getProductTotalByFilter} from '~/utils/getProductTotalByFilter';
import {SearchAutocomplete} from '~/components/SearchAutocomplete';
import {Suspense} from 'react';

export async function loader({request, context, params}: LoaderFunctionArgs) {
  const {storefront} = context;

  // Query the route metaobject
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-search',
  });

  const searchParams = new URL(request.url).searchParams;
  const searchTerm = searchParams.get('q')! || '';

  const PAGE_SIZE = 24;
  const {filters, sortKey, reverse, page} =
    getPaginationAndFiltersFromRequest(request, PAGE_SIZE);

  // Fetch page * PAGE_SIZE products so we can slice to the current page
  const fetchCount = page * PAGE_SIZE;

  const [data, dataGetDefaultPriceFilter, searchSuggestionsData] = await Promise.all([
    storefront.query(SEARCH_QUERY, {
      variables: {
        searchTerm,
        first: fetchCount,
        filters,
        sortKey: sortKey as SearchSortKeys,
        reverse,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    }),
    storefront.query(SEARCH_QUERY_2, {
      variables: {
        searchTerm,
        country: storefront.i18n.country,
        language: storefront.i18n.language,
      },
    }),
    storefront.query(SEARCH_SUGGESTIONS_QUERY),
  ]);

  // Slice products to only the current page
  const startIndex = (page - 1) * PAGE_SIZE;
  const slicedNodes = data.search.nodes.slice(startIndex, startIndex + PAGE_SIZE);

  const defaultPriceFilter =
    dataGetDefaultPriceFilter.search.productFilters?.find(
      (filter) => filter.id === 'filter.v.price',
    );

  const seo = seoPayload.collection({
    url: request.url,
    collection: {
      id: 'search',
      title: 'Search',
      handle: 'search',
      descriptionHtml: 'Search results',
      description: 'Search results',
      seo: {
        title: 'Search',
        description: `Showing ${slicedNodes.length} search results for "${searchTerm}"`,
      },
      metafields: [],
      products: data.search,
      updatedAt: new Date().toISOString(),
    },
  });

  const searchSuggestions = searchSuggestionsData?.metaobject;

  return defer({
    routePromise,
    defaultPriceFilter: {
      value: defaultPriceFilter?.values[0] ?? null,
      locale: storefront.i18n,
    },
    data,
    seo,
    searchTerm,
    products: slicedNodes,
    currentPage: page,
    pageSize: PAGE_SIZE,
    searchSuggestions,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

// Parse search suggestions metaobject into a usable format
function parseSearchSuggestions(metaobject: any) {
  if (!metaobject?.fields) return null;

  const titleField = metaobject.fields.find((f: any) => f.key === 'title');
  const suggestionsField = metaobject.fields.find((f: any) => f.key === 'suggestions');

  const suggestions = suggestionsField?.references?.edges
    ?.map((edge: any) => {
      const node = edge.node;
      if (!node?.fields) return null;

      const label = node.fields.find((f: any) => f.key === 'label')?.value;
      const imageRef = node.fields.find((f: any) => f.key === 'image')?.reference?.image;
      const collectionRef = node.fields.find((f: any) => f.key === 'collection')?.reference;
      const customUrl = node.fields.find((f: any) => f.key === 'url')?.value;
      const sortOrder = node.fields.find((f: any) => f.key === 'sort_order')?.value;

      let href = collectionRef?.handle ? `/collections/${collectionRef.handle}` : null;
      if (customUrl) {
        // If it's an absolute URL, extract the path
        try {
          const url = new URL(customUrl);
          href = url.pathname;
        } catch {
          href = customUrl;
        }
      }

      return {
        id: node.id,
        label,
        image: imageRef,
        href,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 999,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [];

  return {
    title: titleField?.value || 'Explorar por categoría',
    suggestions,
  };
}

export default function Search() {
  const {searchTerm, data, products, currentPage, pageSize, defaultPriceFilter, routePromise, searchSuggestions} =
    useLoaderData<typeof loader>();
  const [params] = useSearchParams();
  const noResults = !products.length;
  const parsedSuggestions = parseSearchSuggestions(searchSuggestions);

  // Get total products from availability filter
  const availabilityFilter = (data.search.productFilters as Filter[])?.find(
    (filter) => filter.id === 'filter.v.availability',
  );
  const totalProducts = noResults
    ? 0
    : getProductTotalByFilter(availabilityFilter?.values as any);

  // Build applied filters from search params (same logic as collection page)
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

  const allFilterValues = (data.search.productFilters as Filter[])?.flatMap(
    (filter) => filter.values,
  ) || [];
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
    <div className={'page-search pb-20 lg:pb-28 xl:pb-32'}>
      <div className="nc-HeadBackgroundCommon h-24 2xl:h-28 top-0 left-0 right-0 w-full bg-primary-50 dark:bg-neutral-800/20" />

      <div className={'space-y-20 sm:space-y-24 lg:space-y-28'}>
        <div>
          <div className="container">
            <header className="max-w-2xl mx-auto -mt-10 flex flex-col lg:-mt-7">
              <SearchAutocomplete defaultValue={searchTerm} variant="page" />
            </header>
          </div>

          {/* Search Suggestions - Category Cards */}
          {parsedSuggestions && parsedSuggestions.suggestions.length > 0 && !searchTerm && (
            <div className="container pt-10 lg:pt-14">
              <h2 className="text-xl font-semibold mb-6">{parsedSuggestions.title}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {parsedSuggestions.suggestions.map((suggestion: any) => (
                  <Link
                    key={suggestion.id}
                    to={suggestion.href || '#'}
                    className="group block"
                  >
                    <div className="aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 mb-2">
                      {suggestion.image?.url ? (
                        <img
                          src={suggestion.image.url}
                          alt={suggestion.image.altText || suggestion.label}
                          width={suggestion.image.width || 300}
                          height={suggestion.image.height || 225}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400">
                          <MagnifyingGlassIcon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-primary-600 transition-colors">
                      {suggestion.label}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="container pt-10 lg:pt-14">
            {noResults ? (
              searchTerm ? (
                <Empty />
              ) : null
            ) : (
              <div className="flex gap-8">
                {/* Sidebar with Filters - Desktop only */}
                <div className="hidden lg:block lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-32px)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
                  <FiltersSidebar
                    filters={data.search.productFilters as Filter[]}
                    appliedFilters={appliedFilters}
                    defaultPriceFilter={defaultPriceFilter}
                  />
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Mobile Filters + Sort */}
                  <div className="lg:hidden mb-8">
                    <SortFilter
                      filters={data.search.productFilters as Filter[]}
                      defaultPriceFilter={defaultPriceFilter}
                      sorts={[
                        {label: 'Relevance', key: 'relevance'},
                        {label: 'Price: Low to High', key: 'price-low-high'},
                        {label: 'Price: High to Low', key: 'price-high-low'},
                      ]}
                    />
                  </div>

                  {/* Desktop Sort Only */}
                  <div className="hidden lg:flex justify-end mb-8">
                    <SortFilter
                      filters={[]}
                      defaultPriceFilter={defaultPriceFilter}
                      sorts={[
                        {label: 'Relevance', key: 'relevance'},
                        {label: 'Price: Low to High', key: 'price-low-high'},
                        {label: 'Price: High to Low', key: 'price-high-low'},
                      ]}
                    />
                  </div>

                  {/* Products Grid */}
                  <ProductsGrid nodes={products as any} className="mt-0" />

                  <PaginationBar
                    totalProducts={totalProducts}
                    pageSize={pageSize}
                    currentPage={currentPage}
                  />
                </div>
              </div>
            )}
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
                  className="space-y-20 sm:space-y-24 lg:space-y-28"
                  route={route}
                />
              </>
            )}
          </Await>
        </Suspense>
      </div>

      <Analytics.SearchView data={{searchTerm, searchResults: {nodes: products, pageInfo: {hasNextPage: false, hasPreviousPage: false}}}} />
    </div>
  );
}

const SEARCH_QUERY = `#graphql
  query PaginatedProductsSearch(
    $country: CountryCode
    $first: Int
    $language: LanguageCode
    $searchTerm: String!
    $filters: [ProductFilter!]
    $reverse: Boolean
    $sortKey: SearchSortKeys!
  ) @inContext(country: $country, language: $language) {
    search(
      first: $first,
      types: PRODUCT,
      query: $searchTerm,
      productFilters: $filters,
      sortKey: $sortKey,  
      reverse: $reverse  
    ) {
      productFilters {
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
        ... on Product {
          ...CommonProductCard
        }
      }
    }
  }

  ${COMMON_PRODUCT_CARD_FRAGMENT}

` as const;

const SEARCH_QUERY_2 = `#graphql
  query PaginatedProductsSearchForGetDefaultPriceFilter(
    $country: CountryCode
    $language: LanguageCode
    $searchTerm: String!
  ) @inContext(country: $country, language: $language) {
    search(
      first: 0,
      types: PRODUCT,
      query: $searchTerm,
      productFilters: {},
    ) {
      productFilters {
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
  }
` as const;

const SEARCH_SUGGESTIONS_QUERY = `#graphql
  query SearchSuggestions {
    metaobject(handle: {handle: "search-suggestions", type: "ciseco--search_suggestions"}) {
      fields {
        key
        value
        references(first: 20) {
          edges {
            node {
              ... on Metaobject {
                id
                handle
                fields {
                  key
                  value
                  reference {
                    ... on Collection {
                      id
                      handle
                      title
                    }
                    ... on MediaImage {
                      image {
                        url
                        altText
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
` as const;
