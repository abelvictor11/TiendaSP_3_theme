import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface PaginationBarProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPageUrl: string;
  previousPageUrl: string;
  totalProducts: number;
  pageSize: number;
  currentNodesCount: number;
}

export function PaginationBar({
  hasNextPage,
  hasPreviousPage,
  nextPageUrl,
  previousPageUrl,
  totalProducts,
  pageSize,
  currentNodesCount,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));

  // Estimate current page from currentNodesCount
  // On first page: nodes = pageSize, on page 2: nodes = pageSize*2, etc.
  const currentPage = Math.max(1, Math.ceil(currentNodesCount / pageSize));
  const viewedCount = Math.min(currentNodesCount, totalProducts);

  // Generate page numbers to display
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  if (totalPages <= 1 && !hasNextPage && !hasPreviousPage) {
    // Still show the "viewed" text if there are products
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
            href={previousPageUrl.replace(/%3D$/, '=')}
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

          // For cursor-based pagination we can only navigate prev/next
          // Active page is just visual, other pages are non-interactive indicators
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
            <span
              key={page}
              className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium text-neutral-600"
            >
              {page}
            </span>
          );
        })}

        {/* Next Arrow */}
        {hasNextPage ? (
          <a
            href={nextPageUrl.replace(/%3D$/, '=')}
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
