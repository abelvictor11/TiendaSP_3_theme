import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {useNavigate, useSearchParams} from '@remix-run/react';
import {useState} from 'react';

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
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const viewedCount = Math.min(currentPage * pageSize, totalProducts);
  const [jumpValue, setJumpValue] = useState('');

  // Build URL for a given page, preserving all other search params
  function getPageUrl(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('cursor');
    params.delete('direction');
    if (page <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '?';
  }

  function handleJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(jumpValue, 10);
    if (!Number.isFinite(parsed)) return;
    const clamped = Math.min(Math.max(parsed, 1), totalPages);
    navigate(getPageUrl(clamped));
    setJumpValue('');
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

  // Below this many pages, clicking through is already fast enough that a
  // jump-to-page input would just be visual noise.
  const showJumpToPage = totalPages > 10;

  return (
    <div className="flex flex-col items-center gap-4 mt-12">
      {/* Page Numbers */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <nav
          className="flex flex-wrap justify-center items-center gap-1"
          aria-label="Paginación"
        >
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
                  aria-current="page"
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

        {showJumpToPage && (
          <form
            onSubmit={handleJumpSubmit}
            className="flex items-center gap-2 text-sm text-neutral-600"
          >
            <label htmlFor="pagination-jump-input">Página</label>
            <input
              id="pagination-jump-input"
              type="number"
              min={1}
              max={totalPages}
              value={jumpValue}
              onChange={(e) => setJumpValue(e.target.value)}
              className="w-16 h-10 text-center rounded-xl border border-neutral-200 focus:outline-none focus:border-neutral-400"
              aria-label={`Ir a la página (1-${totalPages})`}
            />
            <button
              type="submit"
              className="font-medium text-neutral-900 hover:underline"
            >
              Ir
            </button>
          </form>
        )}
      </div>

      {/* Viewed count */}
      <p className="text-sm text-neutral-500">
        Has visto {viewedCount} de {totalProducts} productos
      </p>
    </div>
  );
}

/**
 * Generate page numbers array with ellipsis.
 * Example (current=101, total=125): [1, '...', 99, 100, 101, 102, 103, '...', 125]
 *
 * WINDOW controls how many neighboring pages show on each side of the
 * current page. Was previously 1 (current-1/current/current+1 only), which
 * for a collection with hundreds of pages meant the visible window barely
 * moved as you navigated -- you couldn't tell at a glance how far you were
 * from where you wanted to be. Widened to 2 (+ EDGE_COUNT consecutive pages
 * near the very start/end) to show more real neighboring context.
 */
const WINDOW = 2;
const EDGE_COUNT = 7;

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= EDGE_COUNT) {
    return Array.from({length: total}, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  if (current <= WINDOW + 2) {
    // Near the start: 1 2 3 4 5 6 7 ... last
    for (let i = 2; i <= EDGE_COUNT; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(total);
  } else if (current >= total - (WINDOW + 1)) {
    // Near the end: 1 ... last-6 ... last
    pages.push('...');
    for (let i = total - (EDGE_COUNT - 1); i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Middle: 1 ... current-2 current-1 current current+1 current+2 ... last
    pages.push('...');
    for (let i = current - WINDOW; i <= current + WINDOW; i++) {
      pages.push(i);
    }
    pages.push('...');
    pages.push(total);
  }

  return pages;
}
