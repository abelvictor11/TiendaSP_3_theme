import {useRef} from 'react';
import useSnapSlider from '~/hooks/useSnapSlider';
import Heading from '~/components/Heading/Heading';
import ProductCard, {ProductCardSkeleton} from '~/components/ProductCard';
import {getImageLoadingPriority} from '~/lib/const';
import ProductCardLarge, {
  ProductCardLargeSkeleton,
} from '~/components/ProductCardLarge';
import clsx from 'clsx';
import {type CommonProductCardFragment} from 'storefrontapi.generated';

export interface Props {
  heading_bold?: string | null;
  heading_light?: string | null;
  sub_heading?: string | null;
  products?: CommonProductCardFragment[] | null;
  cardStyle?: '1' | '2' | null;
  className?: string;
  headingFontClass?: string;
  isSkeleton?: boolean;
  /** Number of columns visible on desktop (xl breakpoint). Default is 4. Options: 2-6 */
  columnsDesktop?: 2 | 3 | 4 | 5 | 6;
  /** Color for heading text */
  headingColor?: string;
}

export function SnapSliderProducts(props: Props) {
  const {
    heading_bold,
    heading_light,
    sub_heading,
    products = [],
    cardStyle,
    className = 'container',
    headingFontClass,
    isSkeleton,
    columnsDesktop = 4,
    headingColor,
  } = props;

  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  const Card = cardStyle === '2' ? ProductCardLarge : ProductCard;
  const CardSkeleton =
    cardStyle === '2' ? ProductCardLargeSkeleton : ProductCardSkeleton;

  return (
    <div className={`nc-SectionSliderProductCard ` + className}>
      <Heading
        className={'mb-8 lg:mb-10 text-neutral-900 dark:text-neutral-50 '}
        fontClass={headingFontClass}
        rightDescText={heading_light}
        hasNextPrev
        onClickNext={scrollToNextSlide}
        onClickPrev={scrollToPrevSlide}
        style={headingColor ? {color: headingColor} : undefined}
      >
        {heading_bold}
      </Heading>
      <div
        ref={sliderRef}
        className="relative flex snap-x snap-mandatory overflow-x-auto -mx-2 lg:-mx-4 hiddenScrollbar"
      >
        {isSkeleton &&
          [1, 1, 1, 1, 1].map((_, index) => (
            <div
              key={index}
              className={clsx(
                `mySnapItem snap-start shrink-0 px-2`,
                cardStyle !== '2'
                  ? columnsDesktop === 2
                    ? 'w-[17rem] lg:w-80 xl:w-[50%]'
                    : columnsDesktop === 3
                    ? 'w-[17rem] lg:w-80 xl:w-[33.33%]'
                    : columnsDesktop === 5
                    ? 'w-[17rem] lg:w-80 xl:w-[20%]'
                    : columnsDesktop === 6
                    ? 'w-[17rem] lg:w-80 xl:w-[16.66%]'
                    : 'w-[17rem] lg:w-80 xl:w-[25%]'
                  : 'w-full sm:w-96 lg:w-[50%] xl:w-[33.33%]',
              )}
            >
              <CardSkeleton index={index} className="w-full" />
            </div>
          ))}

        {!isSkeleton &&
          products?.map((item, index) => (
            <div
              key={item.id}
              className={clsx(
                `mySnapItem snap-start shrink-0 px-2`,
                cardStyle !== '2'
                  ? columnsDesktop === 2
                    ? 'w-[17rem] lg:w-80 xl:w-[50%]'
                    : columnsDesktop === 3
                    ? 'w-[17rem] lg:w-80 xl:w-[33.33%]'
                    : columnsDesktop === 5
                    ? 'w-[17rem] lg:w-80 xl:w-[20%]'
                    : columnsDesktop === 6
                    ? 'w-[17rem] lg:w-80 xl:w-[16.66%]'
                    : 'w-[17rem] lg:w-80 xl:w-[25%]'
                  : 'w-full sm:w-96 lg:w-[50%] xl:w-[33.33%]',
              )}
            >
              <Card
                className="w-full"
                product={item}
                loading={getImageLoadingPriority(index)}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
