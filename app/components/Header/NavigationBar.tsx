import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import {ChevronDownIcon} from '@heroicons/react/24/solid';
import {Fragment} from 'react';
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
    <div className="nc-NavigationBar bg-white dark:bg-slate-900 border-t border-slate-200/70 dark:border-slate-700">
      <div className="container relative">
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
            className="inline-flex items-center text-sm lg:text-base font-medium text-slate-700 dark:text-slate-300 py-4 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </Link>
        ) : (
          <a
            href={menuItem.to}
            target={menuItem.target}
            className="inline-flex items-center text-sm lg:text-base font-medium text-slate-700 dark:text-slate-300 py-4 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
          >
            {menuItem.title}
          </a>
        )}
      </li>
    );
  }

  // Dropdown with megamenu
  return (
    <Popover as="li" className="static">
      {({open, close}) => (
        <>
          <PopoverButton
            className={`
              ${open ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'}
              group inline-flex items-center text-sm lg:text-base font-medium py-4 px-4 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg focus:outline-none transition-colors`}
          >
            <span>{menuItem.title}</span>
            <ChevronDownIcon
              className={`${open ? '-rotate-180' : ''}
                ml-1 h-4 w-4 transition ease-in-out duration-150`}
              aria-hidden="true"
            />
          </PopoverButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel className="absolute z-20 left-0 right-0 mt-3">
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
                                className="font-medium text-slate-900 dark:text-neutral-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                onClick={close}
                              >
                                {subItem.title}
                              </Link>
                            ) : (
                              <a
                                href={subItem.to}
                                target={subItem.target}
                                className="block group"
                                onClick={close}
                              >
                                <p className="font-medium text-slate-900 dark:text-neutral-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {subItem.title}
                                </p>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Featured Collection (optional) */}
                    {headerData?.featuredCollections?.nodes?.[0] && (
                      <div className="hidden xl:block w-[300px]">
                        <CollectionItem
                          onClick={close}
                          item={headerData.featuredCollections.nodes[0]}
                        />
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
