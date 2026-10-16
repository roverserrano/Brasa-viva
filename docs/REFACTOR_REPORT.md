# Informe de refactorización integral — Brasa Viva

Fecha: 2026-10-15 · Alcance: `apps/web`, `apps/api`, `packages/contracts`, diseño y QA.
Ejecución guiada por `.agent/refactorizacion.md` (8 fases) y el ExecPlan
`docs/exec-plans/completed/2026-10-15-refactorizacion-integral.md`.

## Resumen

- Se refactorizó el frontend sin reconstruirlo y sin tocar contratos ni esquema:
  sistema de tokens CSS, accesibilidad, jerarquía, estados de carga/error, rendimiento LCP,
  deduplicación (moneda, etiquetas, managers) y QA completo en navegador.
- Backend: la resolución del precio efectivo quedó consolidada en un único punto de dominio
  (`resolve-effective-price.ts`), usada por productos y pedidos, sin cambiar respuestas.
- Una suite e2e que arrastraba 4 fallos desde el baseline quedó en **17/17 en verde**; los
  fallos eran defectos de los propios tests (localizadores y carreras), no de la aplicación.
- Consola del navegador en las 52 navegaciones auditadas: **15 avisos antes → 0 después**.
- Verificación final completa: lint, typecheck, 77 tests unitarios, build y e2e en verde.
- Entregables: `DESIGN.md`, ExecPlan, informe (este documento) y capturas antes/después en
  `docs/design-previews/refactor-qa/` (13 páginas × 375/430/768/1440 px).

## Verificación final

| Gate                                                  | Resultado                                                         |
| :---------------------------------------------------- | :---------------------------------------------------------------- |
| `pnpm lint`                                           | ✅ 5/5 paquetes, 0 warnings                                       |
| `pnpm typecheck`                                      | ✅ 5/5 paquetes                                                   |
| `pnpm test`                                           | ✅ 77 tests (contracts 10, api 33, web 34)                        |
| `pnpm build`                                          | ✅ 5/5 tareas                                                     |
| `pnpm test:e2e`                                       | ✅ 17/17 (25.6 s, Chromium headless)                              |
| Consola del navegador (52 navegaciones × 4 viewports) | ✅ 0 incidencias (antes: 15)                                      |
| Sin scroll horizontal en 375/430/768/1440             | ✅ verificado por e2e (`Executive workspace fits Npx`) y capturas |

Comandos reproducibles desde la raíz:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

## FASE 2 — Skills instaladas

`design-taste-frontend`, `redesign-existing-projects`, `image-to-code`, `web-design-guidelines`,
`awesome-design-md` y `playwright-cli` (global, Chromium headless 1243). Instaladas en
`.agents/skills/` (ruta compartida por OpenCode y Codex) con `SKILL.md` verificado.

## FASE 3 — Sistema de diseño (`DESIGN.md`)

Documento creado en la raíz con: identidad y atmósfera, tokens de color (brasa, crema, carbón,
cobre, admin ejecutivo, semánticos), tipografía y reglas editoriales, espaciado/radios/sombras,
componentes, estados obligatorios, accesibilidad, responsive, imágenes, copy y gobernanza.
Se documenta la identidad **realmente entregada** (crema editorial + admin verde; el hero oscuro
se conserva como "momento de fuego"). `docs/PUBLIC_DESIGN.md` describe un tema oscuro que nunca
se implementó; queda señalado como pendiente documental, no de código.

## FASE 4 — Refactor del frontend

### Tokens CSS

- `apps/web/app/tokens.css` es la única fuente de colores de marca (`--bv-*`), importada primero
  por `globals.css`; los tokens legacy (`--brand-*`, `--public-*`) pasan a ser alias.
- Las 5 hojas (public, home, checkout, executive, admin legacy) consumen el sistema. Las
  variaciones imperceptibles de rojo/crema se unificaron (ej. `#ac3023`/`#b91c1c` → `--bv-brasa`
  `#ae2b21`), validado con capturas antes/después.

### Accesibilidad

