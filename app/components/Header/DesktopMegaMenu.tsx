import React, {useState} from 'react';
import {Link} from '@remix-run/react';
import {XMarkIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {type EnhancedMenu, type ParentEnhancedMenuItem} from '~/lib/utils';

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

  // Check if level 2 has items
  const hasLevel2 = activeL1Item && activeL1Item.items && activeL1Item.items.length > 0;
  
  // Check if level 3 has items
  const hasLevel3 = activeL2Item && (activeL2Item as any).items && (activeL2Item as any).items.length > 0;

  // Calculate number of visible columns
  const visibleColumns = 1 + (hasLevel2 ? 1 : 0) + (hasLevel3 ? 1 : 0);

  return (
    <div className="h-full bg-white shadow-2xl flex flex-col transition-all duration-300" style={{width: `${visibleColumns * 280}px`, maxWidth: '100vw'}}>
      {/* Header - Solo botón cerrar */}
      <div className="flex items-center px-6 py-4 border-b border-slate-200">
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#efefef] rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Menu Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Level 1 - Main Categories */}
        <div className={`w-[280px] overflow-y-auto py-6 ${hasLevel2 ? 'border-r border-slate-200' : ''}`}>
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
                          ? 'text-black font-bold bg-[#efefef]'
                          : 'text-slate-900 hover:bg-[#efefef]'
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
                      className="block px-4 py-3 text-slate-900 hover:bg-[#efefef] rounded-lg transition-colors font-medium"
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
          <div className="w-[280px] border-r border-slate-200 overflow-y-auto py-6 bg-slate-50">
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
        {hasLevel3 && (
          <div className="w-[280px] overflow-y-auto py-6 bg-white border-r border-slate-200">
            <nav className="space-y-1 px-4">
              {(activeL2Item as any).items.map((item: any) => (
                <Link
                  key={item.id}
                  to={item.to || '#'}
                  onClick={onClose}
                  className="block px-4 py-3 text-slate-700 hover:text-slate-900 hover:bg-[#efefef] rounded-lg transition-colors"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Footer with quick actions */}
      <div className="border-t border-slate-200 px-6 py-4 flex items-center gap-6">
        <Link to="/account" onClick={onClose} className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          Cuenta
        </Link>
        <Link to="/wishlist" onClick={onClose} className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Favoritos
        </Link>
      </div>
    </div>
  );
};

export default DesktopMegaMenu;
