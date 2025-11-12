# 🎨 Guía: Configurar Colores de Productos

Esta guía te ayudará a configurar las variables de entorno necesarias para mostrar imágenes de colores en las variantes de productos.

## 📋 Variables Necesarias

- `PUBLIC_STORE_CDN_STATIC_URL` - URL base del CDN de Shopify
- `PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION` - Formato de imagen (png/jpg/jpeg/webp/svg)

---

## 🔧 Paso 1: Obtener la URL del CDN

### 1.1 Ve a tu Admin de Shopify
```
https://shop-sportfitness.myshopify.com/admin
```

### 1.2 Navega a Contenido → Archivos
```
Admin → Contenido → Archivos
```

### 1.3 Sube una imagen de prueba
- Haz clic en "Cargar archivos" o "Upload files"
- Sube cualquier imagen (puede ser temporal)

### 1.4 Copia el enlace de la imagen
- Haz clic derecho en la imagen
- Selecciona "Copiar enlace de la imagen" o "Copy image link"
- Obtendrás algo como:
  ```
  https://cdn.shopify.com/s/files/1/0586/7674/0198/files/test.png?v=1699999999
  ```

### 1.5 Extrae la URL base
De esta URL completa:
```
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/test.png?v=1699999999
```

Necesitas solo esta parte (sin el nombre del archivo):
```
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/
```

**IMPORTANTE:** 
- ✅ Debe empezar con `https://`
- ✅ Debe terminar con `/`

---

## 🎨 Paso 2: Preparar Imágenes de Colores

### 2.1 Identificar tus variantes de color
Ejemplo: Si tienes productos con estas variantes:
- Negro
- Rojo
- Rosa y Blanco
- Azul Marino

### 2.2 Crear archivos de imagen
Nombra tus archivos **exactamente** como el valor de la variante:

| Variante en Shopify | Nombre del archivo |
|---------------------|-------------------|
| `Black` | `Black.png` |
| `Red` | `Red.png` |
| `Pink and White` | `Pink_and_White.png` |
| `Navy Blue` | `Navy_Blue.png` |

**Reglas importantes:**
- ✅ Reemplaza espacios con guiones bajos `_`
- ✅ Respeta mayúsculas/minúsculas
- ✅ Usa el mismo formato de imagen para todas (png recomendado)

### 2.3 Subir las imágenes
1. Ve a **Contenido → Archivos** en Shopify Admin
2. Sube todas las imágenes de colores
3. Espera a que se carguen completamente

---

## ⚙️ Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env
Si no existe, crea un archivo `.env` en la raíz del proyecto:

```bash
# Copia el ejemplo
cp .env.example .env
```

### 3.2 Editar el archivo .env
Abre `.env` y actualiza estas líneas:

```env
# Tu URL del CDN (obtenida en el Paso 1.5)
PUBLIC_STORE_CDN_STATIC_URL="https://cdn.shopify.com/s/files/1/XXXX/XXXX/XXXX/files/"

# Formato de tus imágenes de color
PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION='png'
```

### 3.3 Ejemplo completo de .env

```env
# Shopify Store
PUBLIC_STORE_DOMAIN="shop-sportfitness.myshopify.com"
PUBLIC_STOREFRONT_API_TOKEN="tu_token_aqui"
PRIVATE_STOREFRONT_API_TOKEN="tu_token_privado_aqui"

# Session
SESSION_SECRET="foobar"

# CDN y Colores
PUBLIC_STORE_CDN_STATIC_URL="https://cdn.shopify.com/s/files/1/0586/7674/0198/files/"
PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION='png'

# Otros
PUBLIC_CHECKOUT_DOMAIN=checkout.hydrogen.shop
PUBLIC_STOREFRONT_ID="foobar"
SHOP_ID=1234567890
```

---

## 🧪 Paso 4: Probar la Configuración

### 4.1 Verificar que las imágenes se cargan

Construye la URL manualmente para verificar:
```
[PUBLIC_STORE_CDN_STATIC_URL] + [Nombre_del_Color] + . + [PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION]
```

Ejemplo:
```
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/Red.png
```

### 4.2 Abre esta URL en tu navegador
- ✅ Si ves la imagen → ¡Configuración correcta!
- ❌ Si da error 404 → Revisa el nombre del archivo o la URL base

### 4.3 Reinicia el servidor de desarrollo
```bash
npm run dev
```

---

## 📝 Ejemplo Completo

### Configuración:
```env
PUBLIC_STORE_CDN_STATIC_URL="https://cdn.shopify.com/s/files/1/0586/7674/0198/files/"
PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION='png'
```

### Variantes de producto en Shopify:
- Black
- White
- Red
- Blue Ocean

### Archivos que debes subir:
```
Black.png
White.png
Red.png
Blue_Ocean.png
```

### URLs resultantes:
```
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/Black.png
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/White.png
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/Red.png
https://cdn.shopify.com/s/files/1/0586/7674/0198/files/Blue_Ocean.png
```

---

## ⚠️ Solución de Problemas

### Las imágenes no aparecen
1. ✅ Verifica que los nombres coincidan exactamente (mayúsculas/minúsculas)
2. ✅ Asegúrate de usar guiones bajos `_` en lugar de espacios
3. ✅ Confirma que la URL del CDN termina con `/`
4. ✅ Verifica que el formato de imagen es correcto

### Error 404 al acceder a la imagen
1. ✅ Verifica que la imagen se subió correctamente a Shopify
2. ✅ Revisa la URL base del CDN
3. ✅ Confirma el formato de imagen en la variable

### Los colores no tienen espacios en Shopify
- Si tu variante se llama `NavyBlue` (sin espacio), el archivo debe ser `NavyBlue.png`
- Si tu variante se llama `Navy Blue` (con espacio), el archivo debe ser `Navy_Blue.png`

---

## 🎉 ¡Listo!

Ahora tus productos mostrarán automáticamente las imágenes de colores cuando los clientes seleccionen diferentes variantes.

Si tienes problemas, verifica que:
1. ✅ Las variables de entorno están configuradas correctamente
2. ✅ Las imágenes están subidas a Shopify
3. ✅ Los nombres de archivo coinciden con los nombres de las variantes
4. ✅ El servidor de desarrollo está reiniciado

---

## 📚 Recursos Adicionales

- [Documentación de Hydrogen - Environments](https://shopify.dev/docs/custom-storefronts/hydrogen/environments)
- [Shopify Admin - Archivos](https://shop-sportfitness.myshopify.com/admin/settings/files)
