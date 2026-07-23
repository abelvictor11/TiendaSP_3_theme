import {CartForm, type OptimisticCartLineInput} from '@shopify/hydrogen';
import {CartActionTracker} from '~/components/CartActionTracker';

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
          <CartActionTracker state={fetcher.state} />
          <button
            type="submit"
            className={className}
            disabled={disabled ?? fetcher.state !== 'idle'}
            onClick={onClick}
            {...props}
          >
            {children}
          </button>
        </>
      )}
    </CartForm>
  );
}
