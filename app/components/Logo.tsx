import React from 'react';
import {Link} from './Link';
import {Image} from '@shopify/hydrogen';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';

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
        src="https://cdn.shopify.com/s/files/1/0572/4710/5098/files/Logo_cyclewear_6f22636c-8e2b-49f0-8ca3-2c7e8582bcc7.svg?v=1770484353"
        alt={shop.name + ' logo'}
        className="block max-w-60 max-h-11"
      />
    </Link>
  );
};

export default Logo;
