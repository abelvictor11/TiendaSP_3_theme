# 🎨 Guía: Secciones de Productos

Este documento explica cómo usar las dos nuevas secciones de productos para el homepage.

---

## 📦 1. Section | ProductFeature (Boxed, 50/50)

Sección con dos columnas: una imagen de producto y una card de contenido con colores personalizables.

### 🎯 Uso
Ideal para destacar un producto individual con descripción extensa y CTA.

### 🏗️ Estructura
```
┌──────────────────────────────────────┐
│  Container (Boxed)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │          │  │                  │  │
│  │  Imagen  │  │   Card Azul      │  │
│  │ Producto │  │   • Título       │  │
│  │          │  │   • Descripción  │  │
│  │          │  │   • Botón CTA    │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

### 📋 Campos del Metaobject

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **Title** | Text | Título o nombre del metaobject |
| **Heading** | Text | Título principal en la card |
| **Description** | Multi-line Text | Descripción larga del producto |
| **CTA Text** | Text | Texto del botón (ej: "SHOP DREAM SHOT") |
| **CTA Link** | Text | URL del botón (ej: "/products/dream-shot") |
| **Product** | Product Reference | Producto individual a mostrar |
| **Collection** | Collection Reference | Alternativa: toma el primer producto de la colección |
| **Background Color** | Color | Color de fondo de la card (#00bcd4) |
| **Text Color** | Color | Color del texto (#ffffff) |
| **Button Background Color** | Color | Color de fondo del botón (#ffffff) |
| **Button Text Color** | Color | Color del texto del botón (#000000) |
| **Image Position** | Text | Posición de la imagen: "left" o "right" |

### 🎨 Configuración en Shopify

#### Paso 1: Crear el metaobject
1. Ve a **Settings → Custom data → Metaobjects**
2. Busca **"Section | ProductFeature"**
3. Haz clic en **"Add entry"**

#### Paso 2: Completar campos
```yaml
Title: "Dream Shot Feature"
Heading: "The Future of Sleep Supplements"
Description: "Dream Shot is the only sleep supplement powered by PeptiSleep® to balance neurotransmitters, reduce cortisol spikes, and boost recovery quality during deep sleep. Unlike sedatives, these peptides work with your body's natural systems."
CTA Text: "SHOP DREAM SHOT"
CTA Link: "/products/dream-shot"
Product: [Selecciona tu producto]
Background Color: #00bcd4
Text Color: #ffffff
Button Background Color: #ffffff
Button Text Color: #000000
Image Position: left
```

#### Paso 3: Agregar a una ruta
1. Ve a **Metaobjects → Route**
2. Edita tu ruta del homepage
3. En **Sections**, agrega la nueva sección

---

## 🏆 2. Section | ProductShowcase (Full-width con múltiples productos)

Sección de ancho completo con imagen de fondo, una card de contenido a la izquierda y 2 cards de productos a la derecha.

### 🎯 Uso
Ideal para mostrar una línea de productos con contexto visual impactante.

### 🏗️ Estructura
```
┌──────────────────────────────────────────────────────────────┐
│  Full Width (Background Image)                                │
│  ┌─────────────────┐  ┌──────────┐  ┌──────────┐            │
│  │  Badge          │  │ Producto │  │ Producto │            │
│  │  Título Grande  │  │  Imagen  │  │  Imagen  │            │
│  │  Ícono          │  │  Nombre  │  │  Nombre  │            │
│  │  Subtítulo      │  │  Desc    │  │  Desc    │            │
│  │  Descripción    │  │  [BTN]   │  │  [BTN]   │            │
│  └─────────────────┘  └──────────┘  └──────────┘            │
└──────────────────────────────────────────────────────────────┘
```

### 📋 Campos del Metaobject

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **Title** | Text | Título o nombre del metaobject |
| **Badge Text** | Text | Badge superior (ej: "NEW 48-COUNT BOXES") |
| **Heading** | Text | Título principal |
| **Subheading** | Text | Subtítulo (ej: "MORE GELS, MORE MILES") |
| **Description** | Multi-line Text | Descripción del producto/categoría |
| **Icon SVG** | Multi-line Text | Código SVG del ícono (opcional) |
| **Background Image** | File | Imagen de fondo full-width |
| **Content Background Color** | Color | Color de la card izquierda (#ffffff) |
| **Text Color** | Color | Color del texto en la card izquierda (#000000) |
| **Products** | Product List | Lista de productos (máx. 2) |
| **Collection** | Collection Reference | Alternativa: toma los primeros 2 de la colección |
| **Card Background Color** | Color | Color de las cards de productos (#ffffff) |
| **Card Text Color** | Color | Color del texto en cards de productos (#000000) |
| **Button Text** | Text | Texto de los botones (ej: "VIEW PRODUCT") |

### 🎨 Configuración en Shopify

#### Paso 1: Crear el metaobject
1. Ve a **Settings → Custom data → Metaobjects**
2. Busca **"Section | ProductShowcase"**
3. Haz clic en **"Add entry"**

#### Paso 2: Completar campos
```yaml
Title: "Maurten Gels Showcase"
Badge Text: "NEW 48-COUNT BOXES"
Heading: "Maurten Gels Now in 48-Packs"
Subheading: "MORE GELS, MORE MILES"
Description: "Now available in 48-count boxes. Maurten Gel 100 CAF 100 and Gel 100 deliver hydrogel-powered carbs for long-lasting endurance. Stock up with more gels per box to fuel training and racing without running out mid-season."
Icon SVG: <svg>...</svg>
Background Image: [Sube imagen del ciclista]
Content Background Color: #ffffff
Text Color: #000000
Products: [Selecciona 2 productos Maurten]
Card Background Color: #ffffff
Card Text Color: #000000
Button Text: "VIEW PRODUCT"
```

#### Paso 3: Agregar a una ruta
1. Ve a **Metaobjects → Route**
2. Edita tu ruta del homepage
3. En **Sections**, agrega la nueva sección

---

## 🎨 Personalización de Colores

### Ejemplos de combinaciones

**Estilo Cian/Azul (Dream Shot):**
```
Background Color: #00bcd4
Text Color: #ffffff
Button Background: #ffffff
Button Text: #000000
```

**Estilo Blanco sobre negro:**
```
Background Color: #000000
Text Color: #ffffff
Button Background: #ffffff
Button Text: #000000
```

**Estilo Neón/Moderno:**
```
Background Color: #7c3aed
Text Color: #ffffff
Button Background: #fbbf24
Button Text: #000000
```

**Estilo Limpio/Minimalista:**
```
Background Color: #f9fafb
Text Color: #1f2937
Button Background: #1f2937
Button Text: #ffffff
```

---

## 💡 Tips de Uso

### ProductFeature (50/50):
- ✅ Usa para productos premium que necesitan explicación
- ✅ Coloca la imagen a la izquierda para llamar la atención primero
- ✅ Descripción ideal: 2-4 líneas explicando beneficios únicos
- ✅ CTA claro y directo

### ProductShowcase (Full-width):
- ✅ Ideal para lanzamientos de productos
- ✅ Usa imagen de fondo de alta calidad (1920x800px mínimo)
- ✅ Badge para destacar novedades ("NEW", "LIMITED", "EXCLUSIVE")
- ✅ Máximo 2 productos para no saturar
- ✅ Asegúrate de que el texto sea legible sobre la imagen de fondo

---

## 🚀 Pasos Finales

### 1. Genera los tipos TypeScript:
```bash
npm run graphql-types
```

### 2. Inicia el servidor:
```bash
npm run dev
```

### 3. Verifica las secciones en el homepage

---

## 🔧 Resolución de Problemas

### La imagen no se muestra
- ✅ Verifica que el producto tenga `featuredImage`
- ✅ Si usas colección, asegúrate de que tenga productos
- ✅ Revisa que el campo esté correctamente asignado

### Los colores no cambian
- ✅ Usa códigos hexadecimales (#00bcd4)
- ✅ Verifica que el selector de color esté guardado
- ✅ Limpia caché del navegador (Cmd+Shift+R)

### Los productos no aparecen en ProductShowcase
- ✅ Asigna máximo 2 productos
- ✅ Si usas colección, debe tener al menos 1 producto
- ✅ Verifica que los productos estén activos y publicados

---

¿Necesitas ayuda? Revisa los ejemplos en los otros archivos de secciones en `app/sections/`.
