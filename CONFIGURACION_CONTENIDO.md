# 🎨 Sistema de Edición de Contenido - Shopify Metaobjects

## ✅ **Buenas Noticias: Este Tema Tiene un Sistema de CMS Integrado**

Este tema Hydrogen incluye un **sistema de gestión de contenido basado en Metaobjects de Shopify** que permite editar contenido sin tocar el código.

---

## 📋 ¿Qué es un Metaobject?

Los **Metaobjects** son estructuras de datos personalizadas en Shopify que funcionan como un mini-CMS. Piensa en ellos como "tipos de contenido" editables desde el admin de Shopify.

### Ventajas de este Sistema:
- ✅ **Edición desde Shopify Admin** (no necesitas código)
- ✅ **Contenido dinámico** (banners, sliders, testimonios, etc.)
- ✅ **Multiidioma** (soporta traducciones)
- ✅ **Versionable** (puedes publicar/despublicar)
- ⚠️ **NO es drag-and-drop** (pero sí editable)

### Limitaciones:
- ❌ No hay editor visual drag-and-drop
- ❌ Requiere conocer qué campos editar
- ❌ El orden de las secciones se define en código o metaobjects

---

## 🚀 PASO 1: Configuración Inicial (Solo Una Vez)

### 1.1 Obtener Token de Admin API

Para crear los metaobjects necesitas un **Private App** con permisos de escritura:

#### En Shopify Admin:
1. Ve a **Settings** → **Apps and sales channels** → **Develop apps**
2. Haz clic en **Create an app**
3. Nombre: `Hydrogen Theme Setup`
4. En **Configuration** → **Admin API** → configura estos permisos:
   - `write_metaobjects`
   - `read_metaobjects`
5. **Instala la app** y copia el **Admin API access token**

### 1.2 Crear Metaobject Definitions

Este tema incluye una **ruta especial de setup** que crea automáticamente todas las definiciones:

#### Accede a:
```
https://tu-dominio-local:3000/cisecoInitCreateMetaobjectDefinitions
```

O en producción:
```
https://tu-sitio-hydrogen.com/cisecoInitCreateMetaobjectDefinitions
```

#### En la interfaz:
1. Pega tu **Store Domain** (ej: `mi-tienda.myshopify.com`)
2. Pega tu **Admin API Access Token**
3. Haz clic en **"Create All Metaobject Definitions"**
4. Espera a que se creen todas las definiciones ✅

#### Lo que se crea:
- 🔗 **Link** - Enlaces/botones
- 👥 **Social** - Enlaces sociales (footer)
- 🎯 **Hero Item** - Items de banners
- 📊 **10+ tipos de secciones** (Hero, Sliders, Testimonios, Blog, etc.)
- 🗂️ **Collection Group** - Agrupaciones de colecciones
- 📄 **Route** - Rutas/páginas completas

---

## 📝 PASO 2: Crear y Editar Contenido

Una vez creadas las definiciones, puedes crear contenido en Shopify Admin:

### 2.1 Acceder a Metaobjects

En **Shopify Admin**:
```
Settings → Custom data → Metaobjects
```

### 2.2 Secciones Disponibles

#### 🎯 **Section | Hero** (Banner Simple)
- Título
- Imagen (horizontal y vertical)
- Heading
- Sub-heading
- Botón CTA

**Ejemplo de uso:** Banner principal del home

#### 🎠 **Section | HeroSlider** (Carrusel de Banners)
- Múltiples Hero Items
- Auto-slide
- Navegación

**Ejemplo de uso:** Slider de promociones en home

#### 🛍️ **Section | ProductsSlider** (Slider de Productos)
- Heading
- Sub-heading
- Colección de productos
- Estilo (1 o 2)

**Ejemplo de uso:** "Productos destacados" o "Best sellers"

#### 📦 **Section | CollectionsSlider** (Slider de Colecciones)
- Lista de colecciones
- Botón personalizable
- Headings

**Ejemplo de uso:** "Compra por categoría"

#### 🏪 **Section | GridProductsAndFilter** (Grilla con Filtros)
- Colección
- Heading/Sub-heading
- Mostrar/ocultar filtros

**Ejemplo de uso:** Página de productos filtrable

