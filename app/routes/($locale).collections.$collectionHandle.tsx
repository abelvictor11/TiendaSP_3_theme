import {
  defer,
  redirect,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {
  Await,
  useLoaderData,
  Link,
  useRouteError,
  isRouteErrorResponse,
  useSearchParams,
  useLocation,
} from '@remix-run/react';
import type {
  Filter,
  ProductFilter,
} from '@shopify/hydrogen/storefront-api-types';
import {Analytics} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMetaTags} from '~/lib/seoMeta';
import {SortFilter, FILTER_URL_PREFIX} from '~/components/SortFilter';
import FiltersSidebar from '~/components/FiltersSidebar';
import {PaginationBar} from '~/components/PaginationBar';
import {
  COLLECTION_PAGE_SIZE,
  loadCollectionPage,
} from '~/utils/loadCollectionPage';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {RouteContent} from '~/sections/RouteContent';
import PageHeader from '~/components/PageHeader';
import {Empty} from '~/components/Empty';
import {FireIcon} from '@heroicons/react/24/outline';
import {getPaginationAndFiltersFromRequest} from '~/utils/getPaginationAndFiltersFromRequest';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {getLegacyRedirectTarget} from '~/lib/legacyRedirects.server';
import {ProductsGrid} from '~/components/ProductsGrid';
import clsx from 'clsx';
import {Suspense, useState} from 'react';
import {GenericError} from '~/components/GenericError';
import {NotFound} from '~/components/NotFound';

export const headers = routeHeaders;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  const {collectionHandle} = params;
  const locale = context.storefront.i18n;

  invariant(collectionHandle, 'Missing collectionHandle param');

  // Query the route metaobject
  // .catch() — sin esto, un error transitorio aquí es una promesa dentro de
  // defer() sin manejar, que se propaga como unhandled rejection hasta el
  // ErrorBoundary de root.tsx en vez de degradar a "sin secciones extra" (ver
  // mismo fix en products.$productHandle.tsx, confirmado reproducible en
  // cyclewear 2026-07-22).
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-collection',
  }).catch(() => ({route: null}));

  const {filters, sortKey, reverse, page} = getPaginationAndFiltersFromRequest(
    request,
    COLLECTION_PAGE_SIZE,
  );

  let pageResult;
  try {
    pageResult = await loadCollectionPage({
      storefront: context.storefront,
      handle: collectionHandle,
      collectionQuery: COLLECTION_QUERY,
      filters,
      sortKey,
      reverse,
      page,
    });
  } catch (error) {
    if (error instanceof Response && error.status === 404) {
      const target = getLegacyRedirectTarget(new URL(request.url).pathname);
      if (target) return redirect(target, 301);
    }
    throw error;
  }
  const {collection, products, currentPage, pageSize, totalProducts} =
    pageResult;

  const seo = seoPayload.collection({collection, url: request.url});

  const defaultPriceFilter = collection.productsWithDefaultFilter.filters.find(
    (filter: Filter) => filter.id === 'filter.v.price',
  );

  return defer({
    routePromise,
    collection,
    products,
    currentPage,
    pageSize,
    totalProducts,
    defaultPriceFilter: {
      value: defaultPriceFilter?.values[0] ?? null,
      locale,
    },
    seo,
  });
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMetaTags(matches.map((match) => (match?.data as any)?.seo));
};

export default function Collection() {
  const {
    collection,
    products,
    currentPage,
    pageSize,
    totalProducts,
    defaultPriceFilter,
    routePromise,
  } = useLoaderData<typeof loader>();

  const noResults = !products.length;

  // Get subcollections from metafield
  const subcollections = collection.subcollections?.references?.nodes || [];

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
                to={`/collections/${collection.handle}`}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full bg-[#e5f7fd] dark:bg-white dark:text-slate-900"
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
                {totalProducts} productos
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

      {/* 3. Render the route's content sections */}
      <Suspense fallback={<div className="h-32" />}>
        <Await
          errorElement="Hubo un problema al cargar el contenido de la página"
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
          <SortFilter filters={[]} defaultPriceFilter={defaultPriceFilter} />
        </div>

        {/* Products Grid */}
        {!noResults ? (
          <>
            <ProductsGrid
              nodes={
                (isOnSaleFilter
                  ? products.filter((product: any) => {
                      const compareAt =
                        product.compareAtPriceRange?.minVariantPrice?.amount;
                      const price = product.priceRange?.minVariantPrice?.amount;
                      return (
                        compareAt && price && Number(compareAt) > Number(price)
                      );
                    })
                  : products) as any
              }
              className="mt-0"
            />
            <PaginationBar
              totalProducts={totalProducts}
              pageSize={pageSize}
              currentPage={currentPage}
            />
            {collection.textBelow?.value && (
              <CollectionSeoText richTextJson={collection.textBelow.value} />
            )}
          </>
        ) : (
          <Empty />
        )}

        {/* SEO Text Below (when no results) */}
        {noResults && collection.textBelow?.value && (
          <CollectionSeoText richTextJson={collection.textBelow.value} />
        )}
      </div>
    </div>
  );
}

