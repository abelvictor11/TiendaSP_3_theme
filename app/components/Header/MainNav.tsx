import {type FC} from 'react';
import LangDropdown from './LangDropdown';
import AvatarDropdown from './AvatarDropdown';
import Logo from '../Logo';
import CartBtn from './CartBtn';
import {MagnifyingGlassIcon} from '../Icons/MyIcons';
import clsx from 'clsx';
import {Bars3Icon} from '@heroicons/react/24/outline';
import {Link} from '../Link';
import {useAside} from '../Aside';

export interface Props {
  className?: string;
  isHome?: boolean;
}

const MainNav: FC<Props> = ({className = '', isHome}) => {
  const {type: activeType, close, open} = useAside();

  return (
    <div
      className={clsx(
        className,
        'nc-MainNav2 relative z-10 bg-white dark:bg-slate-900',
      )}
    >
      <div className="container">
        <div className="h-16 sm:h-20 flex justify-between items-center">
          {/* Mobile Menu Button */}
          <div className="flex items-center lg:hidden">
            <button
              className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              onClick={() => open('mobile')}
              type="button"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" aria-hidden="true" />
            </button>
          </div>

          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex items-center justify-center lg:justify-start flex-1 lg:flex-initial">
            <Logo />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LangDropdown className="hidden md:block" />
            <Link
              to={'/search'}
              className="flex w-10 h-10 sm:w-12 sm:h-12 rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none items-center justify-center"
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
