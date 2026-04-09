import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  json,
} from '@shopify/remix-oxygen';
import {useFetcher} from '@remix-run/react';
import ButtonPrimary from '~/components/Button/ButtonPrimary';
import {CheckIcon, ExclamationCircleIcon} from '@heroicons/react/24/outline';

const PDP_ENHANCED_METAFIELDS = [
  {
    name: 'PDP Enhanced - Enabled',
    key: 'enabled',
    namespace: 'pdp_enhanced',
    type: 'boolean',
    ownerType: 'PRODUCT',
    description: 'Activa las secciones mejoradas del PDP para este producto',
  },
  {
    name: 'PDP Enhanced - Subtítulo',
    key: 'subtitle',
    namespace: 'pdp_enhanced',
    type: 'single_line_text_field',
    ownerType: 'PRODUCT',
    description: 'Subtítulo del producto (ej: "ENTRENAMIENTO COMPLETO, SILENCIOSO Y CONECTADO")',
  },
  {
    name: 'PDP Enhanced - Descripción Hero',
    key: 'hero_description',
    namespace: 'pdp_enhanced',
    type: 'multi_line_text_field',
    ownerType: 'PRODUCT',
    description: 'Descripción extendida para la sección hero del producto',
  },
  {
    name: 'PDP Enhanced - Feature Icons',
    key: 'feature_icons',
    namespace: 'pdp_enhanced',
    type: 'json',
    ownerType: 'PRODUCT',
    description: 'JSON array de iconos de características. Formato: [{"icon_svg": "<svg>...</svg>", "title": "Bluetooth"}]',
  },
  {
    name: 'PDP Enhanced - Detail Cards',
    key: 'detail_cards',
    namespace: 'pdp_enhanced',
    type: 'json',
    ownerType: 'PRODUCT',
    description: 'JSON array de cards de detalle. Formato: [{"image_url": "https://...", "title": "...", "description": "..."}]',
  },
  {
    name: 'PDP Enhanced - Aplicaciones',
    key: 'applications',
    namespace: 'pdp_enhanced',
    type: 'json',
    ownerType: 'PRODUCT',
    description: 'JSON array de aplicaciones de uso. Formato: ["Entrenamiento cardiovascular", "Rutinas de resistencia"]',
  },
  {
    name: 'PDP Enhanced - Incluye',
    key: 'includes_list',
    namespace: 'pdp_enhanced',
    type: 'json',
    ownerType: 'PRODUCT',
    description: 'JSON array de elementos incluidos. Formato: ["Remo magnético", "Consola integrada"]',
  },
  {
    name: 'PDP Enhanced - Imagen Dimensiones',
    key: 'dimensions_image',
    namespace: 'pdp_enhanced',
    type: 'file_reference',
    ownerType: 'PRODUCT',
    description: 'Imagen con las dimensiones del producto',
  },
  {
    name: 'PDP Enhanced - Warranty Badges',
    key: 'warranty_badges',
    namespace: 'pdp_enhanced',
    type: 'json',
    ownerType: 'PRODUCT',
    description: 'JSON array de badges de garantía. Formato: [{"title": "GARANTÍA", "subtitle": "1 AÑO", "description": "en estructura", "icon_svg": "<svg>...</svg>"}]',
  },
];

export async function loader({context}: LoaderFunctionArgs) {
  return json({storeDomain: context.env.PUBLIC_STORE_DOMAIN});
}

