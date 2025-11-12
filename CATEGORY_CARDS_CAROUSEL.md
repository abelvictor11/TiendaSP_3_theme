# 🎨 Guía: Section Category Cards Carousel

Esta sección te permite crear un carousel de tarjetas de categorías con tabs, similar al ejemplo que proporcionaste (ENDURANCE, HYBRID, WELLNESS).

## ✅ Metaobjects Creados

Se han creado 3 nuevos tipos de metaobjects:

1. **Category Card** (`ciseco--category_card_item`)
2. **Category Group Tabs** (`ciseco--category_group_tabs`)
3. **Section | CategoryCardsCarousel** (`ciseco--section_category_cards_carousel`)

---

## 📋 Paso 1: Crear Category Cards

Las Category Cards son las tarjetas individuales que se mostrarán en el carousel.

### 1.1 Ve a Shopify Admin → Configuración → Metaobjects

```
https://shop-sportfitness.myshopify.com/admin/settings/custom_data
```

### 1.2 Busca "Category Card" y haz clic en "Agregar entrada"

### 1.3 Completa los campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Title** | Título principal de la tarjeta | `PROMIX WHEY ISOLATE` |
| **Subtitle** | Subtítulo descriptivo | `Grass-fed, cold-processed, and made by athletes` |
| **Image** | Imagen de fondo (banner) | Sube una imagen 1200x800px |
| **CTA Text** | Texto del botón | `SHOP NOW` |
| **CTA Link** | URL del enlace | `/collections/whey-protein` |

### 1.4 Guarda la entrada

Repite este proceso para cada tarjeta que quieras mostrar. **Ejemplo completo:**

**Tarjeta 1:**
- Title: `PROMIX WHEY ISOLATE`
- Subtitle: `Grass-fed, cold-processed, and made by athletes`
- Image: (imagen de chocolate)
- CTA Text: `SHOP NOW`
- CTA Link: `/collections/whey-protein`

**Tarjeta 2:**
- Title: `SWISSRX NITRIC OXIDE`
- Subtitle: `The longest lasting performance booster`
- Image: (imagen de botellas rojas)
- CTA Text: `SHOP NOW`
- CTA Link: `/collections/performance`

**Tarjeta 3:**
- Title: `DREAM SHOT`
- Subtitle: `The complete sleep solution your body's been missing`
- Image: (imagen azul)
- CTA Text: `SHOP NOW`
- CTA Link: `/collections/sleep`

---

## 📋 Paso 2: Crear Category Groups (Tabs)

Los Category Groups son los tabs que organizan tus tarjetas por categoría.

### 2.1 Ve a Shopify Admin → Configuración → Metaobjects

### 2.2 Busca "Category Group Tabs" y haz clic en "Agregar entrada"

### 2.3 Completa los campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Title** | Título del grupo | `Endurance Products` |
| **Name** | Nombre que aparece en el tab | `ENDURANCE` |
| **Icon SVG** (opcional) | Código SVG del ícono | Ver ejemplos abajo |
| **Category Cards** | Selecciona las tarjetas | Elige las 3 tarjetas creadas |

### 2.4 Ejemplo de SVG para iconos:

```html
<!-- Ícono de running/endurance -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-width="2"/>
</svg>

<!-- Ícono de fitness/hybrid -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-width="2"/>
</svg>

<!-- Ícono de wellness/sleep -->
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke-width="2"/>
</svg>
```

### 2.5 Guarda el grupo

Crea un grupo para cada tab. **Ejemplo:**

**Grupo 1: ENDURANCE**
- Title: `Endurance Products`
- Name: `ENDURANCE`
- Icon SVG: (ícono de rayo)
- Category Cards: Tarjeta 1, Tarjeta 2, Tarjeta 3

**Grupo 2: HYBRID**
- Title: `Hybrid Products`
- Name: `HYBRID`
- Icon SVG: (ícono de personas)
- Category Cards: (otras tarjetas)

**Grupo 3: WELLNESS**
- Title: `Wellness Products`
- Name: `WELLNESS`
- Icon SVG: (ícono de luna)
- Category Cards: (otras tarjetas)

---

## 📋 Paso 3: Crear la Sección

### 3.1 Ve a Shopify Admin → Configuración → Metaobjects

### 3.2 Busca "Section | CategoryCardsCarousel" y haz clic en "Agregar entrada"

### 3.3 Completa los campos:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| **Heading** | Título de la sección | `SHOP BY` |
| **Sub Heading** | Subtítulo | `Explore our categories` |
| **Background Color** | Color de fondo (opcional) | `#f9fafb` o deja en blanco |
| **Category Groups** | Selecciona los grupos tabs | ENDURANCE, HYBRID, WELLNESS |

### 3.4 Guarda la sección

---

## 📋 Paso 4: Agregar la Sección a una Ruta

### 4.1 Ve a Shopify Admin → Configuración → Metaobjects

