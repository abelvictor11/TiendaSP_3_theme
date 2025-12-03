#!/bin/bash

STORE_DOMAIN="shop-sportfitness.myshopify.com"
ACCESS_TOKEN="${SHOPIFY_ADMIN_TOKEN}"
API_URL="https://${STORE_DOMAIN}/admin/api/2025-07/graphql.json"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: SHOPIFY_ADMIN_TOKEN environment variable is not set"
  echo "Usage: SHOPIFY_ADMIN_TOKEN=token ./update-route-definition.sh"
  exit 1
fi

echo "🔍 Buscando el ID de la definición de Route..."

# Primero, obtener el ID de la definición de Route
ROUTE_QUERY=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $ACCESS_TOKEN" \
  -d '{
    "query": "{ metaobjectDefinitions(first: 50) { edges { node { id type name } } } }"
  }')

echo "$ROUTE_QUERY" | grep -o '"id":"gid://shopify/MetaobjectDefinition/[0-9]*","type":"ciseco--route"' || echo "No se encontró Route"

echo ""
echo "🔍 Buscando IDs de las nuevas secciones..."

# Obtener IDs de ProductFeature y ProductShowcase
SECTION_IDS=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $ACCESS_TOKEN" \
  -d '{
    "query": "{ metaobjectDefinitions(first: 50) { edges { node { id type name } } } }"
  }')

echo "$SECTION_IDS" | grep "ciseco--section_product"

echo ""
echo "📝 Por favor copia los IDs mostrados arriba y actualiza manualmente el Route en Shopify Admin"
echo ""
echo "Ve a: https://shop-sportfitness.myshopify.com/admin/settings/custom_data/metaobjects/ciseco--route"
echo "Edita la definición y agrega los dos nuevos IDs al campo 'sections' validations"
