# Backend / API

## Stack

- NestJS.
- Node.js.
- TypeScript strict.
- REST JSON.
- `/api/v1`.
- Swagger/OpenAPI.
- Prisma ORM 7.
- PostgreSQL (Supabase).
- Supabase Auth.
- Supabase Storage.

## Estructura recomendada

```text
apps/api/src/
├─ main.ts
├─ app.module.ts
├─ common/
│  ├─ auth/
│  ├─ errors/
│  ├─ logging/
│  ├─ validation/
│  └─ pagination/
└─ modules/
   ├─ auth/
   ├─ users/
   ├─ branches/
   ├─ categories/
   ├─ products/
   ├─ promotions/
   ├─ orders/
   ├─ customers/
   ├─ analytics/
   └─ audit/
```

Dentro de un módulo, preferir una estructura legible:

```text
products/
├─ products.controller.ts
├─ products.module.ts
├─ application/
│  └─ ...
├─ domain/
│  └─ ...
├─ infrastructure/
│  └─ products.repository.ts
├─ dto/
└─ __tests__/
```

No crear capas vacías solo para cumplir una forma. Mantener la separación conceptual.

## API

Base:

```text
/api/v1
```

Recursos iniciales:

```text
GET    /products
GET    /products/:slug
GET    /categories
GET    /branches
GET    /branches/:slug
GET    /promotions
POST   /orders

/admin/products
/admin/categories
/admin/branches
/admin/promotions
/admin/orders
/admin/users
```

La forma exacta puede evolucionar, pero mantener REST y versionado.

## Controladores

El endpoint privado `GET /admin/dashboard/insights` acepta `days=7|30|90` y `branchId` UUID
opcional. Su contrato, definiciones y alcance RBAC están en `docs/ADMIN_DASHBOARD.md`.
Agrega datos de pedidos en PostgreSQL con parámetros, sin trasladar el historial al cliente.

Responsabilidades:

- parsear request;
- aplicar pipes/guards;
- llamar a caso de uso;
- mapear respuesta HTTP.

No:

- calcular precios;
- decidir promociones;
- consultar Prisma directamente salvo adaptadores extremadamente simples y justificados;
- implementar autorización manual repetida en cada controller.

## Validación

Todos los inputs externos deben validarse:

- body;
- params;
- query;
- tokens/claims relevantes;
- uploads.

No confiar en tipos TypeScript en runtime.

## Pedidos

`POST /orders` no acepta como autoridad:

- `unitPrice`;
- `subtotal`;
- `discount`;
- `total`.

Acepta identificadores/configuración y el backend resuelve importes.

Proceso:

```text
validate payload
→ validate branch
→ load products
→ validate branch availability
→ validate variants/extras
→ resolve prices
→ resolve active promotions
→ calculate
→ transaction
→ generate human order number
→ response
```

Usar transacción para pedido + items y cualquier dato inseparable de esa creación.

## Errores

Los errores HTTP mantienen code/message/details seguros y requestId. Los fallos internos se
reportan con un mensaje genérico en español. Las mutaciones admin usan aislamiento serializable;
conflictos de escritura responden 409 para revisión del usuario, sin reintento ciego del POST.
PATCH de promoción combina los campos persistidos con la entrada y valida la regla completa.

Definir un formato consistente, por ejemplo:

```json
{
  "code": "PRODUCT_UNAVAILABLE",
  "message": "Uno de los productos ya no está disponible.",
  "details": {}
}
```

No filtrar:

- stack trace;
- SQL;
- service keys;
- paths sensibles.

Distinguir adecuadamente 400/401/403/404/409/422/500 según la semántica adoptada.

## Auth

Supabase Auth emite identidad.

NestJS debe:

- validar token;
- obtener usuario;
- mapear rol/permisos de aplicación;
- aplicar guards/policies.

No confiar en un `role` enviado por el frontend.

## RBAC

Roles iniciales:

```text
OWNER
ADMIN
BRANCH_MANAGER
EDITOR
OPERATOR
```

Definir capacidades centralizadas, no `if (role === ...)` dispersos en todo el código.

Un `BRANCH_MANAGER` debe quedar limitado a sus sucursales cuando la regla lo requiera.

## Prisma

- Toda query de producción pasa por Prisma/repositories salvo excepción documentada.
- Evitar N+1.
- Seleccionar solo campos necesarios cuando las entidades crezcan.
- Paginar listados administrativos.
- No exponer modelos Prisma como contratos API públicos.
- Migrations versionadas.

## Dinero

El contrato normaliza importes de texto con punto/coma y uno o dos decimales a dos decimales.
Esto incluye la salida de Prisma Decimal que puede serializar `32.5`; la normalización no convierte
los importes enviados por el cliente en autoridad del total del pedido.

Usar `Decimal` como estándar actual.

Nunca:

```ts
const total = 0.1 + 0.2
```

como cálculo monetario autoritativo.

Centralizar helpers/política de redondeo.

## Fechas

Persistir timestamps coherentes, preferiblemente UTC.
Aplicar `America/La_Paz` al presentar/evaluar reglas comerciales locales cuando corresponda.

## Uploads

Para imágenes:

1. validar tipo/tamaño;
2. generar path seguro;
3. subir a Supabase Storage;
4. persistir referencia/URL;
5. reemplazar/eliminar con cuidado de referencias.

No confiar en nombre original del archivo como path seguro.

## Cache e invalidación

El backend debe informar/coordinar una estrategia para invalidar contenido público cuando
muta catálogo/promoción/sucursal.

No introducir Redis en MVP solo por este motivo.

## Logging

Logs estructurados.

Cada error relevante debe incluir contexto seguro:

- request id;
- route;
- actor id si aplica;
- entity id;
- error code.

No registrar:

- passwords;
- tokens;
- service keys;
- datos sensibles innecesarios.

## Swagger

Mantener Swagger/OpenAPI actualizado.
Cualquier endpoint nuevo o cambiado debe reflejar:

- auth;
- params;
- body;
- response;
- errores principales.

## Testing backend

Unit:

- reglas de precio;
- promoción activa;
- permisos;
- order number;
- validadores.

Integration:

- repositories;
- creación transaccional de pedido;
- restricciones de datos.

E2E/API:

- crear pedido válido;
- producto no disponible;
- sucursal inválida;
- precio manipulado ignorado;
- promoción expirada;
- admin sin permiso;
- admin con permiso.

## Funciones futuras

No implementar todavía:

- WebSockets;
- Redis;
- BullMQ;
- pagos;
- inventario;
- POS;
- delivery fleet;
- loyalty.

Diseñar módulos actuales para no impedirlas, pero no crear infraestructura especulativa.
