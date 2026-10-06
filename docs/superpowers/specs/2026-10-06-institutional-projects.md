# Proyectos Institucionales — diseño
Landing en `/pages/proyectos-institucionales` para Tienda Fitness, rama base `tienda`. Objetivo: convertir consultas de gimnasios, hoteles, empresas, instituciones y proyectos residenciales en conversaciones comerciales calificadas.

Diseño: tokens existentes (rojo primary, fondo blanco y slate, Poppins y cuerpo del sitio), hero fotográfico con CTA Solicitar asesoría, respaldo, introducción, sectores, proceso, galería del PDF, marcas, contacto y FAQ. Fotografías extraídas del PDF, sin asociarlas a clientes específicos. Cifras: más de 15 años, cobertura nacional; evitar prometer servicios gratuitos, financiación o resultados no respaldados. Contacto inicial: 310 818 3750 del PDF.

Edición: continuar usando `ciseco--route` y `Sections`. Agregar sección reutilizable `ciseco--section_institutional` con variante y campos simples, imágenes Shopify opcionales y elementos referenciados `ciseco--institutional_item`. Cada bloque se puede ordenar, quitar, mezclar con las secciones existentes y editar en Shopify. Contenido inicial incluido como fallback, desactivado cuando existe una ruta configurada, incluso si está vacía.

Contacto: formulario validado de nombre, entidad, email, teléfono, sector, ciudad, área opcional y objetivo. Consentimiento explícito y transición a WhatsApp (sin afirmar que el formulario se envió o almacenó). Canal editable. No enviar solicitudes reales en las pruebas.

Configuración: CLI idempotente con dry-run para crear las definiciones/entradas, ampliar la lista autorizada de secciones conservando validaciones existentes y crear la página de Shopify para sitemap. No sobrescribir ediciones existentes sin opción explícita.

Verificación: pruebas de resolver, enlaces seguros y mensaje; render real de componentes con React SSR, desktop y mobile en preview del repositorio, accesibilidad del formulario y ausencia de overflow. No fusionar directamente a tienda.
