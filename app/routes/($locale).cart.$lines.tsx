import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {
  appendMarketingParamsToCheckoutUrl,
  MARKETING_PARAMS,
  type MarketingParams,
} from '~/lib/checkoutContinuity';

/**
 * Automatically creates a new cart based on the URL and redirects straight to checkout.
 * Expected URL structure:
 * ```ts
 * /cart/<variant_id>:<quantity>
 *
 * ```
 * More than one `<variant_id>:<quantity>` separated by a comma, can be supplied in the URL, for
 * carts with more than one product variant.
 *
 * @param `?discount` an optional discount code to apply to the cart
 * @example
 * Example path creating a cart with two product variants, different quantities, and a discount code:
 * ```ts
 * /cart/41007289663544:1,41007289696312:2?discount=HYDROBOARD
 *
 * ```
 * @preserve
 */
export async function loader({request, context, params}: LoaderFunctionArgs) {
  const {cart} = context;
  const {lines} = params;
  const linesMap = lines?.split(',').map((line) => {
    const lineDetails = line.split(':');
    const variantId = lineDetails[0];
    const quantity = parseInt(lineDetails[1], 10);

    return {
      merchandiseId: `gid://shopify/ProductVariant/${variantId}`,
      quantity,
    };
  });

  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);

  const discount = searchParams.get('discount');
  const discountArray = discount ? [discount] : [];

  // Este loader redirige directo a Shopify checkout sin pasar por ninguna
  // página del storefront, así que decorateCheckoutUrl (client-side, lee de
  // una cookie) nunca corre — un ad/email que use este link directo
  // ("agregar y pagar") perdía utm_source/gclid/fbclid en el 100% de sus
  // clics. Estos params sí vienen en ESTA url (primer touch), así que los
  // leemos directo del request en vez de depender de la cookie.
  const marketingParams: MarketingParams = {};
  for (const key of MARKETING_PARAMS) {
    const value = searchParams.get(key);
    if (value) marketingParams[key] = value;
  }

  //! create a cart
  const result = await cart.create({
    lines: linesMap,
    discountCodes: discountArray,
  });

  const cartResult = result.cart;

  if (result.errors?.length || !cartResult) {
    throw new Response('Link may be expired. Try checking the URL.', {
      status: 410,
    });
  }

  // Update cart id in cookie
  const headers = cart.setCartId(cartResult.id);

  //! redirect to checkout
  if (cartResult.checkoutUrl) {
    return redirect(
      appendMarketingParamsToCheckoutUrl(cartResult.checkoutUrl, marketingParams),
      {headers},
    );
  } else {
    throw new Error('No checkout URL found');
  }
}

export default function Component() {
  return null;
}
