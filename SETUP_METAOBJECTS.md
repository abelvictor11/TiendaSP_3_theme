# 🎨 Setup de Metaobjects - Guía Paso a Paso

## 🎯 ¿Qué son los Metaobjects?

Los **Metaobjects** son estructuras de datos personalizadas en Shopify que funcionan como un CMS. Cada tipo de contenido (banner, testimonios, etc.) es un **Metaobject Definition** que defines una vez y luego creas múltiples **entries** (entradas).

**Ejemplo:**
- **Definition:** "Hero Item" (define la estructura: título, imagen, botón)
- **Entries:** "Banner Home", "Banner Sale", "Banner New Collection" (instancias específicas)

---

## 📋 Metaobjects que Necesitas Crear

### Para Banners y Hero Sections:

#### 1. **Link** (Enlaces/Botones)
- Usado por: Todos los botones del sitio
- Campos:
  - `title` - Nombre interno
  - `text` - Texto del botón
  - `href` - URL
  - `target` - Nueva pestaña (true/false)
  - `icon_svg` - Ícono SVG (opcional)

#### 2. **Hero Item** (Item de Banner)
- Usado por: Banners individuales
- Campos:
  - `title` - Nombre interno
  - `heading` - Título principal
  - `sub_heading` - Subtítulo
  - `horizontal_image` - Imagen desktop
  - `vertical_image` - Imagen móvil
  - `cta_button` - Botón de acción (Link)

#### 3. **Section | Hero** (Banner Simple)
- Una sola imagen hero
- Campos:
  - `title` - Nombre
  - `hero_item` - Referencia a Hero Item

#### 4. **Section | HeroSlider** (Carrusel de Banners)
- Múltiples banners con slider
- Campos:
  - `title` - Nombre
  - `hero_items` - Lista de Hero Items

### Para Productos:

#### 5. **Section | ProductsSlider**
- Slider de productos
- Campos:
  - `title` - Nombre
  - `heading_bold` - Título en negrita
  - `heading_light` - Título ligero
  - `sub_heading` - Subtítulo
  - `body` - Descripción
  - `collection` - Colección de productos
  - `style` - Estilo (1 o 2)

#### 6. **Section | GridProductsAndFilter**
- Grilla con filtros
- Campos:
  - `title` - Nombre
  - `heading` - Título
  - `sub_heading` - Subtítulo
  - `hide_filter` - Ocultar filtros (true/false)
  - `collection` - Colección

### Para Colecciones:

#### 7. **Collection Group**
- Grupo de colecciones con ícono
- Campos:
  - `title` - Nombre
  - `name` - Nombre visible
  - `icon_svg` - Ícono SVG
  - `collections` - Lista de colecciones

#### 8. **Section | CollectionsSlider**
- Slider de colecciones
- Campos:
  - `title` - Nombre
  - `heading_bold` - Título negrita
  - `heading_light` - Título ligero
  - `sub_heading` - Subtítulo
  - `collections` - Lista de colecciones
  - `button_text` - Texto del botón

#### 9. **Section | TabsCollectionsByGroup**
- Tabs con grupos de colecciones
- Campos:
  - `title` - Nombre
  - `heading` - Título
  - `sub_heading` - Subtítulo
  - `number_collections_to_show` - Cantidad a mostrar
  - `collection_groups` - Grupos de colecciones
  - `card_style` - Estilo (1, 4 o 6)
  - `background_color` - Color de fondo

### Para Testimonios:

#### 10. **Client Say** (Testimonio)
- Testimonio individual
- Campos:
  - `title` - Nombre interno
  - `name` - Nombre del cliente
  - `image` - Foto
  - `content` - Texto del testimonio
  - `stars` - Estrellas (1-5)

#### 11. **Section | ClientsSay**
- Lista de testimonios
- Campos:
  - `title` - Nombre
  - `heading` - Título
  - `sub_heading` - Subtítulo
  - `clients_say` - Lista de testimonios

### Para Blog:

#### 12. **Section | LatestBlog**
- Últimos posts del blog
- Campos:
  - `title` - Nombre
  - `blog_slug` - Slug del blog
  - `heading_bold` - Título negrita
  - `heading_light` - Título ligero
  - `background_color` - Color de fondo
  - `number_of_items` - Cantidad de posts
  - `button_view_all` - Botón ver todos

### Para Contenido:

