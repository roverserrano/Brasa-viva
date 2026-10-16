# Arquitectura de Brasa Viva

## Estado

**Autoritativo para decisiones técnicas.**

Este documento consolida la arquitectura del sistema. Si una especificación de producto
antigua sugiere acceso directo Next.js → Supabase/PostgreSQL, esta arquitectura prevalece:
las reglas de negocio y el acceso a datos pasan por NestJS.

## Objetivos arquitectónicos

La solución debe:

- ser sencilla de operar con un equipo pequeño;
- soportar múltiples sucursales;
- conservar reglas de negocio en un único lugar;
- ofrecer buen SEO y rendimiento en la web pública;
- permitir un panel administrativo rico;
- permitir una futura app móvil/POS sin reescribir las reglas;
- evitar complejidad prematura;
- mantener portabilidad de PostgreSQL.

## Topología

```text
                         Internet
                            │
                            ▼
                     Next.js (web)
                 Vercel / App Router
                            │
                       HTTPS / REST
                            │
                            ▼
                      NestJS API
                    Monolito modular
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        PostgreSQL      Supabase Auth   Supabase Storage
             │
           Prisma
```

Evoluciones futuras, solo cuando exista una necesidad demostrada:

```text
NestJS
├─ Redis
├─ BullMQ
├─ WhatsApp API
├─ Payment gateway
└─ WebSockets
```

## Estilo arquitectónico

### Monolito modular

El backend es un único despliegue NestJS, dividido por dominios funcionales.
No crear microservicios para productos, pedidos, usuarios, pagos, promociones, etc.
en el MVP.

Dominios previstos:

```text
auth
users
branches
categories
products
promotions
orders
customers
analytics
audit
```

Dominios posteriores, no MVP:

```text
coupons
loyalty
payments
inventory
delivery
notifications
```

### Flujo de dependencias backend

```text
Controller
   ↓
Application Service / Use Case
   ↓
Domain rules
   ↓
Repository
   ↓
Prisma
   ↓
PostgreSQL
```

Reglas:

- Controllers traducen HTTP; no concentran lógica de negocio.
- Servicios/casos de uso deciden.
- Repositories encapsulan persistencia.
- Prisma no debe filtrarse indiscriminadamente hacia capas superiores.
- Los módulos no deben importarse circularmente.
- Cruces entre módulos se realizan mediante servicios públicos explícitos.

## Frontend

### Stack

- Next.js 16.
- React.
- TypeScript.
- Tailwind CSS.
- Zustand para estado global cliente pequeño (carrito/sucursal).
- `localStorage` para persistencia temporal de carrito.
- TanStack Query cuando el panel necesite cache/polling/server-state dinámico.
- Zod para validación/contratos donde corresponda.
- React Hook Form para formularios complejos cuando aporte valor.

### Aplicación única

Inicialmente habrá una sola aplicación Next.js:

```text
apps/web/app/
├─ (public)/
│  ├─ page.tsx
│  ├─ menu/
│  ├─ promociones/
│  ├─ sucursales/
│  ├─ nosotros/
│  └─ contacto/
├─ (checkout)/
│  ├─ carrito/
│  └─ pedido/
└─ admin/
   ├─ dashboard/
   ├─ productos/
   ├─ categorias/
   ├─ pedidos/
   ├─ promociones/
   ├─ sucursales/
   ├─ usuarios/
   └─ configuracion/
```

`admin.brasaviva.com` podrá mapear a `/admin` más adelante sin crear una segunda
aplicación salvo que exista un motivo operativo real.

### Rendering

- Contenido público y SEO: preferir Server Components/SSR/cache.
- Interacciones: Client Components.
- Evitar marcar árboles completos con `"use client"` sin necesidad.
- El frontend consume NestJS por REST.
- No leer/escribir tablas de negocio desde el navegador.

## Backend

### Stack

