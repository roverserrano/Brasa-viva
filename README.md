# Brasa Viva

Plataforma de menú, sucursales, pedidos y administración para Brasa Viva.

- [Guía de uso para clientes y personal](docs/USER_GUIDE.md).
- [Configuración y validación antes del lanzamiento](docs/RELEASE_READINESS.md).
- [Diseño público, imágenes y revisión visual](docs/PUBLIC_DESIGN.md).

## Requisitos

- Node.js 22 o superior.
- pnpm 10 o superior.
- PostgreSQL 16 o superior para migraciones y API con datos.

## Arranque local

1. Copia `.env.example` a `.env` y completa las variables de Supabase cuando estén disponibles.
2. Instala dependencias con `pnpm install`.
3. Genera el cliente Prisma con `pnpm prisma:generate`.
4. Aplica las migraciones existentes con `pnpm prisma:deploy` y carga los datos de desarrollo con
   `pnpm prisma db seed`.
5. Inicia las aplicaciones con `pnpm dev`.

La web queda en `http://localhost:3000` y la API expone `GET /api/v1/health` en
`http://localhost:4000/api/v1/health`.

## Primer acceso administrativo

1. En Supabase Auth, crea la cuenta del primer propietario con correo y contraseña.
2. En `.env`, configura `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY` y `ADMIN_BOOTSTRAP_EMAIL` con el mismo correo del propietario.
   La publishable key puede estar en el navegador; no copies una secret/service-role key allí.
3. Inicia API y web, visita `http://localhost:3000/admin/login` e ingresa con esa cuenta. Si aún
   no existe un owner activo, la API crea el usuario local y le asigna `OWNER` en una transacción.
4. Desde **Usuarios**, el owner preautoriza otros correos, roles y sucursales. Cada persona debe
   tener una cuenta de Supabase Auth con el mismo correo; al iniciar sesión por primera vez, su UUID
   se vincula al acceso local preautorizado.

El bootstrap se cierra después de crear el primer owner. Un correo no configurado o sin un rol local
recibe `403`, aunque tenga una sesión válida de Supabase.

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Datos

`prisma/schema.prisma` define el modelo ejecutable. El directorio `postgresql/` conserva el
diseño SQL de referencia, incluidos triggers, vistas e índices parciales que deben trasladarse
en migraciones SQL revisadas cuando se habilite la base de desarrollo.

Para reinicializar una base de desarrollo desechable, ejecuta `pnpm exec prisma migrate reset --force`.
Ese comando elimina todos los datos del esquema `public`, aplica las migraciones y ejecuta el seed.
