import {Suspense, useState} from 'react';
import {
  defer,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, Await, useRouteLoaderData} from '@remix-run/react';
import {
  type VariantOption,
  Image,
  getSelectedProductOptions,
  Analytics,
  useOptimisticVariant,
  getAdjacentAndFirstAvailableVariants,
  useSelectedOptionInUrlParam,
  getProductOptions,
  type MappedProductOptions,
} from '@shopify/hydrogen';
import invariant from 'tiny-invariant';
import clsx from 'clsx';
import type {
  Maybe,
  ProductOptionValueSwatch,
  SelectedOption,
} from '@shopify/hydrogen/storefront-api-types';
import type {ProductFragment} from 'storefrontapi.generated';
import {ProductGallery} from '~/components/ProductGallery';
import {Skeleton} from '~/components/Skeleton';
import {Link} from '~/components/Link';
import {AddToCartButton} from '~/components/AddToCartButton';
import {seoPayload} from '~/lib/seo.server';
import type {Storefront} from '~/lib/type';
import {routeHeaders} from '~/data/cache';
import {MEDIA_FRAGMENT} from '~/data/fragments';
import Prices from '~/components/Prices';
import NcInputNumber from '~/components/NcInputNumber';
import Policy from '~/components/Policy';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import BagIcon from '~/components/BagIcon';
import {NoSymbolIcon} from '@heroicons/react/24/outline';
import {getProductStatus, ProductBadge} from '~/components/ProductCard';
import {useGetPublicStoreCdnStaticUrlFromRootLoaderData} from '~/hooks/useGetPublicStoreCdnStaticUrlFromRootLoaderData';
import ButtonSecondary from '~/components/Button/ButtonSecondary';
import LikeButton from '~/components/LikeButton';
import {
  OKENDO_PRODUCT_REVIEWS_FRAGMENT,
  OKENDO_PRODUCT_STAR_RATING_FRAGMENT,
  OkendoReviews,
  OkendoStarRating,
} from '@okendo/shopify-hydrogen';
import {COMMON_PRODUCT_CARD_FRAGMENT} from '~/data/commonFragments';
import {SnapSliderProducts} from '~/components/SnapSliderProducts';
import {RouteContent} from '~/sections/RouteContent';
import {getSeoMeta} from '@shopify/hydrogen';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import type {RootLoader} from '~/root';
import {useAside} from '~/components/Aside';
import {SlashIcon} from '@heroicons/react/24/solid';

export const headers = routeHeaders;

export async function loader(args: LoaderFunctionArgs) {
  const {params} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);

  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  return defer({...deferredData, ...criticalData});
}

async function loadCriticalData(args: LoaderFunctionArgs) {
  const {params, request, context} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  const selectedOptions = getSelectedProductOptions(request).filter(
    (option) =>
      // Filter out Shopify predictive search query params
      !option.name.startsWith('_sid') &&
      !option.name.startsWith('_pos') &&
      !option.name.startsWith('_psq') &&
      !option.name.startsWith('_ss') &&
      !option.name.startsWith('_v') &&
      // Filter out third party tracking params
      !option.name.startsWith('fbclid'),
  );

  if (!productHandle) {
    throw new Error('Expected product handle to be defined');
  }

  const [{shop, product}] = await Promise.all([
    context.storefront.query(PRODUCT_QUERY, {
      variables: {
        handle: productHandle,
        selectedOptions,
        country: context.storefront.i18n.country,
        language: context.storefront.i18n.language,
      },
    }),
  ]);

  if (!product?.id) {
    throw new Response('product', {status: 404});
  }

  const recommended = getRecommendedProducts(context.storefront, product.id);
  const selectedVariant = product.selectedOrFirstAvailableVariant ?? {};
  const variants = getAdjacentAndFirstAvailableVariants(product);

  const seo = seoPayload.product({
    product: {...product, variants},
    selectedVariant,
    url: request.url,
  });

  return {
    shop,
    variants,
    product,
    recommended,
    storeDomain: shop.primaryDomain.url,
    seo,
  };
}

