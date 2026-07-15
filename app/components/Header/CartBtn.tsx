import {Suspense, useMemo} from 'react';
import {useIsHydrated} from '~/hooks/useIsHydrated';
import {Link} from '../Link';
import {ShoppingBagIcon} from '@heroicons/react/24/outline';
import {Await, useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';

interface CartBtnProps {
  openCart: () => void;
}

export default function CartBtn({openCart}: CartBtnProps) {
  const rootData = useRouteLoaderData<RootLoader>('root');

  return (
    <Suspense fallback={<Badge count={0} openCart={openCart} />}>
      <Await resolve={rootData?.cart}>
        {(cart) => (
          <Badge openCart={openCart} count={cart?.totalQuantity || 0} />
        )}
      </Await>
    </Suspense>
  );
}

function Badge({openCart, count}: {count: number; openCart: () => void}) {
  const isHydrated = useIsHydrated();

  const BadgeCounter = useMemo(
    () => (
      <>
        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex items-center justify-center bg-primary-500 absolute top-1.5 right-1.5 rounded-full text-[9px] sm:text-[10px] leading-none text-white font-medium ring ring-white">
          <span className="mt-[1px]">{count}</span>
        </div>
        <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6" />
      </>
    ),
    [count],
  );

  return isHydrated ? (
    <>
      <button
        onClick={openCart}
        className="group w-10 h-10 sm:w-12 sm:h-12 hover:bg-[#efefef] dark:hover:bg-slate-800 rounded-xl hidden md:inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 relative"
      >
        {BadgeCounter}
      </button>
      <Link
        to="/cart"
        className="group w-10 h-10 sm:w-12 sm:h-12 hover:bg-[#efefef] dark:hover:bg-slate-800 rounded-xl inline-flex md:hidden items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 relative"
      >
        {BadgeCounter}
      </Link>
    </>
  ) : (
    <Link
      to="/cart"
      className="group w-10 h-10 sm:w-12 sm:h-12 hover:bg-[#efefef] dark:hover:bg-slate-800 rounded-xl inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 relative"
    >
      {BadgeCounter}
    </Link>
  );
}
