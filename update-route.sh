#!/bin/bash

STORE_DOMAIN="shop-sportfitness.myshopify.com"
ACCESS_TOKEN="${SHOPIFY_ADMIN_TOKEN}"
API_URL="https://${STORE_DOMAIN}/admin/api/2025-07/graphql.json"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: SHOPIFY_ADMIN_TOKEN environment variable is not set"
  echo "Usage: SHOPIFY_ADMIN_TOKEN=token ./update-route.sh"
  exit 1
fi

echo "🔄 Actualizando Route para incluir las nuevas secciones..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $ACCESS_TOKEN" \
  -d @- << 'EOF'
{
  "query": "mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) { metaobjectDefinitionUpdate(id: $id, definition: $definition) { metaobjectDefinition { id type name } userErrors { field message } } }",
  "variables": {
    "id": "gid://shopify/MetaobjectDefinition/11263213645",
    "definition": {
      "fieldDefinitions": [
        {
          "update": {
            "key": "sections",
            "validations": [
              {
                "name": "metaobject_definition_ids",
                "value": "[\"gid://shopify/MetaobjectDefinition/11262820429\",\"gid://shopify/MetaobjectDefinition/11262853197\",\"gid://shopify/MetaobjectDefinition/11262918733\",\"gid://shopify/MetaobjectDefinition/11262951501\",\"gid://shopify/MetaobjectDefinition/11262984269\",\"gid://shopify/MetaobjectDefinition/11263049805\",\"gid://shopify/MetaobjectDefinition/11263082573\",\"gid://shopify/MetaobjectDefinition/11263115341\",\"gid://shopify/MetaobjectDefinition/11263148109\",\"gid://shopify/MetaobjectDefinition/11263180877\",\"gid://shopify/MetaobjectDefinition/11265507405\",\"gid://shopify/MetaobjectDefinition/11736678477\",\"gid://shopify/MetaobjectDefinition/11736711245\"]"
              }
            ]
          }
        }
      ]
    }
  }
}
EOF

echo ""
echo "✅ Route actualizado exitosamente!"
echo ""
echo "Las secciones ProductFeature y ProductShowcase ahora están disponibles en el selector de secciones."
