# Administración y RBAC del MVP

## Resultado esperado

Una persona autorizada puede iniciar sesión en `/admin` mediante Supabase Auth y gestionar el
catálogo, las sucursales, las promociones y los pedidos desde un panel privado. NestJS verifica
cada token, resuelve los roles y sucursales asignadas desde PostgreSQL, rechaza cualquier acción
fuera de alcance y registra las mutaciones sensibles en `audit_logs`.

## Contexto

Las fases anteriores ya entregaron catálogo público, carrito y confirmación de pedidos. El
esquema inicial contiene `users`, `roles`, `user_roles`, `user_branches`, `audit_logs` y las
entidades de operación necesarias, pero no existen autenticación administrativa, rutas privadas
ni APIs de administración. Los roles base están sembrados, aunque no hay un owner asociado a una
identidad de Supabase.

## Alcance

- Inicio y cierre de sesión administrativo con Supabase Auth en el navegador.
- Verificación de JWT de Supabase en NestJS, con JWKS cuando existan claves asimétricas y
  validación remota segura como compatibilidad para proyectos con clave heredada.
- Mapeo de identidad a `users`, roles y sucursales, incluyendo bootstrap de un único owner
  configurado por entorno.
- Capacidades centralizadas y guards para `OWNER`, `ADMIN`, `BRANCH_MANAGER`, `EDITOR` y
  `OPERATOR`.
- Panel `/admin` y APIs protegidas para dashboard, categorías, productos, asignación de producto
  por sucursal, sucursales, promociones, pedidos, usuarios y configuración.
- Validación Zod de entradas y contratos compartidos; paginación de listados administrativos.
- Auditoría transaccional de altas, ediciones, desactivaciones, cambios de disponibilidad/precio,
  promociones, estados de pedido y roles/asignaciones.
- Pruebas unitarias de autorización y mutaciones críticas, además de pruebas HTTP protegidas
  cuando el entorno permita abrir sockets.

## Fuera de alcance

- Registro de clientes, pagos, delivery propio, inventario/POS y analítica avanzada.
- MFA, SSO y permisos granulares distintos de los cinco roles establecidos.
- Borrado físico de catálogo, pedidos o auditoría.
- Crear cuentas de Supabase desde el navegador. La primera cuenta se crea en Supabase Auth y se
  habilita de forma controlada por configuración; las invitaciones con service role se podrán
  habilitar únicamente si esa clave se configura en backend.

## Invariantes

- Supabase Auth aporta identidad; NestJS y PostgreSQL son autoridad de permisos.
- El token, precio, total, rol y alcance enviados por el navegador nunca son autoridad por sí
  mismos.
- `products` y `branches` mantienen su relación N:M exclusivamente en `branch_products`.
- Un gerente u operador solo accede a sus sucursales asignadas; un editor no opera pedidos.
- El precio efectivo y las promociones se vuelven a validar al crear pedidos.
- Mutaciones administrativas sensibles se guardan junto con su auditoría en una transacción.
- No se exponen service-role keys ni cadenas de PostgreSQL al navegador.
- La UI privada no se indexa y ocultar acciones no sustituye los guards del backend.

## Diseño

### Autenticación y autorización

El cliente mantiene la sesión administrativa y envía el access token como `Authorization: Bearer`
en cada solicitud privada. El API valida ese token en el endpoint autenticado `/auth/v1/user` de
Supabase con la publishable key del proyecto. Este mecanismo oficial cubre tanto claves asimétricas
como proyectos que aún usan firma HS256, sin copiar el secreto JWT al API. La verificación local con
JWKS podrá añadirse cuando la dependencia `jose` esté disponible de forma reproducible.

`AuthService` sincroniza el perfil conocido y devuelve un `AdminPrincipal` con el usuario interno,
roles y sucursales activas. Si aún no existe un owner, solo el correo configurado en
`ADMIN_BOOTSTRAP_EMAIL` puede crear el primer usuario `OWNER`; el correo se compara normalizado y
el bootstrap queda cerrado después de crear ese owner. Usuarios suspendidos, inactivos, sin rol o
sin token válido reciben 401/403 según corresponda.