### 4.2 Busca "Route" y edita tu ruta del homepage (o crea una nueva)

### 4.3 En el campo "Sections", agrega la sección que creaste

**Ejemplo de orden de secciones:**
1. Hero Slider
2. **Category Cards Carousel** ← Nueva sección
3. Products Slider
4. Image With Text
5. Latest Blog

### 4.4 Guarda la ruta

---

## 🎨 Resultado Esperado

Tu sección se verá así:

```
                    SHOP BY
              Explore our categories

    [ENDURANCE]  [HYBRID]  [WELLNESS]  ← Tabs navegables

┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Imagen    │  │   Imagen    │  │   Imagen    │
│   Banner    │  │   Banner    │  │   Banner    │
│             │  │             │  │             │
│ PROMIX WHEY │  │ SWISSRX NO  │  │ DREAM SHOT  │
│  ISOLATE    │  │             │  │             │
│             │  │             │  │             │
│ Subtitle... │  │ Subtitle... │  │ Subtitle... │
│             │  │             │  │             │
│ [SHOP NOW]  │  │ [SHOP NOW]  │  │ [SHOP NOW]  │
└─────────────┘  └─────────────┘  └─────────────┘
      ← → ← Carousel navegable → → →
```

---

## 🎯 Características

### ✅ Tabs Interactivos
- Los tabs cambian el contenido del carousel
- Se pueden personalizar con iconos SVG
- Diseño responsive con scroll horizontal en móvil

### ✅ Carousel
- Deslizable con mouse o touch
- Navegación con flechas
- Responsive (1 card en móvil, 2 en tablet, 3 en desktop)

### ✅ Cards Atractivas
- Imagen de fondo full
- Gradiente para legibilidad
- Título grande y llamativo
- Subtítulo descriptivo
- Botón CTA destacado
- Efecto hover con zoom en imagen

---

## ⚙️ Personalización

### Cambiar el número de cards visibles

Edita el archivo `app/sections/SectionCategoryCardsCarousel.tsx`:

```typescript
<GlideCarousel
  options={{
    perView: 3,  // ← Cambia esto (cards visibles en desktop)
    gap: 28,
    // ...
  }}
>
```

### Cambiar colores del gradiente

Edita la línea del gradiente:

```tsx
<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
```

Puedes cambiar:
- `from-black/60` → Color y opacidad inferior
- `via-black/20` → Color y opacidad medio
- `to-transparent` → Transparente arriba

### Cambiar altura de las cards

```tsx
<div className="... min-h-[400px] lg:min-h-[500px]">
  <!-- min-h-[400px] = altura mínima en móvil -->
  <!-- lg:min-h-[500px] = altura mínima en desktop -->
</div>
```

---

## 🔧 Resolución de Problemas

### Las tarjetas no aparecen
1. ✅ Verifica que los Category Cards tengan imágenes
2. ✅ Asegúrate de que los Category Cards estén asignados a un Category Group
3. ✅ Confirma que los Category Groups estén asignados a la sección

### Los tabs no funcionan
1. ✅ Verifica que tengas más de un Category Group
2. ✅ Si solo tienes un grupo, los tabs no se mostrarán (es normal)

### Las imágenes no se ven bien
- Usa imágenes de al menos 1200x800px
- Formato recomendado: JPG o WebP
- Peso recomendado: < 300KB (optimiza con TinyPNG)

### El carousel no se desliza
- Asegúrate de tener más de 3 tarjetas (o el número de perView configurado)
- Verifica que GlideCarousel esté correctamente instalado

---

## 📸 Recomendaciones de Imágenes

### Dimensiones ideales:
- **Desktop**: 1200 x 800px (ratio 3:2)
- **Mobile**: 800 x 1200px (ratio 2:3)

### Consejos de diseño:
- ✅ Usa imágenes con espacio para el texto (parte inferior)
- ✅ Evita imágenes muy oscuras o muy claras
- ✅ El gradiente ayuda con la legibilidad
- ✅ Optimiza las imágenes antes de subir

---

## 🚀 Próximos Pasos

1. **Genera los tipos de TypeScript:**
   ```bash
   npm run graphql-types
   ```

2. **Inicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Visita tu homepage y verifica la sección**

4. **Ajusta según necesites** (colores, tamaños, textos)

---

## 💡 Tips Adicionales

### Para múltiples tabs:
- Crea 3-5 Category Groups para mejor UX
- Nombra los tabs de forma concisa (1-2 palabras)
- Usa iconos SVG para mejor identificación visual

### Para mejores conversiones:
- CTAs claros y directos ("SHOP NOW", "DISCOVER", "EXPLORE")
- Imágenes de alta calidad que muestren el producto
- Subtítulos que destaquen beneficios únicos
- Links que lleven a colecciones relevantes

---

¿Necesitas ayuda? Revisa los ejemplos en los otros archivos de secciones en `app/sections/`.
