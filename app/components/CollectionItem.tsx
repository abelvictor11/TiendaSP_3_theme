import {type FC} from 'react';
import {type CommonCollectionItemFragment} from 'storefrontapi.generated';
import {Link} from './Link';
import {Image} from '@shopify/hydrogen';
import ButtonSecondary from './Button/ButtonSecondary';
import {type FilterValue} from '@shopify/hydrogen/storefront-api-types';
import clsx from 'clsx';

export type TMyCommonCollectionItem = Partial<CommonCollectionItemFragment> & {
  products?: {
    filters?: {
      values?: Pick<FilterValue, 'count' | 'input' | 'label'>[];
    }[];
  };
};

interface CollectionItemProps {
  item: Partial<TMyCommonCollectionItem>;
  button_text?: string;
  onClick?: () => void;
  className?: string;
  /** Narrow variant for tight spaces (e.g. the nav mega-menu column) — at
   * 16:9 a ~180px-wide card is only ~101px tall, not enough room for the
   * default "Collection" label + title + full button without overflowing;
   * this drops the label/button and shrinks the insets/title so it still
   * fits at that size. */
  compact?: boolean;
}

const CollectionItem: FC<CollectionItemProps> = ({
  item,
  button_text = 'Shop now',
  onClick,
  className = '',
  compact = false,
}) => {
  const {description, handle, title, horizontal_image, products, image} = item;

  const hImage = horizontal_image?.reference?.image;
  const mainImage = image;

  return (
    <Link
      to={'/collections/' + handle}
      className={clsx(`block w-full`, className)}
      onClick={onClick}
      prefetch="intent"
    >
      <div className="relative w-full aspect-w-16 aspect-h-12 sm:aspect-h-9 rounded-2xl overflow-hidden bg-slate-100 group">
        {/* Background image - use horizontal_image first, fallback to main image */}
        {hImage && (
          <Image
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            data={hImage}
            sizes="(max-width: 640px) 90vw, (max-width: 1200px) 50vw, 40vw"
          />
        )}

        {/* Fallback to main image only if no horizontal_image */}
        {!hImage && mainImage && (
          <Image
            className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            data={mainImage as any}
            sizes="(max-width: 640px) 90vw, (max-width: 1200px) 50vw, 40vw"
          />
        )}

        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-2xl"></div>

        {/* Hover effect */}
        <span className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black/20 transition-opacity rounded-2xl"></span>

        <div>
          <div
            className={clsx(
              'absolute flex flex-col',
              compact ? 'inset-3' : 'inset-4 lg:inset-8',
            )}
          >
            <div className="max-w-[18rem]">
              {!compact && (
                <span className="block text-sm text-white/90 font-medium">
                  Collection
                </span>
              )}
              {!!title && (
                <h2
                  className={clsx(
                    'text-white font-normal',
                    compact
                      ? 'text-sm leading-tight'
                      : 'text-xl lg:text-2xl mt-0.5 sm:mt-2',
                  )}
                  dangerouslySetInnerHTML={{__html: title}}
                />
              )}
            </div>
            {!compact && (
              <div className="mt-auto">
                <ButtonSecondary
                  sizeClass="py-3 px-4 sm:py-3.5 sm:px-6"
                  fontSize="text-sm font-medium"
                  className="nc-shadow-lg bg-white/90 hover:bg-white text-neutral-900 backdrop-blur-sm"
                >
                  {button_text || 'Shop now'}
                </ButtonSecondary>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export const CollectionItemSkeleton = ({
  className = '',
}: {
  className?: string;
}) => {
  return (
    <div className={clsx(`block w-full`, className)}>
      <div className="relative w-full aspect-w-16 aspect-h-12 sm:aspect-h-9 rounded-2xl overflow-hidden bg-slate-100 group">
        {/* Background gradient placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl"></div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent rounded-2xl"></div>

        <div>
          <div className="absolute inset-4 md:inset-8 flex flex-col">
            <div className="max-w-[18rem]">
              <span className={`block text-sm text-white/90 font-medium`}>Collection</span>
              <h2 className="text-xl md:text-2xl text-white font-semibold mt-0.5 sm:mt-2">
                Skeleton Collection
              </h2>
            </div>
            <div className="mt-auto">
              <ButtonSecondary
                disabled
                sizeClass="py-3 px-4 sm:py-3.5 sm:px-6"
                fontSize="text-sm font-medium"
                className="nc-shadow-lg bg-white/90 text-neutral-900 backdrop-blur-sm"
              >
                {'Explore now'}
              </ButtonSecondary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionItem;
