# 🚀 Guía Rápida: Editar Contenido en 5 Minutos

## ⚡ Configuración Inicial (Una Sola Vez)

### 1️⃣ Crear Admin API Token
```
Shopify Admin → Settings → Apps and sales channels 
→ Develop apps → Create an app
→ Configuration → Admin API
→ write_metaobjects + read_metaobjects
→ Install app → Copiar token
```

### 2️⃣ Ejecutar Setup Automático
```
1. Inicia el proyecto: npm run dev
2. Abre: http://localhost:3000/cisecoInitCreateMetaobjectDefinitions
3. Pega:
   - Store Domain: tu-tienda.myshopify.com
   - Admin API Token: (el que copiaste)
4. Click "Create All Metaobject Definitions"
5. ✅ Listo!
```

---

## 🎨 Editar Contenido (Día a Día)

### 📍 ¿Dónde edito?
```
Shopify Admin → Settings → Custom data → Metaobjects
```

---

## 📋 Casos de Uso Comunes

### 🎯 Cambiar el Banner Principal

**Ubicación:** `Metaobjects → Route → Route Home`

1. Click en **"Route Home"**
2. En campo **"sections"** → Click en **"Section | HeroSlider"**
3. Click en **"Hero items"** → Edita el banner:
   - **Heading**: Título principal
   - **Sub heading**: Subtítulo
   - **Horizontal image**: Imagen desktop
   - **Vertical image**: Imagen móvil
   - **CTA button**: Botón de acción
4. **Guardar** → **Publish**

**Resultado:** Banner actualizado en home ✅

---

### 🛍️ Cambiar Productos Destacados

**Ubicación:** `Metaobjects → Section | ProductsSlider`

1. Busca la sección de productos
2. Edita:
   - **Heading bold**: Texto en negrita
   - **Heading light**: Texto claro
   - **Sub heading**: Descripción
   - **Collection**: Selecciona otra colección de productos
   - **Style**: 1 o 2 (prueba ambos)
3. **Guardar**

**Resultado:** Productos actualizados ✅

---

### 📦 Cambiar Colecciones del Home

**Ubicación:** `Metaobjects → Section | CollectionsSlider`

1. Edita la sección
2. Campo **"collections"** → Añade/quita colecciones
3. **Button text**: Cambia texto del botón
4. **Guardar**

**Resultado:** Colecciones actualizadas ✅

---

### 💬 Añadir Testimonios

**Paso 1:** Crear el testimonio
```
Metaobjects → Client Say → Add entry
```
- **Title**: Nombre interno (ej: "Testimonio Juan")
- **Name**: Juan Pérez
- **Image**: Foto del cliente
- **Content**: "Excelente servicio, muy recomendado..."
- **Stars**: 5
- **Guardar**

**Paso 2:** Añadirlo a la página
```
Metaobjects → Section | ClientsSay → Editar sección
```
- En **"Clients say"** → Añade el testimonio creado
- **Guardar** → **Publish**

**Resultado:** Nuevo testimonio visible ✅

---

### 📰 Configurar Blog en Home

**Ubicación:** `Metaobjects → Section | LatestBlog`

1. Edita la sección
2. Campos:
   - **Blog slug**: "news" (o el slug de tu blog)
   - **Heading bold**: "Últimas"
   - **Heading light**: "Noticias"
   - **Number of items**: 3
   - **Background color**: Selecciona color
   - **Button view all** → Crea/selecciona link
3. **Guardar**

**Resultado:** Posts del blog visibles ✅

---

### 🖼️ Añadir Sección Imagen + Texto

**Ubicación:** `Metaobjects → Section | ImageWithText`

1. **Add entry** (o edita existente)
2. Completa:
   - **Title**: Nombre interno
   - **Image**: Imagen
   - **Heading**: Título
   - **Content**: Texto largo
   - **Button 1**: Botón principal
   - **Button 2**: Botón secundario (opcional)
   - **Features**: Lista de características
   - **Style**: 1, 2 o 3
   - **Background color**: Color de fondo
3. **Guardar**

**Paso 2:** Añadirlo a una página
```
Metaobjects → Route → Edita la ruta
→ Sections → Añade la sección creada
```

**Resultado:** Nueva sección visible ✅

---

### 📋 Cambiar Pasos/Proceso

**Ubicación:** `Metaobjects → Section | Steps`

1. Edita la sección
2. Campos (todos son listas, mismo número de items):
   - **Labels**: "1", "2", "3"
   - **Icons**: Íconos para cada paso
   - **Headings**: Título de cada paso
   - **Contents**: Descripción de cada paso
   - **Style**: 1 o 2
