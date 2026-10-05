/**
 * Persiste fbp/fbc/user_agent/ga ids como cart attributes para que
 * /webhooks/meta-capi y /webhooks/ga4-mp puedan atribuir la compra
 * server-side (el checkout vive en otro dominio, las cookies no cruzan).
 *
 * Extraído de routes/($locale).cart.tsx (PR #127, IDATTROS-56) -- ese PR
 * arregló el bug (FormData key incorrecta) solo en el checkout-click
 * handler de la página completa de carrito. El drawer de carrito
 * (components/Cart.tsx), que es el punto de entrada MÁS común a checkout
 * (se abre desde cualquier "Agregar al carrito"), nunca tuvo este bloque
 * en absoluto -- no era un bug ahí, era un gap de cobertura. Compartir
 * esta función entre ambos flujos evita que un futuro fix a uno de los
 * dos vuelva a divergir del otro, que es exactamente cómo pasó esto.
 */
import {CartForm} from '@shopify/hydrogen';
import {getFbCookies} from '~/lib/fbCookies';
import {getGaCookies} from '~/lib/gaCookies';

/**
 * Dispara el POST a /cart con los atributos. `keepalive: true` deja que la
 * request sobreviva a una navegación de página inmediatamente después.
 *
 * El promise devuelto resuelve cuando el POST se asienta (ok o no) y nunca
 * rechaza -- un caller que necesite retrasar la navegación (p. ej. la
 * página completa de carrito, que llama e.preventDefault() y navega
 * manualmente) puede hacer Promise.race([este promise, timeout]) antes de
 * navegar; un caller que no bloquea navegación (p. ej. el drawer, que deja
 * que el <a> navegue nativamente) puede ignorar el valor de retorno por
 * completo y confiar en keepalive para que la request sobreviva.
 */
export function persistCheckoutAttributes(eventId: string): Promise<void> {
  const fb = getFbCookies();
  const attributes: Array<{key: string; value: string}> = [];
  if (fb.fbp) attributes.push({key: '_fbp', value: fb.fbp});
  if (fb.fbc) attributes.push({key: '_fbc', value: fb.fbc});
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    attributes.push({key: '_client_user_agent', value: navigator.userAgent});
  }
  attributes.push({key: '_client_event_id', value: eventId});

  const ga = getGaCookies();
  if (ga.clientId) attributes.push({key: '_ga_client_id', value: ga.clientId});
  if (ga.sessionId) {
    attributes.push({key: '_ga_session_id', value: ga.sessionId});
  }

  if (attributes.length === 0) return Promise.resolve();

  const form = new FormData();
  // CartForm.INPUT_NAME es el string literal 'cartFormInput' -- el nombre
  // de campo que el action() de routes/($locale).cart.tsx destructura via
  // CartForm.getFormInput(). Ver PR #127 para el bug original (hardcoded
  // como '[CartForm]', nunca reconocido -> 500 silencioso).
  form.set(
    CartForm.INPUT_NAME,
    JSON.stringify({
      action: 'AttributesUpdateInput',
      inputs: {attributes},
    }),
  );

  return fetch('/cart', {
    method: 'POST',
    body: form,
    keepalive: true,
  })
    .then((res) => {
      if (!res.ok) {
        // eslint-disable-next-line no-console
        console.error(
          `[cart-attributes] /cart returned ${res.status} — fbp/fbc/ga ids were not tagged`,
        );
      }
    })
    .catch(() => {
      // Si falla, no bloqueamos la compra.
    });
}
