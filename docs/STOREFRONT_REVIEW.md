# Revisión del storefront — 9 a 12 de octubre de 2026

## Diagnóstico previo y prioridades

Se inspeccionaron AGENTS, arquitectura, producto, dominio, frontend, backend, datos, seguridad,
calidad y componentes existentes antes de modificar código. El proyecto mantiene Next.js 16,
React, TypeScript, Tailwind, Zustand, NestJS y Prisma 7. Los contratos están centralizados y
el servidor conserva la autoridad sobre importes, disponibilidad, permisos y pedidos.

| Prioridad | Hallazgo                                                            | Mejora implementada                                                                                |
| --------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Alta      | El carrito y la confirmación conservaban otra identidad visual      | Tokens públicos, tipografía editorial, tarjetas, resumen contrastado y pasos de compra compartidos |
| Alta      | Los filtros se perdían al recargar y no se podía ordenar por precio | Búsqueda, categoría y orden en URL; limpieza de filtros y regreso desde ficha                      |
| Alta      | El enlace de salto precedía a la navegación                         | Destino enfocable después del header; destino equivalente en checkout y administración             |
| Alta      | Controles indistinguibles y teléfono validado solo por longitud     | Nombre de producto en botones, controles de 44 px, validación del contrato y errores por campo     |
| Media     | Ficha con título genérico y sin datos estructurados                 | Metadata por producto/sucursal, canonical, OpenGraph y JSON-LD escapado                            |
| Media     | Consultas independientes del menú ejecutadas secuencialmente        | Consultas concurrentes con recuperación parcial; selector usable si falla una sucursal             |
| Media     | Inicio requería otra página para elegir sucursal                    | Sección con sucursales reales y acceso directo al menú, cargada bajo Suspense                      |

El diagnóstico y el plan se presentaron antes de los cambios. No se reemplazó el proyecto,
no se añadieron dependencias y no hubo migraciones ni operaciones sobre datos remotos.

## Skills disponibles y selección

El catálogo de la sesión incluye 31 Skills. Se leyeron los `SKILL.md` de las nueve pertinentes
y sus referencias necesarias; se aplicaron al código existente, respetando las instrucciones
del proyecto por encima de sugerencias genéricas de herramientas o arquitectura.

| Skill aplicada               | Aplicación concreta                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `elegant-futuristic-landing` | Jerarquía editorial, espacio, color cálido y componentes coherentes; sofisticación adaptada al restaurante                |
| `storefront-best-practices`  | Recorrido sucursal → catálogo → carrito → pedido, imágenes reales del catálogo, contratos y accesibilidad de compra       |
| `ecommerce-landing-page`     | Copy que explica oferta y ubicación; acceso al menú de cada sucursal; CTA y compra sin cuenta                             |
| `accessibility`              | Salto de navegación, foco de confirmación, nombres de controles, autocompletado y objetivos táctiles                      |
| `seo`                        | Metadata y datos estructurados reales; canonical sin filtros; noindex en carrito y pedido                                 |
| `performance`                | Consultas concurrentes y reutilización de la consulta de ficha entre página y metadata                                    |
| `core-web-vitals`            | Priorización de foto principal, conservación de dimensiones y WebP; separación explícita entre inspección y medición real |
| `best-practices`             | Contratos compartidos para validación, escape de JSON-LD y preservación de límites entre frontend/backend                 |
| `web-quality-audit`          | Diagnóstico por evidencia, pruebas y registro de limitaciones sin inventar puntuaciones                                   |

Referencias consultadas: guía de diseño de Elegant; diseño, navegación, hero, footer, home,
listado, ficha, carrito, checkout, conexión a backend, SEO y responsive de Storefront;
medición de Performance; datos estructurados de SEO; seguridad de Best Practices.

Las otras 22 Skills están disponibles pero no se aplicaron:

- Recursos auxiliares sin necesidad en esta tarea: `imagegen` (se reutilizaron fotos existentes),
  `find-skills`, `skill-creator`, `skill-installer`, `openai-docs`, `plugin-management:plugin-management`,
  `sites:sites` (el sitio existente es Next.js), `visualize:visualize`.
- Documentos/presentaciones: `documents:documents`, `pdf:pdf`, `presentations:Presentations`,
  `template-creator:template-creator`.
- Google Drive: `google-drive:google-docs`, `google-drive:google-drive`,
  `google-drive:google-drive-comments`, `google-drive:google-sheets`, `google-drive:google-slides`.
- Hojas de cálculo: `spreadsheets:Spreadsheets`, `spreadsheets:excel-live-control`.
- Mascotas: `work-pets:create-pet`, `work-pets:pets`, `work-pets:update-pet`.

## Cambios y límites de comportamiento

