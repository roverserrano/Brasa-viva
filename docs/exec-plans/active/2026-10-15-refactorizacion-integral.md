# Refactorización integral — Brasa Viva

## Resultado esperado

Brasa Viva queda refactorizado de forma verificable sin reconstruir el proyecto ni cambiar su
arquitectura:

- `DESIGN.md` en la raíz: sistema de diseño Brasa Viva (tokens, tipografía, color semántico,
  espaciado, componentes, estados, responsive, accesibilidad) que unifica los 5 subsistemas CSS
  actuales sin romper la identidad crema/rojo brasa/carbón/cobre.
- Frontend con tokens centralizados, problemas de accesibilidad corregidos, código duplicado
  reducido (formatos de moneda/labels/paginación), `admin-managers.tsx` dividido por dominio y
  estados de carga/error/vacío consistentes.
- Backend con sus invariantes intactos y verificados por tests; se consolida la resolución de
  precio efectivo en un único punto y se elimina código muerto.
- Verificación completa: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`
  en verde, más capturas de navegador antes/después en 375/430/768/1440 px.
- Skills de diseño/QA instaladas y verificadas, con informe final de hallazgos corregidos y
  pendientes.

## Contexto

El proyecto es un monorepo pnpm + Turborepo (`apps/web` Next.js 16, `apps/api` NestJS 11,
`packages/contracts`, Prisma 7 + PostgreSQL local). Estado de partida verificado el 2026-10-15:

- Baseline verde: lint, typecheck, 71 tests unitarios y build de las 5 tareas pasan.
- El usuario encargó una refactorización integral descrita en `.agent/refactorizacion.md`
  (8 fases) con criterios de calidad, a11y, rendimiento y QA en navegador.
- Deuda detectada en la auditoría inicial:
  - CSS: 5 hojas (public, home, checkout, globals-admin legacy, executive) sin tokens
    compartidos; >60 hex de rojo/crema duplicados con variaciones; bloque de redeclaraciones al
    final de `public.css`.
  - `features/admin/admin-managers.tsx` con 1931 líneas y 7 managers.
  - Duplicación: `Intl.NumberFormat`, labels de tipo de pedido/servicios, días de semana,
    5 filtros de búsqueda, paginación duplicada.
  - A11y: doble `<h1>` en dashboard, focus amarillo de bajo contraste en login/error/404/loading,
    ids derivados de labels con acentos, `role="status"` anidado dentro de enlaces,
    `role="alert"` en estados vacíos estáticos.
  - Estados faltantes: `error.tsx`/`not-found.tsx`/`menu/loading.tsx` con Tailwind crudo fuera
    del sistema visual.
  - API: `resolve-effective-price.ts` es código muerto (lógica duplicada inline en
    `products.service.ts` y `orders.service.ts`); `audit_logs.requestId/clientIp` nunca se
    escriben; `ValidationPipe` con class-validator inerte (se conserva, documentado).
- No existe repositorio git funcional; se creó uno local con commit inicial `5a9bed4` (estado
  pre-refactor) como red de seguridad de rollback.

## Alcance

1. Instalar y verificar skills de diseño/QA (taste-skill, redesign, image-to-code,
   web-design-guidelines, awesome-design-md, playwright-cli) para Codex/OpenCode.
2. Crear `DESIGN.md` (sistema de diseño Brasa Viva) a partir de la identidad ya entregada.
3. Centralizar tokens CSS y aplicarlos en frontend público, checkout y admin.
4. Corregir hallazgos de accesibilidad, jerarquía y foco detectados en la auditoría.
5. Reducir duplicación (formato de moneda, labels, iconos, paginación, filtros) y dividir
   `admin-managers.tsx` por dominio.
6. Mejorar estados de carga/error/vacío visualmente consistentes.
7. Consolidar precio efectivo en el dominio del backend y otros ajustes internos sin cambiar
   contratos ni esquema.
8. QA en navegador real a 375/430/768/1440, capturas antes/después, consola verificada.
9. Documentación: ExecPlan, `DESIGN.md`, informe final en `docs/`.

## Fuera de alcance

- Migraciones de base de datos, cambios de esquema o datos.
- Cambios de contratos públicos de API (`/api/v1`) o de shapes de `packages/contracts`.
- Cambios de arquitectura (stack, topología, carpetas de dominio).
- Features nuevas del roadmap (pagos, fidelización, Redis, etc.).
- Actualización de dependencias major (Next, Nest, Prisma, Tailwind, React).
- Reescritura total del diseño visual: la refactorización respeta la identidad y las previews
  ya aprobadas en `docs/design-previews/`.

## Invariantes

De `AGENTS.md`, `ARCHITECTURE.md` y `docs/DOMAIN_RULES.md`:

- Producto ↔ sucursal N:M vía `branch_products`; nunca `products.branch_id`.
- Los precios definitivos se calculan y revalidan en NestJS; el frontend nunca es autoridad.
- El pedido + items se persisten antes de generar el enlace de WhatsApp.
- Precios históricos de pedidos inmutables (snapshots en `order_items`).
- Autorización administrativa verificada en backend (guards + `admin-policy`).
- Auditoría en `audit_logs` y soft delete por flags se conservan.
- Dinero con `Decimal`; redondeo explícito; sin floats.
- Identificador humano `BV-000142` intacto.
- No abrir WhatsApp sin pedido persistido (201).
- Next.js no accede directamente a PostgreSQL.
- Copy visible en español; código en inglés; TypeScript strict; sin `any`.

## Diseño

### Sistema de diseño (FASE 3)

`DESIGN.md` documenta dos contextos con una base común:

- **Marca pública**: base crema (`#faf5eb`), rojo brasa (`#ac3023` / `#b91c1c` unificados),
  carbón (`#1c1917`) y cobre (`#edac7d`), serif editorial (Georgia) para display + sans
  (Arial/Helvetica) para UI, fotografía protagonista, radios y sombras actuales.
