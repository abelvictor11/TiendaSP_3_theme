import {
  type AppLoadContext,
  defer,
  redirect,
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
import {useNonce, Analytics, getShopAnalytics} from '@shopify/hydrogen';
import {Layout} from '~/components/Layout';
import {CustomAnalytics} from '~/components/CustomAnalytics';
import {GtmLoader} from '~/components/GtmLoader';
import {RudderStackLoader} from '~/components/RudderStackLoader';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMetaTags} from '~/lib/seoMeta';
import {storeConfig} from '~/config/store';
import {GenericError} from './components/GenericError';
import {NotFound} from './components/NotFound';
import styles from './styles/app.css?url';
import stylesFont from './styles/custom-font.css?url';
import {DEFAULT_LOCALE, stripLocalePrefix} from './lib/utils';
import rcSliderStyle from 'rc-slider/assets/index.css?url';
import {
  COMMON_COLLECTION_ITEM_FRAGMENT,
  COMMON_PRODUCT_CARD_FRAGMENT,
} from './data/commonFragments';
import {OkendoProvider, getOkendoProviderData} from '@okendo/shopify-hydrogen';
import invariant from 'tiny-invariant';
import {getFreeShippingThreshold} from '~/lib/shipping.server';

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
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous' as const,
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap',
    },
    {rel: 'icon', href: storeConfig.faviconUrl},
  ];
};

export async function loader(args: LoaderFunctionArgs) {
  const {env} = args.context;

  // Only the default (unprefixed) locale is a real market -- Shopify Admin
  // has exactly one enabled Market (Colombia, COP). The 38 /en-XX prefixes
  // in app/data/countries.ts are unused Hydrogen boilerplate; redirect any
  // request that hits one (stray link, bookmark, crawler) straight to the
  // unprefixed URL rather than rendering a market that doesn't exist.
  const requestUrl = new URL(args.request.url);
  const strippedPathname = stripLocalePrefix(requestUrl.pathname);
  if (strippedPathname !== requestUrl.pathname) {
    requestUrl.pathname = strippedPathname;
    throw redirect(requestUrl.toString(), 301);
  }

  // Start fetching non-critical data without blocking time to first byte
  const deferredData = loadDeferredData(args);
  // Await the critical data required to render initial state of the page
  const criticalData = await loadCriticalData(args);

  //
  return defer({
    ...deferredData,
    ...criticalData,

    /**********  EXAMPLE UPDATE STARTS  ************/
    // SEGURIDAD: nunca retornar `env` completo — el loader raíz se serializa
    // en el HTML del cliente y expondría todos los secretos del servidor
    // (PRIVATE_STOREFRONT_API_TOKEN, SESSION_SECRET, webhooks, etc.).
    // Solo exponer campos PUBLIC_* explícitos.
    publicStoreDomain: env.PUBLIC_STORE_DOMAIN,
    publicStoreSubdomain: env.PUBLIC_SHOPIFY_STORE_DOMAIN,
    publicStoreCdnStaticUrl: env.PUBLIC_STORE_CDN_STATIC_URL,
    publicImageFormatForProductOption:
      env.PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION,
    publicOkendoSubcriberId: env.PUBLIC_OKENDO_SUBSCRIBER_ID,
    // Sin fallbacks hardcodeados: si falta la env var debe significar
    // "no trackear", nunca "enviar datos a la propiedad de otra tienda".
    publicGtmId: env.PUBLIC_GTM_ID ?? '',
    publicGaMeasurementId: env.PUBLIC_GA_MEASUREMENT_ID ?? '',
    // 'true' → GTM container es dueño de los tags GA4/Meta/TikTok (solo
    // dataLayer); cualquier otro valor → este código dispara gtag/fbq/ttq.
    publicGtmOwnsTags: env.PUBLIC_GTM_OWNS_TAGS ?? '',
    publicGoogleAdsId: env.PUBLIC_GOOGLE_ADS_ID ?? '',
    publicMetaPixelId: env.PUBLIC_META_PIXEL_ID ?? '',
    publicTiktokPixelId: env.PUBLIC_TIKTOK_PIXEL_ID ?? '',
    publicCheckoutDomain: env.PUBLIC_CHECKOUT_DOMAIN ?? '',
    publicRudderstackWriteKey: env.PUBLIC_RUDDERSTACK_WRITE_KEY ?? '',
    publicRudderstackDataPlaneUrl: env.PUBLIC_RUDDERSTACK_DATA_PLANE_URL ?? '',
    /**********   EXAMPLE UPDATE END   ************/
  });
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 */
async function loadCriticalData({request, context}: LoaderFunctionArgs) {
  const {storefront} = context;
  const {language, country} = storefront.i18n;

  // header/footer used to be deferred (streamed in after the initial shell
  // via <Suspense>/<Await>) alongside cart/login/Okendo -- 6 independent
  // Suspense boundaries racing during the streaming response. When one of
  // header/footer resolved late enough over real network latency, its
  // streamed <script> patch could land after the browser's parser had
  // already closed <body>, landing as a stray child of <html> -- React then
  // throws "Did not expect server HTML to contain a <script> in <html>",
  // cascading into hydration-mismatch errors. header/footer are
  // CacheLong()'d (normally warm) and, unlike cart/login/Okendo, already
  // block above-the-fold content (nav menu, footer links) -- awaiting them
  // here removes 2 of those competing boundaries without touching the
  // genuinely-deferrable ones below.
  const [layout, okendoProviderData, headerData, footerData] =
    await Promise.all([
      getLayoutData(context),
      getOkendoProviderData({
        context,
        subscriberId: context.env.PUBLIC_OKENDO_SUBSCRIBER_ID,
      }),
      storefront.query(HEADER_QUERY, {
        cache: storefront.CacheLong(),
        variables: {
          featuredCollectionsFirst: 1,
          socialsFirst: 10,
          headerMenuHandle: 'main-menu',
          language,
          country,
        },
      }),
      storefront.query(FOOTER_QUERY, {
        cache: storefront.CacheLong(),
        variables: {
          footerMenuHandle: 'footer',
          language,
          country,
        },
      }),
      // Add other queries here, so that they are loaded in parallel
    ]);

  const seo = seoPayload.root({shop: layout.shop, url: request.url});
  const {env} = context;

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
      // Banner nativo de Shopify Customer Privacy: con "automated settings"
      // en el admin, solo aparece donde la ley lo exige. En Colombia se
      // trackea por defecto sin banner (analyticsProcessingAllowed = true).
      // false aquí fue lo que silenció Shopify Analytics desde mayo
      // (commit 8c70d83: consentimiento en blanco permanente).
      withPrivacyBanner: true,
    },
    selectedLocale: storefront.i18n,
    okendoProviderData,
    // Named *Promise for backwards compat with the <Await resolve={...}>
    // consumers in Layout.tsx -- <Await> treats a non-promise `resolve` as
    // already-resolved, so those components work unchanged whether this is
    // deferred or not.
    headerPromise: headerData,
    footerPromise: footerData,
  };
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 */
function loadDeferredData({context}: LoaderFunctionArgs) {
  const {cart, customerAccount} = context;
  const isLoggedInPromise = customerAccount.isLoggedIn();

  return {
    isLoggedIn: isLoggedInPromise,
    isLoggedInPromise,
    cart: cart.get(),
    // Umbral real de envío gratis leído del Automatic Discount en Shopify
    // Admin (ver lib/shipping.server.ts) — diferido para no bloquear el TTFB;
    // el fallback ante cualquier fallo ya vive dentro de getFreeShippingThreshold.
    freeShippingThresholdPromise: getFreeShippingThreshold(context),
  };
}