- Doble `<h1>` del dashboard eliminado (queda solo "Tu negocio, de un vistazo.").
- Anillo de foco de contraste alto (`--bv-focus`) en login/error/404/loading; nunca
  `outline: none` sin sustituto.
- Regiones `aria-live` corregidas: el estado del carrito ya no anida `role="status"` dentro de
  un enlace; `role="alert"` reservado a errores dinámicos reales.
- `scroll-margin-top` en anclas internas; `lang="es-BO"`; skip-link verificado en los 3 layouts.
- Ids administrativos derivados de labels con acentos: helper ya existente confirmado (NFD).

### Rendimiento (LCP)

Las 5 imágenes "above the fold" que LCP señalaba (home, producto, sucursales, nosotros) usan
`loading="eager"` + `fetchPriority="high"` (API de Next 16; `priority` está deprecado): 15 avisos
de consola → 0. `productSeo()` se computa una vez por render.

### Deduplicación y estructura

- `admin-managers.tsx` (1931 líneas) dividido en `features/admin/managers/{category,product,branch,promotion,order,user,settings}-manager.tsx` + `shared.tsx`, verificado línea por línea byte a byte contra el original (sin pérdida).
- `lib/format.ts`: `formatBs` (coma decimal, espacio duro U+00A0) y `formatCount` con tests;
  todo el dinero visible (catálogo, producto, promociones, carrito, checkout, admin) usa la
  misma función: se eliminó el formato con punto (`Bs 32.00`) que convivía con `Bs 32,00`.
- Etiquetas de tipo de pedido (`Recojo en sucursal`/`Delivery coordinado`) consolidadas en
  `packages/contracts` junto a `orderStatusLabels`, con test de cobertura del enum; días de la
  semana en `lib/business-hours.ts` (`weekdayLabels`).
- Cifras monetarias con `tabular-nums` en todo el sistema.

### Estados y detalle visual

- `error.tsx`, `not-found.tsx` y `menu/loading.tsx` dejaron Tailwind crudo y usan
  `system-pages.css` con la identidad Brasa Viva.
- Estado seleccionado del checkout (tipo de pedido): de rosa frío (`red-50`) al tinte cálido
  `--bv-brasa-tint` `#fbf1e8` con borde brasa.
- Verificación visual página a página en 4 resoluciones; el diseño entregado se preservó sin
  rediseño (objetivo explícito del encargo).

## FASE 5 — Backend

- `apps/api/src/modules/products/domain/resolve-effective-price.ts` pasa a ser el único punto
  de cálculo del precio efectivo (antes: lógica duplicada inline en `products.service.ts` y
  `orders.service.ts`; la función era código muerto). Comportamiento preservado, cubierto por
  los 33 tests de API (incluye specs e2e con supertest).
- Sin cambios de contrato, sin migraciones Prisma, sin cambios de esquema.

## FASE 6 — Auditoría Web Interface Guidelines

Auditoría contra las guías de vercel-labs (`web-interface-guidelines`) sobre las pantallas y
componentes principales. Hallazgos corregidos:

- `theme-color` declarado vía `viewport` (público `#faf5eb`, admin `#142e2a`).
- Estados `:active` en botones públicos y admin; `-webkit-tap-highlight-color` tintado en brasa.
- `data-scroll-behavior="smooth"` en `<html>` (Next 16) para scroll instantáneo en transiciones
  de ruta sin perder scroll suave en anclas.
- Placeholder de búsqueda con `…` tipográfico; select del menú con nombre accesible correcto.

Comprobado y ya conforme: skip-link presente en los 3 layouts, `touch-action: manipulation`,
safe-area insets en el dock móvil, sin `outline: none`, sin `transition: all`, sin
`<div onClick>`, confirmaciones destructivas con `window.confirm()`, autocompletar de
formularios completo, iconos decorativos `aria-hidden`.

## FASE 7 — QA en navegador (Playwright)

### Suite e2e: 4 fallos pre-existentes corregidos

La suite fallaba en 4 de sus 17 tests **desde el baseline** (verificado ejecutándola sobre el
commit `5a9bed4`). El diagnóstico en caliente y frío determinó que eran defectos de los tests:

