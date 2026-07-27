import clsx from 'clsx';
import {
  flattenConnection,
  CartForm,
  Image,
  Money,
  type OptimisticCart,
  useOptimisticCart,
  type OptimisticCartLine,
  type CartReturn,
} from '@shopify/hydrogen';
import type {
  CartLine,
  CartDiscountCode,
  CartCost,
} from '@shopify/hydrogen/storefront-api-types';
import {Link} from '~/components/Link';
import {FeaturedProducts} from '~/components/FeaturedProducts';
import Prices from './Prices';
import ButtonPrimary from './Button/ButtonPrimary';
import ButtonSecondary from './Button/ButtonSecondary';
import {ArrowLeftIcon} from '@heroicons/react/24/solid';
import {ShieldCheckIcon} from '@heroicons/react/24/outline';
import {useVariantUrl} from '~/lib/variants';
import {useAside} from './Aside';
import type {MouseEvent} from 'react';
import {decorateCheckoutUrl} from '~/lib/checkoutContinuity';
import {trackCheckoutStarted} from '~/components/CustomAnalytics';
import {FREE_SHIPPING_THRESHOLD_COP} from '~/lib/const';

/**
 * Compact, asset-free trust signal shown next to the checkout CTA. No
 * payment-provider logos exist as image assets in this repo, so this names
 * the store's actual live gateways (per the Shopify order data: Addi,
 * Mercado Pago, and Sistecredito together are the large majority of real
 * checkout volume) as plain text next to a lock/shield icon, rather than
 * fabricating or omitting logos.
 */