#### 13. **Section | ImageWithText**
- Imagen con texto lateral
- Campos:
  - `title` - Nombre
  - `image` - Imagen
  - `hide_logo` - Ocultar logo
  - `heading` - Título
  - `content` - Contenido
  - `button_1` - Botón 1
  - `button_2` - Botón 2
  - `background_color` - Color de fondo
  - `features` - Lista de características
  - `show_subscribers_input` - Mostrar suscripción
  - `style` - Estilo (1, 2 o 3)

#### 14. **Section | Steps**
- Pasos/proceso
- Campos:
  - `title` - Nombre
  - `labels` - Lista de etiquetas
  - `icons` - Lista de íconos
  - `headings` - Lista de títulos
  - `contents` - Lista de contenidos
  - `style` - Estilo (1 o 2)

### Para Páginas:

#### 15. **Route** (Página completa)
- Define una página entera
- Campos:
  - `title` - Nombre
  - `handle` - Identificador único
  - `first_line_on_top` - Línea superior
  - `sections` - Lista de secciones

### Para Footer:

#### 16. **Social** (Redes sociales)
- Enlaces sociales
- Campos:
  - `title` - Nombre
  - `description` - Descripción
  - `icon` - Ícono/imagen
  - `link` - URL

---

## 🚀 MÉTODO 1: Creación Automática (RECOMENDADO)

### Paso 1: Preparar Credenciales

#### 1.1 Crear Admin API App

En **Shopify Admin**:

```
Settings → Apps and sales channels → Develop apps
→ Create an app
```

**Nombre:** `Hydrogen CMS Setup`

#### 1.2 Configurar Permisos

En **Configuration → Admin API**:

```
✅ read_metaobjects
✅ write_metaobjects
```

**Save** → **Install app**

#### 1.3 Copiar Token

```
API credentials → Admin API access token
```

**Copia este token** - lo necesitarás en el siguiente paso.

### Paso 2: Ejecutar Setup Automático

#### 2.1 Iniciar Proyecto Local

```bash
cd /Users/usuario/Documents/supermu/Supermu_3_theme

# Asegúrate que .env esté configurado con:
# PUBLIC_STORE_DOMAIN="tu-tienda.myshopify.com"
# PUBLIC_STOREFRONT_API_TOKEN="..."

npm run dev
```

#### 2.2 Acceder a la Página de Setup

Abre en tu navegador:

```
http://localhost:3000/cisecoInitCreateMetaobjectDefinitions
```

#### 2.3 Completar el Formulario

**Campos requeridos:**

1. **Store Domain**: `tu-tienda.myshopify.com`
2. **Admin API Access Token**: (el token que copiaste)

**Click:** "Create All Metaobject Definitions"

#### 2.4 Esperar Confirmación

El proceso toma ~30-60 segundos:

```
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

🎉 All metaobject definitions created successfully!
```

### Paso 3: Verificar en Shopify Admin

```
Shopify Admin → Settings → Custom data → Metaobjects
```

Deberías ver todos los tipos creados ✅

---

## 📝 MÉTODO 2: Creación Manual (No Recomendado)

Si por alguna razón no puedes usar el método automático:

### Para crear "Hero Item" manualmente:

1. **Shopify Admin** → **Settings** → **Custom data** → **Metaobjects**
2. **Add definition**
3. Configura:

```
Name: Hero item
Type: ciseco--hero_item (importante el prefijo ciseco--)
Display name key: title

Fields:
1. Key: title, Type: Single line text
2. Key: heading, Type: Single line text
3. Key: sub_heading, Type: Single line text
4. Key: horizontal_image, Type: File (Image only)
5. Key: vertical_image, Type: File (Image only)
6. Key: cta_button, Type: Metaobject (ciseco--link)

Capabilities:
✅ Translatable
✅ Publishable
```

⚠️ **Repite este proceso para los 16 tipos** - Es tedioso, usa el método automático.

---

## 🎨 Paso 4: Crear Contenido

Una vez creadas las definitions, crea contenido:

### Ejemplo: Crear Banner del Home

#### 4.1 Crear el Botón

```
Metaobjects → Link → Add entry

title: "Button Shop Now"
text: "Shop Now"
href: "/products"
target: false
```

**Save**

#### 4.2 Crear el Hero Item

```
Metaobjects → Hero item → Add entry

title: "Home Banner 1"
heading: "Summer Collection 2024"
sub_heading: "Discover the latest trends"
horizontal_image: [Subir imagen 1920x800px]
vertical_image: [Subir imagen 800x1200px]
cta_button: [Seleccionar "Button Shop Now"]
```

