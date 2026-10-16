# Modelo de datos

## Alcance

Este documento define el modelo conceptual mínimo. `prisma/schema.prisma` será la fuente
ejecutable del esquema cuando exista, pero no debe divergir de estas invariantes.

## Entidades MVP

```text
users
roles / user_roles (según estrategia)
user_branches

branches

categories
products
product_variants
product_extras            (si se implementan extras en MVP)
product_images
branch_products

promotions
promotion_products
promotion_branches

customers                  (registro liviano asociado a pedidos, no cuenta)
orders
order_items

banners                    (si Home administrable lo requiere)
site_settings
audit_logs
```

No todas necesitan existir en el primer commit. Crear según el incremento funcional.

## Identificadores

Recomendación estándar:

- PK internas: UUID.
- identificadores humanos separados donde sea necesario, por ejemplo `order_number`.
- `slug` único para entidades públicas relevantes.

## Branch

Campos conceptuales:

- `id`
- `name`
- `slug`
- `address`
- `latitude`
- `longitude`
- `phone`
- `whatsapp`
- `status` / `active`
- `image_url`
- `map_url` o datos equivalentes
- servicios/capacidades
- timestamps

Horarios pueden modelarse en una tabla dedicada cuando se requieran excepciones/estructura.

## Category

- `id`
- `name`
- `slug`
- `description` opcional
- `sort_order`
- `active`
- timestamps

No usar enum fijo.

## Product

- `id`
- `category_id`
- `name`
- `slug`
- `description`
- `base_price` Decimal
- `active`
- `featured`
- `is_new`
- timestamps

No `branch_id`.

## BranchProduct

Clave lógica única: `(branch_id, product_id)`.

- `id` o PK compuesta según decisión Prisma;
- `branch_id`;
- `product_id`;
- `available`;
- `price_override` Decimal nullable;
- `stock_status`;
- timestamps.

Índices:

- branch;
- product;
- combinación única.

## ProductVariant

Cuando se implemente:

- `id`
- `product_id`
- `name`
- ajuste de precio según diseño
- `active`
- orden

No introducir variantes si el primer incremento no las necesita, pero no modelarlas como
texto libre en pedido si ya son administrables.

## ProductExtra

Misma filosofía de variantes. Si extras se implementan, deben ser entidades/relaciones
consistentes y validables por backend.

## ProductImage

- `id`
- `product_id`
- `storage_path` / URL
- `alt_text`
- `sort_order`
- `is_primary`

## Promotion

Campos conceptuales:

- `id`
- `name`
- `slug`
- `description`
- estado/publicación;
- `starts_at`;
- `ends_at`;
- tipo/regla de descuento según incremento;
- contenido visual;
- timestamps.

La lógica exacta de promociones complejas se diseñará en un ExecPlan si excede combos/precio
simple del MVP.

## PromotionProduct

Relación N:M entre promociones y productos.

## PromotionBranch

Relación N:M entre promociones y sucursales.
Una promoción global puede representarse mediante una regla explícita; no inventar múltiples
filas si el modelo adopta `all_branches`.

## Customer

En MVP no representa una cuenta autenticada.

Puede almacenar datos mínimos del pedido:

- `id`
- `name`
- `phone`
- timestamps

Evitar recopilar información innecesaria.

## Order

Campos conceptuales:

- `id` UUID;
- `order_number` único (`BV-000142`);
- `branch_id`;
- `customer_id` nullable/según estrategia;
- `order_type` (`PICKUP`, `DELIVERY`);
- `status`;
- datos de contacto necesarios;
- dirección si delivery;
- `subtotal` Decimal;
- `discount_total` Decimal;
- `total` Decimal;
- timestamps.

Estados MVP pueden comenzar simples. Si se implementa workflow de estados, documentar
transiciones permitidas.

## OrderItem

Debe preservar snapshot histórico:

- `id`;
- `order_id`;
- `product_id` nullable si se requiere preservación ante catálogo;
- `product_name_snapshot`;
- `unit_price` (precio unitario efectivo antes del descuento de promoción);
- `quantity`;
- `discount_amount` y `line_total` como snapshots del descuento y total final de la línea;
- configuración snapshot (variante/extras) cuando aplique.

No depender del precio actual de `products` para mostrar un pedido histórico.

## User / Role

El usuario de aplicación se vincula con identidad de Supabase Auth.

Datos conceptuales:

- `id`
- `auth_user_id` único
- nombre/datos operativos
- estado
- rol o relación con roles
- timestamps

Si `BRANCH_MANAGER` requiere alcance:

```text
user_branches
```

con relación explícita.

## AuditLog

- `id`
- `actor_user_id`
- `action`
- `entity_type`
- `entity_id`
- `before_json` opcional
- `after_json` opcional
- `metadata_json` opcional
- `created_at`

Nunca guardar secretos en JSON de auditoría.

## SiteSettings

Solo configuraciones reales del sitio:

- marca/contacto;
- redes;
- defaults.

No convertirlo en una bolsa JSON para evitar modelar datos correctamente.

## Integridad

- FKs obligatorias cuando la relación sea real.
- constraints únicas para slugs/números públicos.
- impedir duplicar `branch_products`.
- timestamps.
- estados controlados.
- no cascade delete destructivo sobre pedidos/audit.

## Índices iniciales razonables

Además de PK/unique:

- `products(category_id, active)` según queries;
- `branch_products(branch_id, available)`;
- `promotions(starts_at, ends_at)` y estado;
- `orders(branch_id, created_at)`;
- `orders(status, created_at)` si admin lo usa;
- `audit_logs(entity_type, entity_id, created_at)`.

Validar índices con consultas reales antes de agregar muchos.

## Migrations

- Prisma migrations versionadas.
- Nunca cambiar esquema de producción manualmente.
- Cambios destructivos requieren plan.
- Seeds separados de migrations.
- Seed de desarrollo debe ser idempotente o claramente recreable.
