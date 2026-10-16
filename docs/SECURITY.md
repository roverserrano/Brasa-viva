# Seguridad

## Principios

1. Backend como frontera de confianza.
2. Menor privilegio.
3. Validar todo input externo.
4. No secretos en cliente o repositorio.
5. Autorización del lado servidor.
6. Auditoría de acciones sensibles.
7. No recopilar datos personales innecesarios.

## Secretos

Nunca exponer al navegador:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `DATABASE_URL`;
- credenciales SMTP/WhatsApp futuras;
- claves de payment gateway futuras;
- secretos JWT privados.

Variables `NEXT_PUBLIC_*` se consideran públicas.

`.env*` real no se commitea.
Mantener `.env.example` sin valores secretos.

## Variables esperadas

Nombres recomendados:

```text
# web
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# api
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_ISSUER=
SUPABASE_JWT_AUDIENCE=
WEB_ORIGIN=
```

Los nombres exactos pueden ajustarse una vez creado el proyecto, pero deben permanecer
documentados.

## Auth

- Supabase Auth para admins.
- Verificar firma/claims del JWT en API.
- No confiar en datos de rol enviados por cliente.
- Sesiones administrativas protegidas.
- Reset password por mecanismos del proveedor.
- MFA se considera evolución para roles privilegiados.

### Implementación MVP

La web obtiene la sesión administrativa de Supabase Auth y envía el access token únicamente en el
header `Authorization: Bearer` hacia NestJS. El API valida el token en el endpoint autenticado
`/auth/v1/user` del proyecto con la publishable key: esto mantiene la comprobación de firma,
expiración y pertenencia al proyecto en Supabase, incluso si el proyecto usa claves JWT heredadas.

El token aporta identidad, nunca roles. NestJS resuelve el usuario local, roles y sucursales desde
PostgreSQL en cada solicitud administrativa. `ADMIN_BOOTSTRAP_EMAIL` solo puede crear el primer
owner activo. Después, un owner preautoriza usuarios locales por correo; el UUID de Supabase se
vincula al primer login de ese mismo correo. Si una identidad ya vinculada intenta cambiar de UUID,
la API rechaza el acceso.

No se requiere ni se expone `SUPABASE_SERVICE_ROLE_KEY` para este flujo. Esa clave queda reservada
para integraciones futuras de backend, como invitaciones o Storage administrado.

## RBAC

Toda mutación admin debe declarar autorización.

Casos:

- OWNER: total.
- ADMIN: general.
- BRANCH_MANAGER: restringido a sucursales asignadas.
- EDITOR: catálogo/promos según permisos.
- OPERATOR: pedidos.

Añadir tests negativos: un usuario sin permiso no solo debe carecer del botón, debe recibir 403.

## Supabase

- Service role solo backend.
- RLS en Storage según política.
- Si alguna tabla se expone accidentalmente vía API de Supabase, RLS debe ser segura;
  aun así, la aplicación de negocio no debe saltarse NestJS.

## Input validation

Validar:

- texto;
- UUID;
- slug;
- números;
- Decimal;
- fechas;
- enums;
- archivos;
- URLs cuando existan;
- dirección/teléfono según la tolerancia del negocio.

Aplicar límites de longitud/tamaño.

## Uploads

- allowlist de MIME/type;
- límite de tamaño;
- nombres generados por servidor;
- no ejecutar contenido subido;
- paths sin traversal;
- eliminar metadata sensible si se introduce pipeline de imágenes y es necesario;
- separar buckets/path públicos de internos.

## Pedidos

Amenazas:

- manipulación de precio;
- cantidad negativa;
- producto inexistente;
- promoción expirada;
- sucursal inválida;
- spam.

Mitigaciones:

- backend recalcula;
- schemas estrictos;
- constraints;
- rate limiting cuando el endpoint esté expuesto en producción;
- logs/correlation IDs;
- protección anti-abuso proporcional.

## Rate limiting

El API aplica un guard global con ventanas por IP y memoria acotada: 10 pedidos, 30 escrituras
admin, 120 lecturas admin y 300 consultas públicas por minuto por instancia. En producción deben
configurarse IPs/subredes reales del proxy en `TRUSTED_PROXY_ADDRESSES`; por defecto no se confía
en headers de reenvío. Al escalar horizontalmente, el ingreso debe imponer límites agregados.
Estos presupuestos no sustituyen idempotencia de pedidos entre pestañas/dispositivos.

Las respuestas incluyen un identificador de solicitud. El filtro de errores omite stacks, SQL y
mensajes internos en fallos 5xx; el log registra solo tipo de error, ruta sin query e identificador.
La API privada envía `Cache-Control: no-store`. Swagger se habilita en producción únicamente con
`ENABLE_API_DOCS=true`. Los cambios de acceso se verifican dentro de transacciones serializables
para impedir la desactivación concurrente del último propietario.

El documento de producto exige rate limiting como parte de seguridad.

Implementarlo antes de producción al menos en:

- auth-related endpoints propios si existen;
- creación de pedidos;
- uploads;
- endpoints administrativos sensibles.

No introducir Redis solo por rate limiting si una solución in-process/infra es adecuada al MVP.

## CORS / origins

API debe aceptar solo orígenes necesarios.
Configurar development/staging/production explícitamente.

No usar `*` con credenciales.

## CSRF

Revisar según el mecanismo real de sesión. Si se usan bearer tokens en Authorization,
el perfil cambia; si se introducen cookies, aplicar protección correspondiente.

No marcar “CSRF resuelto” sin evaluar el mecanismo.

## XSS

- React escaping por defecto.
- Evitar `dangerouslySetInnerHTML`.
- Si se necesita contenido rico administrable, sanitizar con una política explícita.
- No confiar en HTML de promociones/descripciones.

## SQL injection

Prisma parametriza consultas habituales.
No usar raw SQL concatenando strings de usuario.
Raw SQL solo con bindings/ APIs seguras.

## Logging

Nunca loguear:

- passwords;
- JWT completos;
- service keys;
- database URL;
- datos personales completos si no son necesarios.

## Privacidad

En MVP, cliente no crea cuenta.
Guardar solo información necesaria para procesar el pedido.

Definir política de retención cuando el sistema pase a producción real.

## Dependencias

- lockfile obligatorio;
- no actualizar majors sin tarea;
- revisar advisories relevantes;
- minimizar paquetes sin mantenimiento.

## Headers

Next configura nosniff, DENY, referrer policy, permisos de cámara/micrófono/geolocalización
deshabilitados, HSTS en producción y CSP para frame-ancestors, base-uri y object-src. Esta CSP
parcial protege embedding/base/objetos; no se declara una política completa de scripts ni XSS
resuelto. Una política con nonce para scripts requiere diseño/validación adicional con Next.

Configurar headers razonables para web:
- HSTS en producción;
- frame protections/CSP según la aplicación;
- nosniff;
- referrer policy.

La CSP debe diseñarse con proveedores reales (Vercel, Supabase, analytics) y no copiarse a ciegas.

## Incidentes

Si se descubre un secreto en Git:

1. tratarlo como comprometido;
2. rotarlo;
3. eliminarlo del estado actual;
4. limpiar historial si corresponde;
5. revisar accesos/logs;
6. documentar la corrección.

No basta con borrar la línea del último commit.