Las capacidades se concentran en una policy de aplicación. Los guards resuelven identidad y rol;
los servicios verifican alcance de sucursal para recursos concretos.

### API y datos

Se conserva el esquema actual. Un repositorio administrativo ejecutará cada mutación con
`Prisma.$transaction`, capturará una representación segura antes/después y creará el `audit_log`
del actor. Se usarán desactivaciones (`active`, `status` o `deleted_at`) para no destruir el
historial. Los contratos administrativos serializan Decimals como strings y fechas como ISO-8601.

Las operaciones de pedido aplican una máquina de estados explícita: `RECEIVED → CONFIRMED o
CANCELLED`, `CONFIRMED → PREPARING o CANCELLED`, `PREPARING → READY o CANCELLED`, `READY →
COMPLETED o CANCELLED`; los estados terminales no cambian.

### Frontend

La sección privada usa componentes de cliente únicamente para sesión, formularios y datos
dinámicos. TanStack Query administra consultas/invalida caché después de mutaciones. Un guard de
pantalla consulta `/admin/me`; el servidor continúa protegiendo todas las acciones. Las páginas
ofrecen formularios accesibles con mensajes de error y bloquean doble envío.

## Cambios de datos

No se prevé una migración para el núcleo de RBAC, ya que el modelo inicial contiene las relaciones
requeridas. Cualquier necesidad descubierta que cambie el modelo, incluida historia detallada de
estados, requerirá una migración Prisma separada y la actualización de `docs/DATA_MODEL.md`.

## API / contratos

- `GET /api/v1/admin/me`
- `GET /api/v1/admin/dashboard`
- `GET|POST|PATCH /api/v1/admin/categories`
- `GET|POST|PATCH /api/v1/admin/products` y `PUT /api/v1/admin/branches/:branchId/products/:productId`
- `GET|POST|PATCH /api/v1/admin/branches`
- `GET|POST|PATCH /api/v1/admin/promotions`
- `GET /api/v1/admin/orders` y `PATCH /api/v1/admin/orders/:id/status`
- `GET|POST /api/v1/admin/users` y `PUT /api/v1/admin/users/:id/access`
- `GET|PUT /api/v1/admin/settings`

Todos los endpoints se validan con contratos compartidos y requieren bearer token, salvo las
rutas públicas ya existentes.

## Plan de implementación

1. Añadir dependencias de Auth/JWT/estado de servidor y exponer solo variables públicas de
   Supabase al bundle web.
2. Crear el módulo Auth del API: verificador, principal, bootstrap, repositorio, decoradores,
   guards y policy centralizada; cubrir 401/403, usuario suspendido y alcance de sucursal.
3. Definir contratos administrativos y el módulo API de administración, con repositorios
   transaccionales y auditoría.
4. Implementar categorías, productos y disponibilidad/precio por sucursal; invalidar datos
   públicos en el cliente después de editar.
5. Implementar sucursales, promociones, pedidos con transiciones válidas, usuarios/accesos y
   configuración.
6. Construir login, shell privado, dashboard y pantallas de gestión accesibles.
7. Ejecutar lint, typecheck, unit/integración, build y pruebas manuales contra Supabase; documentar
   configuración de la primera cuenta administrativa.

## Criterios de aceptación

