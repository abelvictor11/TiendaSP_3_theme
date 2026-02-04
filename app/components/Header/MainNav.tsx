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
import {Form, useParams} from '@remix-run/react';

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

export interface Props {
  className?: string;
  isHome?: boolean;
  brands?: Brand[];
  quickLinks?: QuickLinksConfig;
}

const MainNav: FC<Props> = ({className = '', isHome, brands = [], quickLinks}) => {
  const {type: activeType, close, open} = useAside();
  const params = useParams();

  return (
    <div
      className={clsx(
        className,
        'nc-MainNav2 relative z-10 bg-white dark:bg-slate-900',
      )}
    >
      <div className="px-8">
        <div className="h-16 sm:h-20 flex justify-between items-center">
          {/* Mobile Menu Button with text */}
          <div className="flex items-center">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none transition-colors"
              onClick={() => open('mobile')}
              type="button"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-medium hidden sm:inline">Menú</span>
            </button>
          </div>

          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex items-center justify-center lg:justify-start flex-1 lg:flex-initial">
            <Logo />
          </div>

          {/* Desktop Search Input - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <Form
              method="get"
              action={params.locale ? `/${params.locale}/search` : '/search'}
              className="relative w-full"
            >
              <div className="relative">
                <span className="bg-black rounded-full text-white absolute left-2 top-1/2 -translate-y-1/2 text-black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" fill="none"><title>Icon</title><path stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" d="M28 27.9999L22.2 22.1999M25.3333 14.6667C25.3333 20.5577 20.5577 25.3333 14.6667 25.3333C8.77563 25.3333 4 20.5577 4 14.6667C4 8.77563 8.77563 4 14.6667 4C20.5577 4 25.3333 8.77563 25.3333 14.6667Z"></path></svg>
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar productos..."
                  className="w-full h-11 pl-12 pr-4 border-none bg-[#ededed] text-sm bg-slate-50 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-black dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
                />
              </div>
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
              className="flex lg:hidden w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none items-center justify-center"
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
