# iDeum Hydrogen Headless Theme

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **full-featured setup** of components, queries and tooling to get started with Hydrogen. It is deployed at [hydrogen.shop](https://hydrogen.shop)

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## 🎨 Content Management System

This theme includes a **Shopify Metaobjects-based CMS** that allows content editing without touching code.

### ✅ What you can edit from Shopify Admin:
- Banners and hero sections
- Product sliders
- Collection carousels
- Testimonials
- Blog sections
- Image + text blocks
- And more...

### 📚 Documentation:
- **[CONFIGURACION_CONTENIDO.md](./CONFIGURACION_CONTENIDO.md)** - Complete setup guide (Spanish)
- **[GUIA_RAPIDA_EDICION.md](./GUIA_RAPIDA_EDICION.md)** - Quick start guide for editors (Spanish)

### 🚀 Quick Setup:
1. Create Admin API token (with `write_metaobjects` permission)
2. Visit: `http://localhost:3000/cisecoInitCreateMetaobjectDefinitions`
3. Paste your store domain and token
4. Click "Create All Metaobject Definitions"
5. Done! Edit content from: `Shopify Admin → Settings → Custom data → Metaobjects`


## What's included

- Remix
- Hydrogen
- Oxygen
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Tailwind CSS (via PostCSS)
- Full-featured setup of components and routes
- **Metaobjects-based CMS for content management**

## Getting started

**Requirements:**

- Node.js version 18.0.0 or higher

```bash
npm create @shopify/hydrogen@latest -- --template demo-store
```

Remember to update `.env` with your shop's domain and Storefront API token!

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```

## Setup for using Customer Account API (`/account` section)

### Setup public domain using ngrok

1. Setup a [ngrok](https://ngrok.com/) account and add a permanent domain (ie. `https://<your-ngrok-domain>.app`).
1. Install the [ngrok CLI](https://ngrok.com/download) to use in terminal
1. Start ngrok using `ngrok http --domain=<your-ngrok-domain>.app 3000`

### Include public domain in Customer Account API settings

1. Go to your Shopify admin => `Hydrogen` or `Headless` app/channel => Customer Account API => Application setup
1. Edit `Callback URI(s)` to include `https://<your-ngrok-domain>.app/account/authorize`
1. Edit `Javascript origin(s)` to include your public domain `https://<your-ngrok-domain>.app` or keep it blank
1. Edit `Logout URI` to include your public domain `https://<your-ngrok-domain>.app` or keep it blank
