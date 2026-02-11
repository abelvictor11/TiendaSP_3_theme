import {useLocation, useNavigate, useNavigation, useSearchParams} from '@remix-run/react';
import type {Filter, ProductFilter} from '@shopify/hydrogen/storefront-api-types';
import {ChevronDownIcon} from '@heroicons/react/24/outline';
import Checkbox from './Checkbox';
import clsx from 'clsx';
import {FILTER_URL_PREFIX, filterInputToParams} from './SortFilter';
import type {DefaultPriceFilter} from './SortFilter';
import {useState} from 'react';

// Color map for color swatches
const COLOR_MAP: Record<string, string> = {
  negro: '#000000',
  black: '#000000',
  azul: '#0052CC',
  blue: '#0052CC',
  marrón: '#8B7355',
  marron: '#8B7355',
  brown: '#8B7355',
  cafe: '#8B7355',
  café: '#8B7355',
  verde: '#00875A',
  green: '#00875A',
  gris: '#6B778C',
  gray: '#6B778C',
  grey: '#6B778C',
  naranja: '#FF991F',
  orange: '#FF991F',
  rosa: '#FFCDD2',
  pink: '#FFCDD2',
  púrpura: '#8B008B',
  purpura: '#8B008B',
  purple: '#8B008B',
  morado: '#8B008B',
  rojo: '#DE350B',
  red: '#DE350B',
  blanco: '#FFFFFF',
  white: '#FFFFFF',
  amarillo: '#FFD700',
  yellow: '#FFD700',
  neutral: '#C4C4C4',
  beige: '#D4C4A8',
  dorado: '#FFD700',
  gold: '#FFD700',
  plateado: '#C0C0C0',
  silver: '#C0C0C0',
  turquesa: '#40E0D0',
  turquoise: '#40E0D0',
  coral: '#FF7F50',
  lima: '#32CD32',
  lime: '#32CD32',
  oliva: '#808000',
  olive: '#808000',
  aguamarina: '#7FFFD4',
  aqua: '#00FFFF',
  cyan: '#00FFFF',
};

// Get color from label
function getColorFromLabel(label: string): string | null {
  const normalizedLabel = label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  for (const [colorName, colorValue] of Object.entries(COLOR_MAP)) {
    const normalizedColorName = colorName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedLabel.includes(normalizedColorName)) {
      return colorValue;
    }
  }
  return null;
}

// Check if filter is a color filter
function isColorFilter(filter: Filter): boolean {
  const label = filter.label.toLowerCase();
  return label === 'color' || label === 'colors' || label === 'colour' || label === 'colours' || label.startsWith('color ');
}

