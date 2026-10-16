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
fetch('https://...');
```

por componentes.

El cliente debe:

- usar `NEXT_PUBLIC_API_BASE_URL` para base pública. En desarrollo local, `apps/web/next.config.ts`
  toma únicamente esta variable pública desde el `.env` de la raíz; no carga credenciales de
  servidor en el proceso de Next. Si la variable no está disponible durante `next dev`, el
  cliente servidor usa `http://127.0.0.1:4000/api/v1`; producción requiere una URL explícita;
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

El resumen ejecutivo y la navegación del panel se describen en `docs/ADMIN_DASHBOARD.md`.
Los controles de período/sucursal solicitan agregados autorizados al backend; las respuestas
tardías no sustituyen el filtro vigente. El gráfico tiene deslizador de teclado y tabla alternativa.
Los estilos ejecutivos se limitan al layout privado, con navegación desplegable en móviles.

Los formularios de mantenimiento usan `AdminForm` para bloquear doble envío y contratos
compartidos para validar antes de llamar al API. Los errores conservan el formulario. Los listados
principales tienen paginación y búsqueda por nombre dentro de la página; las opciones de relaciones
se cargan por páginas independientes para no omitir datos después del registro 100. El panel ofrece
estados/roles en español, horarios y servicios por sucursal, y campos de marca sin edición JSON.
Las tablas se presentan como tarjetas con etiquetas de columna en teléfonos.

El carrito valida su persistencia al recuperar, admite hasta 30 productos distintos y 99 unidades
por producto, y espera la hidratación antes de mostrar vacío. Las confirmaciones de cambio de
sucursal o vaciado conservan control explícito del usuario. No se reintenta un POST automáticamente.

La recuperación administrativa usa `/admin/restablecer` mediante un enlace de Supabase Auth.
La renovación de sesión se comparte entre solicitudes concurrentes de una pestaña. Fallos de red
no eliminan la sesión; un refresh inválido o un 401 del API sí requiere ingreso nuevamente.

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

La identidad pública y su recorrido se documentan en `docs/PUBLIC_DESIGN.md`. Los estilos
gastronómicos viven en `apps/web/app/public.css`, acotados al layout público. Fotografías
de presentación/ambientes generados llevan identificación ilustrativa. Las fotos de productos
proceden del catálogo; `ProductPhoto` muestra un placeholder cuando faltan o fallan.
El origen de Storage para next/image se limita al proyecto Supabase configurado.

La portada se compone desde `features/home/`; sus estilos están en `features/home/home.css`.
`PublicLink` retoma la sucursal del carrito hidratado en enlaces generales a `/menu`; una
sucursal explícita en la URL siempre tiene prioridad. `lib/menu-navigation.ts` centraliza
las URLs y conserva `branch`, `q` y `category` al abrir un producto y volver a sus resultados.
Las categorías se identifican por slug y la búsqueda ignora tildes.
La navegación inferior móvil ofrece inicio, menú, sucursales y carrito. La acción flotante del
carrito reserva espacio sobre ella, incluyendo el área segura del dispositivo.

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

El catálogo público conserva `branch`, `q`, `category` y `sort` en la URL. La UI de búsqueda
usa History y `useSearchParams`, sin refetch por tecla. Las fichas conservan ese contexto al
regresar; sus canonical incluyen solo producto y sucursal. `ProductCard` y `PurchaseSteps`
se reutilizan dentro del recorrido de compra. Checkout comparte los tokens de `.public-shell`
y el contrato de cliente de `packages/contracts` para errores locales. NestJS revalida el pedido.

La consulta de ficha se comparte mediante `cache` de React por petición para metadata y página.
No cachear precios persistentemente sin invalidación. La sección de sucursales del inicio se
carga bajo Suspense. Evidencia y pendientes en [STOREFRONT_REVIEW.md](STOREFRONT_REVIEW.md).

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
