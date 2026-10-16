# Contexto de auditoría desde NestJS

PostgreSQL no conoce automáticamente al usuario autenticado en Supabase. NestJS debe informar el identificador de `public.users.id` dentro de la misma transacción que modifica datos.

## Patrón recomendado

Pseudocódigo con Prisma:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`
    SELECT set_config('app.current_user_id', ${user.id}, true)
  `;

  await tx.$executeRaw`
    SELECT set_config('app.request_id', ${requestId}, true)
  `;

  if (clientIp) {
    await tx.$executeRaw`
      SELECT set_config('app.client_ip', ${clientIp}, true)
    `;
  }

  await tx.product.update({
    where: { id: productId },
    data: {
      basePrice: newPrice
    }
  });
});
```

El tercer argumento `true` de `set_config` hace que el valor sea local a la transacción.

## No confiar en campos de auditoría enviados por el cliente

No aceptar desde DTOs públicos:

- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`
- `updated_by`
- `deleted_by`

Para un soft delete, el servicio solo necesita establecer `deleted_at`. PostgreSQL asigna `deleted_by`.

## Usuario de aplicación vs Supabase Auth

El JWT de Supabase identifica `auth.users.id`.

NestJS debe resolver ese UUID contra:

```text
public.users.auth_user_id
```

y utilizar:

```text
public.users.id
```

como `app.current_user_id`.

Esto desacopla la trazabilidad del proveedor de autenticación.

## Operaciones anónimas

Los pedidos públicos pueden crear:

- customer;
- order;
- order_items;
- analytics_events.

En esos casos puede no existir `app.current_user_id`; la auditoría registra el cambio con `user_id = NULL`, pero conserva timestamp, request id e IP si se proporcionan.

## Request ID

Cada solicitud HTTP debería tener un identificador único.

Ejemplo:

```text
req_01J9...
```

Debe propagarse a logs de NestJS y a:

```text
app.request_id
```

Esto permite unir:

```text
HTTP log
  -> application log
  -> database audit_log
```

durante debugging o investigaciones.