1. `getByLabel(x, { exact: true })` sobre labels que envuelven un `<select>` nunca coincide:
   Playwright compara el texto del label incluyendo las opciones (`"OrdenarPor categoría…"`).
   El nombre accesible era correcto (`combobox "Ordenar"`). Corregido a
   `getByRole('combobox', { name })` en `Período`, `Sucursal` y `Ordenar`.
2. `getByRole('alert')` chocaba con el route-announcer de Next (`#__next-route-announcer__`,
   también `role="alert"`): violación de modo estricto. Filtrado por texto.
3. Clic en "Ver mi carrito" seguido de `page.reload()` inmediato: la recarga interrumpía la
   navegación SPA en curso y recargaba la página anterior. Corregido esperando la URL de destino.

Además, `data-scroll-behavior` eliminó el aviso de smooth-scroll en cada navegación.

### Capturas y consola

- `apps/web/scripts/capture-screenshots.mjs` captura 13 vistas (home, menú, producto,
  promociones, sucursales, detalle de sucursal, carrito, checkout, login, dashboard, pedidos,
  nosotros, contacto) × 4 viewports (375/430/768/1440) y recolecta errores de consola.
- Antes: 52 capturas + 15 avisos (LCP). Después: 52 capturas + 0 incidencias.
- Juegos completos versionados en `docs/design-previews/refactor-qa/before/` y `/after/`
  (incluye `console-issues.json` de ambos momentos).

## Pendientes documentados (fuera del alcance de esta refactorización)

- `docs/PUBLIC_DESIGN.md` describe un tema "Obsidian & Ember" nunca implementado; conviene
  actualizarlo o eliminarlo para evitar confusión (decisión del equipo).
- Paleta de los gráficos del dashboard (teal/ámbar/azul…) se conserva como paleta de
  visualización de datos deliberada, documentada en `DESIGN.md`.
- `audit_logs.request_id/client_ip` siguen sin escribirse; `ValidationPipe` con
  class-validator inerte en la API. Pre-existentes, requieren cambio de esquema/contrato.
- La suite e2e depende del fixture local (`e2e/catalog-server.ts`); no corre contra la API real.

## Rollback

Repositorio git local; commit baseline `5a9bed4` (estado pre-refactor con gates verdes).
Cada etapa está commiteada por separado (11 commits) para revertir de forma selectiva.
No hay remoto configurado.

## Addendum (2026-10-15) — Acceso administrativo alineado al executive

A petición posterior al cierre: coherencia corporativa del acceso con el workspace. Antes,
login y restablecimiento usaban la identidad pública (fondo rojo oscuro, tarjeta crema,
botón rojo) mientras el panel interior es verde executive; no parecían el mismo producto.

Cambios:

- Nuevos `app/admin-access.css` y `features/admin/admin-access-layout.tsx`: pantalla de dos
  paneles (marca verde con wordmark, mensaje y viñetas; tarjeta blanca con formulario) usada
  por `app/admin/login/page.tsx` y `app/admin/restablecer/page.tsx`. En <1024 px el panel de
  marca se compacta a franja superior.
- `theme-color` `#142e2a` en login y restablecimiento; `robots noindex` añadido al
  restablecimiento (antes heredaba el indexado público).
- Estado de verificación `admin-loading` restilizado al verde profundo con foco cobre.
- Tokens `--bv-brasa-dark` y `--bv-brasa-night` eliminados (sin uso tras el cambio);
  `DESIGN.md` documenta la pantalla y ya no lista los tokens obsoletos.
- Capturas regeneradas (56 imágenes × 4 viewports, incluye `admin-restablecer` como página
  nueva en `capture-screenshots.mjs`) y `console-issues.json` con 0 incidencias.

Verificación: lint y typecheck en verde (5/5), e2e 17/17. Nota: en una revisión intermedia
apareció un aviso de hidratación por `caret-color: transparent` en inputs; es un artefacto
de Playwright (oculta el caret con un estilo inline durante cada screenshot) que puede
coincidir con la hidratación inicial en dev. No reproducible en el set oficial ni en e2e;
no requiere cambio de producto.
