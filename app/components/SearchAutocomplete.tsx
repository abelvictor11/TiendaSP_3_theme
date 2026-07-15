import {useState, useRef, useEffect, useCallback} from 'react';
import {Form, Link, useFetcher, useParams} from '@remix-run/react';

interface SearchAutocompleteProps {
  defaultValue?: string;
  onSelect?: () => void;
  /** Visual variant */
  variant?: 'page' | 'header' | 'mobile';
  /** Static suggestions from metaobject */
  staticSuggestions?: {
    title: string;
    suggestions: Array<{
      id: string;
      label: string;
      image?: {url: string; altText?: string};
      href?: string;
    }>;
  } | null;
}

export function SearchAutocomplete({
  defaultValue = '',
  onSelect,
  variant = 'page',
  staticSuggestions,
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const fetcher = useFetcher<any>();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const params = useParams();

  const predictiveResults = fetcher.data;
  const isLoading = fetcher.state === 'loading';

  const fetchPredictiveResults = useCallback(
    (searchQuery: string) => {
      if (searchQuery.length < 2) return;
      fetcher.load(
        `/api/predictive-search?q=${encodeURIComponent(searchQuery)}`,
      );
    },
    [fetcher],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length >= 2) {
      setIsOpen(true);
      debounceRef.current = setTimeout(() => {
        fetchPredictiveResults(value);
      }, 300);
    } else {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const productResults = predictiveResults?.products || [];
  const collectionResults = predictiveResults?.collections || [];
  const hasResults = productResults.length > 0 || collectionResults.length > 0;

  // Show static suggestions when focused but no typed query yet (only for header variant)
  const showStaticSuggestions =
    isOpen &&
    query.length < 2 &&
    staticSuggestions &&
    staticSuggestions.suggestions.length > 0;

  const showPredictive = isOpen && query.length >= 2;

  const handleItemClick = () => {
    setIsOpen(false);
    onSelect?.();
  };

  const searchAction = params.locale
    ? `/${params.locale}/search`
    : '/search';

  // Variant-specific input classes
  const inputClasses =
    variant === 'page'
      ? 'block w-full border-neutral-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 bg-white shadow-lg border-0 dark:border rounded-full pl-14 py-5 pr-5 md:pl-16 text-sm font-normal'
      : variant === 'header'
        ? 'w-full h-11 pl-12 pr-4 bg-[#ededed] text-sm dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent placeholder:text-black dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 transition-all border-none'
        : 'border-none bg-transparent focus:outline-none focus:ring-0 w-full text-sm';

  return (
    <Form
      method="get"
      action={searchAction}
      className="relative w-full"
      onSubmit={() => {
        setIsOpen(false);
        onSelect?.();
      }}
    >
      {variant === 'page' && (
        <label htmlFor="search-input" className="text-slate-500">
          <span className="sr-only">Buscar productos</span>
        </label>
      )}

      {variant === 'mobile' ? (
        <div className="bg-slate-50 dark:bg-slate-800 flex space-x-1 p-2 rounded-xl h-full">
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
            placeholder="Buscar productos..."
            className={inputClasses}
          />
          <button
            className="flex items-center justify-center px-2"
            type="submit"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : variant === 'header' ? (
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-black z-10">
            <svg className="w-4 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            autoComplete="off"
            placeholder="Buscar productos..."
            className={inputClasses}
          />
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id="search-input"
            type="search"
            name="q"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length >= 2 && hasResults) setIsOpen(true);
            }}
            autoComplete="off"
            placeholder="Buscar productos, colecciones..."
            className={inputClasses}
          />
          <button
            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-colors"
            type="submit"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl md:left-6">
            <svg className="w-5 h-5" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </>
      )}

      {/* Autocomplete Dropdown */}
      {(showPredictive || showStaticSuggestions) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full mt-2 w-full bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-h-[70vh] overflow-y-auto"
        >
          {/* Static Suggestions (when no query typed, header only) */}
          {showStaticSuggestions && staticSuggestions && (
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3">
                {staticSuggestions.title}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {staticSuggestions.suggestions.map((suggestion) => (
                  <Link
                    key={suggestion.id}
                    to={suggestion.href || '#'}
                    onClick={handleItemClick}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                      {suggestion.image?.url ? (
                        <img
                          src={suggestion.image.url}
                          alt={suggestion.image.altText || suggestion.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                          <svg className="w-4 h-4" width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.5 21C16.7467 21 21 16.7467 21 11.5C21 6.25329 16.7467 2 11.5 2C6.25329 2 2 6.25329 2 11.5C2 16.7467 6.25329 21 11.5 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M22 22L20 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white transition-colors truncate">
                      {suggestion.label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Predictive Results */}
          {showPredictive && (
            <>
              {isLoading && !hasResults && (
                <div className="p-6 text-center text-neutral-500">
                  <div className="animate-pulse">Buscando...</div>
                </div>
              )}

              {!isLoading && !hasResults && predictiveResults && (
                <div className="p-6 text-center text-neutral-500">
                  No se encontraron resultados para &ldquo;{query}&rdquo;
                </div>
              )}

              {hasResults && (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {/* Collections */}
                  {collectionResults.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Colecciones
                      </h3>
                      <div className="space-y-1">
                        {collectionResults.map((collection: any) => (
                          <Link
                            key={collection.id}
                            to={`/collections/${collection.handle}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            onClick={handleItemClick}
                          >
                            {collection.image?.url && (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                <img
                                  src={collection.image.url}
                                  alt={collection.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                              {collection.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Products */}
                  {productResults.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Productos
                      </h3>
                      <div className="space-y-1">
                        {productResults.map((product: any) => (
                          <Link
                            key={product.id}
                            to={`/products/${product.handle}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                            onClick={handleItemClick}
                          >
                            {product.featuredImage?.url && (
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                                <img
                                  src={`${product.featuredImage.url}&width=96`}
                                  alt={product.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                {product.title}
                              </p>
                              {product.priceRange?.minVariantPrice && (
                                <p className="text-sm text-primary-600 font-semibold">
                                  {new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency:
                                      product.priceRange.minVariantPrice
                                        .currencyCode,
                                    minimumFractionDigits: 0,
                                  }).format(
                                    Number(
                                      product.priceRange.minVariantPrice.amount,
                                    ),
                                  )}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View All */}
                  <div className="p-3">
                    <button
                      type="submit"
                      className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 py-2 rounded-lg hover:bg-primary-50 transition-colors"
                    >
                      Ver todos los resultados para &ldquo;{query}&rdquo;
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Form>
  );
}
