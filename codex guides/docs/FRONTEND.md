# Frontend

## Stack

- Next.js 16 App Router.
- React.
- TypeScript strict.
- Tailwind CSS.
- Zustand para carrito/sucursal seleccionada.
- TanStack Query para server-state dinámico del admin cuando aporte valor.
- React Hook Form para formularios complejos.
- Zod para validación de formularios/contratos compartidos cuando corresponda.

## Principios

1. Mobile-first.
2. SEO-first en páginas públicas.
3. Server Components por defecto.
4. Client Components solo por necesidad de interacción/browser APIs.
5. La UI no contiene reglas críticas que el backend no replique.
6. No acceder directamente a tablas PostgreSQL.
7. No exponer service role keys.
8. Evitar JavaScript innecesario en páginas públicas.

## Estructura recomendada

```text
apps/web/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx
│  │  ├─ menu/
│  │  ├─ promociones/
│  │  ├─ sucursales/
│  │  ├─ nosotros/
│  │  └─ contacto/
│  ├─ (checkout)/
│  │  ├─ carrito/
│  │  └─ pedido/
│  └─ admin/
├─ components/
│  ├─ ui/
│  └─ domain/
├─ features/
│  ├─ menu/
│  ├─ cart/
│  ├─ checkout/
│  ├─ branches/
│  ├─ promotions/
│  └─ admin/
├─ lib/
├─ hooks/
└─ public/
```

No crear un directorio global enorme de componentes sin ownership funcional.

## Componentes base

UI:

- Button
- Input
- Select
- Dialog
- Drawer
- Toast
- Tabs
- Badge
- Card

Dominio:

- ProductCard
- ProductDetail
- PromotionCard
- BranchCard
- OrderCard
- QuantitySelector
- CartItem
- Price

## Estado

### Local

React state para:

- modal;
- tab;
- toggle;
- cantidad visual;
- controles efímeros.

### Global cliente

Zustand:

- items del carrito;
- sucursal seleccionada;
- preferencias mínimas del checkout.

Persistencia con `localStorage` solo para datos no sensibles.

### Server state

TanStack Query principalmente en admin para:

- pedidos;
- dashboard;
- listas mutables;
- polling cuando se implemente.

No usar TanStack Query por reflejo en páginas que pueden resolverse de forma limpia en
Server Components.

## Comunicación API

Crear una capa de cliente API centralizada.

No dispersar:

```ts
fetch("https://...")
```

por componentes.

El cliente debe:

- usar `NEXT_PUBLIC_API_BASE_URL` para base pública;
- tipar request/response con contratos compartidos;
- manejar errores de forma consistente;
- enviar token administrativo cuando corresponda;
- no reintentar mutaciones peligrosas sin control.

## Carrito

El store debe persistir:

- `productId`;
- configuración de item;
- cantidad;
- sucursal cuando aplique.

No persistir total como verdad.

Al llegar al checkout, mostrar que precios/promociones pueden ser revalidados.

Si el backend responde cambios de precio/disponibilidad, la UI debe reflejarlos claramente
y permitir al usuario corregir el pedido.

## Checkout

Pasos conceptuales:

1. revisar carrito;
2. seleccionar/confirmar sucursal;
3. tipo: recojo/delivery;
4. datos cliente;
5. resumen;
6. submit a API;
7. recibir order number;
8. abrir WhatsApp con el mensaje generado desde la respuesta validada.

No abrir WhatsApp antes de un `201`/resultado exitoso del backend.

## Admin

`/admin` requiere sesión.

La UI debe respetar roles para experiencia de usuario, pero nunca considerar eso una
protección suficiente. El backend sigue siendo autoridad.

Formularios administrativos deben:

- validar en cliente para UX;
- validar en servidor/API para seguridad;
- mostrar errores accionables;
- evitar dobles submits;
- invalidar/revalidar cache al mutar datos públicos.

## SEO

Para contenido público:

- metadata por página;
- canonical cuando corresponda;
- sitemap;
- robots;
- Open Graph;
- JSON-LD apropiado.

No indexar páginas privadas/admin.

## Imágenes

- `next/image`.
- Preferir WebP/AVIF.
- Tamaños responsivos.
- Lazy loading fuera del contenido prioritario.
- Hero crítico con estrategia adecuada de preload/priority si mejora LCP.
- Alt text descriptivo para contenido, alt vacío para decoración.
- No subir imágenes gigantes sin optimización.

## Diseño

Prioridad de breakpoints de validación:

- ~375 px;
- ~430 px;
- ~768 px;
- ~1440 px.

Identidad provisional:

- rojo intenso;
- amarillo cálido;
- crema;
- negro carbón;
- blanco.

No hardcodear la identidad por toda la app. Centralizar tokens para facilitar cambio de marca.

## Accesibilidad

Mínimos:

- labels asociados;
- navegación por teclado;
- foco visible;
- contraste;
- headings semánticos;
- aria solo cuando HTML semántico no basta;
- targets táctiles adecuados;
- mensajes de error legibles;
- no depender solo del color.

## Rendimiento

Objetivos del producto:

- LCP < 2.5 s;
- CLS < 0.1;
- INP < 200 ms;
- Lighthouse Performance 90+;
- SEO 95+;
- Accessibility 90+.

No falsear Lighthouse eliminando funcionalidad necesaria.

## Testing frontend

- componentes con lógica: Testing Library;
- stores: unit tests;
- checkout: integration/E2E;
- admin crítico: E2E;
- responsive/visual: revisión en viewports objetivos.

Casos importantes:

- carrito persiste;
- producto agotado/desactivado entre navegación y checkout;
- cambio de precio;
- promoción expirada;
- sucursal inválida;
- fallo API;
- WhatsApp solo después de crear pedido.
