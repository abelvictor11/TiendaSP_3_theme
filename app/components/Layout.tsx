import {Await, useRouteLoaderData} from '@remix-run/react';
import {Suspense} from 'react';
import type {
  FooterMenuQuery,
  HeaderMenuQuery,
  LayoutQuery,
} from 'storefrontapi.generated';
import {type EnhancedMenu, parseMenu, useIsHomePath} from '~/lib/utils';
import MainNav from './Header/MainNav';
import NavigationBar from './Header/NavigationBar';
import NavMobile from './Header/NavMobile';
import DesktopMegaMenu from './Header/DesktopMegaMenu';
import StickyHeader from './Header/StickyHeader';
import Logo from './Logo';
import Footer from './Footer';
import {CartLoading} from './CartLoading';
import {Cart} from './Cart';
import type {RootLoader} from '~/root';
import {Aside, useAside} from './Aside';
import TopBarMarquee from './TopBarMarquee';

type LayoutProps = {
  children: React.ReactNode;
  layout?: LayoutQuery;
};

export function Layout({children, layout}: LayoutProps) {
  return (
    <Aside.Provider>
      <div className="flex flex-col min-h-screen">
        <div className="">
          <a href="#mainContent" className="sr-only">
            Skip to content
          </a>
        </div>

        {!!layout && <MyHeader />}

        <main role="main" className="flex-grow">
          {children}
        </main>
      </div>

      {!!layout && <Footer />}
    </Aside.Provider>
  );
}

function MyHeader() {
  const isHome = useIsHomePath();

  return (
    <>
      <CartAside />
      <MobileMenuAside />
      <DesktopMenuAside />
      <TopBarMarqueeWrap />
      {/* Main Header - Not sticky, scrolls with page */}
      <div className="nc-Header z-40 relative">
        <HeaderMenuDataWrap>
          {({headerData, headerMenu}) => {
            const brands = (headerData as any)?.brands?.nodes || [];
            const quickLinksConfig = (headerData as any)?.headerQuickLinks?.nodes?.[0];
            const quickLinks = {
              enabled: quickLinksConfig?.enabled?.value !== 'false',
              items: quickLinksConfig?.items?.references?.nodes || [],
            };
            return (
              <>
                <MainNav isHome={isHome} brands={brands} quickLinks={quickLinks} />
                <NavigationBar 
                  headerMenu={headerMenu?.items} 
                  headerData={headerData}
                />
              </>
            );
          }}
        </HeaderMenuDataWrap>
      </div>
      {/* Sticky Header - appears on scroll up */}
      <StickyHeader />
    </>
  );
}

function TopBarMarqueeWrap() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const headerPromise = rootData?.headerPromise;

  return (
    <Suspense fallback={null}>
      <Await resolve={headerPromise}>
        {(headerData) => {
          const marquee = headerData?.topBarMarquee?.nodes?.[0];
          if (!marquee) return null;

          return (
            <TopBarMarquee
              textContent={marquee.text_content?.value || ''}
              backgroundColor={marquee.background_color?.value || '#1e1b4b'}
              textColor={marquee.text_color?.value || '#ffffff'}
              speed={Number(marquee.speed?.value) || 25}
              separatorIcon={marquee.separator_icon?.value || '🎁'}
              enabled={marquee.enabled?.value !== 'false'}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

function CartAside() {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const {close} = useAside();
  return (
    <Aside heading="Shopping Cart" openFrom="right" type="cart">
      <Suspense fallback={<CartLoading />}>
        <Await resolve={rootData?.cart}>
          {(cart) => {
            return <Cart onClose={close} cart={cart || null} />;
          }}
        </Await>
      </Suspense>
    </Aside>
  );
}

function MobileMenuAside() {
  const {close} = useAside();
  return (
    <Aside openFrom="left" type="mobile" heading="Menu">
      <NavMobile onClose={close} />
    </Aside>
  );
}

function DesktopMenuAside() {
  const {close} = useAside();
  return (
    <Aside openFrom="left" type="desktop-menu" noHeader>
      <HeaderMenuDataWrap>
        {({ultraMenu}) => (
          <DesktopMegaMenu menu={ultraMenu} onClose={close} />
        )}
      </HeaderMenuDataWrap>
    </Aside>
  );
}

export function HeaderMenuDataWrap({
  children,
  fallback = null,
}: {
  fallback?: React.ReactNode;
  children: ({
    headerData,
    headerMenu,
    ultraMenu,
  }: {
    headerMenu: EnhancedMenu | null | undefined;
    ultraMenu: EnhancedMenu | null | undefined;
    headerData: HeaderMenuQuery;
  }) => React.ReactNode;
}) {
  const rootData = useRouteLoaderData<RootLoader>('root');

  const headerPromise = rootData?.headerPromise;
  const layout = rootData?.layout;
  const env = rootData?.env;

  const shop = layout?.shop;

  const customPrefixes = {BLOG: '', CATALOG: 'products'};
  return (
    <Suspense fallback={fallback}>
      <Await resolve={headerPromise}>
        {(headerData) => {
          const menu =
            headerData?.headerMenu && shop?.primaryDomain?.url && env
              ? parseMenu(
                  headerData.headerMenu,
                  shop?.primaryDomain?.url,
                  env,
                  customPrefixes,
                )
              : undefined;

          const ultraMenuParsed =
            (headerData as any)?.ultraMenu && shop?.primaryDomain?.url && env
              ? parseMenu(
                  (headerData as any).ultraMenu,
                  shop?.primaryDomain?.url,
                  env,
                  customPrefixes,
                )
              : undefined;

          return headerData ? children({headerData, headerMenu: menu, ultraMenu: ultraMenuParsed}) : null;
        }}
      </Await>
    </Suspense>
  );
}

export function FooterMenuDataWrap({
  children,
}: {
  children: ({
    footerData,
    footerMenu,
  }: {
    footerMenu: EnhancedMenu | null | undefined;
    footerData: FooterMenuQuery;
  }) => React.ReactNode;
}) {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const footerPromise = rootData?.footerPromise;
  const layout = rootData?.layout;
  const env = rootData?.env;
  const shop = layout?.shop;

  const customPrefixes = {BLOG: '', CATALOG: 'products'};
  return (
    <Suspense fallback={null}>
      <Await resolve={footerPromise}>
        {(footerData) => {
          const menu =
            footerData?.footerMenu && shop?.primaryDomain?.url && env
              ? parseMenu(
                  footerData.footerMenu,
                  shop.primaryDomain.url,
                  env,
                  customPrefixes,
                )
              : undefined;
          return footerData ? children({footerData, footerMenu: menu}) : null;
        }}
      </Await>
    </Suspense>
  );
}
