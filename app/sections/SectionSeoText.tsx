import {useState} from 'react';
import {isVisibleBackground} from '~/utils/isVisibleBackground';
import {type ParsedMetafields} from '@shopify/hydrogen';
import {parseSection} from '~/utils/parseSection';
import type {SectionSeoTextFragment} from 'storefrontapi.generated';
import BackgroundSection from '~/components/BackgroundSection';
import clsx from 'clsx';

export function SectionSeoText(props: SectionSeoTextFragment) {
  const section = parseSection<
    SectionSeoTextFragment,
    {
      heading?: ParsedMetafields['single_line_text_field'];
    }
  >(props);

  const {
    heading,
    content,
    max_chars,
    background_color,
  } = section;

  const [isExpanded, setIsExpanded] = useState(false);

  if (!content?.value) return null;

  // Parse rich text JSON to HTML
  let htmlContent = '';
  try {
    const richText = JSON.parse(content.value);
    htmlContent = richTextToHtml(richText);
  } catch {
    htmlContent = content.value;
  }

  // Strip HTML to count characters
  const textContent = htmlContent.replace(/<[^>]*>/g, '');
  const maxChars = Number(max_chars?.value) || 300;
  const needsTruncation = textContent.length > maxChars;

  // Truncate text for display
  const truncatedText = needsTruncation && !isExpanded
    ? textContent.slice(0, maxChars) + '...'
    : null;

  // Un fondo blanco o gris muy claro no aporta nada visual y deja un panel
  // gris "suelto"; en esos casos no se renderiza el BackgroundSection.
  const hasBgColor = isVisibleBackground(background_color?.value);

  return (
    <section className="section-SectionSeoText container">
      <div className={clsx(hasBgColor ? 'relative py-12 lg:py-16 px-6 rounded-2xl' : '')}>
        {hasBgColor && (
          <BackgroundSection
            style={{backgroundColor: background_color?.value}}
          />
        )}
        <div className="max-w-4xl mx-auto">
          {heading?.value && (
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-slate-900 dark:text-white">
              {heading.value}
            </h2>
          )}

          {truncatedText ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
              <p>{truncatedText}</p>
            </div>
          ) : (
            <div
              className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-slate-600 dark:text-slate-300"
              dangerouslySetInnerHTML={{__html: htmlContent}}
            />
          )}

          {needsTruncation && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline underline-offset-2"
            >
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Helper to convert Shopify rich text JSON to HTML
function richTextToHtml(richText: any): string {
  if (!richText || !richText.children) return '';

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
}

export const SECTION_SEO_TEXT_FRAGMENT = `#graphql
  fragment SectionSeoText on Metaobject {
    type
    heading: field(key: "heading") {
      key
      value
    }
    content: field(key: "content") {
      key
      value
    }
    max_chars: field(key: "max_chars") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
  }
`;
