import clsx from 'clsx';
import ProductCard, {ProductCardSkeleton} from './ProductCard';
import {getImageLoadingPriority} from '~/lib/const';
import type {CommonProductCardFragment} from 'storefrontapi.generated';
import {useViewAsColumns} from './ViewAsToggle';
import type {ViewAsColumns} from './ViewAsToggle';

const VIEW_AS_GRID_CLASSES: Record<ViewAsColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export function ProductsGrid({
  nodes,
  className = 'mt-8 lg:mt-10',
  isSkeleton,
}: {
  nodes?: CommonProductCardFragment[];
  className?: string;
  isSkeleton?: boolean;
}) {
  const viewAs = useViewAsColumns();
  const gridCols = VIEW_AS_GRID_CLASSES[viewAs];

  return (
    <div
      className={clsx(
        'grid gap-x-4 gap-y-10 auto-rows-fr',
        gridCols,
        className,
      )}
    >
      {isSkeleton &&
        [1, 1, 1, 1, 1, 1, 1, 1].map((_, index) => (
          <ProductCardSkeleton key={index} index={index} />
        ))}

      {!isSkeleton &&
        nodes?.map((product, i) => {
          return (
            <ProductCard
              key={product.id}
              product={product}
              loading={getImageLoadingPriority(i)}
            />
          );
        })}
    </div>
  );
}
