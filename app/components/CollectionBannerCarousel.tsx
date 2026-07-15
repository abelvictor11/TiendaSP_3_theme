import {Link} from '~/components/Link';
import {useRef} from 'react';
import {ArrowRightIcon} from '@heroicons/react/24/outline';
import useSnapSlider from '~/hooks/useSnapSlider';

interface Subcollection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  };
}

interface CollectionBannerCarouselProps {
  subcollections: Subcollection[];
  parentHandle: string;
}

export default function CollectionBannerCarousel({
  subcollections,
  parentHandle,
}: CollectionBannerCarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  if (!subcollections || subcollections.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar"
      >
        {subcollections.map((sub) => (
          <Link
            key={sub.id}
            to={`/collections/${parentHandle}/${sub.handle}`}
            className="snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] h-[250px] block relative rounded-2xl overflow-hidden group cursor-pointer"
          >
            <div className="relative h-full">
              {sub.image?.url ? (
                <img
                  src={sub.image.url}
                  alt={sub.image.altText || sub.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-slate-800" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 p-6 flex flex-col">
                <h4 className="text-xl font-bold text-white mb-2">
                  {sub.title}
                </h4>
                {sub.description && (
                  <p className="text-sm text-white/80 line-clamp-2">
                    {sub.description}
                  </p>
                )}
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-white">
                  Ver colección
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Navigation arrows */}
      {subcollections.length > 1 && (
        <>
          <button
            onClick={scrollToPrevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
            aria-label="Previous banner"
          >
            <ArrowRightIcon className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={scrollToNextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-colors z-10"
            aria-label="Next banner"
          >
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
