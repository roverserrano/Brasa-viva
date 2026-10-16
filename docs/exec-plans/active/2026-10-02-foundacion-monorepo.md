# Fundación ejecutable de Brasa Viva

## Resultado esperado

El repositorio ofrece un monorepo TypeScript verificable con una web pública base, API NestJS
versionada, contratos compartidos y una definición Prisma 7 lista para migrarse a PostgreSQL.

## Contexto

El directorio inicial contenía las guías en `codex guides/` y un diseño PostgreSQL en
`postgresql/`, pero no contaba con workspaces, aplicaciones, configuración de calidad ni una
migración Prisma ejecutable.

## Alcance

- Instalar las guías en las rutas operativas del repositorio.
- Crear la fundación pnpm + Turborepo y TypeScript estricto.
- Crear `apps/web` y `apps/api` mínimos y ejecutables.
- Crear contratos de sucursal y catálogo compartidos.
- Modelar el núcleo de datos MVP en Prisma 7.
- Añadir una prueba unitaria de resolución de precio por sucursal.

## Fuera de alcance

- Conectar una base Supabase real o ejecutar migraciones sin `DATABASE_URL`.
- Pedidos, auth/RBAC, administración, promociones calculadas, WhatsApp e imágenes reales.
- Migrar literalmente triggers, vistas e índices parciales del SQL de referencia.

## Invariantes

- Next.js no accede a PostgreSQL.
- Productos y sucursales se relacionan solamente mediante `branch_products`.
- El precio efectivo privilegia el override de sucursal y el backend será su autoridad.
- Prisma migrations son el único mecanismo de cambio de esquema.
- Copy público en español y código interno en inglés.

## Diseño

La web usa Server Components para la base pública. NestJS expone su API bajo `/api/v1` y deja
preparado un módulo de datos que usa el adaptador PostgreSQL exigido por Prisma 7. Los contratos
de respuestas son independientes de los modelos Prisma. `prisma/schema.prisma` es el esquema
ejecutable; `postgresql/` se conserva como diseño de referencia para objetos SQL que Prisma no
modela directamente.

## Cambios de datos

La migración inicial revisada vive en
`prisma/migrations/20261006120000_init/migration.sql`, con su
`prisma/migrations/migration_lock.toml`. Crea exclusivamente el esquema representado por
`prisma/schema.prisma`; no reproduce objetos del SQL de referencia que no forman parte del MVP
actual. La primera aplicación usa `prisma migrate reset --force` sobre la base de desarrollo
Supabase, autorizada para ser reinicializada, y ejecuta `prisma/seed.ts` al finalizar.

## API / contratos

- `GET /api/v1/health` responde el estado básico del proceso.
- `BranchResponse`, `ProductResponse` y `CatalogResponse` viven en `packages/contracts`.

## Plan de implementación

1. Consolidar documentación y crear el ExecPlan.
2. Crear workspaces, scripts de calidad y configuración TypeScript.
3. Crear web pública y API de salud.
4. Definir contratos y la regla de precio efectivo con pruebas.
5. Definir Prisma 7 y la configuración segura para migrations.
6. Instalar dependencias y ejecutar verificaciones disponibles.

## Criterios de aceptación