3. **Guardar**

**Resultado:** Pasos actualizados ✅

---

## 🗂️ Crear una Página Nueva

### Ejemplo: Página "About Us"

**Paso 1:** Crear la ruta
```
Metaobjects → Route → Add entry
```
- **Title**: About Us
- **Handle**: `route-about` (sin espacios, minúsculas)
- **First line on top**: true/false
- **Sections**: Añade secciones deseadas:
  - Section | ImageWithText (historia)
  - Section | Steps (proceso)
  - Section | ClientsSay (testimonios)
- **Guardar** → **Publish**

**Paso 2:** Crear archivo de ruta (requiere código)
```typescript
// app/routes/($locale).about.tsx
import {getLoaderRouteFromMetaobject} from '~/utils/getLoaderRouteFromMetaobject';
import {RouteContent} from '~/sections/RouteContent';

export async function loader(args: LoaderFunctionArgs) {
  const {route} = await getLoaderRouteFromMetaobject({
    ...args,
    handle: 'route-about', // El handle que creaste
  });
  
  return defer({route});
}

export default function AboutPage() {
  const {route} = useLoaderData<typeof loader>();
  return <RouteContent route={route} />;
}
```

**Resultado:** Nueva página `/about` ✅

---

## 🔗 Crear Enlaces/Botones

**Ubicación:** `Metaobjects → Link`

Los botones son reutilizables:

1. **Add entry**
2. Completa:
   - **Title**: Nombre interno (ej: "Ver Productos")
   - **Text**: Texto visible del botón
   - **Href**: `/products` o URL completa
   - **Target**: true (nueva pestaña) / false (misma pestaña)
   - **Icon svg**: (opcional) código SVG
3. **Guardar**

**Uso:** Selecciona este link en cualquier sección que tenga campo de botón

---

## 🎨 Personalizar Colores

**Campos de color disponibles en:**
- Section | LatestBlog → `background_color`
- Section | ImageWithText → `background_color`
- Section | TabsCollectionsByGroup → `background_color`

**Cómo usarlo:**
1. Click en el campo de color
2. Selecciona del picker o ingresa HEX
3. Vista previa en tiempo real
4. Guardar

---

## 🌍 Multiidioma

**Activar traducciones:**
```
Shopify Admin → Settings → Languages → Añade idioma
```

**Traducir metaobjects:**
1. Ve al metaobject
2. En la esquina superior → Selecciona idioma
3. Click **"Add translation"**
4. Traduce cada campo
5. Guarda

**Resultado:** Contenido traducido por idioma ✅

---

## 🐛 Problemas Comunes

### ❌ "No veo los cambios"
**Solución:**
- Verifica que publicaste el metaobject
- Limpia caché del navegador (Cmd/Ctrl + Shift + R)
- En desarrollo: reinicia `npm run dev`

### ❌ "No aparece la sección en la página"
**Solución:**
- Verifica que añadiste la sección al campo "sections" del Route
- Verifica que el Route esté publicado
- Verifica el handle en el código

### ❌ "Los metaobjects no existen"
**Solución:**
- Ejecuta el setup: `/cisecoInitCreateMetaobjectDefinitions`
- Verifica permisos del Admin API token

---

## 📊 Cheat Sheet

| Quiero cambiar... | Voy a... |
|-------------------|----------|
| Banner home | `Route → Route Home → Section HeroSlider` |
| Productos destacados | `Section → ProductsSlider → Collection` |
| Testimonios | `Client Say → Add entry` + `Section ClientsSay` |
| Blog en home | `Section → LatestBlog` |
| Footer social | `Social → Add entries` |
| Colecciones home | `Section → CollectionsSlider` |
| Crear página | `Route → Add entry` + código |
| Botones | `Link → Add entry` |

---

## ⚡ Workflow Diario

```
1. Abre Shopify Admin
2. Settings → Custom data → Metaobjects
3. Busca el tipo de contenido
4. Edita campos
5. Guardar → Publish
6. Verifica en el sitio
7. ✅ Listo!
```

---

## 🎓 Recursos de Aprendizaje

**5 minutos para aprender:**
1. Crea un testimonio
2. Edita un banner
3. Cambia productos destacados

**Ya dominas el sistema! 🎉**

---

## 📞 ¿Necesitas Ayuda?

**Para cambios simples (textos, imágenes):**
→ Usa esta guía

**Para cambios de diseño/estructura:**
→ Requiere desarrollador

**Para añadir nuevas funcionalidades:**
→ Requiere código + desarrollador

---

**Última actualización:** Noviembre 2024
