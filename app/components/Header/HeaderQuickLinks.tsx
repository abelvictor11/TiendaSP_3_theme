import {type FC, useState, useRef, useEffect, useCallback} from 'react';
import {Link} from '@remix-run/react';

export interface QuickLinkSubitem {
  id: string;
  label?: {value?: string};
  link?: {value?: string};
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
  subitems?: {references?: {nodes?: QuickLinkSubitem[]}};
}

interface HeaderQuickLinksProps {
  className?: string;
  items?: QuickLinkItem[];
  enabled?: boolean;
}

const HeaderQuickLinks: FC<HeaderQuickLinksProps> = ({
  className = '',
  items = [],
  enabled = true,
}) => {
  if (!enabled || items.length === 0) return null;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {items.map((item) => (
        <QuickLinkButton key={item.id} item={item} />
      ))}
    </div>
  );
};

function QuickLinkButton({item}: {item: QuickLinkItem}) {
  const subitems = item.subitems?.references?.nodes || [];
  const hasSubitems = subitems.length > 0;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const bgColor = item.background_color?.value || 'transparent';
  const textColor = item.text_color?.value || 'currentColor';
  const iconColor = item.icon_color?.value || 'currentColor';
  const borderColor = item.border_color?.value;

  const buttonStyle: React.CSSProperties = {
    backgroundColor: bgColor !== 'transparent' ? bgColor : undefined,
    color: textColor,
    borderColor: borderColor || undefined,
    borderWidth: borderColor ? '1px' : undefined,
    borderStyle: borderColor ? 'solid' : undefined,
  };

  if (!hasSubitems) {
    return (
      <Link
        to={item.link?.value || '#'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
        style={buttonStyle}
      >
        {item.svg_icon?.value && (
          <span
            className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full"
            style={{color: iconColor}}
            dangerouslySetInnerHTML={{__html: item.svg_icon.value}}
          />
        )}
        {item.label?.value && <span>{item.label.value}</span>}
      </Link>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
        style={buttonStyle}
      >
        {item.svg_icon?.value && (
          <span
            className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full"
            style={{color: iconColor}}
            dangerouslySetInnerHTML={{__html: item.svg_icon.value}}
          />
        )}
        {item.label?.value && <span>{item.label.value}</span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50">
          {subitems.map((sub) => (
            <Link
              key={sub.id}
              to={sub.link?.value || '#'}
              className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {sub.label?.value}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeaderQuickLinks;
