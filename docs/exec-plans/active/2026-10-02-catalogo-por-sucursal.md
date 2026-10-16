# Catálogo público por sucursal

## Resultado esperado

Un cliente puede elegir una sucursal y consultar su menú público. La API devuelve únicamente
productos activos y disponibles, con el precio efectivo de esa sucursal.

## Contexto

La fundación define la relación `branch_products`, el contrato de catálogo y Prisma, pero aún no
expone datos públicos desde NestJS ni los consume la web. La instalación y conexión remota están
bloqueadas por DNS, por lo que este incremento se implementa sin aplicar una migración.

## Alcance

- `GET /api/v1/categories`, `GET /api/v1/branches`, `GET /api/v1/branches/:slug`,
  `GET /api/v1/branches/:slug/menu` y detalle de producto por sucursal.
- Repositorios Prisma y servicios de aplicación para sucursales y productos.
- Validación runtime del slug y respuesta HTTP consistente.
- Páginas `/sucursales` y `/menu?branch=<slug>` consumiendo NestJS.

## Fuera de alcance

- Administración, autenticación, carrito, promociones, imágenes de Storage y pedido.
- Precio promocional: esta respuesta representa el precio efectivo de catálogo antes de una
  promoción; el pedido continuará revalidando todo en backend.

## Invariantes

- No acceder a PostgreSQL desde Next.js.
- Producto y sucursal se unen solo con `branch_products`.
- Producto inactivo, eliminado o no disponible no se expone en el menú de sucursal.
- `price_override` prevalece sobre `base_price`.

## Diseño

`BranchesController` y `ProductsController` traducen HTTP y delegan en servicios. Los
repositorios encapsulan Prisma. La web usa Server Components y una capa central de API con
`cache: 'no-store'` para no ejecutar llamadas a la API durante el build.

## Cambios de datos

No introduce nuevos modelos. Depende del `prisma/schema.prisma` de la fundación y de su primera
migración pendiente.

## API / contratos

- `BranchResponse`: datos públicos de una sucursal activa.
- `CatalogResponse`: sucursal y productos disponibles con precio efectivo como string decimal.

## Plan de implementación

1. Ampliar contratos de catálogo.
2. Implementar repositorios, servicios y controladores NestJS.
3. Consumir endpoints desde las páginas públicas.
4. Añadir pruebas unitarias de la regla de precio y verificar al disponer de dependencias.

## Criterios de aceptación

- [ ] Una sucursal inactiva no figura ni se puede consultar públicamente (implementado; pendiente de integración).
- [ ] Un producto no disponible no aparece en su menú (implementado; pendiente de integración).
- [ ] El override de sucursal se entrega como precio del producto (implementado; pendiente de integración).
- [ ] La web no consulta la base de datos directamente (implementado; pendiente de integración).

## Pruebas

- Unit: resolución de precio base, override y disponibilidad.
- Integration pendiente: repositorio Prisma con una base de test.
- E2E pendiente: selección de sucursal y visualización de menú.

## Riesgos

- La migración pendiente impide la verificación de integración; no se simulará una migración en
  producción ni se ejecutará SQL manual.

## Rollback

Revertir los módulos y páginas de catálogo. No hay datos remotos aplicados por este plan.

## Progreso

- [x] Diseño y contratos de endpoints definidos.
- [x] API implementada.
- [x] Web conectada.
- [x] Categorías, detalles de producto/sucursal y seed de servicios implementados.
- [ ] Dependencias, migración y verificaciones completadas (bloqueado por DNS hacia npm y Supabase).

## Decisiones

- 2026-10-02: el menú público se expresa como recurso de sucursal para que precio y
  disponibilidad no se interpreten fuera de contexto.

## Descubrimientos

- Se implementaron endpoints públicos de sucursal y menú, además de su consumo desde Next.js.
- Se completaron categorías, detalles públicos de producto y sucursal, más servicios de sucursal
  en el seed de desarrollo.
- El hero público se optimizó a WebP de 170 KB para evitar servir el PNG original de 2.4 MB.
- El seed contiene dos sucursales, override de precios, un producto no disponible, una promoción
  activa y una vencida para cubrir los casos de prueba requeridos por `QUALITY.md`.
- `pnpm prisma:generate`, `pnpm prisma:migrate --name init`, `pnpm lint`, `pnpm typecheck`,
  `pnpm test` y `pnpm build` se ejecutaron, pero no pueden iniciar sus herramientas porque
  `pnpm install` no pudo resolver `registry.npmjs.org` y no existe `node_modules`.

## Resultado final

Pendiente.
