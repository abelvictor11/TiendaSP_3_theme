import {type FC, useState, useRef, useEffect, useCallback} from 'react';
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
import {Form, useParams, useNavigate} from '@remix-run/react';

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
  const params = useParams();
  const navigate = useNavigate();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const parsedSuggestions = parseSearchSuggestions(searchSuggestions);

  // Close dropdown when clicking outside
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
      setIsSearchFocused(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  return (
    <div
      className={clsx(
        className,
        'nc-MainNav2 relative z-10 bg-white dark:bg-slate-900',
      )}
    >
      <div className="px-8">
        <div className="h-16 sm:h-20 flex justify-between items-center">
         
          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex items-center justify-center lg:justify-start flex-1 lg:flex-initial">
            <Logo />
          </div>
         
          {/* Menu Button - Mobile opens NavMobile, Desktop opens MegaMenu */}
          <div className="flex items-center">
            {/* Mobile button - opens mobile menu */}
            <button
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-[#efefef] dark:hover:bg-slate-800 focus:outline-none transition-colors"
              onClick={() => open('mobile')}
              type="button"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
            </button>
            {/* Desktop button - opens mega menu */}
            <button
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-[#efefef] dark:hover:bg-slate-800 focus:outline-none transition-colors"
              onClick={() => open('desktop-menu')}
              type="button"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium">Menú</span>
            </button>
          </div>

          {/* Desktop Search Input with Suggestions Dropdown - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8" ref={searchContainerRef}>
            <Form
              method="get"
              action={params.locale ? `/${params.locale}/search` : '/search'}
              className="relative w-full"
            >
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-black z-10">
                  <svg className="w-4 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                </span>
                <input
                  type="search"
                  name="q"
                  autoComplete="off"
                  placeholder="Buscar productos..."
                  className={clsx(
                    "w-full h-11 pl-12 pr-4 bg-[#ededed] text-sm dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-black dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 transition-all",
                    isSearchFocused ? 'border-none ring-2 ring-black' : 'border-none'
                  )}
                  onFocus={() => setIsSearchFocused(true)}
                />
              </div>

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && parsedSuggestions && parsedSuggestions.suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 overflow-hidden">
                  <div className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                      {parsedSuggestions.title}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {parsedSuggestions.suggestions.map((suggestion: any) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => {
                            setIsSearchFocused(false);
                            if (suggestion.href) navigate(suggestion.href);
                          }}
                          className="group flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                            {suggestion.image?.url ? (
                              <img
                                src={suggestion.image.url}
                                alt={suggestion.image.altText || suggestion.label}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                <MagnifyingGlassIcon />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                            {suggestion.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Form>
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
