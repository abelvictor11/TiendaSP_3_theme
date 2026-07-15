# Credit Calculator - Configuración en Shopify

## Crear Metaobject Definition

1. Ve a **Shopify Admin > Settings > Custom data > Metaobjects**
2. Click **Add definition**
3. Configura:
   - **Name:** `Credit Calculator Config`
   - **Type:** `ciseco--credit_calculator`
   - **Access:** Storefronts (public read)

4. Agrega estos campos:

| Field Key | Field Name | Type |
|-----------|------------|------|
| `enabled` | Enabled | Boolean |
| `title` | Title | Single line text |
| `monthly_label` | Monthly Label | Single line text |
| `installments_label` | Installments Label | Single line text |
| `partners_title` | Partners Title | Single line text |
| `installment_options` | Installment Options | JSON |
| `partners` | Partners | JSON |
| `benefits` | Benefits | JSON |

5. Click **Save**

## Crear Entry con valores

1. Click **Add entry**
2. Llena los campos:

- **Enabled:** `true`
- **Title:** `Opciones de financiación`
- **Monthly Label:** `Cuota mensual`
- **Installments Label:** `Pagar en`
- **Partners Title:** `Métodos de crédito disponibles`

- **Installment Options (JSON):**
```json
[3, 6, 12, 24]
```

- **Partners (JSON):**
```json
[
  {
    "name": "Addi",
    "logoUrl": "https://cdn.shopify.com/s/files/1/xxxx/addi-logo.png",
    "badge": "0% Interés",
    "link": "https://addi.com"
  },
  {
    "name": "Mercado Pago",
    "logoUrl": "https://cdn.shopify.com/s/files/1/xxxx/mercadopago-logo.png",
    "badge": "0% Interés",
    "link": "https://mercadopago.com"
  },
  {
    "name": "Sistecrédito",
    "logoUrl": "https://cdn.shopify.com/s/files/1/xxxx/sistecredito-logo.png",
    "badge": "0% Interés",
    "link": "https://sistecredito.com"
  }
]
```

- **Benefits (JSON):**
```json
[
  {
    "text": "Paga hasta en 24 meses con Addi, Mercado Pago y Sistecrédito."
  },
  {
    "text": "Si no quieres usar estas opciones,",
    "highlightText": "¡no te preocupes!",
    "linkText": "Contacta a un asesor",
    "linkUrl": "/pages/contacto"
  },
  {
    "text": "Además, si tienes una bicicleta usada, pregunta por nuestro plan de retoma.",
    "linkText": "Términos y condiciones",
    "linkUrl": "/pages/terminos"
  }
]
```

3. Click **Save**

## Notas

- Los logos deben subirse a **Settings > Files** y usar la URL generada
- El componente usa valores por defecto si no encuentra la configuración
- Puedes deshabilitar el módulo cambiando `enabled` a `false`
