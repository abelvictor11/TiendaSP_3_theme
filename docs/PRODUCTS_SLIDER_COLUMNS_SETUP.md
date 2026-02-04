# Configuración de Columnas en Section Products Slider

Para habilitar la edición de columnas en la sección Products Slider en Cyclewear, debes agregar el campo `columns` al metaobject en Shopify Admin.

## Pasos para agregar el campo:

### 1. Ir a Shopify Admin → Settings → Custom data → Metaobjects

### 2. Buscar el metaobject: `ciseco--section_products_slider`

### 3. Agregar los siguientes campos si no existen:

| Campo | Key | Tipo | Descripción |
|-------|-----|------|-------------|
| Columns | `columns` | Integer number | Número de columnas (2-6). Default: 4 |
| Products Limit | `products_limit` | Integer number | Límite de productos a mostrar. Default: 10 |
| Background Color | `background_color` | Color | Color de fondo de la sección |
| Heading Color | `heading_color` | Color | Color del título |
| Show View All | `show_view_all` | Boolean (true/false) | Mostrar botón "Ver todo" |
| View All Text | `view_all_text` | Single line text | Texto del botón "Ver todo" |

### 4. Configuración del campo `columns`:

1. Click en **"Add field"**
2. Seleccionar **"Integer number"**
3. Configurar:
   - **Name**: `Columns`
   - **Key**: `columns` (automático)
   - **Description**: `Número de columnas para desktop (2-6)`
   - **Validation** (opcional):
     - Minimum: `2`
     - Maximum: `6`

### 5. Guardar cambios

Después de agregar el campo, podrás editar el número de columnas en cada entrada del metaobject Products Slider.

## Valores de columnas soportados:
- **2** - 2 productos por fila
- **3** - 3 productos por fila  
- **4** - 4 productos por fila (default)
- **5** - 5 productos por fila
- **6** - 6 productos por fila

## Nota:
El componente ya está preparado para recibir estos valores. Solo necesitas agregar los campos al metaobject en Shopify Admin.
