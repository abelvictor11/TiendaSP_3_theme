import type {FC} from 'react';
import {storeConfig} from '~/config/store';

interface BrandSwitcherProps {
  className?: string;
}

const BrandSwitcher: FC<BrandSwitcherProps> = ({className = ''}) => {
  const stores =
    'sisterStores' in storeConfig ? storeConfig.sisterStores : [];

  if (!stores.length) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 border-l border-white/20 ${className}`}
    >
      {stores.map((store) => (
        <a
          key={store.id}
          href={store.url}
          target="_blank"
          rel="noopener noreferrer"
          title={store.name}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-200"
        >
          <img
            src={store.logo}
            alt={store.name}
            className="h-[18px] w-auto max-w-[90px] object-contain"
          />
        </a>
      ))}
    </div>
  );
};

export default BrandSwitcher;