- **Admin ejecutivo**: identidad verde profunda ya entregada (`#173e33`, `#167461`) sobre
  superficies claras, misma tipografía y escala de espaciado/estados.

Tokens: se implementarán como variables CSS en un único archivo (`apps/web/app/tokens.css`)
importado primero por `globals.css`, con alias semánticos; las hojas existentes pasarán a
consumirlos de forma gradual, validando visualmente con capturas.

### Refactor de código

- `apps/web/lib/format.ts`: formateo de moneda/fechas compartido (+tests).
- `apps/web/features/admin/managers/`: división de `admin-managers.tsx` por entidad con helpers
  compartidos (búsqueda, paginación, notices).
- `apps/web/components/site/error-state.tsx` y similares: estados reutilizables.
- Ajustes a11y puntuales según auditoría (una entrada por hallazgo).
- `apps/api`: `products.service` y `orders.service` consumen `resolve-effective-price.ts`
  (behavior-preserving, ya cubierto por tests existentes).

## Cambios de datos

Ninguno. Sin migraciones Prisma.

## API / contratos

Sin cambios de contrato. Solo refactor interno behavior-preserving:
`resolveEffectivePrice` pasa a ser usado por producción en lugar de lógica duplicada.

## Plan de implementación

Cada paso produce un estado verificable (lint/typecheck/test/build o captura):

1. **Baseline y red de seguridad** — verificado: gates en verde + commit inicial `5a9bed4`.
2. **Skills** — instaladas y verificadas en `.agents/skills/` para Codex/OpenCode:
   design-taste-frontend, redesign-existing-projects, image-to-code, web-design-guidelines,
   awesome-design-md, playwright-cli. `playwright-cli` global con chrome detectado.
3. **Capturas "antes"** — script `apps/web/scripts/capture-screenshots.mjs` con el fixture e2e
   (catálogo + dashboard); home, menú, producto, promociones, sucursales, carrito, checkout,
   admin login y dashboard en 375/430/768/1440.
4. **DESIGN.md** — redactado a partir de la identidad real (previews + CSS actual + docs).
5. **Tokens CSS** — `tokens.css` + refactor gradual de `public.css`, `home.css`, `checkout.css`,
   `executive.css` y estilos admin legacy con validación visual por capturas.
6. **A11y y estados** — correcciones puntuales; `error.tsx`, `not-found.tsx`, `menu/loading.tsx`
   alineados al sistema.
7. **Dedupe frontend** — `lib/format.ts`, labels compartidos, split de `admin-managers.tsx`,
   consolidación de iconos y paginación.
8. **Backend** — consolidación de precio efectivo; limpieza de código muerto. Tests.
9. **QA navegador (Playwright)** — flujo completo con fixture: navegación, búsqueda, filtros,
   carrito, checkout, login, dashboard; consola sin errores; capturas "después".