- [ ] Un token inválido o ausente no puede leer ni mutar `/admin`.
- [ ] Un usuario autenticado sin rol recibe 403.
- [ ] El owner bootstrap solo sucede para el correo configurado y cuando no existe owner.
- [ ] Un `BRANCH_MANAGER` no puede alterar otra sucursal ni consultar sus pedidos.
- [ ] Un `EDITOR` puede gestionar catálogo/promociones pero no pedidos ni usuarios.
- [ ] Precio, disponibilidad, promociones, estado de pedido y cambios de acceso generan auditoría.
- [ ] Un producto puede publicarse y configurarse por sucursal sin crear `products.branch_id`.
- [ ] El panel permite completar las capacidades MVP documentadas y no expone secretos.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` completan en un entorno con los
   permisos de procesos requeridos.

## Pruebas

- Unitarias de verificación/normalización de identidad, policy, transiciones de pedido y servicios
  administrativos.
- Integración HTTP: 401 sin bearer, 403 sin rol, 403 fuera de sucursal y mutación autorizada.
- Contratos: serialización de importes, validación de UUID/slug/fechas y descarte de campos no
  permitidos.
- Manual: crear cuenta en Supabase Auth, definir `ADMIN_BOOTSTRAP_EMAIL`, iniciar sesión, editar
  catálogo, revisar el menú público y comprobar un registro de auditoría.

## Riesgos

- JWKS vacío en proyectos con firma heredada → fallback al endpoint de usuario de Supabase, sin
  aceptar tokens no verificados.
- Ausencia de `SUPABASE_SERVICE_ROLE_KEY` → no se habilitan invitaciones/Storage servidor; la
  gestión de acceso parte de cuentas existentes y el backend no inventa credenciales.
- Conflictos de edición o relaciones activas → validación transaccional, errores 409 claros y
  desactivación antes que borrado.
- El sandbox no permite sockets/red externa → las pruebas de compilación y unitarias se ejecutan
  localmente; E2E/Supabase se verifican desde la terminal de desarrollo.

## Rollback

Revertir el despliegue del API y web juntos. Las mutaciones no destruyen entidades históricas; los
registros de auditoría permanecen. Si se añade una migración posterior, su reversión se tratará en
esa migración, no con cambios manuales en producción.

## Progreso

- [x] Investigar arquitectura, reglas de dominio, esquema y compatibilidad de JWT.
- [x] Configurar variables públicas seguras sin exponer secretos.
- [x] Implementar Auth/RBAC y pruebas unitarias de policy, bootstrap y workflow.
- [x] Implementar contratos y API administrativa con auditoría transaccional.
- [x] Implementar panel web privado responsive.
- [ ] Ejecutar prueba manual integrada contra Supabase Auth y base remota.

## Decisiones

- 2026-10-06: el entorno no puede descargar `jose` de forma reproducible. Mientras tanto, se
  verifica cada JWT en el endpoint autenticado de Supabase, mecanismo oficial compatible con claves
  asimétricas y HS256; no se implementa criptografía JWT propia.
- 2026-10-06: el primer owner se controla mediante `ADMIN_BOOTSTRAP_EMAIL` y la ausencia de un
  owner activo. Evita asignar roles a cualquier cuenta de Supabase.
- 2026-10-06: el esquema inicial cubre RBAC y auditoría, por lo que no se crea una migración aún.
- 2026-10-06: un owner puede preautorizar localmente un correo existente en Supabase Auth. No se
  crean ni invitan credenciales desde el navegador ni se requiere service role para el MVP.

## Descubrimientos

- El proyecto ya contiene relaciones de roles y sucursales, `AuditLog` y los enums necesarios.
- El `SUPABASE_SERVICE_ROLE_KEY` no está configurado en el entorno actual; nunca se solicitará al
  navegador ni se incluirá en el repositorio.
- El sandbox no permite abrir sockets. Los builds/E2E que los requieren deben comprobarse desde la
  terminal de desarrollo.
- `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan en el monorepo. El build de NestJS genera
  `apps/api/dist`; `next build` y las pruebas HTTP con Supertest quedan bloqueados en este sandbox
  por `EPERM` al intentar abrir un socket, no por una falla de compilación.
- Una promoción histórica sin relaciones de producto no debe impedir que se liste el panel. El
  contrato de lectura la muestra como incompleta para poder corregirla, mientras que los contratos
  de escritura y la activación siguen exigiendo al menos un producto; el catálogo público la excluye.

## Resultado final

Se entregó autenticación administrativa de Supabase, RBAC por roles y sucursales, auditoría
transaccional, contratos, APIs y panel responsive para catálogo, sucursales, promociones, pedidos,
usuarios y configuración. Queda la validación manual con una cuenta real de Supabase Auth y el
entorno que puede abrir sockets.
