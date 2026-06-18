import clsx from 'clsx';

interface FeatureBlock {
  title?: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaAlt?: string;
  imagePosition?: 'left' | 'right';
}

interface ProductFeatureBlocksProps {
  blocks: FeatureBlock[];
  className?: string;
}

export function ProductFeatureBlocks({
  blocks,
  className,
}: ProductFeatureBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className={clsx('product-feature-blocks space-y-12 md:space-y-16', className)}>
      {blocks.map((block, index) => (
        <FeatureBlockItem
          key={index}
          block={block}
          defaultImagePosition={index % 2 === 0 ? 'left' : 'right'}
        />
      ))}
    </div>
  );
}

function FeatureBlockItem({
  block,
  defaultImagePosition,
}: {
  block: FeatureBlock;
  defaultImagePosition: 'left' | 'right';
}) {
  const {
    title,
    description,
    mediaUrl,
    mediaType = 'image',
    mediaAlt = '',
    imagePosition = defaultImagePosition,
  } = block;

  const hasMedia = !!mediaUrl;
  const hasContent = !!title || !!description;

  if (!hasMedia && !hasContent) return null;

  const mediaElement = hasMedia && (
    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
      {mediaType === 'video' ? (
        <video
          src={mediaUrl}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={mediaUrl}
          alt={mediaAlt || title || ''}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );

  const contentElement = hasContent && (
    <div className="flex flex-col justify-center">
      {title && (
        <h3 className="text-xl md:text-2xl font-semibold mb-4 text-slate-900 dark:text-white">
          {title}
        </h3>
      )}
      {description && (
        <div
          className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{__html: description}}
        />
      )}
    </div>
  );

  // If only media or only content, render full width
  if (!hasMedia || !hasContent) {
    return (
      <div className="w-full">
        {mediaElement || contentElement}
      </div>
    );
  }

  // Two columns layout
  return (
    <div
      className={clsx(
        'grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center',
        imagePosition === 'right' && 'md:[&>*:first-child]:order-2'
      )}
    >
      {mediaElement}
      {contentElement}
    </div>
  );
}

// Helper to parse feature blocks from product data
export function parseFeatureBlocks(product: any): FeatureBlock[] {
  const blocks: FeatureBlock[] = [];
  
  // Support up to 4 feature blocks
  for (let i = 1; i <= 4; i++) {
    const title = product?.[`feature_${i}_title`]?.value;
    const description = product?.[`feature_${i}_description`]?.value;
    const mediaRef = product?.[`feature_${i}_media`]?.reference;
    
    // Get media URL and type
    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' = 'image';
    let mediaAlt: string | undefined;
    
    if (mediaRef) {
      if (mediaRef.image?.url) {
        mediaUrl = mediaRef.image.url;
        mediaType = 'image';
        mediaAlt = mediaRef.image.altText;
      } else if (mediaRef.sources?.[0]?.url) {
        mediaUrl = mediaRef.sources[0].url;
        mediaType = 'video';
      }
    }
    
    // Only add block if it has content
    if (title || description || mediaUrl) {
      blocks.push({
        title,
        description,
        mediaUrl,
        mediaType,
        mediaAlt: mediaAlt || title,
      });
    }
  }
  
  return blocks;
}
