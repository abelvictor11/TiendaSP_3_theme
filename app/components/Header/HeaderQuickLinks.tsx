import {type FC, useState, useRef, useEffect} from 'react';
import {Link} from '../Link';
import clsx from 'clsx';

export interface QuickLinkSubitem {
  id: string;
  label?: {value?: string};
  link?: {value?: string};
  svg_icon?: {value?: string};
}

export interface QuickLinkItem {
  id: string;
  svg_icon?: {value?: string};
  link?: {value?: string};
  label?: {value?: string};
  icon_color?: {value?: string};
  text_color?: {value?: string};
  background_color?: {value?: string};
  border_color?: {value?: string};
  subitems?: {
    references?: {
      nodes?: QuickLinkSubitem[];
    };
  };
}

export interface HeaderQuickLinksProps {
  className?: string;
  items?: QuickLinkItem[];
  enabled?: boolean;
}

function processSvg(svgContent: string, color: string): string {
  return svgContent
    .replace(/fill="(?!none)[^"]*"/g, `fill="${color}"`)
    .replace(/stroke="(?!none)[^"]*"/g, `stroke="${color}"`)
    .replace(/<svg([^>]*)>/g, (match, attrs) => {
      if (!attrs.includes('fill=') && !attrs.includes('stroke=')) {
        return `<svg${attrs} fill="none" stroke="${color}">`;
      }
      return match;
    });
}

const QuickLinkWithDropdown: FC<{item: QuickLinkItem}> = ({item}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const svgContent = item.svg_icon?.value;
  const link = item.link?.value || '#';
  const label = item.label?.value;
  const iconColor = item.icon_color?.value || '#000000';
  const textColor = item.text_color?.value;
  const backgroundColor = item.background_color?.value;
  const borderColor = item.border_color?.value;
  const subitems = item.subitems?.references?.nodes || [];
  const hasSubitems = subitems.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!svgContent) return null;

  const processedSvg = processSvg(svgContent, iconColor);

  const linkStyle: React.CSSProperties = {};
  if (backgroundColor) linkStyle.backgroundColor = backgroundColor;
  if (borderColor) {
    linkStyle.borderColor = borderColor;
    linkStyle.borderWidth = '1px';
    linkStyle.borderStyle = 'solid';
  }

  const triggerClasses = clsx(
    'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors group cursor-pointer',
    !backgroundColor && 'hover:bg-[#efefef] dark:hover:bg-slate-800',
  );

  const iconEl = (
    <span
      className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
      dangerouslySetInnerHTML={{__html: processedSvg}}
    />
  );

  const labelEl = label ? (
    <span
      className={clsx(
        'text-xs font-normal hidden sm:inline',
        !textColor && 'text-black dark:text-slate-300',
      )}
      style={textColor ? {color: textColor} : undefined}
    >
      {label}
    </span>
  ) : null;

  if (!hasSubitems) {
    return (
      <Link
        to={link}
        className={triggerClasses}
        style={linkStyle}
        title={label}
      >
        {iconEl}
        {labelEl}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className={triggerClasses}
        style={linkStyle}
        title={label}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
      >
        {iconEl}
        {labelEl}
        <svg
          className={clsx(
            'w-3 h-3 transition-transform hidden sm:block',
            open && 'rotate-180',
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          {subitems.map((sub) => {
            const subLabel = sub.label?.value;
            const subLink = sub.link?.value || '#';
            const subSvg = sub.svg_icon?.value;

            return (
              <Link
                key={sub.id}
                to={subLink}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setOpen(false)}
              >
                {subSvg && (
                  <span
                    className="w-4 h-4 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full text-slate-500"
                    dangerouslySetInnerHTML={{__html: subSvg}}
                  />
                )}
                <span>{subLabel}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const HeaderQuickLinks: FC<HeaderQuickLinksProps> = ({
  className = '',
  items = [],
  enabled = true,
}) => {
  if (!enabled || !items.length) {
    return null;
  }

  // Only show max 3 items
  const visibleItems = items.slice(0, 3);

  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {visibleItems.map((item) => (
        <QuickLinkWithDropdown key={item.id} item={item} />
      ))}
    </div>
  );
};

export default HeaderQuickLinks;
