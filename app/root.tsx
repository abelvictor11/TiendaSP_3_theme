import {
  type AppLoadContext,
  defer,
  type LinksFunction,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
  type ShouldRevalidateFunction,
  useRouteLoaderData,
} from '@remix-run/react';
import {
  useNonce,
  getSeoMeta,
  Analytics,
  getShopAnalytics,
} from '@shopify/hydrogen';
import {Layout} from '~/components/Layout';
import {seoPayload} from '~/lib/seo.server';
import {storeConfig} from '~/config/store';
import {GenericError} from './components/GenericError';
import {NotFound} from './components/NotFound';
import styles from './styles/app.css?url';
import stylesFont from './styles/custom-font.css?url';
import {DEFAULT_LOCALE} from './lib/utils';
import rcSliderStyle from 'rc-slider/assets/index.css?url';
import {COMMON_COLLECTION_ITEM_FRAGMENT} from './data/commonFragments';
import {OkendoProvider, getOkendoProviderData} from '@okendo/shopify-hydrogen';
import invariant from 'tiny-invariant';

// This is important to avoid re-fetching root queries on sub-navigations
export const shouldRevalidate: ShouldRevalidateFunction = ({
  formMethod,
  currentUrl,
  nextUrl,
}) => {
  // revalidate when a mutation is performed e.g add to cart, login...
  if (formMethod && formMethod !== 'GET') {
    return true;
  }

  // revalidate when manually revalidating via useRevalidator
  if (currentUrl.toString() === nextUrl.toString()) {
    return true;
  }

  return false;
};

/**
 * The link to the main stylesheet is purposely not in this list. Instead, it is added
 * in the Layout function.
 *
 * This is to avoid a development bug where after an edit/save, navigating to another
 * link will cause page rendering error "failed to execute 'insertBefore' on 'Node'".
 *
 * This is a workaround until this is fixed in the foundational library.
 */
