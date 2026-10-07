# Proyectos Institucionales Implementation Plan
> For agentic workers: use superpowers:executing-plans to implement task-by-task.

**Goal:** Crear landing editable de proyectos institucionales con los contenidos del PDF.
**Architecture:** Ruta dedicada, secciones del builder y datos iniciales con imágenes del PDF. Configuración administrativa mediante CLI idempotente.
**Tech Stack:** Hydrogen, Remix, React, Tailwind, Shopify metaobjects, Node.
**Spec:** docs/superpowers/specs/2026-10-06-institutional-projects.md

## Global Constraints
- Rama base tienda; cambios aislados del paginador.
- Tokens de marca existentes y contenido comercial sustentado por el PDF.
- La edición existente nunca se reemplaza silenciosamente.
- Formulario abre WhatsApp, sin almacenamiento ni simulación de envío.

## Review Focus
- Ruta configurada vacía debe respetarse.
- URLs editoriales inseguras deben rechazarse.
- Contacto sin consentimiento no debe continuar.
- La definición del builder debe conservar sus tipos actuales.
- Textos largos y fotografía deben ajustarse en móvil.

## Task 1: Modelo y contenido
- [x] Crear pruebas de lectura de campos, fallback, URL y mensajes.
- [x] Implementar modelo y bundle de secciones iniciales.
- [x] Ejecutar pruebas y revisar cifras y fotografías.

## Task 2: UI y ruta
- [x] Implementar renderers de variantes y formulario accesible.
- [x] Registrar fragmento/tipo en Sections y cargar route-proyectos-institucionales.
- [x] Renderizar componentes reales para comprobar desktop y mobile.

## Task 3: Configuración y entrega
- [x] CLI dry-run, creación idempotente y extensión del builder.
- [x] Documentar campos, canales y uso del CLI.
- [x] Ejecutar tests, codegen, lint, typecheck y revisión independiente.
- [x] Preparar rama y PR hacia tienda con cambios de esta landing únicamente.
