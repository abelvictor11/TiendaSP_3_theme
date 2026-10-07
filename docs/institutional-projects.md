# Proyectos Institucionales · Tienda Fitness

Landing Hydrogen para la rama `tienda`, en `/pages/proyectos-institucionales`. Conserva el layout compartido (header/footer), las fuentes, los tokens rojos y el sistema Tailwind existentes. Las imágenes WebP se extrajeron de la presentación comercial suministrada. Las fotografías de áreas no se atribuyen a clientes específicos.

## Configuración inicial en Shopify

1. Desplegar el cambio de código a un entorno de prueba de Hydrogen.
2. Revisar el plan sin credenciales ni escrituras:

   ```sh
   node scripts/setup-institutional-projects.mjs --dry-run
   ```

3. Configurar en el entorno local `SHOPIFY_STORE_DOMAIN` con el dominio `*.myshopify.com` y `SHOPIFY_ADMIN_TOKEN` con una credencial Admin existente con acceso de lectura/escritura a metaobjects y sus definiciones. No guardar el token en el repositorio ni enviarlo por chat.
4. Ejecutar:

   ```sh
   node scripts/setup-institutional-projects.mjs
   ```

El script usa Admin API `2026-01`; crea únicamente definiciones y entradas faltantes. Amplía la validación `metaobject_definition_ids` del campo `sections` en `ciseco--route`, conservando todos los tipos y validaciones anteriores. Si no existe una restricción, no la añade. Conserva el contenido, el orden y las imágenes de las entradas existentes. Detiene el proceso ante errores de Shopify o un esquema incompatible; una repetición permite continuar tras un fallo parcial. No publica código ni cambia menús. No necesita un token Admin dentro del runtime de Hydrogen.

**Configuración realizada y verificada el 7 de octubre de 2026 mediante el MCP de Shopify de Tienda Sportfitness.** Se crearon las dos definiciones, 44 elementos, 10 bloques y la ruta `route-proyectos-institucionales` en estado `ACTIVE`. Las cinco fotografías se subieron a Archivos de Shopify y se enlazaron mediante `file_reference`. Se conservaron los 19 tipos anteriores del builder. No es necesario ejecutar de nuevo el script para esta tienda. Queda pendiente integrar y desplegar el PR de Hydrogen, comprobar la vista real y añadir la navegación/página para el sitemap. Una ruta configurada vacía permanece vacía.

Identificadores de configuración: definición de elementos `gid://shopify/MetaobjectDefinition/24073207885`, definición de secciones `gid://shopify/MetaobjectDefinition/24073240653`, ruta `gid://shopify/Metaobject/611773644877`.

## Edición desde el builder

En **Contenido → Metaobjects**, abrir la entrada de `ciseco--route` con handle `route-proyectos-institucionales`. En `sections`, reordenar, eliminar o añadir bloques. Se pueden mezclar con las secciones existentes del builder.

Los nuevos bloques están en **Proyectos institucionales · Sección** (`ciseco--section_institutional`). Sus campos permiten editar antetítulo, encabezado, descripción, imagen, botones, ancla y WhatsApp. El campo `variant` elige uno de diez diseños:

| Diseño     | Uso                                         |
| ---------- | ------------------------------------------- |
| `hero`     | Imagen principal, H1 y llamadas a la acción |
| `stats`    | Cifras y respaldo                           |
| `intro`    | Imagen y beneficios del servicio            |
| `clients`  | Clientes, con texto o logotipo              |
| `sectors`  | Sectores con iconos Heroicons               |
| `process`  | Pasos del proyecto                          |
| `projects` | Galería de áreas                            |
| `brands`   | Marcas, con texto o logotipo                |
| `contact`  | Formulario que prepara WhatsApp y sedes     |
| `faq`      | Preguntas desplegables                      |

Mantener **un solo hero** para conservar un H1 único. Las listas se editan en **Proyectos institucionales · Elemento** (`ciseco--institutional_item`); cada elemento admite título, descripción, icono e imagen. Iconos disponibles: `fitness`, `hotel`, `company`, `residential`, `education`, `sports`. Los tipos desconocidos usan el icono de energía.

La imagen elegida desde Archivos de Shopify tiene prioridad sobre `image_url`, que conserva la fotografía inicial del repositorio. Usar el texto alternativo de la imagen en Archivos. Los enlaces aceptan rutas internas, anclas, HTTPS, teléfono y correo. Si se cambia el ancla `asesoria`, actualizar también los enlaces que apuntan a `#asesoria`.

WhatsApp inicial: `573108183750`, tomado del PDF. Puede cambiarse en el bloque de contacto. La solicitud **no se guarda en Shopify ni envía automáticamente un mensaje**: abre WhatsApp con la información, para revisión y envío del visitante. El formulario exige consentimiento y también dispone de un POST de respaldo cuando JavaScript no está disponible.

Para publicar la navegación, añadir un enlace desde el menú Shopify correspondiente a `/pages/proyectos-institucionales`. Para incluirla en el sitemap de páginas, crear una página Shopify publicada con el handle `proyectos-institucionales`. Su cuerpo puede estar vacío: la ruta específica de Hydrogen renderiza el builder.

## Verificación local

```sh
node --test tests/unit/institutional.check.mjs tests/unit/institutional-setup.check.mjs tests/unit/institutional-action.check.mjs
npx playwright install chromium
node --test tests/unit/institutional-ui.check.mjs
```

La vista aislada usa los componentes de producción y prueba SSR/hidratación, adaptación a 1440/390 px, imágenes, anclas y validación. Intercepta la navegación a WhatsApp para no contactar al equipo comercial. No representa el header/footer; estos los aporta el layout real de Hydrogen. Para abrir la vista manualmente: `node scripts/preview-institutional-projects.mjs`. Las credenciales Storefront del proyecto permiten verificar también la integración completa en un despliegue de prueba.
