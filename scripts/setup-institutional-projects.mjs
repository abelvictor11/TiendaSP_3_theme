#!/usr/bin/env node
/** Run locally with an Admin API token; never import this script in Hydrogen. */
import {readFile} from 'node:fs/promises';
const content = JSON.parse(
  await readFile(
    new URL('../app/data/institutional-projects.json', import.meta.url),
    'utf8',
  ),
);
const itemType = 'ciseco--institutional_item';
const sectionType = 'ciseco--section_institutional';
const routeType = 'ciseco--route';
const routeHandle = 'route-proyectos-institucionales';
const field = (key, name, type = 'single_line_text_field', extra = {}) => ({
  key,
  name,
  type,
  ...extra,
});
const itemFields = [
  field('title', 'Título', undefined, {required: true}),
  field('description', 'Descripción', 'multi_line_text_field'),
  field('icon', 'Icono'),
  field('image', 'Imagen', 'file_reference', {
    validations: [{name: 'file_type_options', value: '["Image"]'}],
  }),
  field('image_url', 'Imagen alternativa (ruta o URL)'),
];
const sectionFields = [
  field('title', 'Nombre del bloque', undefined, {required: true}),
  field('variant', 'Diseño', undefined, {
    required: true,
    validations: [
      {
        name: 'choices',
        value: JSON.stringify([
          'hero',
          'stats',
          'intro',
          'clients',
          'sectors',
          'process',
          'projects',
          'brands',
          'contact',
          'faq',
        ]),
      },
    ],
  }),
  field('anchor_id', 'Ancla'),
  field('kicker', 'Antetítulo'),
  field('heading', 'Encabezado', 'multi_line_text_field'),
  field('description', 'Descripción', 'multi_line_text_field'),
  field('image', 'Imagen', 'file_reference', {
    validations: [{name: 'file_type_options', value: '["Image"]'}],
  }),
  ...[
    'image_url',
    'cta_text',
    'cta_url',
    'secondary_cta_text',
    'secondary_cta_url',
    'whatsapp',
  ].map((key) =>
    field(
      key,
      {
        image_url: 'Imagen alternativa (ruta o URL)',
        cta_text: 'Texto del botón',
        cta_url: 'Enlace del botón',
        secondary_cta_text: 'Texto secundario',
        secondary_cta_url: 'Enlace secundario',
        whatsapp: 'WhatsApp comercial con código de país',
      }[key],
    ),
  ),
];
if (process.argv.includes('--dry-run')) {
  console.log(
    JSON.stringify(
      {
        definitions: [
          {type: itemType, fields: itemFields},
          {
            type: sectionType,
            fields: [
              ...sectionFields,
              field('items', 'Elementos', 'list.metaobject_reference'),
            ],
          },
        ],
        route: routeHandle,
        sections: content.sections.map((s) => ({
          handle: `institutional-${s.id}`,
          variant: s.variant,
          items: s.items.length,
        })),
        behavior:
          'Crear únicamente datos faltantes. Conservar contenido y orden existentes. No publicar ni editar menús.',
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
const domain =
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.PUBLIC_STORE_DOMAIN ||
  process.env.PUBLIC_SHOPIFY_STORE_DOMAIN;
const token =
  process.env.SHOPIFY_ADMIN_TOKEN || process.env.ADMIN_API_ACCESS_TOKEN;
if (!domain || !/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(domain) || !token)
  throw new Error(
    'Configura SHOPIFY_STORE_DOMAIN (dominio myshopify.com) y SHOPIFY_ADMIN_TOKEN en tu entorno local.',
  );
async function graphql(query, variables = {}) {
  const response = await fetch(
    `https://${domain}/admin/api/2026-01/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({query, variables}),
    },
  );
  if (!response.ok) throw new Error(`Shopify Admin HTTP ${response.status}`);
  const result = await response.json();
  if (result.errors?.length)
    throw new Error(result.errors.map((e) => e.message).join('\n'));
  for (const payload of Object.values(result.data || {}))
    if (payload?.userErrors?.length)
      throw new Error(
        payload.userErrors
          .map((e) => `${e.field?.join('.')}: ${e.message}`)
          .join('\n'),
      );
  if (!result.data) throw new Error('Shopify no devolvió datos.');
  return result.data;
}
async function definition(type) {
  return (
    await graphql(
      `
        query ($type: String!) {
          metaobjectDefinitionByType(type: $type) {
            id
            type
            access {
              storefront
            }
            capabilities {
              publishable {
                enabled
              }
            }
            fieldDefinitions {
              key
              type {
                name
              }
              validations {
                name
                value
              }
            }
          }
        }
      `,
      {type},
    )
  ).metaobjectDefinitionByType;
}
async function ensureDefinition(type, name, fields) {
  const existing = await definition(type);
  if (existing) {
    for (const field of fields)
      if (
        !existing.fieldDefinitions.some(
          (f) => f.key === field.key && f.type.name === field.type,
        )
      )
        throw new Error(
          `La definición ${type} no coincide en ${field.key}. Revisa su esquema antes de continuar.`,
        );
    if (existing.access.storefront !== 'PUBLIC_READ')
      throw new Error(`Activa el acceso Storefront de ${type}.`);
    return existing;
  }
  const data = await graphql(
    `
      mutation ($definition: MetaobjectDefinitionCreateInput!) {
        metaobjectDefinitionCreate(definition: $definition) {
          metaobjectDefinition {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      definition: {
        type,
        name,
        displayNameKey: 'title',
        access: {storefront: 'PUBLIC_READ'},
        fieldDefinitions: fields,
      },
    },
  );
  return {
    id: data.metaobjectDefinitionCreate.metaobjectDefinition.id,
    capabilities: {publishable: {enabled: false}},
  };
}
async function existingEntry(type, handle) {
  return (
    await graphql(
      `
        query ($handle: MetaobjectHandleInput!) {
          metaobjectByHandle(handle: $handle) {
            id
          }
        }
      `,
      {handle: {type, handle}},
    )
  ).metaobjectByHandle;
}
async function ensureEntry(type, handle, values, definition) {
  const existing = await existingEntry(type, handle);
  if (existing) return existing.id;
  const data = await graphql(
    `
      mutation ($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      metaobject: {
        type,
        handle,
        fields: Object.entries(values)
          .filter(([, value]) => value !== undefined && value !== '')
          .map(([key, value]) => ({
            key,
            value: typeof value === 'string' ? value : JSON.stringify(value),
          })),
        ...(definition?.capabilities?.publishable?.enabled
          ? {capabilities: {publishable: {status: 'ACTIVE'}}}
          : {}),
      },
    },
  );
  return data.metaobjectCreate.metaobject.id;
}
// Validate the existing builder before making any writes.
const routeDefinition = await definition(routeType);
const sectionsField = routeDefinition?.fieldDefinitions.find(
  (f) => f.key === 'sections',
);
if (!routeDefinition || sectionsField?.type.name !== 'list.mixed_reference')
  throw new Error(
    'No se encontró el builder ciseco--route con sections list.mixed_reference. No se cambió nada.',
  );
const itemDefinition = await ensureDefinition(
  itemType,
  'Proyectos institucionales · Elemento',
  itemFields,
);
const sectionDefinition = await ensureDefinition(
  sectionType,
  'Proyectos institucionales · Sección',
  [
    ...sectionFields,
    field('items', 'Elementos', 'list.metaobject_reference', {
      validations: [
        {name: 'metaobject_definition_id', value: itemDefinition.id},
      ],
    }),
  ],
);
const validations = sectionsField.validations;
const allowed = validations.find((v) => v.name === 'metaobject_definition_ids');
// No validation means unrestricted mixed references; do not narrow it.
if (allowed) {
  const ids = JSON.parse(allowed.value);
  if (!Array.isArray(ids)) throw new Error('Validación del builder inválida.');
  if (!ids.includes(sectionDefinition.id))
    await graphql(
      `
        mutation ($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
          metaobjectDefinitionUpdate(id: $id, definition: $definition) {
            metaobjectDefinition {
              id
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        id: routeDefinition.id,
        definition: {
          fieldDefinitions: [
            {
              update: {
                key: 'sections',
                validations: validations.map((v) =>
                  v.name === 'metaobject_definition_ids'
                    ? {
                        name: v.name,
                        value: JSON.stringify([...ids, sectionDefinition.id]),
                      }
                    : v,
                ),
              },
            },
          ],
        },
      },
    );
}
const sectionIds = [];
for (const section of content.sections) {
  const itemIds = [];
  for (const {id, ...item} of section.items)
    itemIds.push(
      await ensureEntry(itemType, `institutional-${id}`, item, itemDefinition),
    );
  const {id, items, ...values} = section;
  sectionIds.push(
    await ensureEntry(
      sectionType,
      `institutional-${id}`,
      {
        title: `Institucional · ${id}`,
        anchor_id: id,
        ...values,
        items: itemIds,
      },
      sectionDefinition,
    ),
  );
}
await ensureEntry(
  routeType,
  routeHandle,
  {title: content.title, sections: sectionIds},
  routeDefinition,
);
console.log(
  `Configuración completa: ${routeHandle}. Edita los metaobjects en Contenido. URL Hydrogen: /pages/proyectos-institucionales. No se modificaron menús ni se publicó un despliegue.`,
);