- `MenuCatalog` deriva sus filtros de `searchParams`; History actualiza la URL sin consultar
  nuevamente el catálogo en cada tecla. Precio ordena numéricamente todos los resultados;
  el orden por categoría conserva el orden suministrado por el servidor.
- `ProductCard`, `BranchPicker` y `PurchaseSteps` separan presentación reutilizable de selección.
- El carrito mantiene la sucursal en enlaces de regreso, anuncia subtotal y cantidad, y conserva
  las confirmaciones para vaciar/cambiar de sucursal.
- El formulario autocompleta nombre, teléfono y dirección, muestra errores junto al campo y
  reutiliza `createOrderRequestSchema.shape.customer`. NestJS sigue revalidando todo.
- Solo una respuesta de creación satisfactoria vacía el carrito y ofrece WhatsApp. El foco pasa
  al encabezado del pedido registrado. No se añadieron pagos ni cuentas de cliente.
- La ficha usa `cache` de React dentro de la petición; no introduce caché persistente de precios.
  JSON-LD incluye precio BOB y disponibilidad del catálogo. Sin `NEXT_PUBLIC_SITE_URL` válido
  no se inventa un dominio público. No se inventan valoraciones ni fotografías.

La integración usa los métodos locales existentes `getBranches`, `getBranchMenu`,
`getBranchProduct` y `getBranchDetail`, contrastados con contratos y rutas NestJS.
La serialización segura sigue la [guía JSON-LD de Next.js](https://nextjs.org/docs/app/guides/json-ld).
Los datos de producto se contrastaron con la [documentación de Google](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).
Su inclusión no garantiza resultados enriquecidos ni una mejora de ranking.

## Evidencia de validación

| Verificación                             | Resultado                                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`                              | Pasa                                                                                                                |
| `pnpm typecheck`                         | Pasa                                                                                                                |
| `pnpm test`                              | 71 pasan: 31 API, 31 web, 9 contratos; tareas no afectadas pueden reutilizar caché Turbo                            |
| `pnpm build`                             | Backend/paquetes pasan; Next/Turbopack falla al intentar abrir un puerto para procesar CSS: Operation not permitted |
| `pnpm test:e2e`                          | Falla: seis pruebas HTTP de API no pueden escuchar en 127.0.0.1; no constituye fallo funcional demostrado           |
| `pnpm --filter @brasa-viva/web test:e2e` | Fixture bloqueado por `listen EPERM` en 4101; escenarios no ejecutados                                              |
| Playwright `--list`                      | 17 escenarios descubiertos, incluyendo navegación, filtros/recarga, recuperación de sucursal, compra y admin        |
| Diagnóstico `next build --webpack`       | Tampoco completa: Could not parse output from TypeScript's --showConfig; no se cambió el bundler del proyecto       |

Se renderizaron componentes reales con React SSR y CSS compilado, usando exclusivamente fixtures
aislados en `/tmp`. Chrome inspeccionó cinco páginas (inicio, menú, ficha, carrito y pedido)
a 375, 430, 768 y 1440 px: sin desbordamiento horizontal, un h1 por página y controles
button/input/select/textarea visibles de al menos 44 × 44 px en esos estados.
Para medidas móviles se usaron iframes `srcdoc` de anchura comprobada: Chrome CLI sin emulación
puede imponer un mínimo de 500 px pese al argumento `--window-size`.

Esta revisión estática **no prueba hidratación, servicios de sucursal después de useEffect,
teclado real, lector de pantalla, requests de pedidos ni integración con Supabase**.
No se midieron Lighthouse, Core Web Vitals, métricas de campo ni conversión comercial.

Capturas de QA con datos ficticios (no sucursales ni precios publicados):
[carrito móvil](design-previews/storefront-cart-mobile.webp),
[formulario móvil](design-previews/storefront-order-mobile.webp),
[menú escritorio](design-previews/storefront-menu-desktop.webp) y
[componente de sucursales](design-previews/storefront-home-branches.webp).
El formulario estático no ejecuta su consulta de servicios y mantiene el envío deshabilitado.

## Pendiente antes de publicar

1. Ejecutar `pnpm build` y `pnpm test:e2e` fuera del sandbox; corregir cualquier fallo funcional.
2. Probar checkout con backend de staging: precios cambiados, producto desactivado, rechazo y reintento,
   dirección requerida, persistencia del pedido y continuación por WhatsApp.
3. Revisar teclado, lector de pantalla, zoom 200%, Safari y teléfono real; comprobar foco y barra móvil.
4. Configurar dominio público real y validar metadata/JSON-LD con las fotos y sucursales del negocio.
5. Medir rendimiento en build de producción y un dispositivo/red representativos.

El ExecPlan permanece activo por estas verificaciones externas pendientes. La implementación
no se presenta como un lanzamiento validado.
