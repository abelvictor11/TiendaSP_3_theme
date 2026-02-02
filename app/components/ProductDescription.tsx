import {type FC, useState, useMemo} from 'react';

interface ProductDescriptionProps {
  descriptionHtml: string;
  minCharsToTruncate?: number;
  className?: string;
}

const ProductDescription: FC<ProductDescriptionProps> = ({
  descriptionHtml,
  minCharsToTruncate = 300,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Strip HTML tags to count actual text characters
  const textContent = useMemo(() => {
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.innerHTML = descriptionHtml;
      return div.textContent || div.innerText || '';
    }
    // SSR fallback: simple regex strip
    return descriptionHtml.replace(/<[^>]*>/g, '');
  }, [descriptionHtml]);

  const shouldTruncate = textContent.length > minCharsToTruncate;

  // Find a good truncation point (after a complete word/sentence)
  const truncatedHtml = useMemo(() => {
    if (!shouldTruncate || isExpanded) return descriptionHtml;
    
    // Find position in original HTML that corresponds to ~300 chars of text
    let textCount = 0;
    let inTag = false;
    let cutIndex = 0;
    
    for (let i = 0; i < descriptionHtml.length; i++) {
      if (descriptionHtml[i] === '<') {
        inTag = true;
      } else if (descriptionHtml[i] === '>') {
        inTag = false;
      } else if (!inTag) {
        textCount++;
        if (textCount >= minCharsToTruncate) {
          // Find end of current word or tag
          let endIndex = i;
          while (endIndex < descriptionHtml.length && 
                 descriptionHtml[endIndex] !== ' ' && 
                 descriptionHtml[endIndex] !== '<' &&
                 descriptionHtml[endIndex] !== '\n') {
            endIndex++;
          }
          cutIndex = endIndex;
          break;
        }
      }
    }
    
    // Close any open tags and add ellipsis
    let truncated = descriptionHtml.substring(0, cutIndex) + '...';
    
    // Simple tag balancing for common tags
    const openTags: string[] = [];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(truncated)) !== null) {
      const isClosing = match[0].startsWith('</');
      const tagName = match[1].toLowerCase();
      
      if (isClosing) {
        const lastOpen = openTags.lastIndexOf(tagName);
        if (lastOpen !== -1) {
          openTags.splice(lastOpen, 1);
        }
      } else if (!match[0].endsWith('/>')) {
        // Skip self-closing tags
        const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link'];
        if (!selfClosing.includes(tagName)) {
          openTags.push(tagName);
        }
      }
    }
    
    // Close remaining open tags
    for (let i = openTags.length - 1; i >= 0; i--) {
      truncated += `</${openTags[i]}>`;
    }
    
    return truncated;
  }, [descriptionHtml, shouldTruncate, isExpanded, minCharsToTruncate]);

  if (!descriptionHtml) return null;

  return (
    <div className={className}>
      <h2 className="text-2xl font-semibold">Detalles del producto</h2>
      <div
        className="prose prose-sm sm:prose dark:prose-invert sm:max-w-4xl mt-7"
        dangerouslySetInnerHTML={{
          __html: isExpanded ? descriptionHtml : truncatedHtml,
        }}
      />
      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          {isExpanded ? 'Ver menos' : 'Ver más...'}
        </button>
      )}
    </div>
  );
};

export default ProductDescription;
