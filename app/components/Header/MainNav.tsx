import {type FC} from 'react';
import VendorsDropdown from './VendorsDropdown';
import AvatarDropdown from './AvatarDropdown';
import HeaderQuickLinks, {type QuickLinkItem} from './HeaderQuickLinks';
import Logo from '../Logo';
import CartBtn from './CartBtn';
import {MagnifyingGlassIcon} from '../Icons/MyIcons';
import clsx from 'clsx';
import {Bars3Icon} from '@heroicons/react/24/outline';
import {Link} from '../Link';
import {useAside} from '../Aside';
import {SearchAutocomplete} from '../SearchAutocomplete';
import {storeConfig} from '~/config/store';

interface Brand {
  id: string;
  handle: string;
  name?: { value: string };
  slug?: { value: string };
  logo?: { reference?: { image?: { url: string; altText?: string } } };
}

interface QuickLinksConfig {
  enabled: boolean;
  items: QuickLinkItem[];
}

// Parse search suggestions metaobject into a usable format
function parseSearchSuggestions(metaobject: any) {
  if (!metaobject?.fields) return null;

  const titleField = metaobject.fields.find((f: any) => f.key === 'title');
  const suggestionsField = metaobject.fields.find((f: any) => f.key === 'suggestions');

  const suggestions = suggestionsField?.references?.edges
    ?.map((edge: any) => {
      const node = edge.node;
      if (!node?.fields) return null;

      const label = node.fields.find((f: any) => f.key === 'label')?.value;
      const imageRef = node.fields.find((f: any) => f.key === 'image')?.reference?.image;
      const collectionRef = node.fields.find((f: any) => f.key === 'collection')?.reference;
      const customUrl = node.fields.find((f: any) => f.key === 'url')?.value;
      const sortOrder = node.fields.find((f: any) => f.key === 'sort_order')?.value;

      let href = collectionRef?.handle ? `/collections/${collectionRef.handle}` : null;
      if (customUrl) {
        try {
          const url = new URL(customUrl);
          href = url.pathname;
        } catch {
          href = customUrl;
        }
      }

      return {
        id: node.id,
        label,
        image: imageRef,
        href,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 999,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder) || [];

  return {
    title: titleField?.value || 'Explorar por categoría',
    suggestions,
  };
}

export interface Props {
  className?: string;
  isHome?: boolean;
  brands?: Brand[];
  quickLinks?: QuickLinksConfig;
  searchSuggestions?: any;
}

const MainNav: FC<Props> = ({className = '', isHome, brands = [], quickLinks, searchSuggestions}) => {
  const {type: activeType, close, open} = useAside();

  const parsedSuggestions = parseSearchSuggestions(searchSuggestions);

  return (
    <div
      className={clsx(
        className,
        'nc-MainNav2 relative z-10 bg-white dark:bg-slate-900',
      )}
    >
      <div className="px-8">
        <div className="h-16 sm:h-20 flex justify-between items-center">
         
          {/* Logo - mini SVG on mobile, full logo on desktop */}
          <div className="flex items-center justify-center lg:justify-start flex-1 lg:flex-initial">
            {/* Mobile: compact SVG icon (same as sticky header) */}
            <Link
              to="/"
              className="block lg:hidden text-slate-900 dark:text-white"
              aria-label="Inicio"
            >
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox={storeConfig.stickyLogoViewBox}
                xmlSpace="preserve"
                className="h-7 w-auto fill-current"
                dangerouslySetInnerHTML={{__html: storeConfig.stickyLogoSvg}}
              />
            </Link>
            {/* Desktop: full brand logo */}
            <div className="hidden lg:block">
              <Logo />
            </div>
          </div>
         
          {/* Menu Button - Mobile always visible, Desktop controlled by showMenuButton */}
          <div className="flex items-center">
            {/* Mobile hamburger — always visible on small screens */}
            <button
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-[#efefef] dark:hover:bg-slate-800 focus:outline-none transition-colors"
              onClick={() => open('mobile')}
              type="button"
              aria-label="Abrir menú"
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
            </button>
            {/* Desktop "Menú" text button — controlled by showMenuButton */}
            {storeConfig.showMenuButton && (
              <button
                className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-[#efefef] dark:hover:bg-slate-800 focus:outline-none transition-colors"
                onClick={() => open('desktop-menu')}
                type="button"
                aria-label="Open menu"
              >
                <Bars3Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">Menú</span>
              </button>
            )}
          </div>

          {/* Desktop Search Input with Autocomplete - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <SearchAutocomplete
              variant="header"
              staticSuggestions={parsedSuggestions}
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <HeaderQuickLinks 
              className="hidden md:flex" 
              items={quickLinks?.items} 
              enabled={quickLinks?.enabled}
            />
            <VendorsDropdown className="hidden md:block" brands={brands} />
            {/* Mobile search icon - Hidden on desktop */}
            <Link
              to={'/search'}
              className="flex lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-700 dark:text-slate-300 hover:bg-[#efefef] dark:hover:bg-slate-800 focus:outline-none items-center justify-center"
              aria-label="Search"
            >
              <MagnifyingGlassIcon />
            </Link>
            <AvatarDropdown />
            <CartBtn openCart={() => open('cart')} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainNav;
