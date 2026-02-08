import {type FC} from 'react';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';
import {Link} from '~/components/Link';

interface VendorLogoProps {
  vendor: string;
  className?: string;
  fallbackClassName?: string;
}

const VendorLogo: FC<VendorLogoProps> = ({
  vendor,
  className = 'h-5 w-auto',
  fallbackClassName = 'text-[10px] font-medium uppercase tracking-wide text-slate-600',
}) => {
  if (!vendor) return null;

  const rootData = useRouteLoaderData<RootLoader>('root');
  const storeDomain = rootData?.publicStoreSubdomain || rootData?.publicStoreDomain || '';
  const vendorSlug = vendor.toLowerCase().replace(/\s+/g, '-');
  const baseUrl = storeDomain.startsWith('http') ? storeDomain : `https://${storeDomain}`;
  const logoUrl = `${baseUrl}/cdn/shop/t/73/assets/${vendorSlug}.svg`;

  const vendorUrl = `/collections/${vendorSlug}`;

  return (
    <Link to={vendorUrl} className="inline-block hover:opacity-80 transition-opacity">
      <img
        src={logoUrl}
        alt={vendor}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'block';
          }
        }}
      />
    </Link>
  );
};

export const VendorLogoWithFallback: FC<VendorLogoProps> = ({
  vendor,
  className = 'h-5 w-auto max-w-[80px] object-contain',
  fallbackClassName = 'text-[10px] font-medium uppercase tracking-wide text-slate-600',
}) => {
  if (!vendor) return null;

  const rootData = useRouteLoaderData<RootLoader>('root');
  const storeDomain = rootData?.publicStoreSubdomain || rootData?.publicStoreDomain || '';
  const vendorSlug = vendor.toLowerCase().replace(/\s+/g, '-');
  const baseUrl = storeDomain.startsWith('http') ? storeDomain : `https://${storeDomain}`;
  const logoUrl = `${baseUrl}/cdn/shop/t/73/assets/${vendorSlug}.svg`;

  const vendorUrl = `/collections/${vendorSlug}`;

  return (
    <Link to={vendorUrl} className="inline-block hover:opacity-80 transition-opacity">
      <div className="vendor-logo-container">
        <img
          src={logoUrl}
          alt={vendor}
          className={className}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) {
              fallback.style.display = 'inline';
            }
          }}
        />
        <span className={fallbackClassName} style={{display: 'none'}}>
          {vendor}
        </span>
      </div>
    </Link>
  );
};

export default VendorLogo;
