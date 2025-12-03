# 🚀 Tutorial: Crear Tu Primer Banner - Paso a Paso

## 🎯 Objetivo

Al final de este tutorial tendrás:
- ✅ Un banner funcional en tu home page
- ✅ Con imagen responsive (desktop y móvil)
- ✅ Con texto y botón personalizado
- ✅ Completamente editable desde Shopify Admin

**Tiempo estimado:** 15-20 minutos

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- [ ] Proyecto corriendo localmente (`npm run dev`)
- [ ] Admin API token con permisos `write_metaobjects`
- [ ] Acceso a Shopify Admin
- [ ] 2 imágenes preparadas:
  - Desktop: 1920x800px (horizontal)
  - Móvil: 800x1200px (vertical)

---

## 🔧 FASE 1: Setup Inicial (Una Sola Vez)

### Paso 1.1: Crear Admin API App

#### 1. Accede a Shopify Admin

```
https://admin.shopify.com/store/TU-TIENDA
```

#### 2. Ve a Apps

```
Settings (esquina inferior izquierda)
→ Apps and sales channels
→ Develop apps
```

#### 3. Crea la App

Click en: **"Create an app"**

```
App name: Hydrogen CMS Setup
App developer: Tu nombre/empresa
```

Click: **"Create app"**

#### 4. Configura Permisos

En la app recién creada:

```
→ Configuration (tab)
→ Admin API integration
→ Configure
```

**Busca y activa estos permisos:**

```
Metaobject definitions:
  ☑️ read_metaobjects
  ☑️ write_metaobjects
```

Click: **"Save"**

#### 5. Instala la App

```
→ API credentials (tab)
→ Install app (botón superior derecho)
→ Confirmar instalación
```

#### 6. Copia el Token

En **API credentials**:

```
Admin API access token: shpat_xxxxxxxxxxxxxxxxxxxxxxxx
```

**🔴 IMPORTANTE:** 
- Copia este token completo
- Guárdalo en un lugar seguro (lo necesitarás en el siguiente paso)
- Solo se muestra una vez

---

### Paso 1.2: Ejecutar Setup Automático

#### 1. Abre Terminal

```bash
cd /Users/usuario/Documents/supermu/Supermu_3_theme
```

#### 2. Verifica .env

Asegúrate que tu archivo `.env` tenga:

```bash
PUBLIC_STORE_DOMAIN="tu-tienda.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="tu_token_aqui"
```

#### 3. Inicia el Servidor

```bash
npm run dev
```

Deberías ver:

```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
```

#### 4. Abre la Página de Setup

En tu navegador, abre:

```
http://localhost:3000/cisecoInitCreateMetaobjectDefinitions
```

#### 5. Completa el Formulario

Verás dos campos:

