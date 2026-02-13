import {
  json,
  type MetaArgs,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import type {Page as PageType} from '@shopify/hydrogen/storefront-api-types';
import {useLoaderData} from '@remix-run/react';
import invariant from 'tiny-invariant';
import PageHeader from '~/components/PageHeader';
import {routeHeaders} from '~/data/cache';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMeta} from '@shopify/hydrogen';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {RouteContent} from '~/sections/RouteContent';

export const headers = routeHeaders;

export async function loader({request, params, context}: LoaderFunctionArgs) {
  invariant(params.pageHandle, 'Missing page handle');

  const {page} = await context.storefront.query(PAGE_QUERY, {
    variables: {
      handle: params.pageHandle,
      language: context.storefront.i18n.language,
    },
  });

  if (!page) {
    throw new Response(null, {status: 404});
  }

  // Check if this page has a landing route metaobject linked
  const routeHandle = page.route_handle?.value;
  let route = null;

  if (routeHandle) {
    const result = await getLoaderRouteFromMetaobject({
      params,
      context,
      request,
      handle: routeHandle,
    });
    route = result.route;
  }

  const seo = seoPayload.page({page, url: request.url});

  return json({page, route, seo});
}

export const meta = ({matches}: MetaArgs<typeof loader>) => {
  return getSeoMeta(...matches.map((match) => (match.data as any).seo));
};

export default function Page() {
  const {page, route} = useLoaderData<typeof loader>();

  // Landing page — render sections from metaobject route
  if (route) {
    return (
      <div className="page-landing pb-16 lg:pb-20 xl:pb-24">
        <RouteContent route={route} />
      </div>
    );
  }

  // Informative page — render HTML body
  return (
    <div className="page-handle pt-16 lg:pt-24 pb-20 lg:pb-28 xl:pb-32 ">
      <div className="container">
        <div className="max-w-screen-lg mx-auto">
          <PageHeader
            title={page.title}
            hasBreadcrumb
            breadcrumbText={page.title}
          />
          <div
            dangerouslySetInnerHTML={{__html: page.body}}
            className="prose dark:prose-invert mt-16 lg:mt-20 !max-w-none"
          />
        </div>
      </div>
    </div>
  );
}

const PAGE_QUERY = `#graphql
  query PageDetails($language: LanguageCode, $handle: String!)
  @inContext(language: $language) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        description
        title
      }
      route_handle: metafield(namespace: "custom", key: "route_handle") {
        value
      }
    }
  }
`;
