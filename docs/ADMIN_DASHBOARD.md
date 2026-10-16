# Panel ejecutivo

## Uso

En `/admin`, el resumen presenta importe de pedidos, cantidad, ticket promedio y pedidos en
atención. Cambiar el período (7/30/90 días) o la sucursal actualiza todos los indicadores.
Seleccionar una fila de sucursal aplica ese filtro; «Todas las autorizadas» restaura el alcance.
«Actualizar» solicita una nueva lectura. No hay polling ni una promesa de tiempo real.

El gráfico alterna pedidos e importe. El deslizador permite explorar cada día con ratón,
tacto o teclado; la tabla desplegable permite consultar los mismos valores sin depender del
gráfico. Las distribuciones muestran estados y modalidades. Los enlaces operativos llevan a
Pedidos y, para roles habilitados, Productos. En móvil la navegación se abre con un botón,
se cierra al elegir una sección o con Escape, que devuelve el foco al botón.

## Definiciones

- Períodos por **fecha de creación**, calendario `America/La_Paz`, incluyendo hoy parcial.
- Comparación con la misma cantidad de días anteriores completos. La UI lo identifica para
  evitar interpretar la comparación como ventanas de igual avance horario.
- Importe: suma del total persistido de pedidos **no cancelados**, incluyendo sus cargos
  registrados. No son pagos confirmados, facturación fiscal, margen ni utilidad.
- Ticket: importe dividido entre cantidad de pedidos no cancelados. Sin pedidos elegibles: cero.
- Pedidos: todos los estados. Los cancelados aparecen en conteo, estados y modalidades.
- En atención: recibidos, confirmados, en preparación y listos, creados en el período elegido.
  Pedidos antiguos pendientes se consultan en la sección Pedidos.
- Estado: el actual, incluso para pedidos creados en fechas anteriores.
- Días sin pedidos: cero. Base anterior cero: «Sin base comparable» o «Sin variación».
- Solo sucursales no borradas y accesibles al usuario; incluye sucursales inactivas y sus pedidos.

## Arquitectura y seguridad

`GET /api/v1/admin/dashboard/insights?days=30&branchId=<uuid>` requiere JWT y `VIEW_DASHBOARD`.
OWNER/ADMIN acceden a todas las sucursales disponibles; BRANCH_MANAGER/OPERATOR solo a asignadas.
EDITOR no tiene acceso. Un filtro ajeno produce 403. Sin asignaciones se devuelve un alcance
vacío, nunca una consulta global. Las opciones del selector también respetan el alcance.

Contrato en `packages/contracts/src/dashboard.ts`, publicado en Swagger desde el mismo esquema.
El DTO de respuesta usa importes normalizados sin transformaciones y permite sumas mayores al
límite de un pedido individual. No envía nombres, teléfonos ni direcciones de clientes.
Las respuestas privadas conservan `no-store` y el rate limiting existente.

Flujo: AdminController → DashboardService → DashboardRepository → Prisma/PostgreSQL.
Una consulta agregada por día/sucursal/estado/modalidad cubre como máximo 180 días para el
período actual más el anterior. Las fechas y UUIDs se parametrizan; no se descargan pedidos
individuales. El cálculo posterior usa Decimal. Sin migraciones, nuevas dependencias ni caché
distribuida. El endpoint `/admin/dashboard` anterior sigue disponible.

La consulta sigue la API de [consultas parametrizadas de Prisma 7](https://www.prisma.io/docs/orm/v7/prisma-client/using-raw-sql/raw-queries).
El plan de ejecución SQL y la latencia con volumen real deben medirse en staging antes de
dimensionar infraestructura o añadir índices; no se afirma rendimiento medido en producción.

## Frontend

`AdminShell` comprueba sesión y permisos; `AdminFrame` presenta navegación/contexto/usuario.
`AdminDashboard` maneja solicitudes; `DashboardView`, `DashboardOverview` y `DashboardChart`
presentan controles y datos. Los estilos están en `features/admin/executive.css`, cargados por
el layout privado y acotados al espacio administrativo. El admin conserva formularios y flujos
de gestión existentes. No añade acceso de Next a PostgreSQL.

La respuesta de una solicitud abandonada al cambiar filtros o desmontar no actualiza la UI.
Los indicadores anteriores no se presentan bajo filtros nuevos. Errores y carga tienen estados
explícitos, y los fallos permiten reintentar. El gráfico utiliza SVG/CSS sin librería adicional.

## Validación del 2026-10-09

- Lint y TypeScript pasan. 63 pruebas unitarias pasan (31 API, 23 web, 9 contratos).
- Casos nuevos: alcance por sucursal, selección manipulada, usuario sin asignaciones, fechas
  en medianoche boliviana, cambio de año, sumas decimales, cancelaciones, datos vacíos,
  comparaciones sin base, SQL parametrizado y generación OpenAPI sin fallos de arranque.
- Playwright descubre 14 escenarios, cinco nuevos para filtros, tabla/gráfico, sucursal,
  reintento, respuestas tardías y navegación responsive. Su ejecución está bloqueada por
  `listen EPERM` en el servidor de fixtures (127.0.0.1:4101).
- Las seis pruebas HTTP Nest no pueden abrir el socket local (`listen EPERM`). El módulo
  administrativo sí se carga; no se consideran aprobadas las aserciones HTTP.
- Build Next/Turbopack bloqueado al abrir un puerto para procesar CSS (`Operation not permitted`).
  La compilación del backend Nest pasa.
  La integración con PostgreSQL/Supabase real no se ha ejecutado en este entorno.
- Revisión estática de componentes y CSS reales a 375/430/768/1440 px con Chrome. Las capturas
  usan datos **sintéticos** exclusivos de `e2e/dashboard-fixture.ts`, nunca datos de producción.
  No sustituyen pruebas de hidratación, interacción real, Safari ni accesibilidad asistida.

Capturas: [escritorio](design-previews/admin-executive-desktop.webp),
[móvil](design-previews/admin-executive-mobile.webp), [tablet](design-previews/admin-executive-tablet.webp).

## Validación pendiente antes de publicar

Ejecutar `pnpm build` y `pnpm test:e2e` en local/CI con sockets; probar con cuentas OWNER,
BRANCH_MANAGER, OPERATOR y EDITOR y datos de staging conocidos. Contrastar totales/cancelados
con consultas de referencia y comprobar ausencia de datos de sucursales ajenas. Revisar teclado,
zoom 200%, Safari y un teléfono real. No requiere ejecutar seed ni restablecer la base.
