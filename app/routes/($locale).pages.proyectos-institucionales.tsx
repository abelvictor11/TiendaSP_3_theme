import {
  json,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaArgs,
} from '@shopify/remix-oxygen';
import {useLoaderData, useActionData} from '@remix-run/react';
import type {SectionsFragment} from 'storefrontapi.generated';
import {Sections} from '~/sections/Sections';
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {
  resolveInstitutionalRoute,
  institutionalSeo,
  buildInstitutionalInquiry,
  readInstitutionalSection,
  type InstitutionalInquiry,
  type InstitutionalMetaobject,
} from '~/lib/institutional';
import {seoPayload} from '~/lib/seo.server';
import {getSeoMetaTags} from '~/lib/seoMeta';
import {routeHeaders} from '~/data/cache';

export const headers = routeHeaders;
export async function loader(args: LoaderFunctionArgs) {
  const {route} = await getLoaderRouteFromMetaobject({
    ...args,
    handle: 'route-proyectos-institucionales',
  });
  const content = resolveInstitutionalRoute(route);
  const title = content.title?.value || institutionalSeo.title;
  const seo = seoPayload.page({
    page: {title, seo: {title, description: institutionalSeo.description}},
    url: args.request.url,
  });
  return json({route: content, seo});
}
export const meta = ({matches}: MetaArgs<typeof loader>) =>
  getSeoMetaTags(
    matches.map(
      (match) =>
        (
          match.data as
            | {seo?: Parameters<typeof getSeoMetaTags>[0][number]}
            | undefined
        )?.seo,
    ),
  );
export async function action(args: ActionFunctionArgs) {
  const data = await args.request.formData();
  const input = Object.fromEntries(data.entries()) as InstitutionalInquiry;
  input.consent = data.get('consent') === 'on';
  const {route} = await getLoaderRouteFromMetaobject({
    ...args,
    handle: 'route-proyectos-institucionales',
  });
  const content = resolveInstitutionalRoute(route);
  const sections = content.sections?.references?.nodes as unknown as
    | InstitutionalMetaobject[]
    | undefined;
  const contact = sections
    ?.map(readInstitutionalSection)
    .find(
      (section) =>
        section?.variant === 'contact' &&
        section.id === data.get('contactSection'),
    );
  try {
    return redirect(buildInstitutionalInquiry(input, contact?.whatsapp || ''), {
      status: 303,
      headers: {'Cache-Control': 'no-store'},
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Revisa los datos del proyecto.',
      },
      {status: 400, headers: {'Cache-Control': 'no-store'}},
    );
  }
}
export default function InstitutionalProjects() {
  const {route} = useLoaderData<typeof loader>();
  const submission = useActionData<typeof action>();
  return (
    <div className="institutional-projects">
      {submission?.error && (
        <p role="alert" className="container py-4 text-red-700">
          {submission.error}
        </p>
      )}
      <Sections
        sections={route.sections as unknown as SectionsFragment}
        className="space-y-0"
      />
    </div>
  );
}
