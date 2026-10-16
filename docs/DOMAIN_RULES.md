# Reglas de dominio

Estas reglas son invariantes de negocio. No deben vivir solo en la UI.

## Indicadores administrativos

El resumen ejecutivo usa pedidos persistidos y el alcance de sucursales autorizado en backend.
Agrupa por fecha de creación y estado actual; importes y ticket excluyen cancelados y no equivalen
a cobros. Conteos de pedidos, estados y modalidades sí incluyen cancelados. Calendario de Bolivia,
hoy parcial, comparación con días anteriores completos. Definiciones en `docs/ADMIN_DASHBOARD.md`.

## 1. Productos y sucursales

Un producto es una entidad global de catálogo.

Un producto puede:

- ofrecerse en varias sucursales;
- no estar disponible en algunas;
- tener un precio específico por sucursal.

Por tanto:

```text
Product 1 ──< BranchProduct >── 1 Branch
```

`BranchProduct` es la asociación autoritativa para disponibilidad local.

No duplicar productos completos por sucursal para resolver precio/disponibilidad.

## 2. Precio efectivo

Orden recomendado para resolver precio:

1. producto debe estar activo;
2. asociación `branch_product` debe existir y estar disponible;
3. si existe `price_override`, usarlo;
4. si no, usar `product.base_price`;
5. aplicar promoción válida solo si cumple fecha, sucursal y condiciones;
6. calcular total exclusivamente en backend.

El frontend puede mostrar un precio, pero no debe enviarlo como valor confiable.

## 3. Carrito

El carrito del navegador es estado temporal, no transaccional.

Puede almacenar:

- `productId`;
- variante seleccionada, si existe;
- extras seleccionados, si existen;
- cantidad;
- sucursal seleccionada si ya existe.

No almacenar un `total` como fuente de verdad.

## 4. Creación de pedido

Al recibir `POST /api/v1/orders`, el backend debe:

1. validar shape del request;
2. validar sucursal;
3. validar que la sucursal esté habilitada para recibir pedidos;
4. cargar productos por ID;
5. verificar productos activos;
6. verificar disponibilidad por sucursal;
7. verificar variantes/extras solicitados;
8. resolver precios efectivos;
9. verificar promociones activas;
10. calcular subtotales;
11. calcular total;
12. persistir pedido e items en una transacción;
13. generar/guardar identificador humano;
14. devolver datos necesarios para continuar con WhatsApp.

Si cualquiera de las validaciones críticas falla, no crear un pedido parcial.

## 5. Snapshot histórico del pedido

Los `order_items` deben conservar la información necesaria para reconstruir el pedido
tal como fue vendido, incluso si después cambia el catálogo.

Como estándar de implementación, conservar al menos:

- `product_id` como referencia cuando exista;
- nombre visible snapshot;
- precio unitario snapshot;
- cantidad;
- subtotal;
- variante/extras snapshot cuando aplique.

No recalcular pedidos históricos usando precios actuales.

## 6. WhatsApp

WhatsApp es canal de continuación/comunicación del pedido en el MVP.

Regla:

```text
persistir pedido → recibir orderNumber → generar mensaje WhatsApp
```

No:

```text
generar WhatsApp → quizá guardar pedido
```

El mensaje debe incluir al menos:

- número de pedido;
- sucursal;
- items/cantidades;
- total calculado por backend;
- nombre del cliente;
- tipo de pedido.

## 7. Recojo

Para recojo:

- el cliente elige sucursal;
- puede indicar hora si el flujo la admite;
- el pedido queda asociado a esa sucursal.

No seleccionar silenciosamente una sucursal por geolocalización.

## 8. Delivery MVP

El MVP permite elegir delivery y registrar la dirección/datos necesarios.

No incluye:

- algoritmo de cobertura;
- tarifa automática obligatoria;
- tracking;
- repartidores;
- asignación automática.

La sucursal puede confirmar costo y condiciones por WhatsApp.

## 9. Promociones

