# Promociones públicas activas

## Resultado esperado

La web muestra promociones publicadas y vigentes. Si una sucursal está seleccionada, solo muestra
promociones globales o aplicables a esa sucursal.

## Contexto

El modelo Prisma y el seed ya incluyen promociones con fechas y alcance por sucursal, pero la web
no las consulta desde NestJS.

## Alcance

- `GET /api/v1/promotions` con filtro opcional `branchSlug`.
- Reglas de publicación, ventana temporal y alcance por sucursal en backend.
- Página pública de promociones conectada a la API.

## Fuera de alcance

- Aplicación del descuento en un pedido, CRUD administrativo y reglas complejas de bundles.

## Invariantes

- Una promoción vencida no se devuelve como activa.
- Una promoción con sucursales asignadas solo se devuelve para esas sucursales.
- Una promoción sin alcance de sucursales activo se interpreta como global.
- Sin una sucursal seleccionada, el listado público muestra solo promociones globales.
- El servidor es autoridad de las fechas y del alcance.

## Diseño

El repositorio Prisma recibe la hora actual en UTC y un `branchId` opcional. El servicio valida
la sucursal mediante `BranchesService`; el controlador no calcula reglas de negocio.

## Cambios de datos

No agrega modelos; usa `promotions`, `promotion_branches` y la primera migración pendiente.

## API / contratos

- `GET /api/v1/promotions?branchSlug=<slug>` devuelve promociones públicas vigentes.

## Pruebas

- Unit pendiente: ventanas y alcance de promoción.
- Integration pendiente: repositorio Prisma.

## Progreso

- [x] Contrato y diseño definidos.
- [x] API implementada.
- [x] Web conectada.
- [ ] Verificaciones ejecutadas con dependencias instaladas.

## Decisiones

- 2026-10-02: ausencia de asociaciones activas en `promotion_branches` representa alcance
  global, de acuerdo con la regla conceptual de alcance global.

## Resultado final

Pendiente.