10. **Verificación final** — `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`,
    `pnpm test:e2e`; actualización de docs y del informe final.

## Criterios de aceptación

- [ ] `DESIGN.md` en raíz con tokens, tipografía, color semántico, espaciado, componentes,
      estados, efectos, responsive y reglas de accesibilidad, específico de Brasa Viva.
- [ ] Skills instaladas con `SKILL.md` verificado (6) y playwright-cli operativo.
- [ ] Tokens CSS centralizados; las 5 hojas consumen el sistema sin regresiones visuales
      (capturas comparadas).
- [ ] Hallazgos a11y de la auditoría corregidos y re-auditados.
- [ ] `admin-managers.tsx` dividido y sin pérdida de funcionalidad.
- [ ] Backend sin duplicación de precio efectivo; tests verdes.
- [ ] Gates completos en verde, incluido `test:e2e` (o limitación de entorno documentada).
- [ ] Capturas antes/después en 375/430/768/1440 en `docs/design-previews/refactor-qa/`.
- [ ] Informe final con problemas corregidos y pendientes.

## Pruebas

- Unitarias existentes (71) + nuevas para `lib/format.ts` y lo que se divida.
- API: `vitest run src` y `vitest run test` (e2e Nest con supertest).
- Browser: Playwright `pnpm test:e2e` (fixture catalog-server puerto 4101 + Next 3100).
- Manual asistida por script: capturas en 4 resoluciones, consola y comportamiento.
- Comandos completos: `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e`.

## Riesgos

- **Regresión visual al tocar CSS** → capturas antes/después por viewport; cambios por pasos;
  rollback con git (commit baseline).
- **Romper flujo de pedido al refactorizar admin** → no se tocan contratos ni lógica de dominio;
  tests de orden y e2e existentes como red.
- **Scope creep** → fuera de alcance explícito (sin features, sin esquema, sin majors).
- **Descubrimiento de skills no refresca en sesión actual** → se cargan leyendo `SKILL.md`
  directamente; en sesiones nuevas quedan disponibles vía skill tool.
- **Build/e2e bloqueados por sandbox** (documentado en RELEASE_READINESS) → aquí hay sockets
  locales y chromium; si algo falla se distingue error propio de limitación del entorno.

## Rollback

Commit `5a9bed4` (baseline verde) en git local. Cada etapa se commitea por separado con prefijo
convencional, permitiendo revertir una etapa sin tocar el resto.

## Progreso

- [x] FASE 1 — Auditoría y baseline (gates verdes; hallazgos registrados).
- [x] FASE 2 — Skills instaladas y verificadas.
- [x] ExecPlan creado.
- [ ] FASE 3 — DESIGN.md.
- [ ] FASE 4 — Refactor frontend.
- [ ] FASE 5 — Refactor/verificación backend.
- [ ] FASE 6 — Auditoría web design guidelines + correcciones.
- [ ] FASE 7 — Playwright QA + capturas.
- [ ] FASE 8 — Entregables e informe.

## Decisiones

- 2026-10-15: crear repositorio git local con commit baseline `5a9bed4` para rollback seguro
  (el `.git` estaba vacío). No se publica a ningún remoto.
- 2026-10-15: mantener la identidad administrativa verde existente y unificarla con la marca a
  través de tipografía, espaciado, radios y estados comunes en `DESIGN.md`.
- 2026-10-15: instalar skills para OpenCode y Codex en `.agents/skills/` (ruta compartida por
  ambas herramientas). La carga vía skill tool se activa en sesiones nuevas; en la actual se
  leen los `SKILL.md` directamente.
- 2026-10-15: no modificar contratos de API ni esquema Prisma durante la refactorización.

## Descubrimientos

- El baseline estaba completamente verde (lint, typecheck, 71 tests, build) antes de refactorizar.
- `docs/PUBLIC_DESIGN.md` describe un tema oscuro "Obsidian & Ember" que no coincide con la
  implementación entregada (crema editorial con hero oscuro); `DESIGN.md` documentará la
  identidad realmente entregada, preservando el hero oscuro como "momento de fuego".
- Playwright y Chrome ya están disponibles en el entorno (chromium-1223 + google-chrome).
- PostgreSQL local activo; `.env` presente con DATABASE_URL configurada.
- El CLI de turbo añadió un bloque gestionado a `AGENTS.md` (reglas para agentes); se conserva.

## Resultado final

Pendiente de completar al terminar la ejecución.
