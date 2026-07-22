import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {markRealCartAdd} from '~/lib/cartActionSignal';

export function AddToCartButton({
  analytics,
  children,
  lines,
  className = '',
  disabled,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  lines: Array<OptimisticCartLineInput>;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
  analytics?: unknown;
  onClick?: () => void;
}) {
  return (
    <CartForm route="/cart" inputs={{lines}} action={CartForm.ACTIONS.LinesAdd}>
      {(fetcher) => (
        <>
          <input
            name="analytics"
            type="hidden"
            value={JSON.stringify(analytics || {})}
          />
          <button
            type="submit"
            className={className}
            disabled={disabled ?? fetcher.state !== 'idle'}
            onClick={() => {
              // Marks this as a real add so CustomAnalytics can tell it apart
              // from CartAnalytics' first-render false positive for a
              // resumed cart — see cartActionSignal.ts.
              markRealCartAdd();
              onClick?.();
            }}
            {...props}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}
