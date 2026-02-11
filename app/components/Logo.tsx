import React from 'react';
import {Link} from './Link';
import {Image} from '@shopify/hydrogen';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';
import {storeConfig} from '~/config/store';

export interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  className = 'flex-shrink-0 max-w-28 sm:max-w-32 lg:max-w-none flex text-center',
}) => {
  const rootLoaderData = useRouteLoaderData<RootLoader>('root');

  if (!rootLoaderData) {
    return null;
  }

  const shop = rootLoaderData?.layout.shop;

  return (
    <Link
      to="/"
      className={`ttnc-logo flex-shrink-0 inline-block text-slate-900 ${className}`}
    >
      <img
        src={storeConfig.logoUrl}
        alt={shop.name + ' logo'}
        className="block max-w-60 h-[35px]"
      />
    </Link>
  );
};

export default Logo;
