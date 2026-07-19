import {redirect, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getLegacyRedirectTarget} from '~/lib/legacyRedirects.server';

export async function loader({request}: LoaderFunctionArgs) {
  const {pathname} = new URL(request.url);
  const target = getLegacyRedirectTarget(pathname);

  if (target) {
    return redirect(target, 301);
  }

  throw new Response('Not found', {status: 404});
}

export default function Component() {
  return null;
}