function loadDeferredData(args: LoaderFunctionArgs) {
  const {params, request, context} = args;
  const {productHandle} = params;
  invariant(productHandle, 'Missing productHandle param, check route filename');

  // 3. Query the route metaobject
  const routePromise = getLoaderRouteFromMetaobject({
    params,
    context,
    request,
    handle: 'route-product',
  });

  return {
    routePromise,
  };
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Product() {
  const {product, shop, recommended, variants, routePromise, storeDomain} =
    useLoaderData<typeof loader>();
  const {media, outstanding_features, descriptionHtml, id} = product;
  const {shippingPolicy, refundPolicy, subscriptionPolicy} = shop;

  // Optimistically selects a variant with given available variant information
  const selectedVariant = useOptimisticVariant(
    product.selectedOrFirstAvailableVariant,
    variants,
  );
  // Sets the search param to the selected variant without navigation
  // only when no search params are set in the url
  useSelectedOptionInUrlParam(selectedVariant.selectedOptions);
  // Get the product options array
  const productOptions = getProductOptions({
    ...product,
    selectedOrFirstAvailableVariant: selectedVariant,
  });

  return (
    <div
      className={clsx(
        'product-page mt-5 lg:mt-10 pb-20 lg:pb-28 space-y-12 sm:space-y-16',
      )}
    >
      <main className="container">
        <div className="lg:flex">
          {/* Galleries */}
          <div className="w-full lg:w-[55%] relative">
            <ProductGallery
              media={media.nodes}
              className="w-full lg:col-span-2 lg:gap-7"
            />
            <LikeButton
              id={id}
              className="absolute top-3 end-3 z-10 !w-10 !h-10"
            />
          </div>

          {/* Product Details */}
          <div className="w-full lg:w-[45%] pt-10 lg:pt-0 lg:pl-7 xl:pl-9 2xl:pl-10">
            <div className="sticky top-10 grid gap-7 2xl:gap-8">
              <ProductForm
                productOptions={productOptions}
                selectedVariant={selectedVariant}
                storeDomain={storeDomain}
              />

              {/*  */}
              <hr className=" border-slate-200 dark:border-slate-700"></hr>
              {/*  */}

              {!!outstanding_features?.value && (
                <div>
                  <h2 className="text-sm font-medium text-gray-900">
                    Outstanding Features
                  </h2>
                  <div>
                    <div
                      className="prose prose-sm mt-4 text-gray-600"
                      dangerouslySetInnerHTML={{
                        __html: `<ul role="list"> 
                    ${(
                      JSON.parse(
                        outstanding_features?.value || '[]',
                      ) as string[]
                    )
                      .map((item: string) => `<li>${item}</li>`)
                      .join('')} 
                    </ul>`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* ---------- 6 ----------  */}
              <div>
                <Policy
                  shippingPolicy={shippingPolicy}
                  refundPolicy={refundPolicy}
                  subscriptionPolicy={subscriptionPolicy}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DETAIL AND REVIEW */}
        <div className="mt-12 sm:mt-16 space-y-12 sm:space-y-16">
          {/* Product description */}
          {!!descriptionHtml && (
            <div className="">
              <h2 className="text-2xl font-semibold">Product Details</h2>
              <div
                className="prose prose-sm sm:prose dark:prose-invert sm:max-w-4xl mt-7"
                dangerouslySetInnerHTML={{
                  __html: descriptionHtml || '',
                }}
              />
            </div>
          )}

          {/* PROduct reviews */}
          <ProductReviews product={product} />

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* OTHER SECTION */}
          <Suspense fallback={<div className="h-32" />}>
            <Await
              errorElement="There was a problem loading related products"
              resolve={recommended}
            >
              {(products) => (
                <>
                  <SnapSliderProducts
                    heading_bold={'Customers also purchased'}
                    products={products.nodes}
                    className=""
                    headingFontClass="text-2xl font-semibold"
                  />
                </>
              )}
            </Await>
          </Suspense>
        </div>
      </main>

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
                className="space-y-12 sm:space-y-16"
              />
            </>
          )}
        </Await>
      </Suspense>

      <Analytics.ProductView
        data={{
          products: [
            {
              id: product.id,
              title: product.title,
              price: selectedVariant?.price.amount || '0',
              vendor: product.vendor,
              variantId: selectedVariant?.id || '',
              variantTitle: selectedVariant?.title || '',
              quantity: 1,
            },
          ],
        }}
      />
    </div>
  );
}

