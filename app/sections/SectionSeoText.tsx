import {Link} from '~/components/Link';
import clsx from 'clsx';
import {useState} from 'react';

interface SectionSeoTextProps {
  type: string;
  id: string;
  heading?: {value?: string};
  body?: {value?: string};
  cta_text?: {value?: string};
  cta_link?: {value?: string};
  cta_text_2?: {value?: string};
  cta_link_2?: {value?: string};
  background_color?: {value?: string};
  text_color?: {value?: string};
  heading_color?: {value?: string};
  text_align?: {value?: 'left' | 'center' | 'right'};
  max_width?: {value?: string};
  collapsible?: {value?: string};
  collapsed_height?: {value?: string};
}

export function SectionSeoText(props: SectionSeoTextProps) {
  const {
    heading,
    body,
    cta_text,
    cta_link,
    cta_text_2,
    cta_link_2,
    background_color,
    text_color,
    heading_color,
    text_align,
    max_width,
    collapsible,
    collapsed_height,
  } = props;

  const alignment = text_align?.value || 'left';
  const maxWidth = max_width?.value || '900';
  const isCollapsible = collapsible?.value === 'true';
  const collapsedPx = collapsed_height?.value
    ? parseInt(collapsed_height.value)
    : 120;

  const [expanded, setExpanded] = useState(false);

  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center mx-auto',
    right: 'text-right ml-auto',
  };

  const ctaAlignmentClasses: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  if (!heading?.value && !body?.value) return null;

  return (
    <section
      className="nc-SectionSeoText"
      style={{
        backgroundColor: background_color?.value || 'transparent',
      }}
    >
      <div className="container py-8 lg:py-12">
        <div
          className={clsx(alignmentClasses[alignment])}
          style={{maxWidth: `${maxWidth}px`}}
        >
          {heading?.value && (
            <h2
              className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 lg:mb-6"
              style={{color: heading_color?.value || text_color?.value || undefined}}
              dangerouslySetInnerHTML={{__html: heading.value}}
            />
          )}

          {body?.value && (
            <div className="relative">
              <div
                className={clsx(
                  'seo-text-body prose prose-sm sm:prose-base max-w-none',
                  'prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3',
                  'prose-p:mb-4 prose-p:leading-relaxed',
                  'prose-ul:mb-4 prose-ol:mb-4 prose-li:mb-1',
                  'prose-a:text-primary-600 prose-a:underline hover:prose-a:text-primary-700',
                  isCollapsible && !expanded && 'overflow-hidden',
                )}
                style={{
                  color: text_color?.value || undefined,
                  ...(isCollapsible && !expanded
                    ? {maxHeight: `${collapsedPx}px`}
                    : {}),
                }}
                dangerouslySetInnerHTML={{__html: body.value}}
              />

              {isCollapsible && !expanded && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                  style={{
                    background: `linear-gradient(to bottom, transparent, ${background_color?.value || '#ffffff'})`,
                  }}
                />
              )}

              {isCollapsible && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-700 underline transition-colors"
                >
                  {expanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}
            </div>
          )}

          {(cta_text?.value || cta_text_2?.value) && (
            <div
              className={clsx(
                'flex flex-wrap gap-3 mt-6',
                ctaAlignmentClasses[alignment],
              )}
            >
              {cta_text?.value && cta_link?.value && (
                <Link
                  to={cta_link.value}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  {cta_text.value}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                  >
                    <path
                      d="M2.6665 8H13.3332M13.3332 8L9.33317 4M13.3332 8L9.33317 12"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}

              {cta_text_2?.value && cta_link_2?.value && (
                <Link
                  to={cta_link_2.value}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  style={{color: text_color?.value || undefined}}
                >
                  {cta_text_2.value}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 16 16"
                    stroke="currentColor"
                  >
                    <path
                      d="M2.6665 8H13.3332M13.3332 8L9.33317 4M13.3332 8L9.33317 12"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export const SECTION_SEO_TEXT_FRAGMENT = `#graphql
  fragment SectionSeoText on Metaobject {
    type
    id
    heading: field(key: "heading") {
      key
      value
    }
    body: field(key: "body") {
      key
      value
    }
    cta_text: field(key: "cta_text") {
      key
      value
    }
    cta_link: field(key: "cta_link") {
      key
      value
    }
    cta_text_2: field(key: "cta_text_2") {
      key
      value
    }
    cta_link_2: field(key: "cta_link_2") {
      key
      value
    }
    background_color: field(key: "background_color") {
      key
      value
    }
    text_color: field(key: "text_color") {
      key
      value
    }
    heading_color: field(key: "heading_color") {
      key
      value
    }
    text_align: field(key: "text_align") {
      key
      value
    }
    max_width: field(key: "max_width") {
      key
      value
    }
    collapsible: field(key: "collapsible") {
      key
      value
    }
    collapsed_height: field(key: "collapsed_height") {
      key
      value
    }
  }
`;
