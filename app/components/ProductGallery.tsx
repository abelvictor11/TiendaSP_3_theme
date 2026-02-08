import {Image} from '@shopify/hydrogen';
import type {MediaFragment} from 'storefrontapi.generated';
import {useEffect, useState} from 'react';
import {Dialog, Transition} from '@headlessui/react';
import ButtonClose from './ButtonClose';
import clsx from 'clsx';
import {MagnifyingGlassPlusIcon} from '@heroicons/react/24/outline';
import ProductStatus from './ProductStatus';

/**
 * A client component that defines a media gallery for hosting images, 3D models, and videos of products
 */
export function ProductGallery({
  media,
  className,
  discountPercentage,
  selectedVariantImageUrl,
}: {
  media: MediaFragment[];
  className?: string;
  discountPercentage?: number;
  selectedVariantImageUrl?: string;
}) {
  // Find the index of the selected variant's image in the media array
  const getInitialIndex = () => {
    if (!selectedVariantImageUrl) return 0;
    const index = media.findIndex((m) => {
      if (m.__typename === 'MediaImage' && m.image?.url) {
        // Compare URLs - they might have different query params, so compare the base
        return m.image.url.split('?')[0] === selectedVariantImageUrl.split('?')[0];
      }
      return false;
    });
    return index >= 0 ? index : 0;
  };

  const [isOpenModal, setOpenModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState(getInitialIndex);

  // Update activeIndex when selectedVariantImageUrl changes
  useEffect(() => {
    const newIndex = getInitialIndex();
    setActiveIndex(newIndex);
  }, [selectedVariantImageUrl]);

  const closeModal = () => {
    setOpenModal(false);
  };

  const openModal = (index: number) => {
    setActiveIndex(index);
    setOpenModal(true);
  };

  if (!media.length) {
    return null;
  }

  // Get the active image
  const activeMedia = media[activeIndex];
  const activeImage =
    activeMedia?.__typename === 'MediaImage'
      ? {...activeMedia.image, altText: activeMedia.alt || 'Product image'}
      : null;

  return (
    <>
      <div className={clsx('flex flex-col', className)}>
        {/* Main Image - Maintains aspect ratio and fits within container */}
        <div
          className="border border-slate-200 rounded-xl relative w-full hover:border-black rounded-xl overflow-hidden cursor-zoom-in group flex items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]"
          onClick={() => openModal(activeIndex)}
          aria-hidden
        >
          {/* Badge de Oferta flotante */}
          {discountPercentage && discountPercentage > 0 && (
            <div className="absolute z-10 top-4 left-4">
              <ProductStatus
                status="Oferta"
                icon="IconDiscount"
                color="rose"
                className="px-3 py-1.5 text-sm"
              />
            </div>
          )}

          {/* Zoom button */}
          <button
            className="absolute z-10 bottom-4 right-4 w-10 h-10 text-slate-700 dark:text-slate-200 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(activeIndex);
            }}
          >
            <span className="sr-only">Zoom image</span>
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>

          {activeImage && (
            <Image
              loading="eager"
              data={activeImage}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="mix-blend-multiply object-contain max-w-full max-h-[70vh] lg:max-h-[75vh]"
            />
          )}
        </div>

        {/* Thumbnails - Grid of 9 */}
        <div className="grid grid-cols-9 gap-2 mt-4">
          {Array.from({length: 9}).map((_, i) => {
            const med = media[i];
            const image =
              med?.__typename === 'MediaImage'
                ? {...med.image, altText: med.alt || 'Product image'}
                : null;

            const isActive = i === activeIndex;
            const hasImage = !!image;

            return (
              <button
                key={med?.id || `thumb-${i}`}
                type="button"
                onClick={() => hasImage && setActiveIndex(i)}
                disabled={!hasImage}
                className={clsx(
                  'relative aspect-square rounded-lg overflow-hidden transition-all',
                  hasImage
                    ? 'bg-[#efefef] dark:bg-slate-800 cursor-pointer'
                    : 'bg-slate-50 dark:bg-slate-900 cursor-default',
                  isActive && hasImage
                    ? 'ring-2 ring-black ring-offset-2'
                    : hasImage
                    ? 'hover:ring-2 hover:ring-slate-300 hover:ring-offset-1 opacity-70 hover:opacity-100'
                    : 'opacity-30',
                )}
              >
                {image && (
                  <Image
                    loading="lazy"
                    data={image}
                    sizes="80px"
                    className="object-contain w-full h-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <Transition show={isOpenModal} as={'div'}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={closeModal}
        >
          <>
            <Transition.Child
              as={'div'}
              enter="ease-out duration-150"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
              className="fixed inset-0 bg-black/80"
            />

            <Transition.Child
              as={'div'}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
              className="min-h-screen flex items-center justify-center p-4"
            >
              <ButtonClose
                onClick={closeModal}
                className="fixed right-4 top-4 z-50 !w-11 !h-11 border bg-white dark:bg-slate-800"
                IconclassName="w-6 h-6"
              />
              
              <div className="relative w-full max-w-4xl">
                <ModalImageGallery
                  media={media}
                  indexActive={activeIndex}
                  onChangeIndex={setActiveIndex}
                />
              </div>
            </Transition.Child>
          </>
        </Dialog>
      </Transition>
    </>
  );
}

function ModalImageGallery({
  media,
  indexActive,
  onChangeIndex,
}: {
  media: MediaFragment[];
  indexActive: number;
  onChangeIndex: (index: number) => void;
}) {
  const activeMedia = media[indexActive];
  const activeImage =
    activeMedia?.__typename === 'MediaImage'
      ? {...activeMedia.image, altText: activeMedia.alt || 'Product image'}
      : null;

  return (
    <div className="flex flex-col items-center">
      {/* Main modal image */}
      <div className="w-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        {activeImage && (
          <Image
            loading="eager"
            data={activeImage}
            sizes="90vw"
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        )}
      </div>

      {/* Modal thumbnails */}
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
        {media.map((med, i) => {
          const image =
            med.__typename === 'MediaImage'
              ? {...med.image, altText: med.alt || 'Product image'}
              : null;

          if (!image) return null;

          const isActive = i === indexActive;

          return (
            <button
              key={med.id || image?.id}
              type="button"
              onClick={() => onChangeIndex(i)}
              className={clsx(
                'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white dark:bg-slate-800 transition-all',
                isActive
                  ? 'ring-2 ring-black ring-offset-2'
                  : 'opacity-60 hover:opacity-100 hover:ring-2 hover:ring-slate-300',
              )}
            >
              <Image
                loading="lazy"
                data={image}
                sizes="64px"
                className="object-contain w-full h-full"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
