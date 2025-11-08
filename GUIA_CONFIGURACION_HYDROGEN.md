# 🚀 Guía Completa: Configuración de Hydrogen

## 📋 Requisitos Previos

### Sistema
- **Node.js**: v20.0.0 o superior
- **npm**: v9.0.0 o superior
- **Git**: Para control de versiones
- **Editor**: VS Code recomendado

### Shopify
- ✅ Tienda de Shopify (desarrollo o producción)
- ✅ Acceso al Admin
- ✅ Plan Shopify (cualquiera, puede ser de prueba)

### Conocimientos (Ideales)
- React básico
- JavaScript/TypeScript
- Terminal/línea de comandos
- Git básico

---

## 🛠️ PASO 1: Instalación y Setup Local

### 1.1 Instalar Dependencias

```bash
# Verificar versión de Node
node --version  # Debe ser ≥20.0.0

# Si no tienes Node 20+, instálalo desde nodejs.org
# o usa nvm:
nvm install 20
nvm use 20
```

### 1.2 Instalar Dependencias del Proyecto

```bash
cd /Users/usuario/Documents/supermu/Supermu_3_theme

# Instalar dependencias
npm install
```

**Esto instala (~5 minutos):**
- Shopify CLI
- Hydrogen
- Remix
- React
- TypeScript
- Tailwind CSS
- Todas las dependencias

---

## 🔑 PASO 2: Configuración de Shopify

### 2.1 Crear Storefront API Access

#### Opción A: Usando Shopify CLI (Recomendado)

```bash
# Login en Shopify CLI
npx shopify login

# Esto abrirá tu navegador para autenticarte
# Selecciona tu tienda
```

#### Opción B: Manual desde Shopify Admin

1. Ve a **Shopify Admin**
2. **Apps** → **Develop apps**
3. **Create an app**
   - Nombre: `Hydrogen Storefront`
4. **Configuration** → **Storefront API**
5. Activa estos permisos:
   ```
   ✅ unauthenticated_read_product_listings
   ✅ unauthenticated_read_products  
   ✅ unauthenticated_read_collections
   ✅ unauthenticated_read_product_tags
   ✅ unauthenticated_read_selling_plan_groups
   ✅ unauthenticated_read_product_inventory
   ✅ unauthenticated_write_checkouts
   ✅ unauthenticated_read_checkouts
   ✅ unauthenticated_read_customers (si usas Customer API)
   ```
6. **Save**
7. **API credentials** → Copia:
   - `Storefront API access token`
   - `Store domain`

### 2.2 Crear Admin API Access (Para Metaobjects)

**Solo si vas a usar el sistema CMS:**

1. Misma app o crea nueva
2. **Configuration** → **Admin API**
3. Activa:
   ```
   ✅ read_metaobjects
   ✅ write_metaobjects
   ```
4. **Install app**
5. Copia el **Admin API access token**

---

## 📝 PASO 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env

```bash
# Copiar el ejemplo
cp .env.example .env
```

### 3.2 Editar .env

Abre el archivo `.env` y completa:

```bash
# ==========================================
# CONFIGURACIÓN BÁSICA (REQUERIDO)
# ==========================================

# Dominio de tu tienda (sin https://)
PUBLIC_STORE_DOMAIN="tu-tienda.myshopify.com"

# Token público del Storefront API
PUBLIC_STOREFRONT_API_TOKEN="tu_token_publico_aqui"

# Token privado del Storefront API (opcional pero recomendado)
PRIVATE_STOREFRONT_API_TOKEN="tu_token_privado_aqui"

# Secret para sesiones (genera uno aleatorio)
SESSION_SECRET="tu_secreto_aleatorio_aqui"

# ==========================================
# CUSTOMER ACCOUNT API (OPCIONAL)
# ==========================================

# ID del cliente de Customer Account API
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID="shp_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# URL del Customer Account API
PUBLIC_CUSTOMER_ACCOUNT_API_URL="https://shopify.com/xxxxxxxxxx"

# ==========================================
# CONFIGURACIÓN ADICIONAL
# ==========================================

# URL del CDN de Shopify (para imágenes estáticas)
PUBLIC_STORE_CDN_STATIC_URL="https://cdn.shopify.com/s/files/1/xxxx/xxxx/xxxx/files/"

# Formato de imagen por defecto para opciones de producto
PUBLIC_IMAGE_FORMAT_FOR_PRODUCT_OPTION="webp"

# ID de la tienda (numérico)
SHOP_ID=1234567890

# ID del Storefront
PUBLIC_STOREFRONT_ID="gid://shopify/Storefront/xxxxxxx"

# Dominio del checkout (opcional)
PUBLIC_CHECKOUT_DOMAIN="checkout.myshopify.com"

# ==========================================
# OKENDO (REVIEWS - OPCIONAL)
# ==========================================

PUBLIC_OKENDO_SUBSCRIBER_ID="tu_okendo_id_aqui"
```

