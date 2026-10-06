import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const mocks = {
  '~/sections/Sections': 'export const Sections = () => null;',
  '~/utils/getLoaderRouteFromMetaobject':
    'export async function getLoaderRouteFromMetaobject(){return {route:globalThis.__institutionalTestRoute};}',
  '~/lib/seo.server': 'export const seoPayload={page:x=>x};',
  '~/lib/seoMeta': 'export const getSeoMetaTags=x=>x;',
  '~/data/cache': 'export const routeHeaders=()=>({});',
  '@remix-run/react':
    'export const useLoaderData=()=>({}),useActionData=()=>({});',
};
const result = await build({
  entryPoints: [
    new URL(
      '../../app/routes/($locale).pages.proyectos-institucionales.tsx',
      import.meta.url,
    ).pathname,
  ],
  bundle: true,
  write: false,
  platform: 'node',
  format: 'cjs',
  plugins: [
    {
      name: 'route-context-fixture',
      setup(build) {
        build.onResolve({filter: /.*/}, (args) =>
          mocks[args.path]
            ? {path: args.path, namespace: 'fixture'}
            : undefined,
        );
        build.onLoad({filter: /.*/, namespace: 'fixture'}, (args) => ({
          contents: mocks[args.path],
        }));
      },
    },
  ],
});
const module = {exports: {}};
new Function('require', 'module', 'exports', result.outputFiles[0].text)(
  require,
  module,
  module.exports,
);
const {action} = module.exports;
function request(consent = true, contactSection = 'edited-contact') {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name: 'Prueba',
    company: 'Empresa',
    email: 'test@example.com',
    phone: '3000000000',
    city: 'Bogotá',
    sector: 'Empresa',
    message: 'Prueba',
    contactSection,
    ...(consent ? {consent: 'on'} : {}),
  }))
    data.set(key, value);
  return new Request('https://tienda.example/pages/proyectos-institucionales', {
    method: 'POST',
    body: data,
  });
}
globalThis.__institutionalTestRoute = {
  sections: {
    references: {
      nodes: [
        {
          id: 'contact-id',
          institutional_anchor_id: {value: 'edited-contact'},
          institutional_variant: {value: 'contact'},
          institutional_whatsapp: {value: '573000000001'},
        },
      ],
    },
  },
};
test('native POST uses edited contact phone and returns a noncacheable WhatsApp redirect', async () => {
  const response = await action({request: request(), context: {}, params: {}});
  assert.equal(response.status, 303);
  assert.equal(
    new URL(response.headers.get('Location')).pathname,
    '/573000000001',
  );
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
test('native POST rejects missing consent and an unknown contact section', async () => {
  for (const req of [request(false), request(true, 'removed-contact')]) {
    const response = await action({request: req, context: {}, params: {}});
    assert.equal(response.status, 400);
    assert.ok((await response.json()).error);
    assert.equal(response.headers.get('Location'), null);
  }
});