**Store Domain:**
```
tu-tienda.myshopify.com
```
(Sin https://, solo el dominio)

**Admin API Access Token:**
```
shpat_xxxxxxxxxxxxxxxxxxxxxxxx
```
(El token que copiaste en el paso anterior)

#### 6. Crear Definitions

Click en: **"Create All Metaobject Definitions"**

Verás progreso en pantalla (~30 segundos):

```
Creating metaobject definitions...
✅ Link created
✅ Social created
✅ Hero Item created
✅ Section | Hero created
✅ Section | HeroSlider created
✅ Client Say created
✅ Section | ClientsSay created
✅ Section | LatestBlog created
✅ Section | GridProductsAndFilter created
✅ Collection Group created
✅ Section | TabsCollectionsByGroup created
✅ Section | ImageWithText created
✅ Section | Steps created
✅ Section | ProductsSlider created
✅ Section | CollectionsSlider created
✅ Route created

🎉 Success! All metaobject definitions created!
```

#### 7. Verificar en Shopify

Ve a Shopify Admin:

```
Settings → Custom data → Metaobjects
```

Deberías ver **16 tipos** de metaobjects:

- Link
- Social
- Hero item
- Section | Hero
- Section | HeroSlider
- Client Say
- Section | ClientsSay
- Section | LatestBlog
- Section | GridProductsAndFilter
- Collection Group
- Section | TabsCollectionsByGroup
- Section | ImageWithText
- Section | Steps
- Section | ProductsSlider
- Section | CollectionsSlider
- Route

✅ **Setup completado!** Solo haces esto una vez.

---

## 🎨 FASE 2: Crear el Banner

Ahora vamos a crear el contenido del banner.

### Paso 2.1: Crear el Botón (Link)

#### 1. Accede a Metaobjects

```
Shopify Admin → Settings → Custom data → Metaobjects
```

#### 2. Selecciona "Link"

En la lista de metaobjects, click en: **"Link"**

#### 3. Add Entry

Click en: **"Add entry"** (botón superior derecho)

#### 4. Completa los Campos

```
Title: Shop Now Button
(Este es el nombre interno, solo tú lo ves)

Text: Comprar Ahora
(Este es el texto que verá el usuario en el botón)

Href: /products
(La URL a donde lleva el botón)

Icon svg: (Dejar vacío por ahora)

Target: false
(false = misma pestaña, true = nueva pestaña)
```

#### 5. Guardar

Click en: **"Save"** (esquina superior derecha)

✅ **Botón creado!**

---

### Paso 2.2: Preparar Imágenes

#### Especificaciones de Imagen

**Imagen Desktop (horizontal):**
- Tamaño: 1920 x 800 píxeles
- Formato: JPG o WebP
- Peso: < 500KB (optimizada)
- Proporción: 2.4:1

**Imagen Móvil (vertical):**
- Tamaño: 800 x 1200 píxeles
- Formato: JPG o WebP
- Peso: < 300KB (optimizada)
- Proporción: 2:3

#### Herramientas para Optimizar

**Online:**
- TinyPNG: https://tinypng.com/
- Squoosh: https://squoosh.app/

**Local:**
- Photoshop
- GIMP
- Preview (Mac)

#### Tips de Diseño

```
✅ Usa imágenes de alta calidad
✅ Asegúrate que el texto sea legible
✅ Deja espacio para el texto overlay
✅ Optimiza el peso (velocidad de carga)
❌ No uses imágenes muy pesadas (>1MB)
❌ No uses imágenes borrosas
```

---

### Paso 2.3: Crear Hero Item (El Banner)

#### 1. Volver a Metaobjects

```
Settings → Custom data → Metaobjects
```

#### 2. Selecciona "Hero item"

En la lista, click en: **"Hero item"**

#### 3. Add Entry

Click en: **"Add entry"**

#### 4. Completa los Campos

**Title:**
```
Banner Home Verano 2024
```
(Nombre interno descriptivo)

**Heading:**
```
Colección Verano 2024
```
(Título principal que se verá en el banner)

**Sub heading:**
```
Descubre las últimas tendencias de la temporada
```
(Subtítulo que se verá debajo del título)

**Horizontal image:**
```
Click en "Add file"
→ Upload tu imagen desktop (1920x800px)
→ Espera que cargue
```

**Vertical image:**
```
Click en "Add file"
→ Upload tu imagen móvil (800x1200px)
→ Espera que cargue
```

**CTA button:**
```
Click en el campo
→ Search for: "Shop Now Button"
→ Selecciona el botón que creaste antes
```

#### 5. Vista Previa

Verifica que todo se vea bien:
- ✅ Título correcto
- ✅ Imágenes subidas
- ✅ Botón seleccionado

#### 6. Guardar y Publicar

```
1. Click "Save" (esquina superior derecha)
2. Click "Publish" (botón que aparece después de guardar)
```

**Estado debe ser:** 🟢 **Published**

✅ **Banner creado!**

---

### Paso 2.4: Crear Section HeroSlider

Ahora necesitamos crear la sección que contendrá el banner.

#### 1. Volver a Metaobjects

```
Settings → Custom data → Metaobjects
```

#### 2. Selecciona "Section | HeroSlider"

En la lista, click en: **"Section | HeroSlider"**

#### 3. Add Entry

Click en: **"Add entry"**

#### 4. Completa los Campos

**Title:**
```
Home Page Hero Slider
```
(Nombre interno)

**Hero items:**
```
Click en "Add items"
→ Busca: "Banner Home Verano 2024"
→ Selecciona tu banner
→ Click "Add"
```

💡 **Nota:** Puedes añadir múltiples banners aquí para crear un slider/carrusel.

#### 5. Guardar y Publicar

```
Click "Save" → Click "Publish"
```

✅ **Sección creada!**

---

### Paso 2.5: Añadir a la Página Home

Ahora conectamos todo a la página de inicio.

#### 1. Buscar Route Home

```
Settings → Custom data → Metaobjects
→ Busca y click en "Route"
```

#### 2. Editar "Route Home"

En la lista de routes, busca: **"Route Home"**

Click para editar.

#### 3. Añadir la Sección

En el campo **"sections"**:

```
Click en "Add items"
→ Busca: "Home Page Hero Slider"
→ Selecciona tu slider
→ Click "Add"
```

**Orden de secciones:**

Puedes arrastrar para reordenar. Tu slider debería estar primero (arriba).

```
1. Home Page Hero Slider ← Tu banner
2. (otras secciones existentes)
```

#### 4. Guardar y Publicar

```
Click "Save" → Click "Publish"
```

✅ **Banner conectado al home!**

---

## 🎉 FASE 3: Ver el Resultado

### Paso 3.1: Verificar Localmente

#### 1. Asegúrate que el servidor esté corriendo

```bash
npm run dev
```

#### 2. Abre en el Navegador

```
http://localhost:3000
```

#### 3. Verifica el Banner

Deberías ver:
- ✅ Tu imagen de fondo
- ✅ El título "Colección Verano 2024"
- ✅ El subtítulo
- ✅ El botón "Comprar Ahora"

#### 4. Prueba Responsive

**Desktop:**
- Abre en navegador normal
- Debería verse la imagen horizontal

**Móvil:**
- F12 → Toggle device toolbar
- Selecciona iPhone o Android
- Debería verse la imagen vertical

#### 5. Prueba el Botón

Click en "Comprar Ahora":
- Debería llevarte a `/products`

---

### Paso 3.2: Limpiar Caché (Si No Ves Cambios)

Si no ves el banner:

**Opción 1: Hard Refresh**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Opción 2: Reiniciar Servidor**
```bash
# En terminal:
Ctrl + C (detener)
npm run dev (iniciar de nuevo)
```

**Opción 3: Borrar Caché del Navegador**
```
F12 → Network tab
→ Right click → Clear browser cache
```

---

## 🎨 FASE 4: Personalizar (Opcional)

### Añadir Más Banners al Slider

#### 1. Crear Nuevo Hero Item

Repite el **Paso 2.3** con diferentes:
- Imágenes
- Textos
- Botones

Ejemplo:
```
Title: Banner Home Oferta
Heading: ¡50% OFF en Todo!
Sub heading: Solo por tiempo limitado
```

#### 2. Añadir al Slider

```
Metaobjects → Section | HeroSlider 
→ "Home Page Hero Slider"
→ Edit
→ Hero items → Add items
→ Selecciona tu nuevo banner
→ Save → Publish
```

Ahora tendrás un carrusel con 2+ banners ✨

---

### Cambiar Textos del Banner

#### 1. Editar Hero Item

```
Metaobjects → Hero item
→ "Banner Home Verano 2024"
→ Edit
```

#### 2. Modificar Campos

Cambia cualquier campo:
- Heading
- Sub heading
- Imágenes
- Botón

#### 3. Guardar

```
Save → Publish
```

**Los cambios son inmediatos** (puede requerir refresh)

---

### Cambiar Destino del Botón

#### 1. Editar Link

```
Metaobjects → Link
→ "Shop Now Button"
→ Edit
```

#### 2. Cambiar Href

```
Href: /collections/nueva-coleccion
```

#### 3. Guardar

```
Save
```

**Actualización inmediata** en todos los banners que usen ese botón.

---

## 🐛 Troubleshooting

### Problema: No Veo el Banner

**Checklist:**

- [ ] ✅ Metaobject definitions creadas
- [ ] ✅ Hero Item publicado (estado: Published)
- [ ] ✅ Section HeroSlider publicada
- [ ] ✅ Route Home tiene la sección añadida
- [ ] ✅ Route Home está publicado
- [ ] ✅ Servidor corriendo (`npm run dev`)
- [ ] ✅ Cache limpiado (Cmd+Shift+R)

**Si aún no funciona:**

```bash
# Reinicia el servidor
Ctrl + C
npm run dev
```

### Problema: Banner en Blanco

**Causas posibles:**

1. **Imágenes no cargadas:**
   - Verifica en Shopify Admin que las imágenes estén subidas
   - Re-sube si es necesario

2. **Hero Item no seleccionado:**
   - Verifica que Section HeroSlider tenga el Hero Item añadido

3. **Textos vacíos:**
   - Añade textos en Heading y Sub heading

### Problema: Botón No Funciona

**Verifica:**

1. **Link creado:**
   - Existe el Link en Metaobjects
   - Tiene href configurado

2. **Link seleccionado:**
   - Hero Item tiene el Link en cta_button

3. **URL correcta:**
   - Href comienza con `/` para URLs internas
   - O URL completa para externos

### Problema: Responsive No Funciona

**Verifica:**

1. **Ambas imágenes subidas:**
   - horizontal_image (desktop)
   - vertical_image (móvil)

2. **Tamaños correctos:**
   - Desktop: ~1920x800px
   - Móvil: ~800x1200px

---

## 📊 Resumen Visual del Flujo

```
1. Admin API Token
   ↓
2. Setup Automático (crea 16 tipos)
   ↓
3. Crear Link (botón)
   ↓
4. Crear Hero Item (banner)
   ├── horizontal_image
   ├── vertical_image
   ├── heading
   ├── sub_heading
   └── cta_button (Link)
   ↓
5. Crear Section HeroSlider
   └── hero_items (Hero Item)
   ↓
6. Editar Route Home
   └── sections (Section HeroSlider)
   ↓
7. Ver en localhost:3000 ✨
```

---

## ✅ Checklist Final

Asegúrate de haber completado:

- [ ] Admin API app creada con permisos
- [ ] Setup automático ejecutado correctamente
- [ ] Link (botón) creado y guardado
- [ ] Hero Item creado con:
  - [ ] Título
  - [ ] Heading
  - [ ] Sub heading
  - [ ] Imagen horizontal subida
  - [ ] Imagen vertical subida
  - [ ] Botón seleccionado
  - [ ] Publicado
- [ ] Section HeroSlider creada con Hero Item
- [ ] Route Home actualizada con la sección
- [ ] Banner visible en localhost:3000
- [ ] Responsive funciona (desktop y móvil)
- [ ] Botón funciona y lleva a la URL correcta

---

## 🎯 Próximos Pasos

Ahora que tienes tu primer banner, puedes:

1. **Añadir más banners** para crear un slider
2. **Crear otras secciones:**
   - Section | ProductsSlider
   - Section | CollectionsSlider
   - Section | ClientsSay
3. **Crear páginas nuevas** (About, Contact)
4. **Personalizar diseños** (requiere código)

---

## 📚 Documentos Relacionados

- [SETUP_METAOBJECTS.md](./SETUP_METAOBJECTS.md) - Referencia completa
- [GUIA_RAPIDA_EDICION.md](./GUIA_RAPIDA_EDICION.md) - Edición diaria
- [CONFIGURACION_CONTENIDO.md](./CONFIGURACION_CONTENIDO.md) - Sistema CMS

---

## 🎉 ¡Felicidades!

Has creado tu primer banner headless con Shopify Hydrogen.

**Logros desbloqueados:**
- ✅ Metaobjects configurados
- ✅ Sistema CMS funcionando
- ✅ Banner responsive creado
- ✅ Editable desde Shopify Admin

**Ahora tienes control total del contenido sin tocar código.**

---

**Tiempo completado:** ~15-20 minutos  
**Última actualización:** Noviembre 2024  
**Creado por:** iDeum Team
