# ERD lógico — Brasa Viva

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    ROLES ||--o{ USER_ROLES : grants
    USERS ||--o{ USER_BRANCHES : assigned
    BRANCHES ||--o{ USER_BRANCHES : contains

    BRANCHES ||--o{ BRANCH_BUSINESS_HOURS : has
    BRANCHES ||--o{ BRANCH_SERVICES : offers

    CATEGORIES ||--o{ PRODUCTS : classifies
    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ PRODUCT_VARIANTS : has
    PRODUCTS ||--o{ PRODUCT_ADDONS : allows
    ADDONS ||--o{ PRODUCT_ADDONS : linked

    BRANCHES ||--o{ BRANCH_PRODUCTS : offers
    PRODUCTS ||--o{ BRANCH_PRODUCTS : available_at

    PROMOTIONS ||--o{ PROMOTION_PRODUCTS : includes
    PRODUCTS ||--o{ PROMOTION_PRODUCTS : promoted
    PROMOTIONS ||--o{ PROMOTION_BRANCHES : applies_to
    BRANCHES ||--o{ PROMOTION_BRANCHES : receives

    CUSTOMERS ||--o{ ORDERS : places
    BRANCHES ||--o{ ORDERS : receives
    ORDERS ||--|{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : snapshots
    PRODUCT_VARIANTS ||--o{ ORDER_ITEMS : variant
    PROMOTIONS ||--o{ ORDER_ITEMS : applied
    ORDER_ITEMS ||--o{ ORDER_ITEM_ADDONS : contains
    ADDONS ||--o{ ORDER_ITEM_ADDONS : snapshots
    ORDERS ||--o{ ORDER_STATUS_HISTORY : changes

    BRANCHES ||--o{ ANALYTICS_EVENTS : related
    PRODUCTS ||--o{ ANALYTICS_EVENTS : related
    PROMOTIONS ||--o{ ANALYTICS_EVENTS : related
    ORDERS ||--o{ ANALYTICS_EVENTS : related
```

## Relaciones críticas

### Producto ↔ sucursal

Es N:M mediante `branch_products`.

`products.base_price` representa el precio general y `branch_products.price_override` permite sobrescribirlo por sucursal.

### Promoción ↔ sucursal

Es N:M mediante `promotion_branches`.

### Promoción ↔ producto

Es N:M mediante `promotion_products`.

### Usuario ↔ rol

Es N:M mediante `user_roles`.

### Usuario ↔ sucursal

Es N:M mediante `user_branches`, lo que permite que un gerente u operador trabaje con una o más sucursales.

### Pedido

Un pedido pertenece a una sola sucursal y contiene uno o más `order_items`.

Los ítems guardan snapshots de nombre y precio. Esta decisión es deliberada: un cambio futuro del catálogo nunca debe alterar el contenido histórico de un pedido.
