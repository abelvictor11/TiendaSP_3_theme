import {json, redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {type MetaArgs, useLoaderData} from '@remix-run/react';
import {getSeoMetaTags} from '~/lib/seoMeta';
import {routeHeaders} from '~/data/cache';
import {getCityBySlug} from '~/data/cities';
import {seoPayload} from '~/lib/seo.server';
import PageHeader from '~/components/PageHeader';
import {Link} from '~/components/Link';

export const headers = routeHeaders;

// Curated summary of the store's real top-level categories (verified live
// nav/footer handles on tienda-sportfitness.com). This is intentionally a
// short, hand-picked list rather than a full collections dump: the city
// page exists to signal "we serve this region across our real catalog",
// not to duplicate the storefront.
const CITY_PAGE_COLLECTION_HANDLES = [
  'cardio',
  'fuerza',
  'accesorios-para-gimnasio',
  'yoga',
  'boxeo-artes-marciales',
  'padel',
] as const;

export async function loader({params, request, context}: LoaderFunctionArgs) {
  // This page is hard-coded Spanish/Colombia content — not localized per
  // the ($locale) prefix like other routes. Unlike e.g. ($locale)._index.tsx,
  // which 404s only on prefixes that don't match the resolved storefront
  // locale (so valid country prefixes like /en-de fall through and render),
  // ANY locale prefix here — valid country/language pair or not — would
  // serve the same Spanish/Colombia content as a separate indexable
  // canonical URL. Redirect every prefixed variant to the historical
  // unprefixed URL instead of rendering a duplicate.
  if (params.locale) {
    return redirect(`/ciudad/${params.city}.html`, 301);
  }

  const city = getCityBySlug(params.city);

  if (!city) {
    throw new Response('Not found', {status: 404});
  }

  const {collections} = await context.storefront.query(
    CITY_PAGE_COLLECTIONS_QUERY,
    {
      variables: {
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
        query: CITY_PAGE_COLLECTION_HANDLES.map(
          (handle) => `handle:${handle}`,
        ).join(' OR '),
      },
    },
  );

  // Preserve our curated order (Storefront API doesn't guarantee it back)
  // and drop any handle that no longer resolves to a live collection.
  const orderedCollections = CITY_PAGE_COLLECTION_HANDLES.map((handle) =>
    collections.nodes.find(
      (node: {id: string; handle: string; title: string}) =>
        node.handle === handle,
    ),
  ).filter((node): node is NonNullable<typeof node> => Boolean(node));

  const seo = seoPayload.city({city, url: request.url});

  return json({city, collections: orderedCollections, seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMetaTags(matches.map((match) => (match.data as any).seo));
};

export default function CityPage() {
  const {city, collections} = useLoaderData<typeof loader>();

  return (
    <div className="page-ciudad pt-16 lg:pt-24 pb-20 lg:pb-28 xl:pb-32">
      <div className="container">
        <div className="max-w-screen-lg mx-auto space-y-10">
          <PageHeader
            title={`Equipos de Gimnasio en ${city.name}`}
            hasBreadcrumb
            breadcrumbText={city.name}
          />

          <p className="max-w-3xl text-neutral-600 dark:text-neutral-300">
            {city.paragraph}
          </p>

          {collections.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Categorías disponibles con envío a {city.name}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <Link
                    key={collection.id}
                    to={`/collections/${collection.handle}`}
                    className="block rounded-lg border border-neutral-200 p-4 font-medium transition-colors hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-500"
                  >
                    {collection.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const CITY_PAGE_COLLECTIONS_QUERY = `#graphql
  query CityPageCollections(
    $country: CountryCode
    $language: LanguageCode
    $query: String
  ) @inContext(country: $country, language: $language) {
    collections(first: 10, query: $query) {
      nodes {
        id
        handle
        title
      }
    }
  }
` as const;
