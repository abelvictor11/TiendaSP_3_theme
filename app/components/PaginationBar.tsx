import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {useSearchParams} from '@remix-run/react';

interface PaginationBarProps {
  totalProducts: number;
  pageSize: number;
  currentPage: number;
}

export function PaginationBar({
  totalProducts,
  pageSize,
  currentPage,
}: PaginationBarProps) {
  const [searchParams] = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const viewedCount = Math.min(currentPage * pageSize, totalProducts);

  // Build URL for a given page, preserving all other search params
  function getPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '?';
  }

  const pageNumbers = getPageNumbers(currentPage, totalPages);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  if (totalPages <= 1) {
    if (totalProducts > 0) {
      return (
        <div className="flex flex-col items-center gap-4 mt-12">
          <p className="text-sm text-neutral-500">
            Has visto {viewedCount} de {totalProducts} productos
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      {/* Page Numbers */}
      <nav className="flex items-center gap-1" aria-label="Paginación">
        {/* Previous Arrow */}
        {hasPreviousPage ? (
          <a
            href={getPageUrl(currentPage - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </a>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-100 text-neutral-300 cursor-not-allowed">
            <ChevronLeftIcon className="w-4 h-4" />
          </div>
        )}

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="w-10 h-10 flex items-center justify-center text-sm text-neutral-400"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          if (isActive) {
            return (
              <span
                key={page}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-900 text-white text-sm font-medium"
              >
                {page}
              </span>
            );
          }

          return (
            <a
              key={page}
              href={getPageUrl(page)}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              {page}
            </a>
          );
        })}

        {/* Next Arrow */}
        {hasNextPage ? (
          <a
            href={getPageUrl(currentPage + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-200 hover:border-neutral-400 transition-colors"
            aria-label="Página siguiente"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </a>
        ) : (
          <div className="w-10 h-10 flex items-center justify-center rounded-xl border border-neutral-100 text-neutral-300 cursor-not-allowed">
            <ChevronRightIcon className="w-4 h-4" />
          </div>
        )}
      </nav>

      {/* Viewed count */}
      <p className="text-sm text-neutral-500">
        Has visto {viewedCount} de {totalProducts} productos
      </p>
    </div>
  );
}

/**
 * Generate page numbers array with ellipsis.
 * Example: [1, 2, 3, 4, 5, '...', 10]
 */
function getPageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) {
    return Array.from({length: total}, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  if (current <= 4) {
    // Near the start: 1 2 3 4 5 ... last
    for (let i = 2; i <= 5; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    // Near the end: 1 ... last-4 last-3 last-2 last-1 last
    pages.push('...');
    for (let i = total - 4; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Middle: 1 ... current-1 current current+1 ... last
    pages.push('...');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('...');
    pages.push(total);
  }

  return pages;
}