#### 💬 **Section | ClientsSay** (Testimonios)
- Lista de testimonios
- Nombre, foto, estrellas
- Contenido

**Ejemplo de uso:** Opiniones de clientes

#### 📰 **Section | LatestBlog** (Últimos Posts)
- Slug del blog
- Número de items
- Botón "Ver todos"
- Color de fondo

**Ejemplo de uso:** "Últimas noticias" en home

#### 🖼️ **Section | ImageWithText** (Imagen + Texto)
- Imagen lateral
- Contenido de texto
- 2 botones
- Features en lista
- 3 estilos diferentes

**Ejemplo de uso:** "Sobre nosotros" o features

#### 📋 **Section | Steps** (Pasos/Proceso)
- Lista de pasos con íconos
- Headings y contenidos
- 2 estilos

**Ejemplo de uso:** "Cómo comprar" o "Proceso de envío"

#### 🏷️ **Section | TabsCollectionsByGroup** (Tabs de Colecciones)
- Grupos de colecciones con íconos
- Tabs navegables
- Estilos de tarjeta

**Ejemplo de uso:** "Explora por categoría"

##### 📸 **Imágenes Opcionales en Tarjetas de Colección**

Las tarjetas de colección (CollectionCard4) ahora soportan **dos imágenes diferentes opcionales**:

1. **Imagen de fondo completa** (`horizontal_image`):
   - Se muestra como fondo de toda la tarjeta
   - Ideal para imágenes grandes o colores sólidos
   - Se obtiene del metafield `horizontal_image` de la colección

2. **Imagen circular superpuesta** (`image`):
   - Se muestra como icono pequeño en la esquina superior
   - Ideal para logos o PNG con fondo transparente
   - Se obtiene del campo `image` estándar de la colección

**Configuración en Shopify Admin:**

Para configurar imágenes diferentes:
1. Ve a **Products** → **Collections** → Selecciona una colección
2. En **Metafields** → busca `horizontal_image` y sube la imagen de fondo
3. En **Image** (campo estándar) sube la imagen circular/logo
4. Guarda la colección

**Opciones de uso:**
- ✅ **Dos imágenes**: Fondo completo + logo circular encima
- ✅ **Solo fondo**: Solo `horizontal_image`, sin `image` 
- ✅ **Solo logo**: Solo `image`, sin `horizontal_image` (muestra SVG decorativo de fondo)
- ✅ **Color de fondo**: Usa el prop `bgColor` sin ninguna imagen

---

## 🔧 PASO 3: Crear Páginas (Routes)

### 3.1 ¿Qué es un Route?

Un **Route** es un metaobject que define el contenido de una página completa.

### 3.2 Crear una Página Nueva

1. Ve a **Metaobjects** → **Route**
2. Crea nueva entrada
3. Configura:
   - **Title**: Nombre interno
   - **Handle**: URL slug (ej: `route-home`, `route-about`)
   - **Sections**: Selecciona las secciones a mostrar
   - **First line on top**: Muestra línea superior

### 3.3 Routes Pre-configuradas

El tema incluye estas rutas de ejemplo:
- `route-home` → Página de inicio principal
- `route-home-2` → Home alternativo
- `route-collection` → Template de colección
- `route-product` → Template de producto
- `route-search` → Página de búsqueda
- `route-news` → Blog/noticias

### 3.4 Usar una Route

En el código de la ruta de Remix, se carga así:

```typescript
getLoaderRouteFromMetaobject({
  params,
  context,
  request,
  handle: 'route-home', // Handle del metaobject
})
```

---

## 🎨 PASO 4: Flujo de Trabajo para Editar Contenido

### Para Cambiar el Banner del Home:

1. **Shopify Admin** → **Settings** → **Custom data** → **Metaobjects**
2. Busca **"Route"** → Edita **"Route Home"**
3. En el campo **"sections"** verás las secciones activas
4. Haz clic en la sección **"Section | HeroSlider"**
5. Edita los **Hero Items**:
   - Cambia imagen
   - Modifica textos
   - Actualiza enlaces
6. **Guarda** y **Publica**
7. Refresca tu sitio → Verás los cambios ✅

### Para Añadir Testimonios:

