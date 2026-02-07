import {Image} from '@shopify/hydrogen';
import {Link} from '~/components/Link';
import {useRef, useState, useEffect} from 'react';
import {ArrowRightIcon} from '@heroicons/react/24/outline';
import useSnapSlider from '~/hooks/useSnapSlider';

interface BannerItem {
  id: string;
  title?: {value?: string};
  description?: {value?: string};
  image?: {reference?: {image?: {url?: string; altText?: string; width?: number; height?: number}}};
  cta_text?: {value?: string};
  cta_link?: {value?: string};
}

interface CollectionBannerCarouselProps {
  banners: BannerItem[];
}

export default function CollectionBannerCarousel({banners}: CollectionBannerCarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const {scrollToNextSlide, scrollToPrevSlide} = useSnapSlider({sliderRef});

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={sliderRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory hiddenScrollbar"
      >
        {banners.map((banner) => {
          const imageData = banner.image?.reference?.image;
          const title = banner.title?.value;
          const description = banner.description?.value;
          const ctaText = banner.cta_text?.value;
          const ctaLink = banner.cta_link?.value;

          const Wrapper = ctaLink ? Link : 'div';
          const wrapperProps = ctaLink
            ? {to: ctaLink, className: 'snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] block relative rounded-2xl overflow-hidden group cursor-pointer'}
            : {className: 'snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px] block relative rounded-2xl overflow-hidden group'};

          return (
            <Wrapper key={banner.id} {...(wrapperProps as any)}>
              {/* Background Image */}
              <div className="relative aspect-[3/4]">
                {imageData?.url ? (
                  <img
                    src={imageData.url}
                    alt={imageData.altText || title || ''}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-800" />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />

                {/* Content - positioned at top */}
                <div className="absolute inset-0 p-6 flex flex-col">
                  {title && (
                    <h4 className="text-xl font-bold text-white mb-2">
                      {title}
                    </h4>
                  )}
                  {description && (
                    <p className="text-sm text-white/80">
                      {description}
                    </p>
                  )}
                  {ctaText && (
                    <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-white">
                      {ctaText}
                      <ArrowRightIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {/* Navigation arrows - only show if more than 1 banner */}
      {banners.length > 1 && (
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
