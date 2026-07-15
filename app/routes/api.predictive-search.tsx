import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({request, context}: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const searchTerm = url.searchParams.get('q') || '';

  if (searchTerm.length < 2) {
    return json({products: [], collections: []});
  }

  const {storefront} = context;

  const data = await storefront.query(PREDICTIVE_SEARCH_QUERY, {
    variables: {
      searchTerm,
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  const products = (data.products?.nodes || []).map((product: any) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    featuredImage: product.featuredImage,
    priceRange: product.priceRange,
    vendor: product.vendor,
  }));

  const collections = (data.collections?.nodes || []).map(
    (collection: any) => ({
      id: collection.id,
      title: collection.title,
      handle: collection.handle,
      image: collection.image,
    }),
  );

  return json({products, collections});
}

const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $searchTerm: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: 6, query: $searchTerm) {
      nodes {
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
    }
    collections(first: 4, query: $searchTerm) {
      nodes {
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
