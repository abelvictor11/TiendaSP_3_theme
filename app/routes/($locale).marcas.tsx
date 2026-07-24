import {
  json,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import {TagIcon} from '@heroicons/react/24/outline';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMetaTags} from '~/lib/seoMeta';
import {routeHeaders} from '~/data/cache';
import PageHeader from '~/components/PageHeader';
import {Link} from '~/components/Link';
import {getProductTotalByFilter} from '~/utils/getProductTotalByFilter';
import {normalizeBrandKey} from '~/utils/brandKey';
import {SECTION_BRANDS_TICKER_FRAGMENT} from '~/sections/SectionBrandsTicker';

export const headers = routeHeaders;

/**
 * Brand collections: sportfitness, movifit, evolution, ufc, inspire-fitness,
 * sole-fitness (created live in Shopify July 2026), plus csfitness and k6
 * (pre-existing collections, already live before this page was built —
 * included here too so this is a complete brand index, not just the newly
 * created ones). `collarines` is intentionally excluded — it's a product
 * category/tag (collars/leashes-style accessory grouping), not a brand,
 * so it doesn't belong on a brand-focused "Marcas" index. It's still a
 * normal collection and reachable at /collections/collarines.
 */
const BRAND_COLLECTIONS: Array<{handle: string; alias: string; title: string}> =
  [
    {handle: 'csfitness', alias: 'csfitness', title: 'CSfitness'},
    {handle: 'sportfitness', alias: 'sportfitness', title: 'Sportfitness'},
    {handle: 'evolution', alias: 'evolution', title: 'Evolution'},
    {handle: 'ufc', alias: 'ufc', title: 'UFC'},
    {handle: 'movifit', alias: 'movifit', title: 'MoviFit'},
    {handle: 'k6', alias: 'k6', title: 'K6'},
    {
      handle: 'inspire-fitness',
      alias: 'inspireFitness',
      title: 'Inspire Fitness',
    },
    {handle: 'sole-fitness', alias: 'soleFitness', title: 'Sole Fitness'},
  ];

