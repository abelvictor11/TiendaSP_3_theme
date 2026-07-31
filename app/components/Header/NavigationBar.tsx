import {ChevronDownIcon} from '@heroicons/react/24/solid';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {useState, useRef, useMemo} from 'react';
import {Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import type {ParentEnhancedMenuItem, ChildEnhancedMenuItem} from '~/lib/utils';
import CollectionItem from '../CollectionItem';
import ProductCard from '../ProductCard';
import Prices from '../Prices';
import {normalizeBrandKey} from '~/utils/brandKey';
import {getVendorCollectionUrl} from '~/utils/vendorCollectionUrl';
import type {HeaderMenuQuery} from 'storefrontapi.generated';

const MAX_MEGAMENU_BRANDS = 6;

/**
 * Normaliza un título de menú/panel para emparejarlos sin depender de
 * mayúsculas, acentos ni espacios sobrantes (reutiliza normalizeBrandKey,
 * que ya hace lower + strip de diacríticos).
 */
function normTitle(s?: string | null) {
  return s ? normalizeBrandKey(s) : '';
}

/**
 * Forma resuelta de un metaobject `megamenu_panel` tal como lo devuelve el
 * HEADER_QUERY (campos como `{value}` y referencias resueltas). Se accede vía
 * `any` porque el codegen de storefront no conoce estos campos custom.
 */
interface MegamenuPanel {
  menu_title?: {value?: string | null} | null;
  heading_links?: {value?: string | null} | null;
  heading_collections?: {value?: string | null} | null;
  heading_products?: {value?: string | null} | null;
  heading_brands?: {value?: string | null} | null;
  featured_collections?: {references?: {nodes?: any[]} | null} | null;
  collection_card?: {reference?: any} | null;
  featured_products?: {references?: {nodes?: any[]} | null} | null;
  featured_brands?: {references?: {nodes?: any[]} | null} | null;
}

/**
 * Cruza los vendors reales presentes en la colección (vía el filtro nativo
 * filter.p.vendor de Shopify, sin traer cada producto) contra los logos
 * curados en ciseco--brand_item, para mostrar solo marcas que de verdad
 * venden algo en esta categoría — no una lista fija por categoría, así que
 * se mantiene correcta sola cuando cambia el catálogo.
 */
function getMegamenuBrands(
  menuItem: ParentEnhancedMenuItem,
  brandItems: HeaderMenuQuery['brandItems'] | undefined,
) {
  const resource = menuItem.resource;
  if (resource?.__typename !== 'Collection') return [];

  const vendorFilter = resource.megamenu_brand_filters?.filters?.find(
    (f) => f.id === 'filter.p.vendor',
  );
  const vendorValues = vendorFilter?.values ?? [];
  if (!vendorValues.length) return [];

  const brandNodes = brandItems?.nodes ?? [];

  return [...vendorValues]
    .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
    .slice(0, MAX_MEGAMENU_BRANDS)
    .map((v) => {
      const key = normalizeBrandKey(v.label);
      const matched = brandNodes.find(
        (b) => b.name?.value && normalizeBrandKey(b.name.value) === key,
      );
      return {
        label: v.label,
        url: matched?.url?.value || getVendorCollectionUrl(v.label) || '#',
        svgLogo: matched?.svg_logo?.value,
        imageLogo: matched?.image_logo?.reference?.image,
      };
    });
}

interface NavigationBarProps {
  headerMenu?: ParentEnhancedMenuItem[] | null;
  headerData?: HeaderMenuQuery;
}

export default function NavigationBar({
  headerMenu,
  headerData,
}: NavigationBarProps) {
  // Mapa panel-por-título (normalizado) para resolver O(1) el panel de cada
  // item de menú. Se calcula una vez por render del header.
  const panelsByTitle = useMemo(() => {
    const nodes: MegamenuPanel[] =
      (headerData as any)?.megamenuPanels?.nodes ?? [];
    const map = new Map<string, MegamenuPanel>();
    for (const p of nodes) {
      const key = normTitle(p?.menu_title?.value);
      if (key) map.set(key, p);
    }
    return map;
  }, [headerData]);

  // Early return if no menu
  if (!headerMenu || !Array.isArray(headerMenu) || headerMenu.length === 0) {
    return null;
  }

  return (
    <div className="nc-NavigationBar bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-700">
      <div className="container-fluid relative">
        <nav className="nc-Navigation flex justify-center items-center py-0">
          <ul className="nc-Navigation hidden lg:flex items-center space-x-1">
            {headerMenu.map((item, index) => (
              <NavItem
                key={item.id + '-' + index.toString()}
                menuItem={item}
                headerData={headerData}
                panel={panelsByTitle.get(normTitle(item.title))}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  menuItem,
  headerData,
  panel,
}: {
  menuItem: ParentEnhancedMenuItem;
  headerData?: HeaderMenuQuery;
  panel?: MegamenuPanel;
}) {
  const hasChildren = menuItem.items && menuItem.items.length > 0;

  // Hooks must run unconditionally on every render (rules-of-hooks) — moved
  // above the leaf-item early return below, which previously skipped them
  // for items with no dropdown.
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Un item abre megamenú si tiene sub-items en la navegación O un panel de
  // metaobject configurado (permite paneles solo con colecciones/marcas
  // destacadas sin depender del árbol de navegación).
  const hasPanel = !!panel;
  const opensMegamenu = hasChildren || hasPanel;

  if (!opensMegamenu) {
    // Simple link without dropdown
    return (
      <li>
        {!menuItem.to.startsWith('http') ? (
          <Link
            to={menuItem.to}
            target={menuItem.target}
            prefetch="intent"
            className="inline-flex items-center text-sm font-medium text-[#131210] dark:text-slate-300 py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </Link>
        ) : (
          <a
            href={menuItem.to}
            target={menuItem.target}
            className="inline-flex items-center text-sm font-medium text-[#131210] dark:text-slate-300 py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </a>
        )}
      </li>
    );
  }

  // Dropdown with megamenu - hover to open, click to navigate

  const megamenuBrands = getMegamenuBrands(menuItem, headerData?.brandItems);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150); // Small delay to allow moving to the panel
  };

  const close = () => setIsHovered(false);

  return (
    <li
      className="group/nav static"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Link - Click navigates to collection */}
      {!menuItem.to.startsWith('http') ? (
        <Link
          to={menuItem.to}
          prefetch="intent"
          className={`
            ${
              isHovered
                ? 'text-slate-900 dark:text-slate-100 bg-[#F9F7F7] dark:bg-slate-800'
                : 'text-[#131210] dark:text-slate-300'
            }
            group inline-flex items-center text-sm font-medium py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''}
              ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <a
          href={menuItem.to}
          target={menuItem.target}
          className={`
            ${
              isHovered
                ? 'text-slate-900 dark:text-slate-100 bg-[#F9F7F7] dark:bg-slate-800'
                : 'text-[#131210] dark:text-slate-300'
            }
            group inline-flex items-center text-sm font-medium py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''}
              ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </a>
      )}

      {/* Megamenu Panel - Shows on hover */}
      {isHovered && (
        <div
          className="absolute z-50 left-0 right-0 top-full pt-3"
          style={{position: 'absolute'}}
        >
          <div className="container">
            {/* w-max + mx-auto: el panel ajusta su ancho al contenido y se
                centra, en vez de estirarse a todo el ancho dejando huecos. */}
            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-2xl overflow-hidden w-max max-w-full mx-auto">
              <div className="relative px-6 py-8 lg:px-8 lg:py-10">
                {hasPanel ? (
                  <PanelMegamenu
                    menuItem={menuItem}
                    panel={panel!}
                    onNavigate={close}
                  />
                ) : (
                  <AutoMegamenu
                    menuItem={menuItem}
                    megamenuBrands={megamenuBrands}
                    onNavigate={close}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * Megamenú de 6 columnas dirigido por el metaobject `megamenu_panel`:
 *  · Columnas 1-3: sub-items del menú de navegación (grid de 3 columnas).
 *  · Columna 4: colecciones destacadas + tarjeta de colección con imagen.
 *  · Columna 5: slider de productos destacados (1 a la vez).
 *  · Columna 6: logos de marcas destacadas.
 * Cualquier columna cuyo campo esté vacío en el metaobject simplemente no se
 * renderiza, así el mismo layout sirve para paneles parciales.
 */
function PanelMegamenu({
  menuItem,
  panel,
  onNavigate,
}: {
  menuItem: ParentEnhancedMenuItem;
  panel: MegamenuPanel;
  onNavigate: () => void;
}) {
  const collections = panel.featured_collections?.references?.nodes ?? [];
  const card = panel.collection_card?.reference ?? null;
  const products = (panel.featured_products?.references?.nodes ?? []).slice(
    0,
    6,
  );
  const brands = panel.featured_brands?.references?.nodes ?? [];

  const headingCollections =
    panel.heading_collections?.value || 'Colecciones';
  const headingProducts = panel.heading_products?.value || 'Más vendidos';
  const headingBrands = panel.heading_brands?.value || 'Marcas';

  const dividerCls =
    'border-l border-neutral-200/80 dark:border-neutral-700/80 pl-6 xl:pl-8';

  return (
    <div className="flex items-stretch gap-6 xl:gap-8">
      {/* Columnas 1-3: sub-items del menú. Ancho de contenido (no flex-1)
          para que COLECCIONES quede justo al lado sin un hueco enorme; el
          espacio sobrante se manda a la derecha con un spacer al final. El
          enlace "Ver todo" va debajo de los ítems. */}
      <div className="flex-shrink-0 max-w-[440px]">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          {panel.heading_links?.value || menuItem.title}
        </p>
        <div className="grid grid-cols-3 gap-x-6 gap-y-3.5">
          {menuItem.items?.map((subItem: ChildEnhancedMenuItem, idx) => (
            <div key={subItem.id + '-' + idx}>
              {!subItem.to.startsWith('http') ? (
                <Link
                  to={subItem.to}
                  target={subItem.target}
                  prefetch="intent"
                  className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  onClick={onNavigate}
                >
                  {subItem.title}
                </Link>
              ) : (
                <a
                  href={subItem.to}
                  target={subItem.target}
                  className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  onClick={onNavigate}
                >
                  {subItem.title}
                </a>
              )}
            </div>
          ))}
        </div>
        {!menuItem.to.startsWith('http') && (
          <Link
            to={menuItem.to}
            prefetch="intent"
            className="inline-block text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors mt-6"
            onClick={onNavigate}
          >
            Ver todo {menuItem.title} →
          </Link>
        )}
      </div>

      {/* Columna 4: colecciones destacadas + tarjeta */}
      {(collections.length > 0 || card) && (
        <div className={`hidden lg:block w-[190px] flex-shrink-0 ${dividerCls}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            {headingCollections}
          </p>
          {collections.length > 0 && (
            <ul className="space-y-2.5 mb-5">
              {collections.map((c: any) => (
                <li key={c.id}>
                  <Link
                    to={`/collections/${c.handle}`}
                    prefetch="intent"
                    className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    onClick={onNavigate}
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {card && (
            <CollectionItem onClick={onNavigate} item={card as any} compact />
          )}
        </div>
      )}

      {/* Columna 5: slider de productos destacados */}
      {products.length > 0 && (
        <div className={`hidden xl:block w-[270px] flex-shrink-0 ${dividerCls}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            {headingProducts}
          </p>
          <ProductSlider products={products} />
        </div>
      )}

      {/* Columna 6: marcas destacadas (pills) */}
      {brands.length > 0 && (
        <div className={`hidden xl:block w-[168px] flex-shrink-0 ${dividerCls}`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            {headingBrands}
          </p>
          <div className="space-y-2.5">
            {brands.map((b: any) => {
              const name = b?.name?.value || '';
              const link = b?.link?.value || '#';
              const logo = b?.logo?.reference?.image;
              return (
                <Link
                  key={b.id}
                  to={link}
                  prefetch="intent"
                  className="flex items-center justify-center h-11 px-3 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 hover:shadow-sm transition group"
                  aria-label={name}
                  onClick={onNavigate}
                >
                  {logo ? (
                    <Image
                      data={logo}
                      width={110}
                      height={28}
                      className="max-h-7 w-auto object-contain grayscale group-hover:grayscale-0 transition-[filter]"
                      sizes="110px"
                    />
                  ) : (
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {name}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slider de productos que muestra un producto a la vez, con flechas y puntos.
 */
function ProductSlider({products}: {products: any[]}) {
  const [index, setIndex] = useState(0);
  const total = products.length;
  const current = products[index];
  const go = (delta: number) =>
    setIndex((i) => (i + delta + total) % total);

  if (!current) return null;

  return (
    <div>
      {/* Misma card de producto que el resto del sitio (isCardSmall omite el
          rating para caber en el megamenú). */}
      <ProductCard product={current} isCardSmall />

      {total > 1 && (
        <div className="flex items-center justify-between mt-3">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="p-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5">
            {products.map((_, i) => (
              <button
                type="button"
                key={i}
                aria-label={`Ir al producto ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index
                    ? 'w-4 bg-primary-600'
                    : 'w-1.5 bg-neutral-300 dark:bg-neutral-600'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => go(1)}
            className="p-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Megamenú automático (fallback): cuando un item de menú no tiene panel de
 * metaobject, se deriva todo del `resource` de la colección — mismo
 * comportamiento previo a la capa configurable.
 */
function AutoMegamenu({
  menuItem,
  megamenuBrands,
  onNavigate,
}: {
  menuItem: ParentEnhancedMenuItem;
  megamenuBrands: ReturnType<typeof getMegamenuBrands>;
  onNavigate: () => void;
}) {
  return (
    <div className="flex gap-6">
      {/* Menu Items Grid */}
      <div className="flex-1 min-w-0">
        {!menuItem.to.startsWith('http') && (
          <Link
            to={menuItem.to}
            prefetch="intent"
            className="inline-block font-semibold text-[#131210] dark:text-neutral-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
            onClick={onNavigate}
          >
            Ver todo {menuItem.title}
          </Link>
        )}
        <div className="grid grid-cols-3 gap-6 xl:gap-8">
          {menuItem.items?.map((subItem: ChildEnhancedMenuItem, idx) => (
            <div key={subItem.id + '-' + idx}>
              {!subItem.to.startsWith('http') ? (
                <Link
                  to={subItem.to}
                  target={subItem.target}
                  prefetch="intent"
                  className="font-medium text-[#131210] dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  onClick={onNavigate}
                >
                  {subItem.title}
                </Link>
              ) : (
                <a
                  href={subItem.to}
                  target={subItem.target}
                  className="block group"
                  onClick={onNavigate}
                >
                  <p className="font-medium text-[#131210] dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {subItem.title}
                  </p>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Colección e imagen resueltas directamente del `resource` del
            menu item vía Storefront API. */}
      {menuItem.resource?.__typename === 'Collection' && (
        <div className="hidden xl:flex gap-4 flex-shrink-0">
          <div className="w-[180px] flex-shrink-0">
            <CollectionItem
              onClick={onNavigate}
              item={menuItem.resource}
              compact
            />
          </div>
          {!!menuItem.resource.megamenu_products?.nodes?.length && (
            <div className="w-[180px] flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Más vendidos
              </p>
              <div className="space-y-3">
                {menuItem.resource.megamenu_products.nodes.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.handle}`}
                    prefetch="intent"
                    className="flex items-center gap-3 group"
                    onClick={onNavigate}
                  >
                    {product.featuredImage && (
                      <Image
                        data={product.featuredImage}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        sizes="40px"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#131210] dark:text-neutral-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {product.title}
                      </p>
                      <Prices
                        price={product.priceRange.minVariantPrice}
                        className="text-xs"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {!!megamenuBrands.length && (
            <div className="w-[140px] flex-shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Marcas
              </p>
              <div className="space-y-2.5">
                {megamenuBrands.map((brand) => (
                  <Link
                    key={brand.label}
                    to={brand.url}
                    prefetch="intent"
                    className="flex items-center h-6 group"
                    aria-label={brand.label}
                    onClick={onNavigate}
                  >
                    {brand.imageLogo ? (
                      <Image
                        data={brand.imageLogo}
                        width={80}
                        height={24}
                        className="max-h-6 w-auto object-contain grayscale group-hover:grayscale-0 transition-[filter]"
                        sizes="80px"
                      />
                    ) : brand.svgLogo ? (
                      <span
                        className="max-h-6 w-auto [&_svg]:h-6 [&_svg]:w-auto grayscale group-hover:grayscale-0 transition-[filter]"
                        dangerouslySetInnerHTML={{
                          __html: brand.svgLogo,
                        }}
                      />
                    ) : (
                      <span className="text-xs text-[#131210] dark:text-neutral-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {brand.label}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
