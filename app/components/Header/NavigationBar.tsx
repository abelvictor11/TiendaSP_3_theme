import {ChevronDownIcon} from '@heroicons/react/24/solid';
import {useState, useRef} from 'react';
import {Link} from '@remix-run/react';
import type {ParentEnhancedMenuItem, ChildEnhancedMenuItem} from '~/lib/utils';
import CollectionItem from '../CollectionItem';
import type {HeaderMenuQuery} from 'storefrontapi.generated';

interface NavigationBarProps {
  headerMenu?: ParentEnhancedMenuItem[] | null;
  headerData?: HeaderMenuQuery;
}

export default function NavigationBar({headerMenu, headerData}: NavigationBarProps) {
  // Early return if no menu
  if (!headerMenu || !Array.isArray(headerMenu) || headerMenu.length === 0) {
    return null;
  }

  return (
    <div className="nc-NavigationBar bg-white dark:bg-secondary-800 border-t border-[#dacac7]/70 dark:border-slate-700">
      <div className="container-fluid relative">
        <nav className="nc-Navigation flex justify-center items-center py-0">
          <ul className="nc-Navigation hidden lg:flex items-center space-x-1">
            {headerMenu.map((item, index) => (
              <NavItem
                key={item.id + '-' + index.toString()}
                menuItem={item}
                headerData={headerData}
              />
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  menuItem,
  headerData,
}: {
  menuItem: ParentEnhancedMenuItem;
  headerData?: HeaderMenuQuery;
}) {
  const hasChildren = menuItem.items && menuItem.items.length > 0;

  if (!hasChildren) {
    // Simple link without dropdown
    return (
      <li>
        {!menuItem.to.startsWith('http') ? (
          <Link
            to={menuItem.to}
            target={menuItem.target}
            prefetch="intent"
            className="inline-flex items-center text-sm font-medium text-[#131210] dark:text-slate-300 py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-secondary-700 hover:text-secondary-800 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </Link>
        ) : (
          <a
            href={menuItem.to}
            target={menuItem.target}
            className="inline-flex items-center text-sm font-medium text-[#131210] dark:text-slate-300 py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-secondary-700 hover:text-secondary-800 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </a>
        )}
      </li>
    );
  }

  // Dropdown with megamenu - hover to open, click to navigate
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 150); // Small delay to allow moving to the panel
  };

  return (
    <li 
      className="group/nav static"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Link - Click navigates to collection */}
      {!menuItem.to.startsWith('http') ? (
        <Link
          to={menuItem.to}
          prefetch="intent"
          className={`
            ${isHovered ? 'text-secondary-800 dark:text-slate-100 bg-[#F9F7F7] dark:bg-secondary-700' : 'text-[#131210] dark:text-slate-300'}
            group inline-flex items-center text-sm font-medium py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-secondary-700 hover:text-secondary-800 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''}
              ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </Link>
      ) : (
        <a
          href={menuItem.to}
          target={menuItem.target}
          className={`
            ${isHovered ? 'text-secondary-800 dark:text-slate-100 bg-[#F9F7F7] dark:bg-secondary-700' : 'text-[#131210] dark:text-slate-300'}
            group inline-flex items-center text-sm font-medium py-4 px-4 hover:bg-[#F9F7F7] dark:hover:bg-secondary-700 hover:text-secondary-800 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
        >
          <span>{menuItem.title}</span>
          <ChevronDownIcon
            className={`${isHovered ? '-rotate-180' : ''}
              ml-1 h-4 w-4 transition ease-in-out duration-150`}
            aria-hidden="true"
          />
        </a>
      )}

      {/* Megamenu Panel - Shows on hover */}
      {isHovered && (
        <div 
          className="absolute z-50 left-0 right-0 top-full pt-3"
          style={{position: 'absolute'}}
        >
            <div className="container">
              <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-2xl overflow-hidden">
                <div className="relative px-6 py-8 lg:px-8 lg:py-10">
                  <div className="flex gap-8">
                    {/* Menu Items Grid */}
                    <div className="flex-1">
                      <div className="grid grid-cols-4 gap-6 xl:gap-8">
                        {menuItem.items?.map((subItem: ChildEnhancedMenuItem, idx) => (
                          <div key={subItem.id + '-' + idx}>
                            {!subItem.to.startsWith('http') ? (
                              <Link
                                to={subItem.to}
                                target={subItem.target}
                                prefetch="intent"
                                className="font-medium text-secondary-800 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                onClick={() => setIsHovered(false)}
                              >
                                {subItem.title}
                              </Link>
                            ) : (
                              <a
                                href={subItem.to}
                                target={subItem.target}
                                className="block group"
                                onClick={() => setIsHovered(false)}
                              >
                                <p className="font-medium text-secondary-800 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {subItem.title}
                                </p>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Featured Collection - matched to this menu item */}
                    {(() => {
                      const collections = headerData?.featuredCollections?.nodes;
                      if (!collections?.length) return null;
                      // Extract collection handle from menu item URL (e.g. /collections/ropa-de-ciclismo -> ropa-de-ciclismo)
                      const menuHandle = menuItem.to.replace(/^\/collections\//, '').replace(/\/$/, '');
                      const matched = collections.find((c) => c.handle === menuHandle);
                      const collectionToShow = matched || collections[0];
                      return (
                        <div className="hidden xl:block w-[300px]">
                          <CollectionItem
                            onClick={() => setIsHovered(false)}
                            item={collectionToShow}
                          />
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
      )}
    </li>
  );
}