export function CheckoutTrustSignal({className = ''}: {className?: string}) {
  return (
    <p
      className={`flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <ShieldCheckIcon className="w-4 h-4 flex-shrink-0" />
      Pago 100% seguro con Mercado Pago, Addi, Sistecredito y más
    </p>
  );
}

export function Cart({
  onClose,
  cart: originalCart,
  freeShippingThreshold,
}: {
  onClose?: () => void;
  cart: OptimisticCart | null | undefined | CartReturn;
  freeShippingThreshold?: number;
}) {
  // `useOptimisticCart` adds optimistic line items to the cart.
  // These line items are displayed in the cart until the server responds.
  const cart = useOptimisticCart(originalCart);
  const linesCount = Boolean(cart?.lines?.nodes?.length || 0);

  return (
    <>
      <CartEmpty hidden={linesCount} onClose={onClose} />
      <CartDetails
        onClose={onClose}
        cart={cart as OptimisticCart}
        freeShippingThreshold={freeShippingThreshold}
      />
    </>
  );
}

function CartDetails({
  cart,
  onClose,
  freeShippingThreshold,
}: {
  cart: OptimisticCart;
  onClose?: () => void;
  freeShippingThreshold?: number;
}) {
  // @todo: get optimistic cart cost
  const cartHasItems = (cart?.totalQuantity || 0) > 0;

  return (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      <div className="flex-1 overflow-auto hiddenScrollbar">
        <CartLines lines={cart?.lines} />
      </div>
      {cartHasItems && (
        <CartSummary
          cost={cart.cost}
          discountCodes={cart.discountCodes}
          checkoutUrl={cart.checkoutUrl}
          lines={cart?.lines ? flattenConnection(cart.lines) : []}
          onClose={onClose}
          freeShippingThreshold={freeShippingThreshold}
        />
      )}
    </div>
  );
}

function CartLines({lines: cartLines}: {lines?: OptimisticCart['lines']}) {
  const currentLines = cartLines ? flattenConnection(cartLines) : [];

  return (
    <section
      aria-labelledby="cart-contents"
      className="overflow-auto transition flex-1 hiddenScrollbar"
    >
      <ul className="grid divide-y divide-slate-100 dark:divide-slate-700">
        {currentLines.map((line) => (
          <CartLineItem key={line.id} line={line} />
        ))}
      </ul>
    </section>
  );
}

function CartSummary({
  cost,
  children = null,
  checkoutUrl,
  discountCodes,
  lines,
  onClose,
  freeShippingThreshold,
}: {
  children?: React.ReactNode;
  cost?: CartCost;
  discountCodes?: CartDiscountCode[];
  checkoutUrl?: string;
  lines?: OptimisticCartLine[];
  onClose?: () => void;
  freeShippingThreshold?: number;
}) {
  function handleCheckoutClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !checkoutUrl
    ) {
      return;
    }

    // Igual que el /cart completo (routes/($locale).cart.tsx): quien inicia
    // checkout desde el drawer también dispara "Checkout Started" — antes
    // solo el /cart completo lo hacía, dejando este flujo (el más común, ya
    // que el drawer se abre desde cualquier "Agregar al carrito") sin trackear.
    trackCheckoutStarted(cost, (lines ?? []) as any);

    event.currentTarget.href = decorateCheckoutUrl(checkoutUrl);
  }

  return (
    <section
      aria-labelledby="summary-heading"
      className="grid gap-4 py-6 border-t border-slate-100 flex-shrink-0 mt-auto"
    >
      <h2 id="summary-heading" className="sr-only">
        Resumen del pedido
      </h2>
      <div className="">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <>
            {cost?.subtotalAmount?.amount ? (
              <Money data={cost?.subtotalAmount} />
            ) : (
              '-'
            )}
          </>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Envío e impuestos calculados en el checkout.
        </p>
        <FreeShippingProgress
          cost={cost}
          threshold={freeShippingThreshold}
        />
        <div className="grid grid-cols-2 gap-2 mt-5">
          <ButtonSecondary
            href="/cart"
            className="flex-1 border border-slate-200 dark:border-slate-700"
            onClick={onClose}
          >
            Ver carrito
          </ButtonSecondary>
          <a
            className="flex"
            href={checkoutUrl}
            target="_self"
            onClick={handleCheckoutClick}
          >
            <ButtonPrimary className="flex-1">Finalizar compra</ButtonPrimary>
          </a>
        </div>
        <CheckoutTrustSignal className="mt-3" />
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            o{' '}
            <button
              type="button"
              className="font-medium text-primary-600 hover:text-primary-500"
              onClick={onClose}
            >
              Seguir comprando
              <span aria-hidden="true"> &rarr;</span>
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}

// Barra de progreso hacia envío gratis. El umbral llega como prop, leído en
// vivo del Automatic Discount "Envío gratis" en Shopify Admin (ver
// root.tsx + lib/shipping.server.ts) — si cambia en Admin > Descuentos, se
// refleja aquí sin deploy. FREE_SHIPPING_THRESHOLD_COP solo se usa si esa
// lectura falla (token no configurado, Admin API caída, etc.). Solo aplica
// en COP — si la tienda alguna vez vende en otra moneda, este umbral en
// pesos no tendría sentido y el componente no renderiza nada.
function FreeShippingProgress({
  cost,
  threshold,
}: {
  cost?: CartCost;
  threshold?: number;
}) {
  const currencyCode = cost?.subtotalAmount?.currencyCode;
  if (currencyCode && currencyCode !== 'COP') return null;

  const subtotal = Number(cost?.subtotalAmount?.amount ?? 0);
  if (!subtotal) return null;

  const freeShippingThreshold = threshold || FREE_SHIPPING_THRESHOLD_COP;
  const remaining = freeShippingThreshold - subtotal;
  const pct = Math.min(
    100,
    Math.round((subtotal / freeShippingThreshold) * 100),
  );

  if (remaining <= 0) {
    return (
      <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400">
        ¡Tu pedido tiene envío gratis!
      </div>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Te faltan{' '}
        <span className="font-semibold text-slate-900 dark:text-white">
          <Money
            data={{amount: String(remaining), currencyCode: currencyCode ?? 'COP'}}
            withoutTrailingZeros
          />
        </span>{' '}
        para envío gratis
      </p>
      <div className="mt-1.5 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-300"
          style={{width: `${pct}%`}}
        />
      </div>
    </div>
  );
}

function CartLineItem({line}: {line: OptimisticCartLine}) {
  const {id, quantity, merchandise, isOptimistic} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close: closeCartAside} = useAside();

  return (
    <div
      key={id}
      style={
        {
          // Hide the line item if the optimistic data action is remove
          // Do not remove the form from the DOM
          // display: optimisticData?.action === 'remove' ? 'none' : 'flex',
        }
      }
      className="flex py-6"
    >
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-100">
        <>
          {merchandise.image && (
            <Link to={lineItemUrl} onClick={closeCartAside}>
              <Image
                width={110}
                height={110}
                data={merchandise.image}
                className="absolute inset-0 object-cover rounded w-full h-full"
                alt={merchandise.title}
                sizes="(min-width: 1024px) 120px, 100px"
              />
            </Link>
          )}
        </>
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div className="flex justify-between gap-5">
          <div>
            <h3 className="text-base font-medium">
              {merchandise?.product?.handle ? (
                <Link to={lineItemUrl} onClick={closeCartAside}>
                  {merchandise?.product?.title || ''}
                </Link>
              ) : (
                <span>{merchandise?.product?.title || ''}</span>
              )}
            </h3>
            <div className="mt-1 text-sm text-slate-500 dark:text-black flex pe-3 gap-x-4">
              {merchandise?.selectedOptions.length < 3
                ? (merchandise?.selectedOptions || []).map((option, index) => {
                    // Default Title is not a useful option
                    if (
                      option.name === 'Title' &&
                      option.value === 'Default Title'
                    ) {
                      return null;
                    }
                    if (!option.name || !option.value || index > 3) {
                      return null;
                    }

                    return (
                      <div
                        key={option.name}
                        className={clsx(
                          !!index && 'border-l border-gray-200 pl-4',
                          'capitalize',
                        )}
                      >
                        <span className="line-clamp-1">{option.value}</span>
                      </div>
                    );
                  })
                : merchandise.title || ''}
            </div>
          </div>
          <CartLinePrice line={line} className="mt-0.5" />
        </div>
        <div className="flex flex-1 items-end justify-between text-sm">
          <p className="text-slate-500 dark:text-black">
            {`Cant: ` + line.quantity}
          </p>

          <div className="flex">
            <ItemRemoveButton lineId={id} disabled={!!isOptimistic} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ItemRemoveButton({
  lineId,
  disabled,
}: {
  lineId: CartLine['id'];
  disabled: boolean;
}) {
  return (
    <CartForm
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{
        lineIds: [lineId],
      }}
    >
      <button
        type="submit"
        className="font-medium text-primary-600 hover:text-primary-700 disabled:text-slate-600"
        disabled={disabled}
        title="Eliminar del carrito"
      >
        Eliminar
      </button>
    </CartForm>
  );
}

export function CartLinePrice({
  line,
  priceType = 'regular',
  withoutTrailingZeros = true,
  ...passthroughProps
}: {
  line: OptimisticCartLine;
  priceType?: 'regular' | 'compareAt';
  [key: string]: any;
  withoutTrailingZeros?: boolean;
}) {
  if (!line?.cost?.amountPerQuantity || !line?.cost?.totalAmount) return null;

  const moneyV2 =
    priceType === 'regular'
      ? line.cost.totalAmount
      : line.cost.compareAtAmountPerQuantity;

  if (moneyV2 == null) {
    return null;
  }

  return (
    <Prices
      {...passthroughProps}
      withoutTrailingZeros={withoutTrailingZeros}
      price={moneyV2}
    />
  );

  // return <Money withoutTrailingZeros {...passthroughProps} data={moneyV2} />;
}

function CartEmpty({
  hidden = false,
  onClose,
}: {
  hidden: boolean;
  onClose?: () => void;
}) {
  return (
    <div className={clsx('h-full overflow-auto py-6')} hidden={hidden}>
      <section className="grid gap-6">
        <p>
          Parece que no has agregado nada todavía. ¡Comencemos!
        </p>
        <div>
          <ButtonPrimary onClick={onClose}>
            <ArrowLeftIcon className="w-4 h-4 me-2" />
            <span>Seguir comprando</span>
          </ButtonPrimary>
        </div>
      </section>
      <section className="grid gap-8 pt-16">
        <FeaturedProducts
          count={4}
          heading="Los más vendidos"
          onClose={onClose}
          sortKey="BEST_SELLING"
          isCardSmall
        />
      </section>
    </div>
  );
}
