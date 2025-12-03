#!/bin/bash

STORE_DOMAIN="shop-sportfitness.myshopify.com"
ACCESS_TOKEN="${SHOPIFY_ADMIN_TOKEN}"  # Set this environment variable before running
API_URL="https://${STORE_DOMAIN}/admin/api/2025-07/graphql.json"

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: SHOPIFY_ADMIN_TOKEN environment variable is not set"
  echo "Usage: SHOPIFY_ADMIN_TOKEN=your_token ./create-metaobjects-simple.sh"
  exit 1
fi

echo "🚀 Creando Section | ProductFeature..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $ACCESS_TOKEN" \
  -d @- << 'EOF'
{
  "query": "mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id type name } userErrors { field message } } }",
  "variables": {
    "definition": {
      "name": "Section | ProductFeature",
      "type": "ciseco--section_product_feature",
      "description": "A 50/50 section with product image and content card",
      "displayNameKey": "title",
      "capabilities": {
        "translatable": {
          "enabled": true
        },
        "publishable": {
          "enabled": true
        }
      },
      "fieldDefinitions": [
        {
          "key": "title",
          "name": "title",
          "type": "single_line_text_field"
        },
        {
          "key": "heading",
          "name": "heading",
          "type": "single_line_text_field"
        },
        {
          "key": "description",
          "name": "description",
          "type": "multi_line_text_field"
        },
        {
          "key": "cta_text",
          "name": "CTA Text",
          "type": "single_line_text_field"
        },
        {
          "key": "cta_link",
          "name": "CTA Link",
          "type": "single_line_text_field"
        },
        {
          "key": "product",
          "name": "product",
          "type": "product_reference"
        },
        {
          "key": "collection",
          "name": "collection",
          "type": "collection_reference"
        },
        {
          "key": "background_color",
          "name": "Background Color",
          "type": "color"
        },
        {
          "key": "text_color",
          "name": "Text Color",
          "type": "color"
        },
        {
          "key": "button_background_color",
          "name": "Button Background Color",
          "type": "color"
        },
        {
          "key": "button_text_color",
          "name": "Button Text Color",
          "type": "color"
        },
        {
          "key": "image_position",
          "name": "Image Position",
          "type": "single_line_text_field",
          "description": "Enter left or right"
        }
      ]
    }
  }
}
EOF

echo ""
echo ""
echo "🚀 Creando Section | ProductShowcase..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Access-Token: $ACCESS_TOKEN" \
  -d @- << 'EOF'
{
  "query": "mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id type name } userErrors { field message } } }",
  "variables": {
    "definition": {
      "name": "Section | ProductShowcase",
      "type": "ciseco--section_product_showcase",
      "description": "A full-width section with background image and product cards",
      "displayNameKey": "title",
      "capabilities": {
        "translatable": {
          "enabled": true
        },
        "publishable": {
          "enabled": true
        }
      },
      "fieldDefinitions": [
        {
          "key": "title",
          "name": "title",
          "type": "single_line_text_field"
        },
        {
          "key": "badge_text",
          "name": "Badge Text",
          "type": "single_line_text_field"
        },
        {
          "key": "heading",
          "name": "heading",
          "type": "single_line_text_field"
        },
        {
          "key": "subheading",
          "name": "subheading",
          "type": "single_line_text_field"
        },
        {
          "key": "description",
          "name": "description",
          "type": "multi_line_text_field"
        },
        {
          "key": "icon_svg",
          "name": "Icon SVG",
          "type": "multi_line_text_field"
        },
        {
          "key": "background_image",
          "name": "Background Image",
          "type": "file_reference",
          "validations": [
            {
              "name": "file_type_options",
              "value": "[\"Image\"]"
            }
          ]
        },
        {
          "key": "content_background_color",
          "name": "Content Background Color",
          "type": "color"
        },
        {
          "key": "text_color",
          "name": "Text Color",
          "type": "color"
        },
        {
          "key": "products",
          "name": "products",
          "type": "list.product_reference"
        },
        {
          "key": "collection",
          "name": "collection",
          "type": "collection_reference"
        },
        {
          "key": "card_background_color",
          "name": "Card Background Color",
          "type": "color"
        },
        {
          "key": "card_text_color",
          "name": "Card Text Color",
          "type": "color"
        },
        {
          "key": "button_text",
          "name": "Button Text",
          "type": "single_line_text_field"
        }
      ]
    }
  }
}
EOF

echo ""
echo ""
echo "✅ Proceso completado!"