### 3.3 Generar SESSION_SECRET

```bash
# Genera un string aleatorio seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copia el resultado a SESSION_SECRET
```

### 3.4 Encontrar tus credenciales

#### Store Domain:
```
Tu URL de admin: https://admin.shopify.com/store/mi-tienda
                                                    ^^^^^^^^
Store domain: mi-tienda.myshopify.com
```

#### Storefront API Token:
```
Shopify Admin → Apps → Tu app → API credentials
→ Storefront API access token
```

#### Shop ID:
```
1. Ve a: https://admin.shopify.com/store/tu-tienda/settings
2. La URL contiene tu Shop ID
O usa GraphQL:
query { shop { id } }
```

---

## 🚀 PASO 4: Iniciar Desarrollo Local

### 4.1 Primera Ejecución

```bash
# Iniciar servidor de desarrollo
npm run dev
```

**Esto hace:**
1. Compila el proyecto con Vite
2. Inicia el servidor local en `http://localhost:3000`
3. Genera tipos de GraphQL automáticamente
4. Hot reload (recarga automática en cambios)

### 4.2 Verificar que funciona

Abre: `http://localhost:3000`

**Deberías ver:**
- ✅ Home page cargando
- ✅ Productos (si tienes en Shopify)
- ✅ Navegación funcional
- ❌ Si ves errores, revisa el `.env`

### 4.3 Comandos Útiles

```bash
# Desarrollo con codegen automático
npm run dev

# Solo generar tipos GraphQL
npm run codegen

# Build para producción
npm run build

# Preview de la build
npm run preview

# Linting
npm run lint

# Formatear código
npm run format

# Type checking
npm run typecheck

# Tests E2E
npm run e2e
```

---

## 🎨 PASO 5: Configurar Sistema CMS (Metaobjects)

### 5.1 Obtener Admin API Token

Ya lo hiciste en el PASO 2.2 ✅

### 5.2 Ejecutar Setup de Metaobjects

```bash
# Con el servidor corriendo (npm run dev)
# Abre en navegador:
http://localhost:3000/cisecoInitCreateMetaobjectDefinitions
```

**En la interfaz:**
1. **Store Domain**: `tu-tienda.myshopify.com`
2. **Admin API Token**: (el token de Admin API)
3. Click: **"Create All Metaobject Definitions"**
4. Espera ~30 segundos
5. Verás mensajes de éxito ✅

**Esto crea:**
- Link
- Social
- Hero Item
- Section | Hero
- Section | HeroSlider
- Section | ClientsSay
- Section | LatestBlog
- Section | GridProductsAndFilter
- Section | TabsCollectionsByGroup
- Section | ImageWithText
- Section | Steps
- Section | ProductsSlider
- Section | CollectionsSlider
- Collection Group
- Route

### 5.3 Poblar Contenido de Ejemplo (Opcional)

En la misma página, hay una segunda sección para importar contenido de ejemplo.

⚠️ **Advertencia:** Esto creará muchas entradas de prueba.

---

## 🌐 PASO 6: Configurar Customer Account API (Opcional)

**Solo si quieres que funcione la sección `/account`:**