export const links: LinksFunction = () => {
  return [
    {rel: 'preconnect', href: 'https://cdn.shopify.com'},
    {rel: 'preconnect', href: 'https://shop.app'},
    {rel: 'preconnect', href: 'https://fonts.googleapis.com'},
    {rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const},
    {rel: 'preconnect', href: 'https://use.typekit.net'},
    {rel: 'icon', href: storeConfig.faviconUrl},
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const {env} = args.context;

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  //
  return defer({
    ...deferredData,
    ...criticalData,

    /**********  EXAMPLE UPDATE STARTS  ************/
    env,
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    publicStoreSubdomain: env.PUBLIC_SHOPIFY_STORE_DOMAIN,
    publicStoreCdnStaticUrl: env.PUBLIC_STORE_CDN_STATIC_URL,
    publicImageFormatForProductOption:
      env.PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION,
    publicOkendoSubcriberId: env.PUBLIC_OKENDO_SUBSCRIBER_ID,
    /**********   EXAMPLE UPDATE END   ************/
  });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({request, context}: LoaderFunctionArgs) {
  const [layout, okendoProviderData] = await Promise.all([
    getLayoutData(context),
    getOkendoProviderData({
      context,
      subscriberId: context.env.PUBLIC_OKENDO_SUBSCRIBER_ID,
    }),
    // Add other queries here, so that they are loaded in parallel
  ]);

  const seo = seoPayload.root({shop: layout.shop, url: request.url});
  const {storefront, env} = context;

  return {
    layout,
    seo,
    shop: getShopAnalytics({
      storefront: context.storefront,
      publicStorefrontId: env.PUBLIC_STOREFRONT_ID,
    }),
    consent: {
      checkoutDomain: env.PUBLIC_CHECKOUT_DOMAIN,
      storefrontAccessToken: env.PUBLIC_STOREFRONT_API_TOKEN,
      withPrivacyBanner: true,
    },
    selectedLocale: storefront.i18n,
    okendoProviderData,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const {cart, customerAccount, storefront} = context;
  const isLoggedInPromise = customerAccount.isLoggedIn();
  const {language, country} = storefront.i18n;

  // Load the header, footer and layout data in parallel
  const headerPromise = storefront.query(HEADER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      featuredCollectionsFirst: 1,
      socialsFirst: 10,
      headerMenuHandle: 'menu-header',
      ultraMenuHandle: 'ultra-menu',
      language,
      country,
    },
  });
  const footerPromise = storefront.query(FOOTER_QUERY, {
    cache: storefront.CacheLong(),
    variables: {
      footerMenuHandle: 'footer',
      language,
      country,
    },
  });

  return {
    isLoggedIn: isLoggedInPromise,
    isLoggedInPromise,
    cart: cart.get(),
    headerPromise,
    footerPromise,
  };
}

export type RootLoader = typeof loader;

export const meta: MetaFunction<RootLoader> = ({data, matches}) => {
  // Pass one or more arguments, preserving properties from parent routes
  return getSeoMeta(...matches.map((match) => (match?.data as any)?.seo));
};

function MainLayout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;

  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="msvalidate.01" content="A352E6A0AF9A652267361BBB572B8468" />
        {data ? (
          <meta
            name="oke:subscriber_id"
            content={data.publicOkendoSubcriberId}
          />
        ) : null}
        <link rel="stylesheet" href={styles}></link>
        <link rel="stylesheet" href={stylesFont}></link>
        <link rel="stylesheet" href={rcSliderStyle}></link>
        <link rel="stylesheet" href="https://use.typekit.net/nfu3xaw.css"></link>

        <Meta />
        <Links />
      </head>
      <body className="bg-white">
        {data ? (
          <>
            <OkendoProvider
              nonce={nonce}
              okendoProviderData={data.okendoProviderData}
            />
            <Analytics.Provider
              cart={data.cart}
              shop={data.shop}
              consent={data.consent}
            >
              <Layout
                key={`${locale.language}-${locale.country}`}
                layout={data.layout}
              >
                {children}
              </Layout>
            </Analytics.Provider>
          </>
        ) : (
          children
        )}

        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

export function ErrorBoundary({error}: {error: Error}) {
  const nonce = useNonce();
  const routeError = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  let title = 'Error';
  let pageType = 'page';

  if (isRouteError) {
    title = 'Not found';
    if (routeError.status === 404) pageType = routeError.data || pageType;
  }

  return (
    <MainLayout>
      <>
        {isRouteError ? (
          <>
            {routeError.status === 404 ? (
              <NotFound type={pageType} />
            ) : (
              <GenericError
                error={{message: `${routeError.status} ${routeError.data}`}}
              />
            )}
          </>
        ) : (
          <GenericError error={error instanceof Error ? error : undefined} />
        )}
      </>
    </MainLayout>
  );
}

const MENU_FRAGMENT = `#graphql
  fragment MenuItem on MenuItem {
    id
    resourceId
    tags
    title
    type
    url
  }
  fragment ChildMenuItem on MenuItem {
    ...MenuItem
  }
  fragment ParentMenuItem on MenuItem {
    ...MenuItem
    items {
      ...ChildMenuItem
    }
  }
  fragment Menu on Menu {
    id
    title
    items {
      ...ParentMenuItem
    }
  }
` as const;

const LAYOUT_QUERY = `#graphql
  query layout(
    $language: LanguageCode
    $country: CountryCode
  ) @inContext(language: $language, country: $country) {
    shop {
      ...Shop
    }
  }
  fragment Shop on Shop {
    id
    name
    description
    primaryDomain {
      url
    }
    brand {
      logo {
        image {
          url
          width
          height
        }
      }
      squareLogo {
        image {
          altText
          height
          width
          url
        }
      }
    }
  }
` as const;

const FOOTER_QUERY = `#graphql
  query FooterMenu(
    $language: LanguageCode
    $country: CountryCode
    $footerMenuHandle: String!
  ) @inContext(language: $language, country: $country) {
    footerMenu: menu(handle: $footerMenuHandle) {
      ...Menu
    }
  }
  ${MENU_FRAGMENT}
` as const;

const HEADER_QUERY = `#graphql
  query HeaderMenu(
    $language: LanguageCode
    $country: CountryCode
    $headerMenuHandle: String!
    $ultraMenuHandle: String!
    $featuredCollectionsFirst: Int!
    $socialsFirst: Int!
  ) @inContext(language: $language, country: $country) {
    headerMenu: menu(handle: $headerMenuHandle) {
      ...Menu
    }
    ultraMenu: menu(handle: $ultraMenuHandle) {
      ...Menu
    }
    featuredCollections: collections(first: $featuredCollectionsFirst, sortKey: UPDATED_AT) {
      nodes {
        ...CommonCollectionItem
      }
    }
    socials: metaobjects(type: "ciseco--social", first: $socialsFirst) {
      edges {
        node {
          type
          id
          handle
          title: field(key: "title") {
            type
            key
            value
          }
          description: field(key: "description") {
            type
            key
            value
          }
          icon: field(key: "icon") {
            type
            key
            reference {
              ... on MediaImage {
                image {
                  altText
                  url
                  width
                  height
                }
              }
            }
          }
          link: field(key: "link") {
            type
            key
            value
          }
        }
      }
    }
    brands: metaobjects(type: "ciseco--brand", first: 50) {
      nodes {
        id
        handle
        name: field(key: "name") {
          value
        }
        slug: field(key: "slug") {
          value
        }
        logo: field(key: "logo") {
          reference {
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
    topBarMarquee: metaobjects(type: "ciseco--top_bar_marquee", first: 1) {
      nodes {
        id
        handle
        text_content: field(key: "text_content") {
          value
        }
        background_color: field(key: "background_color") {
          value
        }
        text_color: field(key: "text_color") {
          value
        }
        speed: field(key: "speed") {
          value
        }
        enabled: field(key: "enabled") {
          value
        }
        separator_icon: field(key: "separator_icon") {
          value
        }
      }
    }
    headerQuickLinks: metaobjects(type: "ciseco--header_quick_links", first: 1) {
      nodes {
        id
        handle
        enabled: field(key: "enabled") {
          value
        }
        items: field(key: "items") {
          references(first: 5) {
            nodes {
              ... on Metaobject {
                id
                svg_icon: field(key: "svg_icon") {
                  value
                }
                link: field(key: "link") {
                  value
                }
                label: field(key: "label") {
                  value
                }
                icon_color: field(key: "icon_color") {
                  value
                }
                text_color: field(key: "text_color") {
                  value
                }
                background_color: field(key: "background_color") {
                  value
                }
                border_color: field(key: "border_color") {
                  value
                }
                subitems: field(key: "subitems") {
                  references(first: 10) {
                    nodes {
                      ... on Metaobject {
                        id
                        label: field(key: "label") {
                          value
                        }
                        link: field(key: "link") {
                          value
                        }
                        svg_icon: field(key: "svg_icon") {
                          value
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
    megamenuConfigs: metaobjects(type: "ciseco--megamenu_config", first: 20) {
      nodes {
        id
        handle
        menu_item_title: field(key: "menu_item_title") {
          value
        }
        banner_image: field(key: "banner_image") {
          reference {
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
        banner_title: field(key: "banner_title") {
          value
        }
        banner_text: field(key: "banner_text") {
          value
        }
        banner_cta_text: field(key: "banner_cta_text") {
          value
        }
        banner_cta_link: field(key: "banner_cta_link") {
          value
        }
        footer_text: field(key: "footer_text") {
          value
        }
        footer_link: field(key: "footer_link") {
          value
        }
        resources_title: field(key: "resources_title") {
          value
        }
        resources_link: field(key: "resources_link") {
          value
        }
        sections: field(key: "sections") {
          references(first: 10) {
            nodes {
              ... on Metaobject {
                id
                handle
                title: field(key: "title") {
                  value
                }
                columns: field(key: "columns") {
                  value
                }
                items: field(key: "items") {
                  references(first: 20) {
                    nodes {
                      ... on Metaobject {
                        id
                        title: field(key: "title") {
                          value
                        }
                        description: field(key: "description") {
                          value
                        }
                        link: field(key: "link") {
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        brands_title: field(key: "brands_title") {
          value
        }
        featured_brands: field(key: "featured_brands") {
          references(first: 20) {
            nodes {
              ... on Metaobject {
                id
                name: field(key: "name") {
                  value
                }
                logo: field(key: "logo") {
                  reference {
                    ... on MediaImage {
                      image {
                        url
                        altText
                        width
                        height
                      }
                    }
                    ... on GenericFile {
                      url
                    }
                  }
                }
                link: field(key: "link") {
                  value
                }
              }
            }
          }
        }
      }
    }
  }
  ${MENU_FRAGMENT}
  ${COMMON_COLLECTION_ITEM_FRAGMENT}
` as const;

async function getLayoutData({storefront, env}: AppLoadContext) {
  const data = await storefront.query(LAYOUT_QUERY, {
    variables: {
      country: storefront.i18n.country,
      language: storefront.i18n.language,
    },
  });

  invariant(data, 'No data returned from Shopify API');

  return data;
}
