import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

// Filename is ($locale)-prefixed (not plain api.predictive-search) so a
// request to /en-gb/api/predictive-search resolves to this same loader with
// context.storefront.i18n already set to that market — server.ts derives
// i18n purely from the request path's first segment (getLocaleFromRequest),
// so an unprefixed route would always answer in the default market
// regardless of which one the caller is actually browsing.
export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('q') || '';

  if (searchTerm.length < 2) {
    return json({query: searchTerm, products: [], collections: []});
  }

  const {storefront} = context;

  const data = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      searchTerm,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const products = (data.predictiveSearch?.products || []).map(
    (product: any) => ({
      id: product.id,
      title: product.title,
      handle: product.handle,
      featuredImage: product.featuredImage,
      priceRange: product.priceRange,
      vendor: product.vendor,
    }),
  );

  const collections = (data.predictiveSearch?.collections || []).map(
    (collection: any) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      image: collection.image,
    }),
  );

  // Echoes the query back so the dropdown can tell a fresh response from a
  // stale one arriving after the user has already typed something else —
  // see the comparison in SearchAutocomplete.tsx.
  return json({query: searchTerm, products, collections});
}

// Uses the dedicated `predictiveSearch` field (not the generic `products`/
// `collections` query filters) so the dropdown shares the same matching and
// relevance engine as the full results page's `search` field on
// ($locale).search.tsx — otherwise the two surfaces rank/match differently
// for the same term.
//
// `searchableFields` is set explicitly because predictiveSearch's own default
// field set excludes VARIANTS_SKU/VARIANTS_BARCODE (unlike the `search` field
// used on the results page, whose default already includes them). Without
// this, searching an exact SKU/reference number returned zero results, and a
// partial numeric fragment (e.g. part of a SKU) would only match by loose
// substring against product TITLE text — surfacing unrelated products whose
// title happened to contain that digit sequence while completely missing the
// product that actually has that SKU. Verified directly against the
// Storefront API: query "60826-1042" (a real product's SKU) returned zero
// products before this fix, and the correct single product after.
//
// VARIANTS_TITLE is included alongside the new SKU/barcode fields because
// it's part of predictiveSearch's own default set — omitting it would drop
// products that only match through a variant option (e.g. a size or color
// like "S/M"), which worked before this change. Verified: query "S/M"
// without VARIANTS_TITLE silently dropped 3 real helmets that only match via
// their size variant; restored with VARIANTS_TITLE present.
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $searchTerm: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      query: $searchTerm,
      types: [PRODUCT, COLLECTION],
      limit: 6,
      limitScope: EACH,
      searchableFields: [TITLE, VARIANTS_TITLE, VARIANTS_SKU, VARIANTS_BARCODE, PRODUCT_TYPE, VENDOR, TAG]
    ) {
      products {
        id
        title
        handle
        vendor
        featuredImage {
          url
          altText
          width
          height
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      collections {
        id
        title
        handle
        image {
          url
          altText
          width
          height
        }
      }
    }
  }
` as const;