export function ProductForm({
  productOptions,
  selectedVariant,
  storeDomain,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  storeDomain: string;
}) {
  const {open} = useAside();
  const {product} = useLoaderData<typeof loader>();
  const [quantity, setQuantity] = useState(1);

  const isOutOfStock = !selectedVariant?.availableForSale;

  const status = getProductStatus({
    availableForSale: !!selectedVariant?.availableForSale,
    compareAtPriceRangeMinVariantPrice:
      selectedVariant?.compareAtPrice || undefined,
    priceRangeMinVariantPrice: selectedVariant?.price,
    publishedAt: product.publishedAt,
  });

  const collection = product.collections.nodes[0];

  return (
    <>
      {/* ---------- HEADING ----------  */}
      <div>
        {!!collection && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              <li>
                <div className="flex items-center text-sm">
                  <Link
                    to={'/'}
                    className="font-medium text-gray-500 hover:text-gray-900"
                  >
                    Home
                  </Link>
                  <SlashIcon className="ml-2 h-5 w-5 flex-shrink-0 text-gray-300 " />
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm">
                  <Link
                    to={'/collections/' + collection.handle}
                    className="font-medium text-gray-500 hover:text-gray-900"
                  >
                    {/* romove html on title */}
                    {collection.title.replace(/(<([^>]+)>)/gi, '')}
                  </Link>
                </div>
              </li>
            </ol>
          </nav>
        )}
        <h1
          className="text-2xl sm:text-3xl font-semibold"
          title={product.title}
        >
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center mt-5 gap-4 lg:gap-5">
          <Prices
            contentClass="py-1 px-2 md:py-1.5 md:px-3 text-lg font-semibold"
            price={selectedVariant?.price}
            compareAtPrice={selectedVariant?.compareAtPrice}
          />

          {(status || product.reviews_rating_count) && (
            <div className="h-7 border-l border-slate-300 dark:border-slate-700 opacity-0 sm:opacity-100" />
          )}

          {/* Reviews */}
          <div className="flex items-center gap-2.5">
            {product?.okendoStarRatingSnippet ? (
              <>
                <OkendoStarRating
                  productId={product.id}
                  okendoStarRatingSnippet={product.okendoStarRatingSnippet}
                />
                {!!status && <span className="block">·</span>}
              </>
            ) : null}
            {!!status && (
              <>
                <ProductBadge className="" status={status} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ---------- VARIANTS AND COLORS LIST ----------  */}
      {productOptions.map((option, optionIndex) => (
        <div key={option.name}>
          {option.name === 'Color' ? (
            <ProductColorOption option={option} />
          ) : (
            <ProductOtherOption option={option} />
          )}
        </div>
      ))}

      {selectedVariant && (
        <div className="grid items-stretch gap-4">
          {isOutOfStock ? (
            <ButtonSecondary disabled>
              <NoSymbolIcon className="w-5 h-5" />
              <span className="ms-2">Sold out</span>
            </ButtonSecondary>
          ) : (
            <div className="flex gap-2 sm:gap-3.5 items-stretch">
              <div className="flex items-center justify-center bg-slate-100/70 dark:bg-slate-800/70 p-2 sm:p-3 rounded-full">
                <NcInputNumber
                  className=""
                  defaultValue={quantity}
                  onChange={setQuantity}
                />
              </div>
              <div className="flex-1 *:h-full *:flex">
                <AddToCartButton
                  lines={[
                    {
                      merchandiseId: selectedVariant.id!,
                      quantity,
                      selectedVariant,
                    },
                  ]}
                  className="w-full flex-1"
                  data-test="add-to-cart"
                  onClick={() => open('cart')}
                >
                  <ButtonPrimary
                    as="span"
                    className="w-full h-full flex items-center justify-center gap-3 "
                  >
                    <BagIcon className="hidden sm:inline-block w-5 h-5 mb-0.5" />
                    <span>Add to Cart</span>
                  </ButtonPrimary>
                </AddToCartButton>
              </div>
            </div>
          )}
          {/* {!isOutOfStock && (
            <ShopPayButton
              width="100%"
              className="rounded-full"
              variantIds={[selectedVariant?.id!]}
              storeDomain={storeDomain}
            />
          )} */}
        </div>
      )}
    </>
  );
}

