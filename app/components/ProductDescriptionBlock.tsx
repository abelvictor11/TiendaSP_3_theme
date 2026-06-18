import {useState} from 'react';
import clsx from 'clsx';

interface ProductDescriptionBlockProps {
  descriptionHtml: string;
  maxChars?: number;
  className?: string;
}

export function ProductDescriptionBlock({
  descriptionHtml,
  maxChars = 300,
  className,
}: ProductDescriptionBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!descriptionHtml) return null;

  // Strip HTML tags to count actual text characters
  const textContent = descriptionHtml.replace(/<[^>]*>/g, '');
  const needsTruncation = textContent.length > maxChars;

  // For truncation, we need to be careful with HTML
  // We'll show full HTML when expanded, truncated text when collapsed
  const truncatedText = needsTruncation && !isExpanded
    ? textContent.slice(0, maxChars) + '...'
    : null;

  return (
    <div className={clsx('product-description-block', className)}>
      <h3 className="text-lg font-semibold mb-3">Descripción</h3>
      
      {truncatedText ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-slate-600 dark:text-slate-300">{truncatedText}</p>
        </div>
      ) : (
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{__html: descriptionHtml}}
        />
      )}

      {needsTruncation && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline underline-offset-2"
        >
          {isExpanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
}
