import {Link} from '@remix-run/react';
import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams: URLSearchParams;
}

export default function Paginator({
  currentPage,
  totalPages,
  basePath,
  searchParams,
}: PaginatorProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    
    if (page === 1) {
      params.delete('cursor');
      params.delete('direction');
    } else {
      // For now, we'll use a simple page parameter
      // Shopify's cursor-based pagination would need more complex logic
      params.set('page', page.toString());
    }
    
    return `${basePath}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
      {/* Previous Button */}
      <Link
        to={currentPage > 1 ? getPageUrl(currentPage - 1) : '#'}
        className={clsx(
          'flex items-center justify-center w-10 h-10 rounded-full border transition-colors',
          currentPage > 1
            ? 'border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50'
            : 'border-neutral-200 text-neutral-300 cursor-not-allowed',
        )}
        aria-disabled={currentPage <= 1}
        onClick={(e) => currentPage <= 1 && e.preventDefault()}
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </Link>

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-10 h-10 text-neutral-500"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              to={getPageUrl(pageNum)}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-full border font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Button */}
      <Link
        to={currentPage < totalPages ? getPageUrl(currentPage + 1) : '#'}
        className={clsx(
          'flex items-center justify-center w-10 h-10 rounded-full border transition-colors',
          currentPage < totalPages
            ? 'border-neutral-300 hover:border-neutral-500 hover:bg-neutral-50'
            : 'border-neutral-200 text-neutral-300 cursor-not-allowed',
        )}
        aria-disabled={currentPage >= totalPages}
        onClick={(e) => currentPage >= totalPages && e.preventDefault()}
      >
        <ChevronRightIcon className="w-5 h-5" />
      </Link>
    </nav>
  );
}
