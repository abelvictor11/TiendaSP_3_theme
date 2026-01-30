import {ChevronDownIcon} from '@heroicons/react/24/solid';
import {BuildingStorefrontIcon} from '@heroicons/react/24/outline';
import {type FC} from 'react';
import {Link} from '@remix-run/react';
import NcModal from '../NcModal';

interface VendorsDropdownProps {
  panelClassName?: string;
  className?: string;
  vendors?: string[];
}

const VendorsDropdown: FC<VendorsDropdownProps> = ({
  panelClassName = '',
  className = '',
  vendors = [],
}) => {

  const renderVendors = (close: () => void) => {
    return (
      <div className="grid gap-x-1 md:gap-x-4 gap-y-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {vendors.map((vendor: string) => (
          <Link
            key={vendor}
            to={`/search?q=&productVendor=${encodeURIComponent(vendor)}`}
            onClick={close}
            className="flex flex-shrink-0 flex-1 w-full items-center p-2 transition duration-150 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-orange-500 focus-visible:ring-opacity-50 opacity-80 hover:opacity-100"
          >
            <div className="grid text-left">
              <span className="text-sm font-medium">{vendor}</span>
            </div>
          </Link>
        ))}
        {vendors.length === 0 && (
          <p className="text-sm text-gray-500 col-span-full text-center py-4">
            No hay marcas disponibles
          </p>
        )}
      </div>
    );
  };

  return (
    <div className={'VendorsDropdown ' + className}>
      <NcModal
        renderTrigger={(openModal) => {
          return (
            <button
              className={`text-opacity-80 group h-10 sm:h-12 px-3 py-1.5 inline-flex items-center text-sm text-gray-800 dark:text-neutral-200 font-medium hover:text-opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
              onClick={openModal}
            >
              <BuildingStorefrontIcon className="w-[18px] h-[18px] opacity-80" />
              <span className="ms-2">Marcas</span>
              <ChevronDownIcon
                className={
                  'text-opacity-70 ms-1 h-4 w-4 group-hover:text-opacity-80 transition ease-in-out duration-150'
                }
                aria-hidden="true"
              />
            </button>
          );
        }}
        renderContent={(closeModal) => renderVendors(closeModal)}
        modalTitle="Selecciona una marca"
      />
    </div>
  );
};

export default VendorsDropdown;