// Component to render SEO text with truncation
function CollectionSeoText({richTextJson}: {richTextJson: string}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Parse rich text JSON to HTML
  let htmlContent = '';
  try {
    const richText = JSON.parse(richTextJson);
    if (richText && richText.children) {
      htmlContent = richText.children
        .map((node: any) => {
          if (node.type === 'paragraph') {
            const content = node.children
              ?.map((child: any) => {
                if (child.type === 'text') {
                  let text = child.value || '';
                  if (child.bold) text = `<strong>${text}</strong>`;
                  if (child.italic) text = `<em>${text}</em>`;
                  return text;
                }
                if (child.type === 'link') {
                  const linkText = child.children?.map((c: any) => c.value).join('') || '';
                  return `<a href="${child.url}" class="text-primary-600 hover:underline">${linkText}</a>`;
                }
                return '';
              })
              .join('');
            return `<p>${content}</p>`;
          }
          if (node.type === 'heading') {
            const level = node.level || 2;
            const content = node.children?.map((c: any) => c.value).join('') || '';
            return `<h${level} class="text-lg font-semibold mt-4 mb-2">${content}</h${level}>`;
          }
          if (node.type === 'list') {
            const tag = node.listType === 'ordered' ? 'ol' : 'ul';
            const items = node.children
              ?.map((item: any) => {
                const itemContent = item.children
                  ?.map((c: any) => {
                    if (c.type === 'text') return c.value;
                    if (c.type === 'paragraph') {
                      return c.children?.map((pc: any) => pc.value).join('') || '';
                    }
                    return '';
                  })
                  .join('');
                return `<li>${itemContent}</li>`;
              })
              .join('');
            return `<${tag} class="list-disc list-inside space-y-1">${items}</${tag}>`;
          }
          return '';
        })
        .join('');
    } else {
      htmlContent = richTextJson;
    }
  } catch {
    htmlContent = richTextJson;
  }

  // Strip HTML to count characters
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  const maxChars = 300;
  const needsTruncation = textContent.length > maxChars;

  // Truncate text for display
  const truncatedText = needsTruncation && !isExpanded
    ? textContent.slice(0, maxChars) + '...'
    : null;

  return (
    <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
      <div className="max-w-4xl">
        {truncatedText ? (
          <div className="prose prose-sm dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300">
            <p>{truncatedText}</p>
          </div>
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-neutral-600 dark:text-neutral-300"
            dangerouslySetInnerHTML={{__html: htmlContent}}
          />
        )}

        {needsTruncation && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 underline underline-offset-2"
          >
            {isExpanded ? 'Ver menos' : 'Ver más'}
          </button>
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
    $first: Int!
    $after: String
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
      textBelow: metafield(namespace: "custom", key: "text_below") {
        value
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
        after: $after,
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

export function ErrorBoundary() {
  const error = useRouteError();

  // El loader lanza throw new Response('collection', {status: 404}) para
  // handles desconocidos — sin este check, este boundary lo interceptaba
  // ANTES de que el boundary de root.tsx pudiera renderizar el NotFound
  // real, mostrando el genérico "No pudimos cargar esta colección" en vez
  // del 404 esperado (encontrado por Codex en PR #77).
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFound type={error.data || 'collection'} />;
    }
    return (
      <GenericError
        heading="No pudimos cargar esta colección."
        description={
          typeof error.data === 'string' && error.data
            ? error.data
            : undefined
        }
      />
    );
  }

  return (
    <GenericError
      heading="No pudimos cargar esta colección."
      error={error instanceof Error ? error : undefined}
    />
  );
}
