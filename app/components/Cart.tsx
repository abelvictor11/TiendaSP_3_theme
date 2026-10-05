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
import {useFetchers} from '@remix-run/react';
import type {
  CartLine,
  CartDiscountCode,
  CartCost,
  CurrencyCode,
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
import {persistCheckoutAttributes} from '~/lib/checkoutAttributes';
import {FREE_SHIPPING_THRESHOLD_COP} from '~/lib/const';

/**
 * `useOptimisticCart()` appends a newly-added line with no `cost` object at
 * all until the real `LinesAdd` mutation round-trips and the root loader
 * revalidates (confirmed 2026-08-11: the full /cart page and its subtotal
 * are correct once that resolves -- this is purely a drawer/optimistic-
 * render gap, not a discount bug). Until then, both `CartLinePrice` and the
 * drawer subtotal used to render blank / "COP 0", which reads as a broken
 * cart to the customer even though nothing is actually wrong. This estimates
 * from the variant's own listed price (real number, same one shown on the
 * PDP) as a stand-in for that brief window -- not perfect (can't replicate
 * server-side discount allocation client-side), but never worse than the
 * real price, and never a misleading zero.
 */
function lineEstimatedTotal(
  line: OptimisticCartLine,
): {amount: string; currencyCode: CurrencyCode} | null {
  if (line.cost?.totalAmount) return line.cost.totalAmount;
  const unitPrice = (
    line.merchandise as {price?: {amount: string; currencyCode: CurrencyCode}}
  )?.price;
  if (!unitPrice) return null;
  return {
    amount: String(Number(unitPrice.amount) * line.quantity),
    currencyCode: unitPrice.currencyCode,
  };
}

// Mismo patrón que `lineEstimatedTotal`, para el precio "antes" (tachado).
// `compareAtAmountPerQuantity` es POR UNIDAD (a diferencia de `totalAmount`,
// que ya viene multiplicado por cantidad) -- hay que multiplicar por
// `line.quantity` para que sea comparable con `lineEstimatedTotal`, si no
// el tachado quedaría mal para cualquier línea con cantidad > 1.
function lineEstimatedCompareAtTotal(
  line: OptimisticCartLine,
): {amount: string; currencyCode: CurrencyCode} | null {
  if (line.cost?.compareAtAmountPerQuantity) {
    return {
      amount: String(
        Number(line.cost.compareAtAmountPerQuantity.amount) * line.quantity,
      ),
      currencyCode: line.cost.compareAtAmountPerQuantity.currencyCode,
    };
  }
  const compareAtUnitPrice = (
    line.merchandise as {
      compareAtPrice?: {amount: string; currencyCode: CurrencyCode} | null;
    }
  )?.compareAtPrice;
  if (!compareAtUnitPrice) return null;
  return {
    amount: String(Number(compareAtUnitPrice.amount) * line.quantity),
    currencyCode: compareAtUnitPrice.currencyCode,
  };
}

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
  const optimisticCart = useOptimisticCart(originalCart);

  // Con el cart en critical data (fix de #418 en root.tsx), useOptimisticCart
  // se queda devolviendo la PRIMERA línea como `isOptimistic` y el cart sin
  // `checkoutUrl` aun cuando el carrito real ya está resuelto — dejando
  // "Eliminar" del primer ítem deshabilitado (isOptimistic) y "Finalizar
  // compra" sin URL con 1 solo producto (se "arreglaba" solo al agregar un
  // segundo ítem, que forzaba otra revalidación). Solución: usar el carrito
  // REAL (originalCart) cuando no hay ninguna mutación de carrito en vuelo;
  // el optimista solo se usa mientras un LinesAdd/Remove/Update está enviando
  // (para feedback inmediato). Al quedar idle, las líneas traen ids reales
  // (isOptimistic falsy → Eliminar habilitado) y checkoutUrl real.
  const fetchers = useFetchers();
  const cartMutating = fetchers.some(
    (f) =>
      f.state !== 'idle' &&
      (f.formAction?.includes('/cart') ||
        String(f.formData?.get('cartFormInput') || '').length > 0),
  );
  const cart = cartMutating ? optimisticCart : originalCart ?? optimisticCart;
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
        {cartHasItems && <CartCrossSell onClose={onClose} />}
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

// Cross-sell shown once the cart has at least one item -- previously
// `FeaturedProducts` only rendered in `CartEmpty`, so a populated cart
// (the actual point of purchase) had zero cross-sell surface at all.
// Reuses the same self-contained fetcher-based component already proven
// working on the empty-cart state, just with copy suited to "add one more"
// rather than "get started".
function CartCrossSell({onClose}: {onClose?: () => void}) {
  return (
    <section className="px-1 pt-2 pb-6 border-t border-slate-100 dark:border-slate-700 mt-4">
      <FeaturedProducts
        count={4}
        heading="También te puede interesar"
        headingClassName="text-base font-semibold mb-3"
        sortKey="BEST_SELLING"
        isCardSmall
        className="grid grid-cols-2 gap-x-4 gap-y-6"
        onClose={onClose}
      />
    </section>
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

    // IDATTROS-56: este handler nunca persistía fbp/fbc/user_agent/ga ids
    // como cart attributes para CAPI/GA4 MP -- solo lo hacía el checkout-
    // click handler de la página completa de carrito (PR #127), dejando el
    // drawer (el punto de entrada más común) sin este tagging. No se
    // llama e.preventDefault() aquí -- el <a> navega nativamente apenas
    // retorna este handler -- así que no hay nada que "esperar": el fetch
    // (keepalive: true, dentro del helper) ya salió antes de que el
    // navegador navegue, igual que como ya funciona este mismo flujo sin
    // preventDefault para trackCheckoutStarted arriba.
    persistCheckoutAttributes(`client_checkout_${Date.now()}`);

    event.currentTarget.href = decorateCheckoutUrl(checkoutUrl);
  }

  // `cost` (a diferencia de cada línea individual) nunca se actualiza de
  // forma optimista -- useOptimisticCart() lo deja en su valor pre-mutación
  // completo hasta que el LinesAdd resuelve. Antes esto se detectaba
  // chequeando si el subtotal era exactamente "0", pero eso solo cubre el
  // caso de carrito vacío + primer item: agregar un SEGUNDO item a un
  // carrito que ya tenía subtotal > 0 también deja `cost` viejo, y ese
  // heurístico lo daba por bueno -- subestimando el total silenciosamente.
  // La señal correcta es si ALGUNA línea todavía no tiene `cost` real
  // (recién agregada, optimista), sin importar el valor del subtotal.
  const hasPendingLine = lines?.some((line) => !line.cost) ?? false;
  let displaySubtotal = cost?.subtotalAmount;
  if (hasPendingLine && lines?.length) {
    const summed = lines!.reduce<{amount: number; currencyCode: CurrencyCode} | null>(
      (acc, line) => {
        const est = lineEstimatedTotal(line);
        if (!est) return acc;
        return {
          amount: (acc?.amount ?? 0) + Number(est.amount),
          currencyCode: est.currencyCode,
        };
      },
      null,
    );
    displaySubtotal = summed
      ? {amount: String(summed.amount), currencyCode: summed.currencyCode}
      : cost?.subtotalAmount;
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
            {displaySubtotal?.amount ? (
              <Money data={displaySubtotal} />
            ) : (
              '-'
            )}
          </>
        </div>
        <p className="mt-0.5 text-sm text-gray-500">
          Envío e impuestos calculados en el checkout.
        </p>
        <FreeShippingProgress
          cost={{...cost, subtotalAmount: displaySubtotal} as CartCost}
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
  withoutTrailingZeros = true,
  ...passthroughProps
}: {
  line: OptimisticCartLine;
  [key: string]: any;
  withoutTrailingZeros?: boolean;
}) {
  // Línea optimista recién agregada (ver `lineEstimatedTotal`): cost.totalAmount
  // real todavía no llegó del servidor -- usar el precio del variant como
  // estimado en vez de no mostrar nada (antes: blank hasta que resolviera).
  const moneyV2 = line?.cost?.totalAmount ?? lineEstimatedTotal(line);

  if (moneyV2 == null) {
    return null;
  }

  // Antes solo se mostraba el precio final -- el "antes" tachado + "Ahorra
  // X%" que sí se ve en el PDP nunca llegaba al carrito (drawer ni /cart),
  // aunque el producto tuviera descuento real. `Prices` ya sabe mostrar
  // ambos juntos (mismo componente que usa el PDP); solo hacía falta
  // pasarle el compareAt real (o su estimado optimista) también aquí.
  const compareAtMoneyV2 = lineEstimatedCompareAtTotal(line);

  return (
    <Prices
      {...passthroughProps}
      withoutTrailingZeros={withoutTrailingZeros}
      price={moneyV2}
      compareAtPrice={compareAtMoneyV2 ?? undefined}
    />
  );
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