1. **Metaobjects** → **Client Say** → **Add entry**
2. Completa:
   - Nombre del cliente
   - Foto
   - Contenido del testimonio
   - Estrellas (1-5)
3. Guarda
4. Ve a **Route Home** → **Sections** → **Section | ClientsSay**
5. Añade el nuevo testimonio a la lista
6. Guarda y publica

### Para Cambiar Productos Destacados:

1. **Metaobjects** → **Section | ProductsSlider**
2. Edita la sección existente o crea nueva
3. Cambia el campo **"collection"** por otra colección
4. Modifica headings si quieres
5. Guarda

---

## 📊 Comparación: Metaobjects vs. Theme Customizer

| Característica | Metaobjects (Este tema) | Theme Customizer |
|----------------|-------------------------|------------------|
| Editor visual drag-and-drop | ❌ | ✅ |
| Editable desde Admin | ✅ | ✅ |
| Requiere conocimiento técnico | Medio | Bajo |
| Flexibilidad | ✅ Alta | Media |
| Rendimiento | ✅ Excelente | Bueno |
| Multiidioma | ✅ | ✅ |
| Control total del diseño | ✅ | ❌ |

---

## 🛠️ PASO 5: Workflow de Desarrollo

### Para Desarrolladores:

1. **Crear nueva sección**:
   - Añade el componente React en `/app/sections/`
   - Define el GraphQL fragment
   - Añade al `Sections.tsx`
   - Crea la definición de metaobject

2. **Modificar sección existente**:
   - Edita el componente en `/app/sections/`
   - Si añades campos, actualiza la definición del metaobject
   - Re-corre el setup si cambias la estructura

### Para Editores de Contenido:

1. Accede a **Shopify Admin** → **Metaobjects**
2. Busca el tipo de contenido
3. Edita los campos
4. Guarda y publica
5. Los cambios son inmediatos (puede requerir caché bust)

---

## ⚠️ Limitaciones Importantes

### NO Puedes (sin código):
- ❌ Reordenar secciones con drag-and-drop
- ❌ Cambiar el diseño/layout visual
- ❌ Añadir nuevos tipos de secciones
- ❌ Modificar estilos CSS

### SÍ Puedes (desde Admin):
- ✅ Cambiar textos, imágenes, enlaces
- ✅ Añadir/quitar items de listas
- ✅ Seleccionar productos/colecciones
- ✅ Activar/desactivar secciones
- ✅ Cambiar colores de fondo (si el campo existe)
- ✅ Multiidioma (traducir contenido)

---

## 📚 Recursos y Ayuda

### Documentación Shopify:
- [Metaobjects](https://shopify.dev/docs/apps/custom-data/metaobjects)
- [Admin API](https://shopify.dev/docs/api/admin-graphql)

### Archivos Importantes del Tema:
- `/app/sections/` - Componentes de secciones
- `/app/routes/($locale).cisecoInitCreateMetaobjectDefinitions._index.tsx` - Setup
- `/app/utils/parseSection.ts` - Parser de metaobjects
- `/app/sections/Sections.tsx` - Renderizador principal

### Comandos Útiles:
```bash
# Regenerar tipos GraphQL
npm run codegen

# Ver logs en desarrollo
npm run dev
```

---

## 🎯 Recomendaciones Finales

### ✅ Este tema es ideal si:
- Tienes desarrolladores para setup inicial
- Quieres rendimiento máximo
- El cliente puede aprender a editar metaobjects
- Necesitas flexibilidad total

### ⚠️ Considera un tema tradicional si:
- El cliente necesita editor visual drag-and-drop
- No hay equipo técnico disponible
- Presupuesto limitado para soporte
- Primera tienda del cliente

### 🔄 Solución Híbrida:
Puedes usar apps como:
- **Builder.io** (headless page builder)
- **Shogun Frontend** (para Hydrogen)
- **Contentful/Sanity** (CMS headless dedicado)

---

## 📞 Soporte

Si necesitas ayuda con:
- Crear nuevas secciones
- Modificar diseños existentes
- Configurar multiidioma
- Optimizar rendimiento

Consulta con un desarrollador Shopify/Hydrogen.

---

**Creado para:** Supermu Theme  
**Versión:** Hydrogen 2025.1.2  
**Última actualización:** Noviembre 2024
