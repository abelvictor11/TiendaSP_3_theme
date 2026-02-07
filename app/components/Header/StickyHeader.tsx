import {type FC, useState, useEffect, useRef} from 'react';
import {Link} from '../Link';
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
              className="flex lg:hidden items-center justify-center w-10 h-10 rounded-full text-black dark:text-slate-300 hover:bg-[#efefef] dark:hover:bg-slate-800"
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
              <span className="text-primary-600">
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 473.321 127.556" style="enable-background:new 0 0 473.321 127.556;" xml:space="preserve">
<path d="M110.087,114.388h-87.92c-9.399,0-15.147-7.664-12.796-17.063l16.782-67.094c2.351-9.399,11.933-17.063,21.332-17.063h87.92
	c9.544,0,15.146,7.664,12.796,17.063l-3.328,13.303H120.58l3.002-12.002H50.123L33.991,96.025h73.46l3.033-12.077h24.293
	l-3.358,13.378C129.068,106.724,119.63,114.388,110.087,114.388z M268.802,114.388h-34.416l-0.722-4.049l-4.733-25.594
	l-17.392,25.594l-2.893,4.049h-34.272l-18.641-101.22h26.463l15.245,82.422l24.624-36.005l1.808-2.603l-6.105-33.403l-2.023-10.411
	h24.149l8.129,43.814l0.505,2.603l6.61,36.005l50.178-73.226l-14.552-9.196h47.317L268.802,114.388z M436.227,72.802h-19.495
	l26.158,41.585h-30.354l-26.293-41.585l-32.694,0l5.74-18.364h74.302l5.731-22.905h-73.459l-20.726,82.855h-24.293l25.319-101.22
	h104.983c9.544,0,15.146,7.664,12.796,17.063l-6.382,25.508C455.207,65.138,445.771,72.802,436.227,72.802z"/>
</svg>
</span>
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
                  className="w-full h-9 pl-9 pr-4 text-sm bg-[#ededed] dark:bg-slate-800 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-slate-400"
                />
              </Form>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <Link
                to="/search"
                className="flex lg:hidden w-10 h-10 rounded-full text-black dark:text-slate-300 hover:bg-[#efefef] dark:hover:bg-slate-800 items-center justify-center"
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