- [x] Las guías están disponibles en raíz, `docs/` y `.agent/`.
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build` pasan tras instalar dependencias.
- [ ] El cliente Prisma se genera sin modificar el esquema manualmente.
- [ ] La migración inicial versionada se aplica y el seed concluye en la base de desarrollo.

## Pruebas

- Unit: precio base, override disponible y producto no disponible.
- Comandos: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.

## Riesgos

- Prisma 7 requiere adaptador PostgreSQL y cliente generado; se configura `@prisma/adapter-pg`
  y salida explícita.
- El SQL fuente incluye triggers/vistas que Prisma no genera; su incorporación requiere una
  migración SQL revisada antes de la primera base compartida.

## Rollback

Revertir los archivos de fundación. No hay migración ni datos aplicados en esta etapa.

## Progreso

- [x] Documentación consolidada y análisis de fuentes terminado.
- [x] Decisiones de fundación registradas.
- [x] Workspaces y aplicaciones creados.
- [x] Contratos, dominio Prisma y pruebas creados.
- [x] Dependencias intentadas y verificaciones ejecutadas.
- [x] Migración Prisma inicial generada desde el esquema, revisada y versionada.
- [x] Conectividad local del API y generación de cliente verificadas sin errores de tipos.
- [ ] Reinicio autorizado de la base de desarrollo Supabase, aplicación de la migración y seed.

## Decisiones

- 2026-10-02: `prisma/schema.prisma` será la fuente ejecutable. El SQL original permanece como
  referencia, porque las guías establecen Prisma migrations como mecanismo de cambios.
- 2026-10-02: se adopta `audit_logs` en Prisma, de acuerdo con `AGENTS.md` y `DATA_MODEL.md`,
  aunque el SQL fuente use `audit_log`.
- 2026-10-02: la primera migración no se inventa sin una base de desarrollo y revisión del SQL.
- 2026-10-02: los emails se modelan inicialmente como `varchar` y no `citext`; Prisma 7 no
  ofrece un codec de cliente seguro para ese tipo de extensión. La semántica case-insensitive,
  si se mantiene, se añadirá en una migración SQL revisada junto con su estrategia de consulta.
- 2026-10-06: la migración inicial se genera con `prisma migrate diff --from-empty` para
  conservar un historial versionado antes de reinicializar la base de desarrollo existente.
- 2026-10-06: el entorno de desarrollo usa el Session Pooler IPv4 de Supabase porque el host
  directo solo era alcanzable por IPv6 desde la red local. La URL de ejecución local mantiene TLS
  con `sslmode=no-verify` mientras se instala la CA de Supabase; antes de desplegar se debe usar
  verificación completa del certificado.

## Descubrimientos

- El SQL de referencia duplica `products.is_new`; Prisma elimina esa duplicación.
- El entorno no permite inicializar `.git`, por lo que esta ejecución no crea commits.
- La resolución DNS hacia `registry.npmjs.org` no está disponible en el entorno. `pnpm install`
  no creó `node_modules` ni lockfile; por ello `pnpm lint`, `pnpm typecheck`, `pnpm test` y
  `pnpm build` llegan al script raíz pero fallan al no encontrar `turbo`.
- Validación estática disponible: JSON de paquetes válido; Prisma contiene 18 modelos y 8 enums;
  no hay una relación prohibida `products.branch_id`.
- Se recibió una URL y credencial de una instancia Supabase para desarrollo. La conexión quedó
  únicamente en `.env` ignorado por Git; falta confirmar conectividad y generar la migración.
- La consulta read-only a Supabase no pudo resolver el hostname desde este entorno por el mismo
  bloqueo DNS que afecta npm. No se aplicó ninguna migración ni se modificaron datos remotos.
- Se reintentó `pnpm install` y se ejecutaron los comandos de Prisma y calidad. Todos quedan
  bloqueados por la ausencia de dependencias; no se creó lockfile ni cliente Prisma.
- Se añadió una imagen hero propia para la web pública en `apps/web/public/images/` y un sistema
  visual mobile-first para cumplir la prioridad visual definida en `PRODUCT.md`.
- El schema Prisma incorpora `site_settings`, consistente con el modelo conceptual, y el seed
  aporta los casos de catálogo necesarios para desarrollo y pruebas.
- La base Supabase preexistente contiene tablas y enums fuera del historial de migraciones;
  Prisma lo reporta como drift. El propietario autorizó explícitamente reiniciar el esquema
  `public` de esa base de desarrollo para establecer el historial inicial.
- El entorno aislado del agente no puede abrir conexiones externas ni puertos locales. El API
  completa la inicialización de Nest y registra sus rutas; la aplicación y el seed remotos se
  ejecutarán desde la terminal de desarrollo que ya alcanza el pooler.
- El comando de desarrollo usa `tsx`, que no emite los metadatos de constructor requeridos por
  Nest para inferir dependencias. Las rutas públicas declaran ahora `@Inject(...)` de forma
  explícita en controladores, servicios y repositorios, y una prueba de integración ligera cubre
  esas cadenas sin requerir una conexión PostgreSQL.
- Next ejecuta cada workspace desde `apps/web`, por lo que no lee automáticamente el `.env` del
  monorepo. La configuración web obtiene de forma explícita solo `NEXT_PUBLIC_API_BASE_URL` del
  `.env` raíz. Las variables de base de datos y otros secretos no se exponen al proceso web.
- Una respuesta `200 []` de `GET /branches` confirma que Prisma y PostgreSQL están conectados,
  pero que el seed no dejó sucursales activas. El seed es idempotente mediante `upsert`, por lo
  que puede ejecutarse de nuevo sin reinicializar el esquema.

## Resultado final

Pendiente de completar tras las verificaciones.
