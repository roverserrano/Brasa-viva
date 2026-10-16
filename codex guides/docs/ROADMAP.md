# Roadmap técnico-funcional

## Regla

Este roadmap indica orden y límites. No convierte automáticamente una fase futura en alcance
de la tarea actual.

## Fase 0 — Fundamentos de repositorio

Objetivo: entorno ejecutable y verificable.

Entregables:

- monorepo pnpm + Turborepo;
- `apps/web` Next.js;
- `apps/api` NestJS;
- packages compartidos;
- ESLint/Prettier/TypeScript strict;
- Vitest/Playwright base;
- Prisma + conexión dev;
- env examples;
- CI inicial.

Criterio: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` ejecutables.

## Fase 1 — Sistema visual y web base

- tokens de marca;
- layout;
- navbar/footer;
- componentes UI;
- home;
- responsive base;
- SEO base.

## Fase 2 — Catálogo y sucursales

- categories;
- products;
- branches;
- branch_products;
- menú público;
- detalle;
- disponibilidad/precio por sucursal;
- seeds.

## Fase 3 — Promociones

- promotions;
- alcance por sucursal;
- fechas;
- home/menu integration;
- admin inicial de promos.

## Fase 4 — Carrito y checkout

- Zustand;
- persistence;
- selector de sucursal;
- recojo/delivery;
- formularios;
- resumen.

## Fase 5 — Pedidos

- POST order;
- validación servidor;
- transacción;
- snapshots;
- order number;
- WhatsApp;
- admin pedidos;
- auditoría relevante.

Esta fase completa el flujo comercial principal.

## Fase 6 — Administración completa

- Supabase Auth;
- usuarios;
- RBAC;
- productos/categorías;
- sucursales;
- promociones;
- pedidos;
- configuración.

## Fase 7 — Analytics / SEO / rendimiento

- eventos KPIs;
- Search Console/analytics hooks;
- JSON-LD;
- sitemap;
- imágenes;
- cache/revalidation;
- Core Web Vitals.

## Fase 8 — Hardening

- rate limiting;
- seguridad;
- E2E completo;
- backups/restore procedure;
- staging;
- observabilidad base;
- QA dispositivo.

## Lanzamiento MVP

El MVP se lanza cuando:

- cliente completa pedido;
- pedido queda guardado antes de WhatsApp;
- admin mantiene menú/sucursal/promos;
- roles mínimos funcionan;
- SEO/analytics base están activos;
- pruebas críticas pasan;
- secrets/infra production están configurados.

## Fase 2 del producto (posterior)

Solo después de validar uso:

- estados/seguimiento de pedido;
- cupones;
- fidelización;
- clientes registrados;
- notificaciones;
- PWA;
- pedidos programados.

## Fase 3 del producto (posterior)

Solo con volumen/razón comercial:

- pago QR automatizado;
- delivery propio;
- repartidores;
- inventario;
- POS;
- facturación;
- BI;
- apps móviles.

## Prohibición de “preconstruir el futuro”

No crear tablas, servicios, colas y abstracciones de fases futuras si no las necesita el
incremento actual, salvo pequeños puntos de extensión que no agreguen complejidad operativa.
