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
