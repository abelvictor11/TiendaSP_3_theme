import {Fragment, useState} from 'react';
import {useLocation, useNavigate, useNavigation, useSearchParams} from '@remix-run/react';
import type {Filter, ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {ChevronDownIcon} from '@heroicons/react/24/outline';
import {Disclosure, DisclosureButton, DisclosurePanel} from '@headlessui/react';
import Checkbox from './Checkbox';
import ButtonPrimary from './Button/ButtonPrimary';
import ButtonThird from './Button/ButtonThird';
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

  const [temporarySelectedInputs, setTemporarySelectedInputs] = useState<
    Record<string, any>
  >({});

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-24 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        
        {filters.map((filter: Filter) => {
          const isActive = appliedFilters.some((af) =>
            af.data?.id?.includes(filter.id),
          );

          const count =
            appliedFilters.filter((f) => f.data?.id?.includes(filter.id))
              .length ?? 0;

          // Skip price range for now - can be added later
          if (filter.type === 'PRICE_RANGE') {
            return null;
          }

          return (
            <Disclosure key={filter.id} defaultOpen={isActive}>
              {({open}) => (
                <div className="border-b border-neutral-200 dark:border-neutral-700 pb-4">
                  <DisclosureButton className="flex justify-between items-center w-full py-2 text-left">
                    <span className="font-medium text-sm capitalize">
                      {filter.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {count > 0 && (
                        <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
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
                  
                  <DisclosurePanel className="pt-3 space-y-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        let paramsClone = new URLSearchParams(params);

                        Object.entries(temporarySelectedInputs).forEach(
                          ([_, value]) => {
                            if (value.checked) {
                              paramsClone = filterInputToParams(
                                value.input as string,
                                paramsClone,
                              );
                            } else {
                              const rawInput = value.input as
                                | string
                                | ProductFilter;
                              const input =
                                typeof rawInput === 'string'
                                  ? (JSON.parse(rawInput) as ProductFilter)
                                  : rawInput;

                              Object.entries(input).forEach(
                                ([key, value]) => {
                                  const fullKey = FILTER_URL_PREFIX + key;
                                  paramsClone.delete(
                                    fullKey,
                                    JSON.stringify(value),
                                  );
                                },
                              );
                            }
                          },
                        );

                        navigate(
                          `${location.pathname}?${paramsClone.toString()}`,
                          {preventScrollReset: true},
                        );

                        return;
                      }}
                    >
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filter.values?.map((option, index) => {
                          const isCheckedFromServer = appliedFilters.some(
                            (af) =>
                              af.data?.id === option.id &&
                              af.label === option.label,
                          );

                          const isChecked =
                            temporarySelectedInputs[option.id + option.label]
                              ?.checked ?? isCheckedFromServer;

                          return (
                            <div key={`${index + option.id}`}>
                              <Checkbox
                                data-input={option.input as string}
                                name={option.label}
                                label={option.label}
                                checked={isChecked}
                                labelClassName="capitalize text-sm"
                                onChange={(event) => {
                                  setTemporarySelectedInputs({
                                    ...temporarySelectedInputs,
                                    [option.id + option.label]: {
                                      ...option,
                                      checked: event.target.checked,
                                    },
                                  });
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-3 flex items-center gap-2">
                        <ButtonThird
                          type="button"
                          onClick={() => {
                            const newVal = filter.values?.reduce(
                              (acc, option) => {
                                return {
                                  ...acc,
                                  [option.id + option.label]: {
                                    ...option,
                                    checked: false,
                                  },
                                };
                              },
                              {},
                            );

                            setTemporarySelectedInputs(newVal);
                          }}
                          sizeClass="!px-3 !py-1.5 text-xs"
                        >
                          Clear
                        </ButtonThird>
                        <ButtonPrimary
                          type="submit"
                          sizeClass="px-3 py-1.5 text-xs"
                          loading={LOADING}
                        >
                          Apply
                        </ButtonPrimary>
                      </div>
                    </form>
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