export async function action({request, context}: ActionFunctionArgs) {
  const {env} = context;
  const storeDomain = env.PUBLIC_SHOPIFY_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;
  const adminToken = env.ADMIN_API_ACCESS_TOKEN;

  if (!adminToken || !storeDomain) {
    return json({
      success: false,
      results: [],
      error: 'Missing ADMIN_API_ACCESS_TOKEN or store domain',
    });
  }

  const results: Array<{name: string; success: boolean; message: string}> = [];

  for (const metafield of PDP_ENHANCED_METAFIELDS) {
    try {
      const res = await fetch(
        `https://${storeDomain}/admin/api/2025-01/graphql.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': adminToken,
          },
          body: JSON.stringify({
            query: `
              mutation($definition: MetafieldDefinitionInput!) {
                metafieldDefinitionCreate(definition: $definition) {
                  createdDefinition {
                    id
                    name
                    namespace
                    key
                  }
                  userErrors {
                    field
                    message
                    code
                  }
                }
              }
            `,
            variables: {
              definition: {
                name: metafield.name,
                namespace: metafield.namespace,
                key: metafield.key,
                description: metafield.description,
                ownerType: metafield.ownerType,
                pin: true,
                type: metafield.type,
              },
            },
          }),
        },
      );

      const data: any = await res.json();
      const userErrors = data?.data?.metafieldDefinitionCreate?.userErrors || [];
      const created = data?.data?.metafieldDefinitionCreate?.createdDefinition;

      if (userErrors.length > 0) {
        const alreadyExists = userErrors.some(
          (e: any) => e.code === 'TAKEN' || e.message?.includes('already exists'),
        );
        results.push({
          name: metafield.name,
          success: alreadyExists,
          message: alreadyExists
            ? 'Ya existe'
            : userErrors.map((e: any) => e.message).join(', '),
        });
      } else if (created) {
        results.push({
          name: metafield.name,
          success: true,
          message: `Creado: ${created.namespace}.${created.key}`,
        });
      } else {
        results.push({
          name: metafield.name,
          success: false,
          message: 'Respuesta inesperada',
        });
      }
    } catch (err: any) {
      results.push({
        name: metafield.name,
        success: false,
        message: err?.message || 'Error desconocido',
      });
    }
  }

  return json({success: true, results, error: null});
}

export default function SetupPdpEnhanced() {
  const fetcher = useFetcher<{
    success: boolean;
    results: Array<{name: string; success: boolean; message: string}>;
    error: string | null;
  }>();

  const isLoading = fetcher.state !== 'idle';
  const results = fetcher.data?.results;

  return (
    <div className="container mx-auto py-16 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">Setup PDP Enhanced</h1>
      <p className="text-slate-500 mb-8">
        Crea los metafield definitions necesarios en la tienda para las secciones
        mejoradas del PDP (Feature Icons, Detail Cards, Aplicaciones, Incluye, Warranty Badges).
      </p>

      <fetcher.Form method="post">
        <ButtonPrimary type="submit" loading={isLoading} disabled={isLoading}>
          {isLoading ? 'Creando metafields...' : 'Crear Metafield Definitions'}
        </ButtonPrimary>
      </fetcher.Form>

      {fetcher.data?.error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {fetcher.data.error}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold mb-4">Resultados:</h2>
          {results.map((r, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                r.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              {r.success ? (
                <CheckIcon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-medium text-sm">{r.name}</span>
                <p className="text-xs text-slate-500">{r.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-slate-50 rounded-xl">
        <h3 className="font-semibold mb-3">Formato de los campos JSON:</h3>
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-slate-700">feature_icons:</p>
            <pre className="bg-white p-3 rounded-lg border text-xs overflow-x-auto mt-1">{`[
  {"icon_svg": "<svg>...</svg>", "title": "Bluetooth y Kinomap"},
  {"icon_svg": "<svg>...</svg>", "title": "32 Niveles"}
]`}</pre>
          </div>
          <div>
            <p className="font-medium text-slate-700">detail_cards:</p>
            <pre className="bg-white p-3 rounded-lg border text-xs overflow-x-auto mt-1">{`[
  {
    "image_url": "https://cdn.shopify.com/s/files/...",
    "title": "Sistema de resistencia magnética",
    "description": "Volante de inercia de 12 lb..."
  }
]`}</pre>
          </div>
          <div>
            <p className="font-medium text-slate-700">applications:</p>
            <pre className="bg-white p-3 rounded-lg border text-xs overflow-x-auto mt-1">{`["Entrenamiento cardiovascular", "Entrenamiento funcional"]`}</pre>
          </div>
          <div>
            <p className="font-medium text-slate-700">includes_list:</p>
            <pre className="bg-white p-3 rounded-lg border text-xs overflow-x-auto mt-1">{`["Remo magnético CSFitness Nilo", "Consola integrada"]`}</pre>
          </div>
          <div>
            <p className="font-medium text-slate-700">warranty_badges:</p>
            <pre className="bg-white p-3 rounded-lg border text-xs overflow-x-auto mt-1">{`[
  {
    "title": "GARANTÍA",
    "subtitle": "1 AÑO",
    "description": "en estructura y componentes",
    "icon_svg": "<svg>...</svg>"
  }
]`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
