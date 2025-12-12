import {useLocation, useNavigate, useNavigation, useSearchParams} from '@remix-run/react';
import type {Filter, ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {Disclosure, DisclosureButton, DisclosurePanel} from '@headlessui/react';
import Checkbox from './Checkbox';
import clsx from 'clsx';
import {FILTER_URL_PREFIX, filterInputToParams} from './SortFilter';
import type {DefaultPriceFilter} from './SortFilter';

interface FiltersSidebarProps {
  filters: Filter[];
  appliedFilters: any[];
  defaultPriceFilter?: DefaultPriceFilter;
}

export default function FiltersSidebar({
  filters,
  appliedFilters,
  defaultPriceFilter,
}: FiltersSidebarProps) {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const LOADING = navigation.state === 'loading';

  // Apply filter immediately when checkbox changes
  const handleFilterChange = (option: any, isChecked: boolean) => {
    let paramsClone = new URLSearchParams(params);

    if (isChecked) {
      // Add filter
      paramsClone = filterInputToParams(option.input as string, paramsClone);
    } else {
      // Remove filter
      const rawInput = option.input as string | ProductFilter;
      const input =
        typeof rawInput === 'string'
          ? (JSON.parse(rawInput) as ProductFilter)
          : rawInput;

      Object.entries(input).forEach(([key, value]) => {
        const fullKey = FILTER_URL_PREFIX + key;
        paramsClone.delete(fullKey, JSON.stringify(value));
      });
    }

    navigate(`${location.pathname}?${paramsClone.toString()}`, {
      preventScrollReset: true,
    });
  };

  // Handle wheel event to prevent propagation when scrolling inside sidebar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isScrollable = target.scrollHeight > target.clientHeight;
    
    if (isScrollable) {
      const isAtTop = target.scrollTop === 0;
      const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight;
      
      // Prevent scroll propagation unless at boundaries
      if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
        e.stopPropagation();
      }
    }
  };

  return (
    <aside 
      className="w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-32 lg:self-start lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:overscroll-contain pr-2"
      onWheel={handleWheel}
    >
      <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-white dark:bg-neutral-900 py-2 z-10">Filters</h3>
      
      <div className="space-y-1 pb-4">
        {filters.map((filter: Filter) => {
          const count =
            appliedFilters.filter((f) => f.data?.id?.includes(filter.id))
              .length ?? 0;

          // Skip price range for now - can be added later
          if (filter.type === 'PRICE_RANGE') {
            return null;
          }

          return (
            <Disclosure key={filter.id} defaultOpen>
              {({open}) => (
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-3">
                  <DisclosureButton className="flex justify-between items-center w-full py-2 text-left">
                    <span className="font-medium text-sm capitalize">
                      {filter.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {count}
                        </span>
                      )}
                      <ChevronDownIcon
                        className={clsx(
                          'w-4 h-4 transition-transform',
                          open && 'rotate-180',
                        )}
                      />
                    </div>
                  </DisclosureButton>
                  
                  <DisclosurePanel className="pt-2" static>
                    <div className="space-y-2">
                      {filter.values?.map((option, index) => {
                        const isChecked = appliedFilters.some(
                          (af) =>
                            af.data?.id === option.id &&
                            af.label === option.label,
                        );

                        return (
                          <div 
                            key={`${index + option.id}`}
                            className={clsx(
                              'transition-opacity',
                              LOADING && 'opacity-50 pointer-events-none'
                            )}
                          >
                            <Checkbox
                              data-input={option.input as string}
                              name={option.label}
                              label={option.label}
                              checked={isChecked}
                              labelClassName="capitalize text-sm"
                              onChange={(event) => {
                                handleFilterChange(option, event.target.checked);
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </DisclosurePanel>
                </div>
              )}
            </Disclosure>
          );
        })}
      </div>
    </aside>
  );
}