**Save** → **Publish**

#### 4.3 Crear la Sección Hero Slider

```
Metaobjects → Section | HeroSlider → Add entry

title: "Home Hero Slider"
hero_items: [Seleccionar "Home Banner 1"]
```

Puedes añadir múltiples items para crear un slider

**Save** → **Publish**

#### 4.4 Crear/Editar la Ruta Home

```
Metaobjects → Route → "Route Home" (ya existe de ejemplo)

sections: 
  - Añadir "Home Hero Slider"
  - Añadir otras secciones...
```

**Save** → **Publish**

#### 4.5 Ver Resultado

Abre: `http://localhost:3000`

Tu banner debería estar visible ✅

---

## 📊 Estructura Típica de una Página Home

```
Route Home
├── Section | HeroSlider
│   ├── Hero Item 1 (Banner sale)
│   ├── Hero Item 2 (Banner new arrival)
│   └── Hero Item 3 (Banner special)
├── Section | ProductsSlider
│   └── Collection: "Featured Products"
├── Section | TabsCollectionsByGroup
│   ├── Collection Group: Men
│   │   ├── Shirts
│   │   ├── Pants
│   │   └── Shoes
│   └── Collection Group: Women
│       ├── Dresses
│       ├── Accessories
│       └── Bags
├── Section | ImageWithText
│   ├── Image: About us
│   ├── Button 1: "Learn More"
│   └── Button 2: "Contact"
├── Section | ClientsSay
│   ├── Client Say 1
│   ├── Client Say 2
│   └── Client Say 3
└── Section | LatestBlog
    └── Blog: "news"
```

---

## 🔧 Tips y Buenas Prácticas

### Nomenclatura

**Buena práctica:**
- Route: "Route Home", "Route About"
- Hero Item: "Banner Home Sale", "Banner Collection Women"
- Link: "Button Shop Now", "Button Learn More"

**Mala práctica:**
- "asdf", "test", "banner1"

### Organización

1. **Crear primero los componentes básicos:**
   - Links (botones)
   - Hero Items (banners)
   
2. **Luego las secciones:**
   - Section | HeroSlider
   - Section | ProductsSlider
   
3. **Finalmente las rutas:**
   - Route Home
   - Route About

### Imágenes

**Tamaños recomendados:**

- **Hero horizontal**: 1920x800px
- **Hero vertical**: 800x1200px
- **Collection thumbnails**: 600x600px
- **Product images**: 1200x1200px
- **Blog images**: 1200x600px
- **Testimonial photos**: 200x200px

**Formato:** WebP o JPG optimizado

---

## ❓ Troubleshooting

### "No veo los Metaobjects en Admin"

**Solución:**
1. Verifica que el token tenga permisos `write_metaobjects`
2. Ejecuta de nuevo el setup automático
3. Refresca la página de Shopify Admin

### "El banner no aparece en el home"

**Checklist:**
1. ✅ Hero Item creado y publicado
2. ✅ Section | HeroSlider creada con el Hero Item
3. ✅ Route Home tiene la sección añadida
4. ✅ Route Home está publicado
5. ✅ En el código, el loader usa `handle: 'route-home'`

### "Los cambios no se reflejan"

**Solución:**
1. Limpia caché: Cmd/Ctrl + Shift + R
2. Verifica que publicaste el metaobject
3. Reinicia el servidor: `npm run dev`

---

## 📚 Recursos Relacionados

- [GUIA_RAPIDA_EDICION.md](./GUIA_RAPIDA_EDICION.md) - Cómo editar contenido
- [CONFIGURACION_CONTENIDO.md](./CONFIGURACION_CONTENIDO.md) - Guía completa del CMS
- [GUIA_CONFIGURACION_HYDROGEN.md](./GUIA_CONFIGURACION_HYDROGEN.md) - Setup general

---

## 🎯 Checklist Final

- [ ] Admin API app creada con permisos
- [ ] Token copiado
- [ ] Setup automático ejecutado
- [ ] 16 tipos de Metaobjects creados
- [ ] Verificado en Shopify Admin
- [ ] Primer banner creado (Link + Hero Item)
- [ ] Primera sección creada (HeroSlider)
- [ ] Route Home configurada
- [ ] Contenido visible en localhost:3000

**¡Listo para crear contenido! 🎉**

---

**Última actualización:** Noviembre 2024  
**Autor:** iDeum Team
