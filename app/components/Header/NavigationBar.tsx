import {ChevronDownIcon, ArrowRightIcon} from '@heroicons/react/24/solid';
import {useState, useRef} from 'react';
import {Link} from '@remix-run/react';
import type {ParentEnhancedMenuItem, ChildEnhancedMenuItem} from '~/lib/utils';
import CollectionItem from '../CollectionItem';
import type {HeaderMenuQuery} from 'storefrontapi.generated';

interface MegamenuItem {
  id: string;
  title?: { value?: string };
  description?: { value?: string };
  link?: { value?: string };
}

interface MegamenuSection {
  id: string;
  title?: { value?: string };
  columns?: { value?: string };
  items?: { references?: { nodes?: MegamenuItem[] } };
}

interface MegamenuBrand {
  id: string;
  name?: { value?: string };
  logo?: { reference?: { image?: { url?: string; altText?: string }; url?: string } };
  link?: { value?: string };
}

interface MegamenuConfig {
  id: string;
  menu_item_title?: { value?: string };
  banner_image?: { reference?: { image?: { url?: string; altText?: string } } };
  banner_title?: { value?: string };
  banner_text?: { value?: string };
  banner_cta_text?: { value?: string };
  banner_cta_link?: { value?: string };
  footer_text?: { value?: string };
  footer_link?: { value?: string };
  resources_title?: { value?: string };
  resources_link?: { value?: string };
  sections?: { references?: { nodes?: MegamenuSection[] } };
  brands_title?: { value?: string };
  featured_brands?: { references?: { nodes?: MegamenuBrand[] } };
}

interface NavigationBarProps {
  headerMenu?: ParentEnhancedMenuItem[] | null;
  headerData?: HeaderMenuQuery;
}