export async function loader({
  request,
  context: {storefront},
}: LoaderFunctionArgs) {
  const {country, language} = storefront.i18n;

  const [collectionsData, brandLogosData] = await Promise.all([
    storefront.query(BRAND_COLLECTIONS_QUERY, {
      variables: {
        country,
        language,
        csfitness: 'csfitness',
        sportfitness: 'sportfitness',
        evolution: 'evolution',
        ufc: 'ufc',
        movifit: 'movifit',
        k6: 'k6',
        inspireFitness: 'inspire-fitness',
        soleFitness: 'sole-fitness',
      },
    }),
    // Reuse the exact same "route-home" -> brands ticker section query the
    // homepage carousel uses, so brand logo assets already uploaded to that
    // metaobject (CSFITNESS, Evolution, Sportfitness, UFC) aren't
    // re-uploaded or duplicated for this page — see SectionBrandsTicker.tsx.
    storefront.query(BRAND_LOGOS_QUERY, {
      variables: {country, language},
    }),
  ]);

  const brandLogoItems =
    brandLogosData?.route?.sections?.references?.nodes?.find(
      (node: any) => node.type === 'ciseco--section_brands_ticker',
    )?.brands?.references?.nodes ?? [];

  const logoByKey = new Map<
    string,
    {
      svgLogo?: string | null;
      imageUrl?: string | null;
      imageAlt?: string | null;
    }
  >();
  for (const item of brandLogoItems as any[]) {
    const name = item?.name?.value;
    if (!name) continue;
    logoByKey.set(normalizeBrandKey(name), {
      svgLogo: item?.svg_logo?.value,
      imageUrl: item?.image_logo?.reference?.image?.url,
      imageAlt: item?.image_logo?.reference?.image?.altText,
    });
  }

  const brands = BRAND_COLLECTIONS.map(({handle, alias, title}) => {
    const collection = (collectionsData as any)?.[alias];
    const logo = logoByKey.get(normalizeBrandKey(title));
    const count = getProductTotalByFilter(
      collection?.products?.filters?.[0]?.values,
    );

    return {
      handle,
      title: collection?.title || title,
      count,
      exists: Boolean(collection),
      svgLogo: logo?.svgLogo || null,
      imageUrl: logo?.imageUrl || null,
      imageAlt: logo?.imageAlt || title,
    };
  });

  const seo = seoPayload.brands({
    url: request.url,
    brands: brands
      .filter((brand) => brand.exists)
      .map(({handle, title}) => ({handle, title})),
  });

  return json({brands, seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMetaTags(matches.map((match) => (match?.data as any)?.seo));
};

export default function Marcas() {
  const {brands} = useLoaderData<typeof loader>();

  return (
    <div className="container pt-16 lg:pt-24 pb-20 lg:pb-28 xl:pb-32">
      <div className="space-y-14 lg:space-y-16">
        <PageHeader title="Marcas" hasBreadcrumb breadcrumbText="Marcas" />

        <div className="grid gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {brands.map((brand) => (
            <Link
              key={brand.handle}
              to={`/collections/${brand.handle}`}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6 text-center transition-shadow hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
            >
              <div className="flex h-16 w-full items-center justify-center">
                {brand.svgLogo ? (
                  <div
                    className="h-full w-full flex items-center justify-center opacity-80 transition-opacity group-hover:opacity-100 [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{__html: brand.svgLogo}}
                  />
                ) : brand.imageUrl ? (
                  <img
                    src={brand.imageUrl}
                    alt={brand.imageAlt || brand.title}
                    className="max-h-full max-w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950/40">
                    <TagIcon className="h-6 w-6 text-primary-600" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-base font-semibold text-secondary-800 dark:text-white">
                  {brand.title}
                </p>
                <p className="mt-1 text-sm text-neutral-500">
                  {brand.count > 0
                    ? `${brand.count} producto${brand.count === 1 ? '' : 's'}`
                    : 'Ver colección'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const BRAND_COLLECTIONS_QUERY = `#graphql
  query MarcasBrandCollections(
    $country: CountryCode
    $language: LanguageCode
    $csfitness: String!
    $sportfitness: String!
    $evolution: String!
    $ufc: String!
    $movifit: String!
    $k6: String!
    $inspireFitness: String!
    $soleFitness: String!
  ) @inContext(country: $country, language: $language) {
    csfitness: collection(handle: $csfitness) {
      ...MarcasCollectionItem
    }
    sportfitness: collection(handle: $sportfitness) {
      ...MarcasCollectionItem
    }
    evolution: collection(handle: $evolution) {
      ...MarcasCollectionItem
    }
    ufc: collection(handle: $ufc) {
      ...MarcasCollectionItem
    }
    movifit: collection(handle: $movifit) {
      ...MarcasCollectionItem
    }
    k6: collection(handle: $k6) {
      ...MarcasCollectionItem
    }
    inspireFitness: collection(handle: $inspireFitness) {
      ...MarcasCollectionItem
    }
    soleFitness: collection(handle: $soleFitness) {
      ...MarcasCollectionItem
    }
  }
  fragment MarcasCollectionItem on Collection {
    id
    handle
    title
    products(first: 0) {
      filters {
        values {
          input
          count
          label
        }
      }
    }
  }
` as const;

// Pulls the homepage's brands-ticker section so this page can reuse the
// exact same logo assets (svg_logo / image_logo) already configured there,
// instead of re-uploading duplicate image assets for this page.
const BRAND_LOGOS_QUERY = `#graphql
  query MarcasBrandLogos($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    route: metaobject(handle: {type: "ciseco--route", handle: "route-home"}) {
      sections: field(key: "sections") {
        references(first: 20) {
          nodes {
            ... on Metaobject {
              type
              ...SectionBrandsTicker
            }
          }
        }
      }
    }
  }
  ${SECTION_BRANDS_TICKER_FRAGMENT}
` as const;