### 6.1 Setup ngrok (Desarrollo Local)

```bash
# Instalar ngrok
brew install ngrok  # Mac
# o descarga de ngrok.com

# Crear cuenta en ngrok.com (gratis)
# Obtener token de auth
ngrok config add-authtoken TU_TOKEN

# Crear dominio permanente (plan gratis permite 1)
# En ngrok.com → Domains → Create domain

# Iniciar tunnel
ngrok http --domain=tu-subdominio.ngrok-free.app 3000
```

### 6.2 Configurar en Shopify Admin

```
Shopify Admin → Settings → Customer accounts
→ New customer accounts (required)
→ Classic customer accounts (si prefieres)

→ Hydrogen/Headless app → Customer Account API
→ Application setup

Callback URI:
https://tu-subdominio.ngrok-free.app/account/authorize

Javascript origins:
https://tu-subdominio.ngrok-free.app

Logout URI:
https://tu-subdominio.ngrok-free.app
```

### 6.3 Actualizar .env

```bash
PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID="shp_xxxxxxxx"
PUBLIC_CUSTOMER_ACCOUNT_API_URL="https://shopify.com/xxxxxxx"
```

### 6.4 Reiniciar servidor

```bash
# Ctrl+C para detener
npm run dev
```

---

## 🚢 PASO 7: Deploy a Producción (Shopify Oxygen)

### 7.1 Preparar para Deploy

```bash
# Asegúrate que todo funciona localmente
npm run build
npm run preview

# Verifica en http://localhost:3000
```

### 7.2 Deploy con Shopify CLI

```bash
# Login si no lo has hecho
npx shopify login

# Deploy
npx shopify hydrogen deploy
```

**El CLI te preguntará:**
1. Seleccionar tienda
2. Crear nuevo storefront o usar existente
3. Confirmar deploy

**Proceso (~2-5 minutos):**
1. Build optimizado
2. Upload a Oxygen
3. Deploy a edge network global
4. Te da URL de producción

### 7.3 Configurar Dominio Custom

```bash
# En Shopify Admin
Settings → Domains → Connect existing domain

# O desde CLI
npx shopify hydrogen link
```

### 7.4 Variables de Entorno en Producción

```
Shopify Admin → Apps → Hydrogen
→ Storefront → Settings → Environment variables
```

Añade las mismas variables del `.env` local:
- `SESSION_SECRET`
- `PRIVATE_STOREFRONT_API_TOKEN`
- etc.

⚠️ **NO incluir variables `PUBLIC_*`** (ya están en el build)

---

## 🔧 PASO 8: Configuración Avanzada

### 8.1 Configurar Multiidioma

```typescript
// En app/lib/i18n.ts ya está configurado

// Para añadir idioma nuevo:
// 1. Shopify Admin → Settings → Languages
// 2. Añade el idioma
// 3. Reinicia el servidor
```

### 8.2 Configurar SEO

```typescript
// Ya configurado en app/lib/seo.server.ts

// Personalizar:
export function seoPayload({
  title,
  description,
  image,
  url,
}: SeoConfig) {
  return {
    title,
    description,
    canonical: url,
    openGraph: {
      title,
      description,
      url,
      images: [image],
    },
  };
}
```

### 8.3 Analytics

```typescript
// En app/root.tsx

// Añadir Google Analytics:
<script
  async
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
/>

// Shopify Analytics ya está incluido
```

### 8.4 Configurar Cache

```typescript
// En app/data/cache.ts

export const CACHE_LONG = 'public, max-age=3600, s-maxage=86400'; // 1 día
export const CACHE_SHORT = 'public, max-age=60, s-maxage=300'; // 5 min
export const CACHE_NONE = 'no-cache, no-store, must-revalidate';
```

---

## 📊 PASO 9: Monitoreo y Optimización

### 9.1 Oxygen Metrics

```
Shopify Admin → Apps → Hydrogen
→ Storefronts → Tu storefront → Analytics
```

Métricas disponibles:
- Requests por segundo
- Response time
- Error rate
- Cache hit rate
- Geographic distribution

