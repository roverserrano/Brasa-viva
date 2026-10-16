# Recorrido comercial y calidad del storefront

## Resultado esperado

Una experiencia coherente entre menú, ficha, carrito y pedido, con filtros recuperables,
controles accesibles y fichas indexables basadas exclusivamente en el catálogo real.

## Contexto y diagnóstico

La arquitectura Next.js → NestJS → Prisma está consolidada. Las imágenes WebP y la identidad
crema/carbón/rojo ya existen. El checkout mantiene un lenguaje visual anterior. Los filtros
solo viven en memoria, la ficha tiene título genérico y el enlace de salto precede al header.
El menú consulta datos independientes de manera secuencial.

## Alcance

UI pública, navegación del catálogo, accesibilidad, metadatos, pruebas y documentación.
No incluye administración, cambios de esquema, migraciones, pagos ni nuevas dependencias.

## Invariantes

Precios finales, servicios y permisos siguen siendo autoridad de NestJS. El pedido se guarda
antes de WhatsApp. No se publican precios, testimonios ni disponibilidad inventados.

## Diseño

Reutilizar tokens, fotos, iconos y componentes existentes. URL como estado del catálogo.
Componentes compartidos para productos y pasos de compra. SEO con datos reales y JSON seguro.
Consulta concurrente de datos independientes. No cambiar arquitectura ni contratos.

## Cambios de datos / API

Ninguno. Se reutilizan los endpoints públicos existentes.

## Plan priorizado

1. Documentar diagnóstico y Skills; conservar identidad y tecnología.
2. Mejorar filtros, navegación y accesibilidad del catálogo.
3. Unificar carrito/checkout y guiar la compra sin cuenta.
4. Completar SEO de producto y optimizaciones de carga comprobables.
5. Ejecutar lint, tipos, unitarias, build y E2E; inspeccionar render responsive.

## Criterios de aceptación

- [x] Filtros y orden implementados en URL, incluida navegación a ficha y regreso; E2E pendiente.
- [x] Identidad coherente, pasos de compra, objetivos táctiles y campos identificados.
- [x] Metadatos de producto reales; carrito/pedido no indexables.
- [x] Verificaciones ejecutadas y limitaciones registradas sin métricas inventadas.
- [ ] Build y E2E satisfactorios fuera del sandbox; QA integrado con backend de staging.

## Pruebas

Unitarias de navegación/orden/serialización; E2E de filtros y compra existente.
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.
QA estática con Chrome cuando no sea posible abrir un servidor local.

## Riesgos y rollback

URL y estado de React pueden divergir: usar searchParams como fuente y probar recarga/regreso.
Estilos globales pueden afectar admin: limitar selectores al storefront/checkout.
Revertir componentes/estilos/documentación de este plan; no hay operaciones de datos.

## Progreso

- [x] Inspección de arquitectura, documentación, componentes y Skills web.
- [x] Diagnóstico y prioridades comunicados antes de modificar código.
- [x] Implementación incremental.
- [x] Lint, TypeScript y 71 pruebas unitarias; revisión estática de 20 combinaciones página/viewport.
- [x] Documentación de entrega y capturas en `docs/STOREFRONT_REVIEW.md`.
- [ ] Validación integral de navegación, pedidos y build en entorno con sockets habilitados.

## Decisiones

- 2026-10-09: Elegant Futuristic Landing se adapta a una marca gastronómica cálida;
  no se introducen estética SaaS, fuentes remotas ni librerías de animación.
- 2026-10-12: La validación local del cliente reutiliza el contrato del backend. Los errores
  de teléfono y límites se muestran junto al campo, sin sustituir las validaciones NestJS.

## Descubrimientos

El sandbox rechaza `listen` con EPERM. No hay servidor local accesible ni datos de campo.
Una revisión estática no acredita resultados Lighthouse, Core Web Vitals ni conversión.
Chrome CLI puede imponer ancho mínimo de 500 px: la revisión móvil se hizo en iframes
`srcdoc` comprobados a 375 y 430 px, además de tablet/escritorio. Se corrigió el ancho
del botón Quitar (41 → 44 px). Webpack tampoco completó el build: fallo leyendo `tsc --showConfig`.

## Resultado final

Implementación entregada con filtros recuperables, orden por precio, componentes reutilizables,
checkout coherente/accesible, SEO de producto y sección de sucursales en inicio. Sin cambios de
API/esquema ni dependencias. El plan permanece activo exclusivamente por build, E2E y QA integrado
pendientes. Diagnóstico, Skills, resultados y procedimiento en `docs/STOREFRONT_REVIEW.md`.
