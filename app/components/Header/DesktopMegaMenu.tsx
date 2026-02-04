import React, {useState} from 'react';
import {Link} from '@remix-run/react';
import {XMarkIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {type EnhancedMenu, type ParentEnhancedMenuItem} from '~/lib/utils';
import Logo from '../Logo';

interface DesktopMegaMenuProps {
  menu: EnhancedMenu | null | undefined;
  onClose: () => void;
}

const DesktopMegaMenu: React.FC<DesktopMegaMenuProps> = ({menu, onClose}) => {
  const [activeLevel1, setActiveLevel1] = useState<string | null>(null);
  const [activeLevel2, setActiveLevel2] = useState<string | null>(null);

  const menuItems = menu?.items || [];

  // Get active level 1 item
  const activeL1Item = menuItems.find((item) => item.id === activeLevel1) as ParentEnhancedMenuItem | undefined;
  
  // Get active level 2 item
  const activeL2Item = activeL1Item?.items?.find((item) => item.id === activeLevel2) as ParentEnhancedMenuItem | undefined;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-slate-200">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="absolute right-8">
          <Logo />
        </div>
      </div>

      {/* Menu Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Level 1 - Main Categories */}
        <div className="w-64 border-r border-slate-200 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {menuItems.map((item) => {
              const hasChildren = 'items' in item && (item as any).items && (item as any).items.length > 0;
              const isActive = activeLevel1 === item.id;

              return (
                <div key={item.id}>
                  {hasChildren ? (
                    <button
                      className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                        isActive
                          ? 'text-rose-500 bg-rose-50'
                          : 'text-slate-900 hover:bg-slate-100'
                      }`}
                      onMouseEnter={() => {
                        setActiveLevel1(item.id);
                        setActiveLevel2(null);
                      }}
                      onClick={() => {
                        setActiveLevel1(item.id);
                        setActiveLevel2(null);
                      }}
                    >
                      <span className="font-medium">{item.title}</span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  ) : (
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className="block px-4 py-3 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                    >
                      {item.title}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Links */}
          <div className="mt-8 px-4 pt-6 border-t border-slate-200">
            <nav className="space-y-2">
              <Link
                to="/collections/all"
                onClick={onClose}
                className="block text-sm text-slate-700 hover:text-slate-900 font-medium"
              >
                Ver Todo
              </Link>
              <Link
                to="/collections/ofertas"
                onClick={onClose}
                className="block text-sm text-slate-700 hover:text-slate-900 font-medium"
              >
                Ofertas
              </Link>
              <Link
                to="/collections/nuevos"
                onClick={onClose}
                className="block text-sm text-slate-700 hover:text-slate-900 font-medium"
              >
                Nuevos
              </Link>
            </nav>
          </div>
        </div>

        {/* Level 2 - Subcategories */}
        {activeL1Item && activeL1Item.items && activeL1Item.items.length > 0 && (
          <div className="w-64 border-r border-slate-200 overflow-y-auto py-6 bg-slate-50">
            <nav className="space-y-1 px-4">
              {activeL1Item.items.map((item) => {
                const hasChildren = 'items' in item && (item as any).items && (item as any).items.length > 0;
                const isActive = activeLevel2 === item.id;

                return (
                  <div key={item.id}>
                    {hasChildren ? (
                      <button
                        className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors ${
                          isActive
                            ? 'text-rose-500 bg-white'
                            : 'text-slate-900 hover:bg-white'
                        }`}
                        onMouseEnter={() => setActiveLevel2(item.id)}
                        onClick={() => setActiveLevel2(item.id)}
                      >
                        <span className="font-medium">{item.title}</span>
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <Link
                        to={(item as any).to || '#'}
                        onClick={onClose}
                        className="block px-4 py-3 text-slate-900 hover:bg-white rounded-lg transition-colors font-medium"
                      >
                        {item.title}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        )}

        {/* Level 3 - Sub-subcategories */}
        {activeL2Item && activeL2Item.items && activeL2Item.items.length > 0 && (
          <div className="w-64 overflow-y-auto py-6 bg-white">
            <nav className="space-y-1 px-4">
              {activeL2Item.items.map((item) => (
                <Link
                  key={item.id}
                  to={(item as any).to || '#'}
                  onClick={onClose}
                  className="block px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Empty space / Featured area */}
        <div className="flex-1 bg-slate-50" />
      </div>
    </div>
  );
};

export default DesktopMegaMenu;