const ProductOtherOption = ({option}: {option: MappedProductOptions}) => {
  if (!option.optionValues.length) {
    return null;
  }
  if (option.name === 'Title' && option.optionValues.length < 2) {
    return null;
  }

  return (
    <div>
      <div className="font-medium text-sm">{option.name}</div>
      <div className="flex flex-wrap gap-3 mt-3">
        {option.optionValues.map(
          ({
            name: value,
            variantUriQuery,
            selected: isActive,
            available: isAvailable,
            isDifferentProduct,
            handle,
          }) => {
            return (
              <Link
                key={option.name + value}
                {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
                to={`/products/${handle}?${variantUriQuery}`}
                preventScrollReset
                prefetch="intent"
                replace
                className={clsx(
                  'relative flex items-center justify-center rounded-md border py-3 px-5 sm:px-3 text-sm font-medium uppercase sm:flex-1 cursor-pointer focus:outline-none border-gray-200 ',
                  !isAvailable
                    ? isActive
                      ? 'opacity-90 text-opacity-80 cursor-not-allowed'
                      : 'text-opacity-20 cursor-not-allowed'
                    : 'cursor-pointer',
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-slate-100'
                    : 'border-slate-300 text-slate-900 hover:bg-neutral-50 ',
                )}
              >
                {!isAvailable && (
                  <span
                    className={clsx(
                      'absolute inset-[1px]',
                      isActive ? 'text-slate-100/60' : 'text-slate-300/60',
                    )}
                  >
                    <svg
                      className="absolute inset-0 h-full w-full stroke-1"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      stroke="currentColor"
                    >
                      <line
                        x1="0"
                        y1="100"
                        x2="100"
                        y2="0"
                        vectorEffect="non-scaling-stroke"
                      ></line>
                    </svg>
                  </span>
                )}
                {/* {!isAvailable && (
                <div
                  className={clsx(
                    'absolute -inset-x-0.5 border-t top-1/2 z-10 rotate-[28deg]',
                    isActive ? 'border-slate-400' : '',
                  )}
                />
              )} */}
                {value}
              </Link>
            );
          },
        )}
      </div>
    </div>
  );
};

const ProductColorOption = ({option}: {option: MappedProductOptions}) => {
  const {getImageWithCdnUrlByName} =
    useGetPublicStoreCdnStaticUrlFromRootLoaderData();

  if (!option.optionValues.length) {
    return null;
  }

  return (
    <div>
      <div className="text-sm font-medium">{option.name}</div>
      <div className="flex flex-wrap gap-3 mt-3">
        {option.optionValues.map(
          ({
            name: value,
            variantUriQuery,
            selected: isActive,
            available: isAvailable,
            isDifferentProduct,
            handle,
          }) => (
            <Link
              key={option.name + value}
              {...(!isDifferentProduct ? {rel: 'nofollow'} : {})}
              to={`/products/${handle}?${variantUriQuery}`}
              preventScrollReset
              prefetch="intent"
              replace
              className={clsx(
                'relative w-8 h-8 md:w-9 md:h-9 rounded-full',
                isActive ? 'ring ring-offset-1 ring-primary-500/60' : '',
                !isAvailable && 'opacity-50 cursor-not-allowed',
              )}
              title={value}
            >
              <span className="sr-only">{value}</span>

              <div className="absolute inset-0.5 rounded-full overflow-hidden z-0">
                <Image
                  data={{
                    url: getImageWithCdnUrlByName(value.replaceAll(/ /g, '_')),
                    altText: value,
                    width: 36,
                    height: 36,
                  }}
                  width={36}
                  height={36}
                  sizes="(max-width: 640px) 36px, 40px"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>

              {!isAvailable && (
                <div className="absolute inset-x-1 border-t border-dashed top-1/2 rotate-[-30deg]" />
              )}
            </Link>
          ),
        )}
      </div>
    </div>
  );
};

function ProductOptionSwatch({
  swatch,
  name,
}: {
  swatch?: Maybe<ProductOptionValueSwatch> | undefined;
  name: string;
}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return name;
  return (
    <div
      aria-label={name}
      className="w-8 h-8"
      style={{
        backgroundColor: color || 'transparent',
      }}
    >
      {!!image && <img src={image} alt={name} />}
    </div>
  );
}

const ProductReviews = ({product}: {product: ProductFragment}) => {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const publicOkendoSubcriberId = rootData?.publicOkendoSubcriberId;

  if (!product?.id || !publicOkendoSubcriberId) {
    return null;
  }

  return (
    <>
      <hr className="border-slate-200 dark:border-slate-700" />

      <div className="product-page__reviews scroll-mt-nav" id="reviews">
        {/* HEADING */}
        {product?.okendoReviewsSnippet ? (
          <h2 className="text-2xl font-semibold text-center sm:text-left">
            <span>Reviews</span>
          </h2>
        ) : null}

        <div className="product-page__reviews-widget">
          <OkendoReviews
            productId={product?.id}
            okendoReviewsSnippet={product?.okendoReviewsSnippet}
          />
        </div>
      </div>
    </>
  );
};

export const PRODUCT_VARIANT_FRAGMENT = `#graphql
  fragment ProductVariant on ProductVariant {
    id
    availableForSale
    selectedOptions {
      name
      value
    }
    image {
      id
      url
      altText
      width
      height
    }
    price {
      amount
      currencyCode
    }
    compareAtPrice {
      amount
      currencyCode
    }
    sku
    title
    unitPrice {
      amount
      currencyCode
    }
    product {
      title
      handle
    }
  }
`;

const PRODUCT_FRAGMENT = `#graphql
  fragment Product on Product {
    id
      title
      vendor
      handle
      descriptionHtml
      description
      publishedAt
      encodedVariantExistence
      encodedVariantAvailability
      collections(first: 1) {
        nodes {
          id
          title
          handle
        }
      }
      reviews_rating_count: metafield(namespace: "reviews", key:"rating_count") {
        id
        value
        namespace
        key
      }
      reviews_rating: metafield(namespace: "reviews", key:"rating") {
        id
        value
        namespace
        key
      }
      outstanding_features: metafield(namespace: "ciseco--product", key:"outstanding_features") {
        id
        value
        namespace
        key
      }
      options {
        name
        optionValues {
          name
          firstSelectableVariant {
            ...ProductVariant
          }
          swatch {
            color
            image {
              previewImage {
                url
              }
            }
          }
        }
      }
      selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
        ...ProductVariant
      }
      adjacentVariants (selectedOptions: $selectedOptions) {
        ...ProductVariant
      }
      media(first: 7) {
        nodes {
          ...Media
        }
      }
      # variants(first: 1) {
      #   nodes {
      #     ...ProductVariant
      #   }
      # }
      seo {
        description
        title
      }
      ...OkendoStarRatingSnippet
		  ...OkendoReviewsSnippet
  }
  ${PRODUCT_VARIANT_FRAGMENT}
  ${OKENDO_PRODUCT_STAR_RATING_FRAGMENT}
	${OKENDO_PRODUCT_REVIEWS_FRAGMENT}
` as const;

export const PRODUCT_QUERY = `#graphql
  query Product(
    $country: CountryCode
    $language: LanguageCode
    $handle: String!
    $selectedOptions: [SelectedOptionInput!]!
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...Product
    }
    shop {
      name
      primaryDomain {
        url
      }
      shippingPolicy {
        handle
      }
      refundPolicy {
        handle
      }
      subscriptionPolicy {
        handle
      }
    }
  }
  ${MEDIA_FRAGMENT}
  ${PRODUCT_FRAGMENT}
` as const;

const RECOMMENDED_PRODUCTS_QUERY = `#graphql
  query productRecommendations(
    $productId: ID!
    $count: Int
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    recommended: productRecommendations(productId: $productId) {
      ...CommonProductCard
    }
    additional: products(first: $count, sortKey: BEST_SELLING) {
      nodes {
        ...CommonProductCard
      }
    }
  }
  ${COMMON_PRODUCT_CARD_FRAGMENT}
` as const;

async function getRecommendedProducts(
  storefront: Storefront,
  productId: string,
) {
  const products = await storefront.query(RECOMMENDED_PRODUCTS_QUERY, {
    variables: {productId, count: 12},
  });

  invariant(products, 'No data returned from Shopify API');

  const mergedProducts = (products.recommended ?? [])
    .concat(products.additional.nodes)
    .filter(
      (value, index, array) =>
        array.findIndex((value2) => value2.id === value.id) === index,
    );

  const originalProduct = mergedProducts.findIndex(
    (item) => item.id === productId,
  );

  mergedProducts.splice(originalProduct, 1);

  return {nodes: mergedProducts};
}
