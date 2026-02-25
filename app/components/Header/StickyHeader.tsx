import {type FC, useState, useEffect, useRef} from 'react';
import {Link} from '../Link';
import {storeConfig} from '~/config/store';
import CartBtn from './CartBtn';
import {MagnifyingGlassIcon} from '../Icons/MyIcons';
import clsx from 'clsx';
import {Bars3Icon} from '@heroicons/react/24/outline';
import {useAside} from '../Aside';
import {Form, useParams} from '@remix-run/react';

export interface StickyHeaderProps {
  className?: string;
}

const StickyHeader: FC<StickyHeaderProps> = ({className = ''}) => {
  const {open} = useAside();
  const params = useParams();
  const [isVisible, setIsVisible] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const headerHeight = 140; // Height threshold to start showing sticky header

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only show after scrolling past the main header
      if (currentScrollY < headerHeight) {
        setIsVisible(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        className,
      )}
    >
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="container">
          <div className="h-14 flex justify-between items-center">
            {/* Mobile Menu Button */}
            <button
              className="flex lg:hidden items-center justify-center w-10 h-10 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => open('mobile')}
              type="button"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Mini Logo */}
            <Link
              to="/"
              className="flex items-center text-lg font-bold text-slate-900 dark:text-white"
            >
              {'stickyLogoSvg' in storeConfig && storeConfig.stickyLogoSvg ? (
                <span
                  className="h-8 w-auto [&>svg]:h-full [&>svg]:w-auto"
                  dangerouslySetInnerHTML={{__html: storeConfig.stickyLogoSvg}}
                />
              ) : (
                <span className="text-primary-600">{storeConfig.stickyLogoText}</span>
              )}
            </Link>

            {/* Compact Search - Desktop only */}
            <div className="hidden lg:flex flex-1 max-w-md mx-6">
              <Form
                method="get"
                action={params.locale ? `/${params.locale}/search` : '/search'}
                className="relative w-full"
              >
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </span>
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar..."
                  className="w-full h-9 pl-9 pr-4 text-sm bg-slate-100 dark:bg-slate-800 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400"
                />
              </Form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <Link
                to="/search"
                className="flex lg:hidden w-10 h-10 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 items-center justify-center"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </Link>
              <CartBtn openCart={() => open('cart')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyHeader;