- Node.js.
- NestJS.
- TypeScript.
- REST JSON.
- API versionada `/api/v1`.
- OpenAPI/Swagger.
- Zod y/o pipes de Nest para validar entradas.
- Prisma ORM 7.
- PostgreSQL.

### Contratos

Los contratos reutilizables se ubican en `packages/contracts`.

Ejemplos:

```text
CreateOrderRequest
CreateOrderResponse
ProductResponse
BranchResponse
PromotionResponse
```

El objetivo es evitar que frontend y backend mantengan copias divergentes de shapes.

## Base de datos

### Motor

PostgreSQL administrado en Supabase.

La solución debe seguir siendo portable a otro PostgreSQL administrado en el futuro.

### ORM

Prisma ORM 7 es el estándar actual. No actualizar a una major nueva como parte de una
feature no relacionada. Toda actualización mayor requiere tarea explícita y verificación.

### Relación producto-sucursal

Nunca modelar:

```text
products.branch_id
```

El producto es global y su disponibilidad/precio puede variar por sucursal.

Modelo:

```text
products
   │
   └──< branch_products >── branches
```

`branch_products` contiene como mínimo:

- `product_id`
- `branch_id`
- `available`
- `price_override`
- `stock_status`

## Auth y autorización

### Autenticación

Supabase Auth gestiona login administrativo, sesiones, reset de contraseña y JWT.

Flujo:

```text
Browser
   ├── login → Supabase Auth
   └── JWT → NestJS
               └── valida identidad
```

### Autorización

NestJS es autoridad de permisos.

Roles:

- `OWNER`
- `ADMIN`
- `BRANCH_MANAGER`
- `EDITOR`
- `OPERATOR`

Ocultar un botón en UI no sustituye un guard/policy del backend.

## Storage

Supabase Storage para:

```text
/products/
/promotions/
/branches/
/banners/
```

Imágenes públicas de catálogo pueden ser públicas. Archivos internos, si existen,
deben ser privados.

La service role key solo vive en backend/infra segura.

## Pedidos

Flujo canónico:

```text
Cliente arma carrito
        ↓
Selecciona sucursal
        ↓
Selecciona recojo/delivery
        ↓
Introduce datos
        ↓
POST /api/v1/orders
        ↓
NestJS revalida todo y calcula importes
        ↓
Transacción PostgreSQL guarda pedido + items
        ↓
API devuelve orderNumber
        ↓
Frontend construye/abre mensaje WhatsApp
```

Nunca abrir WhatsApp como sustituto de persistir el pedido.

## Caché

El contenido público del menú puede usar cache de Next.js.
Cuando una mutación administrativa cambie contenido visible, se debe invalidar/revalidar
el contenido correspondiente.

No introducir Redis solo para cache del MVP.

## Observabilidad

El MVP debe disponer al menos de:

- logs estructurados en backend;
- request/correlation id cuando sea razonable;
- registro de errores sin secretos;
- métricas de producto mediante analytics en web;
- `audit_logs` para acciones administrativas definidas.

Observabilidad avanzada puede incorporarse después, pero el código no debe depender de
`console.log` dispersos como estrategia operativa.

## Despliegue

Objetivo:

- Web Next.js: Vercel.
- PostgreSQL/Auth/Storage: Supabase, preferentemente región São Paulo.
- NestJS: compute/container cercano a la región de PostgreSQL.
- Development, staging y production separados.

Evitar backend en una región distante de la base de datos.

## Decisiones prohibidas sin aprobación

No introducir por iniciativa propia:

- microservicios;
- GraphQL;
- MongoDB;
- Firebase como reemplazo;
- segunda fuente de verdad de datos;
- acceso directo Next.js → PostgreSQL para negocio;
- Redux;
- Kubernetes;
- Redis/BullMQ en MVP;
- backend separado por sucursal;
- app móvil nativa antes de validar el producto;
- sistema propio de repartidores;
- pagos online;
- inventario/POS.

Si un requisito futuro hace necesaria una de estas decisiones, escribir un ExecPlan
y documentar el motivo, impacto y migración.
