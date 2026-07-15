import clsx from 'clsx';
import {useSearchParams, useLocation, useNavigate} from '@remix-run/react';

export type ViewAsColumns = 1 | 2 | 3 | 4;

const VIEW_ICONS: {cols: ViewAsColumns; label: string; icon: JSX.Element}[] = [
  {
    cols: 1,
    label: '1 columna',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="16" height="2.5" rx="0.5" fill="currentColor" />
        <rect x="2" y="8.75" width="16" height="2.5" rx="0.5" fill="currentColor" />
        <rect x="2" y="14.5" width="16" height="2.5" rx="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    cols: 2,
    label: '2 columnas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="7" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="11" y="2" width="7" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    cols: 3,
    label: '3 columnas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1.5" y="2" width="4.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7.75" y="2" width="4.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="14" y="2" width="4.5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    cols: 4,
    label: '4 columnas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="3.25" height="16" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="5.75" y="2" width="3.25" height="16" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="10.5" y="2" width="3.25" height="16" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        <rect x="15.25" y="2" width="3.25" height="16" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
      </svg>
    ),
  },
];

export function useViewAsColumns(defaultCols: ViewAsColumns = 4): ViewAsColumns {
  const [params] = useSearchParams();
  const viewAs = Number(params.get('viewAs')) as ViewAsColumns;
  if ([1, 2, 3, 4].includes(viewAs)) return viewAs;
  return defaultCols;
}

export default function ViewAsToggle() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeCols = useViewAsColumns();

  const handleClick = (cols: ViewAsColumns) => {
    const newParams = new URLSearchParams(params);
    if (cols === 4) {
      newParams.delete('viewAs');
    } else {
      newParams.set('viewAs', String(cols));
    }
    const search = newParams.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}`, {
      preventScrollReset: true,
    });
  };

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider mr-1">
        Ver como
      </span>
      {VIEW_ICONS.map(({cols, label, icon}) => (
        <button
          key={cols}
          onClick={() => handleClick(cols)}
          aria-label={label}
          title={label}
          className={clsx(
            'p-1.5 rounded border transition-colors',
            activeCols === cols
              ? 'border-neutral-900 text-neutral-900 bg-neutral-100'
              : 'border-neutral-300 text-neutral-400 hover:border-neutral-500 hover:text-neutral-600',
          )}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
