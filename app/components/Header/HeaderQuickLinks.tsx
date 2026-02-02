import {type FC} from 'react';
import {Link} from '../Link';
import clsx from 'clsx';

export interface QuickLinkItem {
  id: string;
  svg_icon?: {value?: string};
  link?: {value?: string};
  label?: {value?: string};
  icon_color?: {value?: string};
  text_color?: {value?: string};
  background_color?: {value?: string};
  border_color?: {value?: string};
}

export interface HeaderQuickLinksProps {
  className?: string;
  items?: QuickLinkItem[];
  enabled?: boolean;
}

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
      {visibleItems.map((item) => {
        const svgContent = item.svg_icon?.value;
        const link = item.link?.value || '#';
        const label = item.label?.value;
        const iconColor = item.icon_color?.value || '#000000';
        const textColor = item.text_color?.value;
        const backgroundColor = item.background_color?.value;
        const borderColor = item.border_color?.value;

        if (!svgContent) return null;

        // Process SVG to apply the color
        const processedSvg = svgContent
          .replace(/fill="[^"]*"/g, `fill="${iconColor}"`)
          .replace(/stroke="[^"]*"/g, `stroke="${iconColor}"`)
          // If no fill/stroke attributes, add fill to the svg tag
          .replace(/<svg([^>]*)>/g, (match, attrs) => {
            if (!attrs.includes('fill=') && !attrs.includes('stroke=')) {
              return `<svg${attrs} fill="${iconColor}">`;
            }
            return match;
          });

        // Build inline styles for customizable colors
        const linkStyle: React.CSSProperties = {};
        if (backgroundColor) linkStyle.backgroundColor = backgroundColor;
        if (borderColor) {
          linkStyle.borderColor = borderColor;
          linkStyle.borderWidth = '1px';
          linkStyle.borderStyle = 'solid';
        }

        return (
          <Link
            key={item.id}
            to={link}
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors group',
              !backgroundColor && 'hover:bg-slate-100 dark:hover:bg-slate-800',
            )}
            style={linkStyle}
            title={label}
          >
            <span
              className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{__html: processedSvg}}
            />
            {label && (
              <span 
                className={clsx(
                  'text-xs font-medium hidden sm:inline',
                  !textColor && 'text-slate-700 dark:text-slate-300',
                )}
                style={textColor ? {color: textColor} : undefined}
              >
                {label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};

export default HeaderQuickLinks;
