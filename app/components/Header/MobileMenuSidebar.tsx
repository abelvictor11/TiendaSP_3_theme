import {type FC, useState} from 'react';
import {XMarkIcon, ChevronRightIcon, ChevronLeftIcon} from '@heroicons/react/24/outline';
import {HeartIcon, UserIcon, ShoppingBagIcon} from '@heroicons/react/24/outline';
import {Link} from '@remix-run/react';
import {type ParentEnhancedMenuItem, type ChildEnhancedMenuItem} from '~/lib/utils';
import {useAside} from '../Aside';

type MenuItem = ParentEnhancedMenuItem | ChildEnhancedMenuItem;

interface MobileMenuSidebarProps {
  menu?: ParentEnhancedMenuItem[];
  onClose?: () => void;
}

const MobileMenuSidebar: FC<MobileMenuSidebarProps> = ({menu = [], onClose}) => {
  const [activeLevel1, setActiveLevel1] = useState<ParentEnhancedMenuItem | null>(null);
  const [activeLevel2, setActiveLevel2] = useState<ParentEnhancedMenuItem | null>(null);
  const {open} = useAside();

  const handleLevel1Click = (item: ParentEnhancedMenuItem) => {
    if (item.items && item.items.length > 0) {
      setActiveLevel1(item);
      setActiveLevel2(null);
    } else {
      onClose?.();
    }
  };

  const handleLevel2Click = (item: ParentEnhancedMenuItem) => {
    if (item.items && item.items.length > 0) {
      setActiveLevel2(item);
    } else {
      onClose?.();
    }
  };

  const handleBack = () => {
    if (activeLevel2) {
      setActiveLevel2(null);
    } else if (activeLevel1) {
      setActiveLevel1(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        {(activeLevel1 || activeLevel2) ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Volver</span>
          </button>
        ) : (
          <span className="text-lg font-semibold text-slate-900 dark:text-white">Menú</span>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#efefef] dark:hover:bg-slate-800"
        >
          <XMarkIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Menu Content */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {/* Level 1 */}
          <div
            className={`w-full flex-shrink-0 overflow-y-auto transition-transform duration-300 ${
              activeLevel1 ? '-translate-x-full' : 'translate-x-0'
            }`}
            style={{minWidth: '100%'}}
          >
            <ul className="py-2">
              {menu.map((item) => (
                <li key={item.id}>
                  {item.items && item.items.length > 0 ? (
                    <button
                      onClick={() => handleLevel1Click(item)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className={`text-base font-medium ${activeLevel1?.id === item.id ? 'text-primary-600' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </span>
                      <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  ) : (
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-base font-medium text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Level 2 */}
          {activeLevel1 && (
            <div
              className={`w-full flex-shrink-0 overflow-y-auto transition-transform duration-300 ${
                activeLevel2 ? '-translate-x-full' : 'translate-x-0'
              }`}
              style={{minWidth: '100%', marginLeft: '-100%'}}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {activeLevel1.title}
                </h3>
              </div>
              <ul className="py-2">
                {activeLevel1.items?.map((item) => {
                  const itemWithChildren = item as any;
                  const hasChildren = itemWithChildren.items && itemWithChildren.items.length > 0;
                  
                  return (
                    <li key={item.id}>
                      {hasChildren ? (
                        <button
                          onClick={() => handleLevel2Click(itemWithChildren)}
                          className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className={`text-base ${activeLevel2?.id === item.id ? 'text-primary-600 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                            {item.title}
                          </span>
                          <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                        </button>
                      ) : (
                        <Link
                          to={(item as ChildEnhancedMenuItem).to}
                          onClick={onClose}
                          className="w-full flex items-center px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <span className="text-base text-slate-700 dark:text-slate-300">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </li>
                  );
                })}
                {/* View All link */}
                <li className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to={activeLevel1.to}
                    onClick={onClose}
                    className="block px-6 py-3 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Ver todo en {activeLevel1.title}
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Level 3 */}
          {activeLevel2 && (
            <div
              className="w-full flex-shrink-0 overflow-y-auto"
              style={{minWidth: '100%', marginLeft: '-200%'}}
            >
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {activeLevel2.title}
                </h3>
              </div>
              <ul className="py-2">
                {activeLevel2.items?.map((item) => {
                  const itemTyped = item as ChildEnhancedMenuItem;
                  return (
                    <li key={item.id}>
                      <Link
                        to={itemTyped.to}
                        onClick={onClose}
                        className="w-full flex items-center px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span className="text-base text-slate-700 dark:text-slate-300">
                          {item.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {/* View All link */}
                <li className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Link
                    to={activeLevel2.to}
                    onClick={onClose}
                    className="block px-6 py-3 text-sm font-semibold text-primary-600 hover:text-primary-700"
                  >
                    Ver todo en {activeLevel2.title}
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center justify-around py-4">
          <Link
            to="/wishlist"
            onClick={onClose}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <HeartIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Favoritos</span>
          </Link>
          <Link
            to="/account"
            onClick={onClose}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <UserIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Cuenta</span>
          </Link>
          <button
            onClick={() => {
              onClose?.();
              setTimeout(() => open('cart'), 100);
            }}
            className="flex flex-col items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <ShoppingBagIcon className="w-6 h-6" />
            <span className="text-xs font-medium">Carrito</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuSidebar;
