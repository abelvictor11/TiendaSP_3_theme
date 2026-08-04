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
  /** Encabezado opcional de la sección (ej. "Características"). */
  heading?: string;
  /** Texto pequeño encima del encabezado (ej. "Lo que la hace especial"). */
  eyebrow?: string;
  /** Viñetas tipo "Key features" (una por elemento). */
  keyFeatures?: string[];
}

/**
 * Bloques de características del producto: un intro opcional (eyebrow +
 * encabezado + viñetas "Key features") y las tarjetas (imagen + título +
 * descripción) en grilla de 3. Con más de 3 tarjetas — y siempre en mobile —
 * las tarjetas pasan a carrusel horizontal con scroll-snap.
 * Datos: metafields de producto pdp_features.* (ver parseFeatureBlocks).
 */
export function ProductFeatureBlocks({
  blocks,
  className,
  heading,
  eyebrow,
  keyFeatures,
}: ProductFeatureBlocksProps) {
  const items = (blocks || []).filter(
    (b) => b.mediaUrl || b.title || b.description,
  );
  const bullets = (keyFeatures || []).filter((b) => b.trim());
  if (items.length === 0 && bullets.length === 0) return null;

  // Carrusel en desktop solo si hay más de 3; en mobile/tablet siempre.
  const carousel = items.length > 3;

  return (
    <section className={clsx('product-feature-blocks', className)}>
      {(eyebrow || heading || bullets.length > 0) && (
        <div className="mb-8 md:mb-10 max-w-3xl">
          {eyebrow && (
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-1">
              {eyebrow}
            </p>
          )}
          {heading && (
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
              {heading}
            </h2>
          )}
          {bullets.length > 0 && (
            <ul className="mt-4 space-y-2 list-disc pl-5 text-slate-600 dark:text-slate-300">
              {bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {items.length > 0 && (
        <div
          className={clsx(
            // Base: carrusel horizontal con snap (mobile y tablet).
            'flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory hiddenScrollbar -mx-4 px-4',
            // Desktop: si no hay carrusel, vuelve a grilla estática de 3.
            !carousel &&
              'lg:grid lg:grid-cols-3 lg:overflow-visible lg:snap-none lg:mx-0 lg:px-0',
            carousel && 'lg:mx-0 lg:px-0',
          )}
        >
          {items.map((block, index) => (
            <div
              key={index}
              className={clsx(
                'snap-start shrink-0 w-[82%] sm:w-[46%]',
                carousel ? 'lg:w-[31.5%]' : 'lg:w-auto',
              )}
            >
              <FeatureCard block={block} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeatureCard({block}: {block: FeatureBlock}) {
  const {title, description, mediaUrl, mediaType = 'image', mediaAlt = ''} =
    block;

  return (
    <div className="flex flex-col">
      {mediaUrl && (
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
      )}
      {title && (
        <h3 className="mt-4 text-lg md:text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      )}
      {description && (
        <div
          className="mt-2 prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{__html: description}}
        />
      )}
    </div>
  );
}

// Helper to convert Shopify rich text JSON to HTML
function richTextToHtml(richTextJson: string | undefined): string {
  if (!richTextJson) return '';
  
  try {
    const richText = JSON.parse(richTextJson);
    if (!richText || !richText.children) return richTextJson;

    return richText.children
      .map((node: any) => {
        if (node.type === 'paragraph') {
          const content = node.children
            ?.map((child: any) => {
              if (child.type === 'text') {
                let text = child.value || '';
                if (child.bold) text = `<strong>${text}</strong>`;
                if (child.italic) text = `<em>${text}</em>`;
                return text;
              }
              if (child.type === 'link') {
                const linkText = child.children?.map((c: any) => c.value).join('') || '';
                return `<a href="${child.url}" target="${child.target || '_self'}">${linkText}</a>`;
              }
              return '';
            })
            .join('');
          return `<p>${content}</p>`;
        }
        if (node.type === 'heading') {
          const level = node.level || 2;
          const content = node.children?.map((c: any) => c.value).join('') || '';
          return `<h${level}>${content}</h${level}>`;
        }
        if (node.type === 'list') {
          const tag = node.listType === 'ordered' ? 'ol' : 'ul';
          const items = node.children
            ?.map((item: any) => {
              const itemContent = item.children
                ?.map((c: any) => {
                  if (c.type === 'text') return c.value;
                  if (c.type === 'paragraph') {
                    return c.children?.map((pc: any) => pc.value).join('') || '';
                  }
                  return '';
                })
                .join('');
              return `<li>${itemContent}</li>`;
            })
            .join('');
          return `<${tag}>${items}</${tag}>`;
        }
        return '';
      })
      .join('');
  } catch {
    // If not valid JSON, return as-is (might be plain text)
    return richTextJson;
  }
}

// Helper to parse feature blocks from product data
export function parseFeatureBlocks(product: any): FeatureBlock[] {
  const blocks: FeatureBlock[] = [];
  
  // Support up to 4 feature blocks
  for (let i = 1; i <= 4; i++) {
    const title = product?.[`feature_${i}_title`]?.value;
    const descriptionRaw = product?.[`feature_${i}_description`]?.value;
    const description = richTextToHtml(descriptionRaw);
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