// Check if filter is a size filter
function isSizeFilter(filter: Filter): boolean {
  const sizeLabels = ['talla', 'tallas', 'size', 'sizes', 'tamaño', 'tamaños'];
  return sizeLabels.includes(filter.label.toLowerCase());
}

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
  const hasActiveFilters = appliedFilters.length > 0;

  // Track expanded "show more" state for each filter
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({});
  // Track collapsed state for each filter section (all open by default)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (filterId: string) => {
    setCollapsedSections(prev => ({...prev, [filterId]: !prev[filterId]}));
  };

  // Apply filter immediately when checkbox changes
  const handleFilterChange = (option: any, isChecked: boolean) => {
    let paramsClone = new URLSearchParams(params);

    if (isChecked) {
      paramsClone = filterInputToParams(option.input as string, paramsClone);
    } else {
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

  // Render color filter with swatches
  const renderColorFilter = (filter: Filter, options: any[], isExpanded: boolean) => {
    const initialOptions = options.slice(0, 9);
    const extraOptions = options.slice(9);
    const hasMore = extraOptions.length > 0;

    return (
      <div className="pt-2">
        <div className="grid grid-cols-3 gap-3">
          {initialOptions.map((option, index) => {
            const isChecked = appliedFilters.some(
              (af) => af.data?.id === option.id && af.label === option.label,
            );
            const color = getColorFromLabel(option.label);
            const isWhite = color === '#FFFFFF';

            return (
              <button
                key={`${index}-${option.id}`}
                onClick={() => handleFilterChange(option, !isChecked)}
                className={clsx(
                  'flex flex-col items-center gap-2 p-2 rounded-lg transition-all',
                  LOADING && 'opacity-50 pointer-events-none',
                  isChecked && 'bg-[#efefef] dark:bg-slate-800',
                )}
              >
                <div
                  className={clsx(
                    'w-12 h-12 rounded-full transition-all',
                    isWhite ? 'border border-slate-300' : '',
                    isChecked && 'ring-2 ring-offset-2 ring-black',
                  )}
                  style={{backgroundColor: color || '#C4C4C4'}}
                />
                <span className="text-xs text-center truncate w-full">
                  {option.label.length > 7 ? option.label.slice(0, 7) + '...' : option.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* Animated extra options */}
        {hasMore && (
          <div
            className={clsx(
              'grid transition-all duration-300 ease-in-out',
              isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                {extraOptions.map((option, index) => {
                  const isChecked = appliedFilters.some(
                    (af) => af.data?.id === option.id && af.label === option.label,
                  );
                  const color = getColorFromLabel(option.label);
                  const isWhite = color === '#FFFFFF';

                  return (
                    <button
                      key={`extra-${index}-${option.id}`}
                      onClick={() => handleFilterChange(option, !isChecked)}
                      className={clsx(
                        'flex flex-col items-center gap-2 p-2 rounded-lg transition-all',
                        LOADING && 'opacity-50 pointer-events-none',
                        isChecked && 'bg-[#efefef] dark:bg-slate-800',
                      )}
                    >
                      <div
                        className={clsx(
                          'w-12 h-12 rounded-full transition-all',
                          isWhite ? 'border border-slate-300' : '',
                          isChecked && 'ring-2 ring-offset-2 ring-black',
                        )}
                        style={{backgroundColor: color || '#C4C4C4'}}
                      />
                      <span className="text-xs text-center truncate w-full">
                        {option.label.length > 7 ? option.label.slice(0, 7) + '...' : option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {hasMore && (
          <button
            onClick={() => setExpandedFilters(prev => ({...prev, [filter.id]: !isExpanded}))}
            className="text-sm underline mt-3 hover:text-primary-600 transition-colors"
          >
            {isExpanded ? 'Mostrar Menos' : 'Mostrar Más'}
          </button>
        )}
      </div>
    );
  };

  // Render size filter with grid buttons
  const renderSizeFilter = (filter: Filter, options: any[], isExpanded: boolean) => {
    const initialOptions = options.slice(0, 8);
    const extraOptions = options.slice(8);
    const hasMore = extraOptions.length > 0;

    return (
      <div className="pt-2">
        <div className="grid grid-cols-2 gap-2">
          {initialOptions.map((option, index) => {
            const isChecked = appliedFilters.some(
              (af) => af.data?.id === option.id && af.label === option.label,
            );

            return (
              <button
                key={`${index}-${option.id}`}
                onClick={() => handleFilterChange(option, !isChecked)}
                className={clsx(
                  'px-3 py-2.5 border rounded-lg text-sm font-medium transition-all text-left',
                  LOADING && 'opacity-50 pointer-events-none',
                  isChecked
                    ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {/* Animated extra options */}
        {hasMore && (
          <div
            className={clsx(
              'grid transition-all duration-300 ease-in-out',
              isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2">
                {extraOptions.map((option, index) => {
                  const isChecked = appliedFilters.some(
                    (af) => af.data?.id === option.id && af.label === option.label,
                  );

                  return (
                    <button
                      key={`extra-${index}-${option.id}`}
                      onClick={() => handleFilterChange(option, !isChecked)}
                      className={clsx(
                        'px-3 py-2.5 border rounded-lg text-sm font-medium transition-all text-left',
                        LOADING && 'opacity-50 pointer-events-none',
                        isChecked
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500',
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {hasMore && (
          <button
            onClick={() => setExpandedFilters(prev => ({...prev, [filter.id]: !isExpanded}))}
            className="text-sm underline mt-3 hover:text-primary-600 transition-colors"
          >
            {isExpanded ? 'Mostrar Menos' : 'Mostrar Más'}
          </button>
        )}
      </div>
    );
  };

  // Render default checkbox filter
  const renderDefaultFilter = (options: any[]) => {
    return (
      <div className="space-y-2 pt-2">
        {options.map((option, index) => {
          const isChecked = appliedFilters.some(
            (af) => af.data?.id === option.id && af.label === option.label,
          );

          return (
            <div
              key={`${index}-${option.id}`}
              className={clsx(
                'transition-opacity',
                LOADING && 'opacity-50 pointer-events-none',
              )}
            >
              <Checkbox
                data-input={option.input as string}
                name={option.label}
                label={option.label}
                checked={isChecked}
                labelClassName=""
                onChange={(event) => {
                  handleFilterChange(option, event.target.checked);
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="border border-[#e5e7eb] p-4 rounded-md w-full lg:w-64 flex-shrink-0 lg:sticky lg:top-32 lg:self-start pr-2">
      <h3 className="text-lg font-semibold mb-4">Filtros</h3>
      
      <div className="space-y-1 pb-4">
        {filters.map((filter: Filter) => {
          const activeCount =
            appliedFilters.filter((f) => f.data?.id?.includes(filter.id)).length ?? 0;

          if (filter.type === 'PRICE_RANGE') {
            return null;
          }

          // Filter out options with count=0 when there are active filters (dynamic filtering)
          const availableOptions = hasActiveFilters
            ? filter.values?.filter((option) => {
                const isChecked = appliedFilters.some(
                  (af) => af.data?.id === option.id && af.label === option.label,
                );
                // Keep if checked or has available products
                return isChecked || (option.count && option.count > 0);
              }) || []
            : filter.values || [];

          // Skip filter if no options available
          if (availableOptions.length === 0) {
            return null;
          }

          const isExpanded = expandedFilters[filter.id] || false;
          const isColor = isColorFilter(filter);
          const isSize = isSizeFilter(filter);

          const isCollapsed = collapsedSections[filter.id] || false;

          return (
            <div key={filter.id} className="border-b border-neutral-200 dark:border-neutral-700 pb-3">
              <button
                type="button"
                onClick={() => toggleSection(filter.id)}
                className="flex justify-between items-center w-full py-2 text-left"
              >
                <span className="font-medium text-sm capitalize">
                  {filter.label}
                </span>
                <div className="flex items-center gap-2">
                  {activeCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {activeCount}
                    </span>
                  )}
                  <ChevronDownIcon
                    className={clsx(
                      'w-4 h-4 transition-transform duration-200',
                      !isCollapsed && 'rotate-180',
                    )}
                  />
                </div>
              </button>

              <div
                className={clsx(
                  'grid transition-all duration-200 ease-in-out',
                  isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
                )}
              >
                <div className="overflow-hidden">
                  {isColor
                    ? renderColorFilter(filter, availableOptions, isExpanded)
                    : isSize
                      ? renderSizeFilter(filter, availableOptions, isExpanded)
                      : renderDefaultFilter(availableOptions)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