El panel puede leer una promoción histórica sin productos para repararla, pero no activarla.
Despublicarla siempre está permitido. Toda edición de vigencia o descuento revalida la promoción
completa; el listado público excluye promociones sin relaciones de producto vigentes.

Una promoción tiene:

- estado de publicación;
- `starts_at`;
- `ends_at`;
- productos/condiciones asociadas;
- una o varias sucursales o alcance global.

Una promoción es activa solo si cumple todas sus condiciones de publicación/fecha/alcance.

La expiración debe resolverse por datos/consulta. No requerir un cron para “apagar” la
promoción del MVP.

Para promociones simples por producto (`FIXED_PRICE`, `PERCENTAGE` y `FIXED_DISCOUNT`), el
backend puede elegir la promoción elegible que deje el menor precio unitario. Las promociones
`BUNDLE` requieren una composición explícita de productos/cantidades y no se aplican hasta que
esa regla se implemente. Ninguna promoción puede aumentar el precio ni producir un importe
negativo.

## 10. Categorías

Las categorías son datos administrables.

No modelarlas como enum fijo porque el negocio puede crear/eliminar/reordenar categorías.

## 11. Desactivación y borrado

Para entidades utilizadas por pedidos históricos:

- preferir `active = false` / estado equivalente;
- evitar borrado físico que rompa historial.

Pedidos y audit logs no deben borrarse como efecto colateral de eliminar/desactivar catálogo.

## 12. Roles

Roles base:

### OWNER

Acceso completo.

### ADMIN

Administración operativa general, exceptuando acciones reservadas al owner si se definen.

### BRANCH_MANAGER

Acciones limitadas a su(s) sucursal(es), especialmente disponibilidad y operación.

### EDITOR

Productos/promociones dentro de permisos concedidos.

### OPERATOR

Pedidos/operación según alcance.

Toda decisión de autorización se valida en backend.

Debe permanecer al menos un propietario activo. Esta regla se verifica dentro de la transacción
de cambio de acceso, además de la validación previa del servicio.

Los estados de pedido comparten una máquina explícita con el frontend: RECEIVED → CONFIRMED
o CANCELLED, CONFIRMED → PREPARING o CANCELLED, PREPARING → READY o CANCELLED y READY →
COMPLETED o CANCELLED. Los terminales no cambian. La persistencia comprueba el estado actual
y rechaza conflictos, incluso si cambió después de la validación inicial del servicio.

## 13. Auditoría

Registrar al menos cambios sensibles como:

- cambio de precio;
- disponibilidad;
- creación/edición/publicación de promoción;
- cambios relevantes de sucursal;
- cambios de roles/permisos;
- desactivaciones.

Un audit log debe poder identificar:

- actor;
- acción;
- entidad;
- entidad ID;
- momento;
- metadata antes/después cuando sea razonable.

## 14. Dinero

Estándar de implementación añadido para evitar errores:

- no usar `float` como valor monetario autoritativo;
- usar `Decimal` en PostgreSQL/Prisma para precios e importes;
- redondear de forma explícita en el backend;
- serializar contratos de dinero de manera consistente.

Si se cambia a unidades menores enteras, debe hacerse globalmente y documentarse.

## 15. Tiempo y zona horaria

Las fechas de persistencia deben ser consistentes y preferiblemente almacenarse en UTC.
La presentación y reglas comerciales deben respetar la zona local del negocio
(`America/La_Paz`) cuando aplique.

No comparar promociones usando timestamps ambiguos del navegador.

## 16. Slugs

Productos y sucursales con páginas públicas deben tener `slug` único y estable.

Cambiar un slug publicado puede afectar SEO; tratarlo como cambio consciente.

## 17. Fuente de verdad

- Catálogo/precios/promociones/pedidos: NestJS + PostgreSQL.
- Identidad administrativa: Supabase Auth.
- Archivos/imágenes: Supabase Storage.
- Carrito previo a confirmación: navegador.
- UI nunca es fuente de verdad de autorización ni precio.