export default function NavigationBar({headerMenu, headerData}: NavigationBarProps) {
  if (!headerMenu || !Array.isArray(headerMenu) || headerMenu.length === 0) {
    return null;
  }

  const megamenuConfigs = (headerData as any)?.megamenuConfigs?.nodes || [];

  return (
    <div className="nc-NavigationBar bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-700">
      <div className="container-fluid relative">
        <nav className="nc-Navigation flex justify-center items-center py-0">
          <ul className="nc-Navigation hidden lg:flex items-center space-x-1">
            {headerMenu.map((item, index) => {
              const megamenuConfig = megamenuConfigs.find(
                (config: MegamenuConfig) => 
                  config.menu_item_title?.value?.toLowerCase() === item.title.toLowerCase()
              );
              return (
                <NavItem
                  key={item.id + '-' + index.toString()}
                  menuItem={item}
                  headerData={headerData}
                  megamenuConfig={megamenuConfig}
                />
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  menuItem,
  headerData,
  megamenuConfig,
}: {
  menuItem: ParentEnhancedMenuItem;
  headerData?: HeaderMenuQuery;
  megamenuConfig?: MegamenuConfig;
}) {
  const hasChildren = menuItem.items && menuItem.items.length > 0;
  const hasCustomMegamenu = megamenuConfig?.sections?.references?.nodes?.length;

  if (!hasChildren && !hasCustomMegamenu) {
    return (
      <li>
        {!menuItem.to.startsWith('http') ? (
          <Link
            to={menuItem.to}
            target={menuItem.target}
            prefetch="intent"
            className="inline-flex items-center text-sm lg:text-sm font-medium text-black dark:text-slate-300 py-4 px-4 hover:bg-[#efefef] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </Link>
        ) : (
          <a
            href={menuItem.to}
            target={menuItem.target}
            className="inline-flex items-center text-sm lg:text-sm font-medium text-black dark:text-slate-300 py-4 px-4 hover:bg-[#efefef] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </a>
        )}
      </li>
    );
  }

  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150);
  };

  return (
    <li 
      className="group/nav static"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {!menuItem.to.startsWith('http') ? (
        <Link
          to={menuItem.to}
          prefetch="intent"
          className={`
            ${isHovered ? 'text-slate-900 dark:text-slate-100 bg-[#efefef] dark:bg-slate-800' : 'text-black dark:text-slate-300'}
            group inline-flex items-center text-sm lg:text-sm font-medium py-4 px-4 hover:bg-[#efefef] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''} ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <a
          href={menuItem.to}
          target={menuItem.target}
          className={`
            ${isHovered ? 'text-slate-900 dark:text-slate-100 bg-[#efefef] dark:bg-slate-800' : 'text-slate-700 dark:text-slate-300'}
            group inline-flex items-center text-sm lg:text-base font-medium py-4 px-4 hover:bg-[#efefef] dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''} ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </a>
      )}

      {/* Megamenu Panel */}
      {isHovered && (
        <div className="absolute z-50 left-0 right-0 top-full pt-3">
          <div className="container">
            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-2xl overflow-hidden">
              <div className="relative px-6 py-8 lg:px-8 lg:py-10">
                {hasCustomMegamenu ? (
                  <CustomMegamenu 
                    config={megamenuConfig!} 
                    onClose={() => setIsHovered(false)} 
                  />
                ) : (
                  <DefaultMegamenu 
                    menuItem={menuItem} 
                    headerData={headerData}
                    onClose={() => setIsHovered(false)} 
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

function CustomMegamenu({
  config,
  onClose,
}: {
  config: MegamenuConfig;
  onClose: () => void;
}) {
  const sections = config.sections?.references?.nodes || [];
  const bannerImage = config.banner_image?.reference?.image;
  const hasBanner = bannerImage?.url || config.banner_title?.value;
  const featuredBrands = config.featured_brands?.references?.nodes || [];
  const hasBrands = featuredBrands.length > 0;

  return (
    <div className="flex gap-8">
      {/* Sections */}
      <div className="flex-1 space-y-6">
        {sections.map((section, sectionIdx) => {
          const items = section.items?.references?.nodes || [];
          const columns = Number(section.columns?.value) || 2;
          
          return (
            <div key={section.id || sectionIdx}>
              {/* Section Title */}
              {section.title?.value && (
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  {section.title.value}
                </h3>
              )}
              
              {/* Section Items */}
              <div 
                className="grid gap-x-8 gap-y-3"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {items.map((item, itemIdx) => (
                  <Link
                    key={item.id || itemIdx}
                    to={item.link?.value || '#'}
                    className="group block"
                    onClick={onClose}
                  >
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.title?.value}
                    </p>
                    {item.description?.value && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description.value}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer Link */}
        {config.footer_link?.value && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to={config.footer_link.value}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white hover:text-primary-600 transition-colors"
              onClick={onClose}
            >
              {config.footer_text?.value || 'Ver todo'}
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            
            {config.resources_link?.value && (
              <Link
                to={config.resources_link.value}
                className="ml-8 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                onClick={onClose}
              >
                {config.resources_title?.value || 'Recursos'}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Featured Brands */}
      {hasBrands && (
        <div className="hidden lg:block w-[220px] shrink-0 border-l border-slate-100 dark:border-slate-800 pl-8">
          {config.brands_title?.value && (
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
              {config.brands_title.value}
            </h3>
          )}
          <div className="space-y-3">
            {featuredBrands.map((brand, idx) => {
              const logoUrl = brand.logo?.reference?.image?.url || brand.logo?.reference?.url;
              return (
                <Link
                  key={brand.id || idx}
                  to={brand.link?.value || '#'}
                  className="flex items-center justify-center px-4 py-3 dark:bg-slate-800 rounded-md hover:bg-[#efefef] dark:hover:bg-slate-700 transition-colors group"
                  onClick={onClose}
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={brand.name?.value || ''}
                      className="h-6 max-w-[140px] object-contain dark:brightness-0 dark:invert"
                    />
                  ) : (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary-600">
                      {brand.name?.value}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Banner */}
      {hasBanner && (
        <div className="hidden xl:block w-[300px] shrink-0">
          <Link
            to={config.banner_cta_link?.value || '#'}
            className="block relative h-full rounded-xl overflow-hidden group"
            onClick={onClose}
          >
            {/* Background Image */}
            {bannerImage?.url && (
              <img
                src={bannerImage.url}
                alt={bannerImage.altText || config.banner_title?.value || ''}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {/* Content */}
            <div className="relative h-full min-h-[280px] p-6 flex flex-col justify-end text-white">
              {config.banner_title?.value && (
                <h4 className="text-xl font-semibold mb-2">
                  {config.banner_title.value}
                </h4>
              )}
              {config.banner_text?.value && (
                <p className="text-sm text-white/80 mb-4">
                  {config.banner_text.value}
                </p>
              )}
              {config.banner_cta_text?.value && (
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  {config.banner_cta_text.value}
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

function DefaultMegamenu({
  menuItem,
  headerData,
  onClose,
}: {
  menuItem: ParentEnhancedMenuItem;
  headerData?: HeaderMenuQuery;
  onClose: () => void;
}) {
  return (
    <div className="flex gap-8">
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-6 xl:gap-8">
          {menuItem.items?.map((subItem: ChildEnhancedMenuItem, idx) => (
            <div key={subItem.id + '-' + idx}>
              {!subItem.to.startsWith('http') ? (
                <Link
                  to={subItem.to}
                  target={subItem.target}
                  prefetch="intent"
                  className="font-medium text-slate-900 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  onClick={onClose}
                >
                  {subItem.title}
                </Link>
              ) : (
                <a
                  href={subItem.to}
                  target={subItem.target}
                  className="block group"
                  onClick={onClose}
                >
                  <p className="font-medium text-slate-900 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {subItem.title}
                  </p>
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {headerData?.featuredCollections?.nodes?.[0] && (
        <div className="hidden xl:block w-[300px]">
          <CollectionItem
            onClick={onClose}
            item={headerData.featuredCollections.nodes[0]}
          />
        </div>
      )}
    </div>
  );
}