### 9.2 Web Vitals

```bash
# Usa Lighthouse
npx lighthouse http://localhost:3000

# O Chrome DevTools:
# F12 → Lighthouse → Analyze page load
```

Objetivos:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### 9.3 GraphQL Query Optimization

```bash
# Ver queries en desarrollo
npm run dev

# Check DevTools → Network → GraphQL requests
# Optimiza queries grandes
```

---

## 🐛 Troubleshooting Común

### Error: "Invalid Storefront API token"
```bash
# Verifica .env
PUBLIC_STOREFRONT_API_TOKEN="..."

# Regenera token en Shopify Admin
Apps → Tu app → API credentials → Regenerate
```

### Error: "CORS error"
```bash
# Verifica que el dominio esté permitido
Shopify Admin → Apps → Tu app
→ App setup → App URL
```

### Error: "Cannot find module"
```bash
# Reinstala dependencias
rm -rf node_modules package-lock.json
npm install
```

### Build falla
```bash
# Verifica TypeScript
npm run typecheck

# Fix errores
npm run codegen
```

### Hot reload no funciona
```bash
# Reinicia servidor
# Ctrl+C
npm run dev
```

---

## 📚 Estructura del Proyecto

```
Supermu_3_theme/
├── app/
│   ├── components/      # Componentes React
│   ├── routes/          # Rutas de Remix (páginas)
│   ├── sections/        # Secciones del CMS
│   ├── lib/             # Utilidades
│   ├── styles/          # CSS/Tailwind
│   ├── data/            # Queries GraphQL
│   ├── utils/           # Helper functions
│   ├── root.tsx         # Layout principal
│   └── entry.*.tsx      # Entry points
├── public/              # Assets estáticos
├── .env                 # Variables de entorno (NO subir a git)
├── .env.example         # Template de .env
├── package.json         # Dependencias
├── vite.config.ts       # Configuración Vite
├── tailwind.config.js   # Configuración Tailwind
├── tsconfig.json        # Configuración TypeScript
└── remix.config.js      # Configuración Remix
```

---

## ✅ Checklist de Configuración Completa

### Setup Inicial
- [ ] Node.js 20+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] `.env` creado y configurado
- [ ] Storefront API token obtenido
- [ ] Servidor local funcionando (`npm run dev`)

### CMS (Opcional pero Recomendado)
- [ ] Admin API token obtenido
- [ ] Metaobjects definitions creados
- [ ] Contenido de prueba poblado
- [ ] Puede editar desde Shopify Admin

### Customer Accounts (Opcional)
- [ ] ngrok configurado
- [ ] Customer Account API configurado
- [ ] `/account` funciona

### Producción
- [ ] Build exitoso (`npm run build`)
- [ ] Deploy a Oxygen completado
- [ ] Dominio custom configurado
- [ ] Variables de entorno en producción
- [ ] Analytics configurado

---

## 🎯 Próximos Pasos

1. **Personalizar diseño**: Edita componentes en `/app/components`
2. **Añadir páginas**: Crea rutas en `/app/routes`
3. **Configurar contenido**: Usa Metaobjects
4. **Optimizar**: Mejora queries GraphQL
5. **Testear**: E2E tests con Playwright

---

## 📖 Recursos Útiles

### Documentación Oficial
- [Hydrogen Docs](https://shopify.dev/docs/custom-storefronts/hydrogen)
- [Remix Docs](https://remix.run/docs)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)

### Este Proyecto
- [CONFIGURACION_CONTENIDO.md](./CONFIGURACION_CONTENIDO.md)
- [GUIA_RAPIDA_EDICION.md](./GUIA_RAPIDA_EDICION.md)
- [DECISION_HEADLESS_VS_TRADICIONAL.md](./DECISION_HEADLESS_VS_TRADICIONAL.md)

### Comunidad
- [Hydrogen Discord](https://discord.gg/shopifydevs)
- [Shopify Community](https://community.shopify.com/)

---

**Tiempo estimado de setup completo:** 2-4 horas  
**Última actualización:** Noviembre 2024
