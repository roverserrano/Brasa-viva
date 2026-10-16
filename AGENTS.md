# AGENTS.md — Brasa Viva

## Propósito

Punto de entrada para Codex y otros agentes. Este archivo es un mapa, no la especificación
completa. Antes de modificar código, consulta `ARCHITECTURE.md` y los documentos relevantes
de `docs/`.

Brasa Viva es una plataforma para una cadena de restaurantes con múltiples sucursales en
Cochabamba. El MVP debe convertir la web en un canal de menú, promociones, sucursales,
carrito, pedidos y administración.

## Jerarquía de fuentes

Cuando exista conflicto:

1. La solicitud actual del usuario.
2. `docs/PRODUCT.md` y `docs/DOMAIN_RULES.md` para comportamiento del producto.
3. `ARCHITECTURE.md` para decisiones técnicas.
4. Documentos especializados de `docs/`.
5. Código existente como evidencia del estado actual.

No cambies arquitectura para simplificar una tarea. Si una tarea exige hacerlo, crea un
ExecPlan y documenta la decisión.

## Arquitectura no negociable

- TypeScript en frontend, backend, tests y paquetes compartidos.
- Monorepo: `pnpm` workspaces + Turborepo.
- `apps/web`: Next.js 16 + React + App Router.
- `apps/api`: NestJS, fuente central de reglas de negocio.
- REST versionado bajo `/api/v1`.
- PostgreSQL administrado por Supabase.
- Prisma ORM 7.
- Supabase Auth para autenticación administrativa.
- Supabase Storage para imágenes/archivos.
- Next.js no accede directamente a PostgreSQL; auth con Supabase es la excepción.
- No microservicios, GraphQL, Redis/BullMQ, pagos o delivery propio en MVP salvo instrucción.

## Invariantes de dominio

- Producto ↔ sucursal es N:M mediante `branch_products`; nunca `products.branch_id`.
- Una sucursal puede sobreescribir precio/disponibilidad.
- El frontend nunca es autoridad del precio final.
- NestJS revalida productos, sucursal, precios y promociones al confirmar.
- Pedido + items se persisten antes de continuar a WhatsApp.
- Cada pedido tiene identificador humano tipo `BV-000142`.
- Promociones pueden tener ventana temporal y alcance por sucursal.
- Desactivar catálogo no debe destruir historial.
- Cambios administrativos sensibles dejan `audit_logs`.
- El MVP no requiere cuenta de cliente.
- Roles: `OWNER`, `ADMIN`, `BRANCH_MANAGER`, `EDITOR`, `OPERATOR`.

Antes de tocar pedidos, productos, promociones, sucursales o permisos, lee
`docs/DOMAIN_RULES.md`.

## Alcance MVP

Incluye:

- Home, menú, categorías, productos, promociones y sucursales.
- Precio/disponibilidad por sucursal.
- Carrito persistido en navegador.
- Recojo y delivery coordinado por WhatsApp.
- Persistencia del pedido antes de WhatsApp.
- `/admin` con gestión de catálogo, sucursales, promociones y pedidos.
- Auth/RBAC administrativo.
- SEO, analytics básico, responsive y pruebas del flujo crítico.

No amplíes con fidelización, cupones, PWA, tracking, pagos, inventario, POS o app móvil
sin una tarea explícita.

## Convenciones

- Código, tipos, funciones, tablas y rutas internas: inglés.
- Copy visible: español salvo requisito.
- TypeScript `strict`.
- Evita `any`; valida datos en runtime.
- Controllers NestJS delgados; negocio en servicios/casos de uso.
- Contratos compartidos en `packages/contracts`.
- Nunca secretos/service keys en navegador o Git.
- Evita dependencias y abstracciones prematuras.
- Prefiere código explícito, testeable y legible.

## Estructura esperada

```text
brasa-viva/
├─ apps/
│  ├─ web/
│  └─ api/
├─ packages/
│  ├─ contracts/
│  ├─ config/
│  ├─ types/
│  └─ eslint-config/
├─ prisma/
├─ docs/
├─ .agent/
├─ AGENTS.md
├─ ARCHITECTURE.md
├─ package.json
├─ pnpm-workspace.yaml
└─ turbo.json
```

## Antes de implementar

1. Lee `AGENTS.md` y `ARCHITECTURE.md`.
2. Lee los docs del área:
   - producto: `docs/PRODUCT.md`, `docs/DOMAIN_RULES.md`
   - frontend: `docs/FRONTEND.md`
   - backend: `docs/BACKEND.md`
   - datos: `docs/DATA_MODEL.md`
   - seguridad: `docs/SECURITY.md`
   - pruebas: `docs/QUALITY.md`
3. Inspecciona código existente antes de crear un patrón nuevo.
4. Para cambios transversales/migraciones/contratos, usa `.agent/PLANS.md`.
5. Implementa el cambio mínimo coherente.
6. Añade/actualiza pruebas.
7. Ejecuta verificaciones.
8. Actualiza documentación si cambió una regla estable.

## Verificaciones

Cuando existan los scripts:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para pedido, auth, permisos, navegación crítica o admin:

```bash
pnpm test:e2e
```

Si algo no puede ejecutarse, informa qué y por qué. No ocultes pruebas fallidas.

## Datos y seguridad

- Cambios de esquema solo con Prisma migrations.
- No editar producción manualmente.
- Operaciones de pedido multi-entidad deben ser transaccionales.
- No confiar en `price`, `subtotal`, `discount` o `total` del cliente.
- Autorización siempre en backend aunque la UI oculte controles.
- Service role key solo en backend/infra segura.
- Actualiza `docs/DATA_MODEL.md` cuando cambie el modelo conceptual.

## UI

- Mobile-first.
- Server Components para contenido público cuando aplique.
- Client Components solo para interacción real.
- Accesibilidad: teclado, labels, foco, contraste y alt text.
- Imágenes optimizadas con `next/image`, WebP/AVIF.
- No mezclar reglas de negocio dentro de componentes visuales.

## Backend

Flujo preferido:

```text
Controller → Application/Domain Service → Repository → Prisma → PostgreSQL
```

Mantén OpenAPI/Swagger sincronizado. Errores consistentes; no filtrar secretos ni stack
traces de producción.

## ExecPlans

Para features complejas, refactors grandes, migraciones o cambios transversales usa
`.agent/PLANS.md`. Guarda planes activos en `docs/exec-plans/active/` y muévelos a
`docs/exec-plans/completed/` al terminar.

## Documentación

`AGENTS.md` es el índice operativo. Si descubres una regla nueva y estable, actualiza el
documento especializado correspondiente en lugar de inflar este archivo.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
