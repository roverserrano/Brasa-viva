# Base de datos PostgreSQL — Brasa Viva

Este paquete contiene un esquema PostgreSQL pensado para el MVP de Brasa Viva y para su crecimiento posterior sin convertir el sistema en microservicios desde el inicio.

## Archivos

- `schema.sql`: esquema principal, constraints, índices, vistas y auditoría.
- `seed.sql`: roles, categorías y configuración mínima.
- `nest-audit-context.md`: cómo NestJS debe informar a PostgreSQL qué usuario realiza cada cambio.

## Modelo principal

El esquema cubre:

- usuarios administrativos y roles;
- asignación de usuarios a sucursales;
- sucursales, horarios y servicios;
- categorías, productos, variantes, imágenes y extras;
- disponibilidad y precio por sucursal;
- promociones por producto y sucursal;
- clientes;
- pedidos, ítems, extras e historial de estados;
- banners y configuración del sitio;
- eventos analíticos;
- auditoría centralizada.

## Auditoría

Las tablas de negocio contienen:

- `created_at`
- `updated_at`
- `deleted_at`
- `created_by`
- `updated_by`
- `deleted_by`

Además existe `audit_log`, que conserva el antes y después de cada INSERT, UPDATE, borrado lógico, restauración o DELETE físico.

La API debe establecer en cada transacción:

```sql
SET LOCAL app.current_user_id = 'UUID_DEL_USUARIO_DE_PUBLIC.USERS';
SET LOCAL app.request_id = 'req_abc123';
SET LOCAL app.client_ip = '190.0.0.1';
```

Los triggers se encargan del resto.

Para operaciones públicas (por ejemplo, un pedido creado por un cliente no autenticado), `app.current_user_id` puede quedar vacío; los timestamps y el log se mantienen igualmente.

## Soft delete

La aplicación no debería borrar físicamente datos de negocio en operación normal.

Ejemplo:

```sql
UPDATE products
SET deleted_at = now()
WHERE id = '...';
```

El trigger asignará `deleted_by` usando `app.current_user_id`.

Para restaurar:

```sql
UPDATE products
SET deleted_at = NULL
WHERE id = '...';
```

La auditoría registrará la acción como `RESTORE`.

## Precios

Regla crítica:

- `products.base_price` = precio general.
- `branch_products.price_override` = precio específico de una sucursal.
- precio efectivo = `COALESCE(price_override, base_price)`.

El navegador nunca es fuente de verdad del total de un pedido.

Cuando se crea un pedido, NestJS debe consultar el catálogo vigente y almacenar snapshots en `order_items`:

- nombre del producto;
- variante;
- precio unitario;
- descuento;
- total de línea.

De esta manera, cambiar un producto mañana no modifica pedidos históricos.

## Pedidos

`orders.order_number` es un identity BIGINT.

Un trigger genera:

```text
BV-000001
BV-000002
...
```

en `orders.order_code`.

También existe `order_status_history`, que registra automáticamente los cambios de estado.

## Ejecución

En una base nueva:

```bash
psql "$DATABASE_URL" -f schema.sql
psql "$DATABASE_URL" -f seed.sql
```

En Supabase se puede ejecutar el contenido mediante una migración SQL o desde el SQL Editor.

## Prisma

Prisma debe modelar las mismas tablas, pero los siguientes elementos deben mantenerse mediante migraciones SQL manuales cuando sea necesario:

- triggers;
- funciones de auditoría;
- vistas;
- índices parciales;
- tipos PostgreSQL específicos.

No eliminar estos objetos si Prisma genera una migración de reconciliación.

## Borrado físico

Las FK usan principalmente `ON DELETE RESTRICT` de forma deliberada. Esto obliga a conservar historia y evita que borrar accidentalmente una sucursal, producto o usuario destruya pedidos o auditoría.

La purga física, si alguna vez se requiere por política de retención, debe ejecutarse como un proceso administrativo separado y controlado.

## Recomendación de backups

Para producción:

- backups automáticos diarios;
- Point-in-Time Recovery si el plan de infraestructura lo permite;
- probar restauraciones periódicamente;
- no considerar un backup válido hasta haber probado que restaura.

## Próximos objetos posibles

No están incluidos porque quedan fuera del MVP:

- cupones;
- fidelización/puntos;
- pagos en línea;
- inventario transaccional;
- facturación;
- repartidores;
- POS;
- colas/Redis.

Se pueden añadir como módulos sin modificar los límites principales del esquema.
