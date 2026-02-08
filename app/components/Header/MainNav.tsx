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

         

          {/* Desktop Search Input - Hidden on mobile */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <Form
              method="get"
              action={params.locale ? `/${params.locale}/search` : '/search'}
              className="relative w-full"
            >
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-black">
                  <svg className="w-4 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 22L20 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar productos..."
                  className="w-full h-11 pl-12 pr-4 border-none bg-[#ededed] text-sm  dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-black dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100"
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