export type RootLoader = typeof loader;

export const meta: MetaFunction<RootLoader> = ({data, matches}) => {
  // Pass one or more arguments, preserving properties from parent routes
  return getSeoMetaTags(matches.map((match) => (match?.data as any)?.seo));
};

function MainLayout({children}: {children?: React.ReactNode}) {
  const nonce = useNonce();
  const data = useRouteLoaderData<RootLoader>('root');
  const locale = data?.selectedLocale ?? DEFAULT_LOCALE;
  const gtmId = data?.publicGtmId as string | null | undefined;
  const gaMeasurementId = data?.publicGaMeasurementId as
    | string
    | null
    | undefined;
  const googleAdsId = data?.publicGoogleAdsId as string | null | undefined;
  const metaPixelId = data?.publicMetaPixelId as string | null | undefined;
  const tiktokPixelId = data?.publicTiktokPixelId as string | null | undefined;
  const checkoutDomain = data?.publicCheckoutDomain as
    | string
    | null
    | undefined;
  const rudderstackWriteKey = data?.publicRudderstackWriteKey as
    | string
    | null
    | undefined;
  const rudderstackDataPlaneUrl = data?.publicRudderstackDataPlaneUrl as
    | string
    | null
    | undefined;
  const gtmOwnsTags =
    (data?.publicGtmOwnsTags as string | undefined) === 'true';

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
              {/* Carga GTM/GA4/Ads/Meta/TikTok gateado por consentimiento
                  (Customer Privacy API) — debe vivir dentro del Provider */}
              <GtmLoader
                gtmId={gtmId}
                gaMeasurementId={gaMeasurementId}
                googleAdsId={googleAdsId}
                metaPixelId={metaPixelId}
                tiktokPixelId={tiktokPixelId}
                checkoutDomain={checkoutDomain}
                gtmOwnsTags={gtmOwnsTags}
              />
              {/* Inicializa el SDK de RudderStack (CDP propio) — mismo gate
                  de consentimiento que GtmLoader, ver RudderStackLoader.tsx */}
              <RudderStackLoader
                writeKey={rudderstackWriteKey}
                dataPlaneUrl={rudderstackDataPlaneUrl}
              />
              {/* Puente SPA: dispara eventos a Meta Pixel, GA4, dataLayer y RudderStack en cada navegación */}
              <CustomAnalytics gtmOwnsTags={gtmOwnsTags} />
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
              // routeError.data es un Response body que nosotros mismos
              // lanzamos (seguro de mostrar) — va por `description`, no por
              // `error`, que GenericError reserva para excepciones reales y
              // solo muestra en dev (ver GenericError.tsx). Solo lo
              // mostramos si es un string no vacío — sin este check se
              // mostraría el status code crudo o basura tipo "410 undefined"
              // cuando data no es texto legible; GenericError ya cae al
              // description genérico por defecto en ese caso.
              <GenericError
                description={
                  typeof routeError.data === 'string' && routeError.data
                    ? routeError.data
                    : undefined
                }
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
    resource {
      __typename
      ... on Collection {
        id
        handle
        title
        image {
          altText
          url
          width
          height
        }
        megamenu_products: products(first: 4, sortKey: BEST_SELLING) {
          nodes {
            id
            title
            handle
            featuredImage {
              altText
              url
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
        # first: 0 — solo queremos la faceta de filtros (vendor real
        # presente en esta colección, con conteo), no productos. Mismo
        # mecanismo nativo de Shopify que ya usa SectionGridProductsAndFilter
        # para Categoría/Material/Color — el filtro de marca (filter.p.vendor)
        # ya viene gratis, sin necesitar traer cada producto para deducirlo.
        megamenu_brand_filters: products(first: 0) {
          filters {
            id
            values {
              label
              count
              input
            }
          }
        }
      }
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
    $featuredCollectionsFirst: Int!
    $socialsFirst: Int!
  ) @inContext(language: $language, country: $country) {
    headerMenu: menu(handle: $headerMenuHandle) {
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
    # Logos de marca (mega-menu "Brands" column) — mismo metaobject type que
    # ya alimenta la sección "Marcas" del footer/ticker, pero consultado
    # directo por type en vez de indirectamente vía route-home →
    # section_brands_ticker → brands, así no hace falta traer toda esa
    # sección solo para tener los logos en el header.
    brandItems: metaobjects(type: "ciseco--brand_item", first: 20) {
      nodes {
        id
        name: field(key: "name") {
          value
        }
        svg_logo: field(key: "svg_logo") {
          value
        }
        image_logo: field(key: "image_logo") {
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
        url: field(key: "url") {
          value
        }
      }
    }
    # Config del footer (contacto, sedes, descripción) editable por el
    # merchant desde el metaobject footer_settings — sin tocar código.
    footerSettings: metaobjects(type: "footer_settings", first: 1) {
      nodes {
        id
        about_title: field(key: "about_title") {
          value
        }
        email: field(key: "email") {
          value
        }
        whatsapp: field(key: "whatsapp") {
          value
        }
        whatsapp_label: field(key: "whatsapp_label") {
          value
        }
        phone: field(key: "phone") {
          value
        }
        hours: field(key: "hours") {
          value
        }
        description: field(key: "description") {
          value
        }
        locations: field(key: "locations") {
          value
        }
      }
    }
    # Paneles de megamenú configurables por item de menú (metaobject
    # megamenu_panel). Cada panel se empareja por menu_title con el título del
    # item de navegación; controla columnas 4-6 (colecciones destacadas,
    # slider de productos, marcas). Si un item no tiene panel, el megamenú
    # cae al comportamiento automático derivado de la colección.
    megamenuPanels: metaobjects(type: "megamenu_panel", first: 25) {
      nodes {
        id
        menu_title: field(key: "menu_title") {
          value
        }
        heading_collections: field(key: "heading_collections") {
          value
        }
        heading_products: field(key: "heading_products") {
          value
        }
        heading_brands: field(key: "heading_brands") {
          value
        }
        featured_collections: field(key: "featured_collections") {
          references(first: 12) {
            nodes {
              ... on Collection {
                id
                handle
                title
                image {
                  altText
                  url
                  width
                  height
                }
              }
            }
          }
        }
        collection_card: field(key: "collection_card") {
          reference {
            ... on Collection {
              id
              handle
              title
              image {
                altText
                url
                width
                height
              }
            }
          }
        }
        featured_products: field(key: "featured_products") {
          references(first: 6) {
            nodes {
              ... on Product {
                ...CommonProductCard
              }
            }
          }
        }
        featured_brands: field(key: "featured_brands") {
          references(first: 12) {
            nodes {
              ... on Metaobject {
                id
                name: field(key: "name") {
                  value
                }
                link: field(key: "link") {
                  value
                }
                logo: field(key: "logo") {
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
              }
            }
          }
        }
      }
    }
  }
  ${MENU_FRAGMENT}
  ${COMMON_COLLECTION_ITEM_FRAGMENT}
  ${COMMON_PRODUCT_CARD_FRAGMENT}
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
