import {type FC} from 'react';
import {Link} from '../Link';
import clsx from 'clsx';

export interface QuickLinkItem {
  id: string;
  svg_icon?: {value?: string};
  link?: {value?: string};
  label?: {value?: string};
  icon_color?: {value?: string};
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

        return (
          <Link
            key={item.id}
            to={link}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            title={label}
          >
            <span
              className="w-5 h-5 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
              dangerouslySetInnerHTML={{__html: processedSvg}}
            />
            {label && (
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
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
