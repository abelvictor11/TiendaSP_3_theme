import {ChevronDownIcon} from '@heroicons/react/24/solid';
import {BuildingStorefrontIcon} from '@heroicons/react/24/outline';
import {type FC, useState} from 'react';
import {Link} from '@remix-run/react';
import {useRouteLoaderData} from '@remix-run/react';
import type {RootLoader} from '~/root';
import NcModal from '../NcModal';

interface Brand {
  id: string;
  handle: string;
  name?: { value: string };
  slug?: { value: string };
  logo?: { reference?: { image?: { url: string; altText?: string } } };
  count?: number;
}

interface VendorsDropdownProps {
  panelClassName?: string;
  className?: string;
  brands?: Brand[];
}

const VendorsDropdown: FC<VendorsDropdownProps> = ({
  panelClassName = '',
  className = '',
  brands = [],
}) => {
  const rootData = useRouteLoaderData<RootLoader>('root');
  const storeDomain = rootData?.publicStoreSubdomain || rootData?.publicStoreDomain || '';
  const baseUrl = storeDomain.startsWith('http') ? storeDomain : `https://${storeDomain}`;

  const [letterFilter, setLetterFilter] = useState<string | null>(null);

  // Get unique first letters for alphabet navigation
  const letters = Array.from(
    new Set(
      brands.map((b) => (b.name?.value || b.handle).charAt(0).toUpperCase())
    )
  ).sort();

  const filteredBrands = letterFilter
    ? brands.filter((b) => (b.name?.value || b.handle).charAt(0).toUpperCase() === letterFilter)
    : brands;

  const renderBrands = (close: () => void) => {
    return (
      <div>
        {/* Alphabet filter */}
        {letters.length > 5 && (
          <div className="flex flex-wrap gap-1 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => setLetterFilter(null)}
              className={`px-2 py-1 text-xs font-medium rounded ${
                !letterFilter
                  ? 'bg-black text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              } transition-colors`}
            >
              Todas
            </button>
            {letters.map((letter) => (
              <button
                key={letter}
                onClick={() => setLetterFilter(letter === letterFilter ? null : letter)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  letterFilter === letter
                    ? 'bg-black text-white'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                } transition-colors`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        {/* Brands grid */}
        <div className="grid gap-x-1 md:gap-x-4 gap-y-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredBrands.map((brand) => {
            const name = brand.name?.value || brand.handle;
            const slug = brand.slug?.value || name;
            // Use metaobject logo if available, otherwise use CDN SVG pattern
            const metaobjectLogoUrl = brand.logo?.reference?.image?.url;
            const vendorSlug = name.toLowerCase().replace(/\s+/g, '-');
            const cdnLogoUrl = `${baseUrl}/cdn/shop/t/73/assets/${vendorSlug}.svg`;
            const logoUrl = metaobjectLogoUrl || cdnLogoUrl;
            
            return (
              <Link
                key={brand.id}
                to={`/search?q=&productVendor=${encodeURIComponent(slug)}`}
                onClick={close}
                className="flex flex-shrink-0 flex-1 w-full items-center gap-3 p-2 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 opacity-80 hover:opacity-100"
              >
                <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                  <img
                    src={logoUrl}
                    alt={name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center text-xs font-bold text-neutral-500"
                    style={{display: 'none'}}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="grid text-left min-w-0">
                  <span className="text-sm font-medium truncate">{name}</span>
                  {brand.count != null && (
                    <span className="text-xs text-neutral-400">{brand.count} productos</span>
                  )}
                </div>
              </Link>
            );
          })}
          {filteredBrands.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full text-center py-4">
              No hay marcas disponibles
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={'VendorsDropdown ' + className}>
      <NcModal
        renderTrigger={(openModal) => {
          return (
            <button
              className={`text-black group h-10 sm:h-12 px-3 py-1.5 inline-flex items-center text-sm text-gray-800 dark:text-neutral-200 font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
              onClick={openModal}
            >
              <BuildingStorefrontIcon className="w-6 h-6" />
              <span className="ms-2">Marcas</span>
              <ChevronDownIcon
                className={
                  'text-black ms-1 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150'
                }
                aria-hidden="true"
              />
            </button>
          );
        }}
        renderContent={(closeModal) => renderBrands(closeModal)}
        modalTitle="Marcas"
      />
    </div>
  );
};

export default VendorsDropdown;
