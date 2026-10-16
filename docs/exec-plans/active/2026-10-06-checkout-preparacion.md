# Checkout de preparación de pedido

## Resultado esperado

Con artículos en el carrito, una persona puede avanzar a `/pedido`, confirmar la sucursal,
elegir recojo o delivery de acuerdo con los servicios disponibles, completar sus datos y revisar
un resumen con precios estimados.

## Contexto

La Fase 4 continúa al carrito persistente por sucursal. Aún no existe `POST /api/v1/orders`,
por lo que esta fase prepara los datos y la experiencia de checkout sin presentar el carrito ni
los importes del navegador como fuente de verdad.

## Alcance

- Enlace desde carrito a `/pedido` cuando hay una sucursal y artículos.
- Pantalla cliente de checkout con sucursal, tipo de atención, datos de contacto, dirección para
  delivery y resumen estimado.
- Consulta del detalle público de la sucursal mediante la capa central `lib/api` para habilitar
  solo los servicios disponibles.
- Validación accesible en cliente para los campos requeridos del paso de preparación.

## Fuera de alcance

- Persistir datos de clientes en `localStorage`.
- Crear pedidos, recalcular precios, aplicar promociones o abrir WhatsApp.
- Pagos, delivery propio, cuentas de cliente y cambios administrativos.

## Invariantes

- El carrito mantiene una sola sucursal y sus importes son solo estimados.
- La sucursal no se cambia silenciosamente: cambiarla exige volver al menú y vaciar el carrito.
- Dirección es obligatoria solo para delivery.
- Las reglas finales de precio, disponibilidad y promoción siguen perteneciendo a NestJS en la
  Fase 5.
- El checkout no abre WhatsApp antes de una creación exitosa de pedido.

## Diseño

`CheckoutForm` es un Client Component porque consume el store persistido y consulta los servicios
de la sucursal después de hidratar. Los datos personales se mantienen únicamente en estado del
formulario. La página de ruta conserva el layout de checkout y delega la interacción al feature.

## Cambios de datos

No hay cambios de Prisma ni migraciones.

## API / contratos

Consume el `GET /api/v1/branches/:slug` público existente mediante `getBranchDetail`. No crea
un contrato de pedido antes de existir el endpoint de la Fase 5.

## Plan de implementación

1. Crear la ruta de checkout y el formulario cliente.
2. Mostrar la sucursal del carrito y comprobar sus servicios públicos.
3. Implementar tipo de atención, validación de datos y resumen de artículos.
4. Enlazar el carrito al checkout y comunicar que la confirmación se implementa con la creación
   transaccional de pedidos.
5. Ejecutar typecheck, lint, test y build disponibles.

## Criterios de aceptación

- [ ] Un carrito vacío no muestra un checkout funcional.
- [ ] Recojo y delivery respetan los servicios publicados de la sucursal.
- [ ] Delivery exige dirección y recojo no.
- [ ] El resumen identifica sus montos como estimados.
- [ ] No hay persistencia de nombre, teléfono o dirección.
- [ ] No se abre WhatsApp ni se intenta crear un pedido en esta fase.

## Pruebas

- Typecheck del monorepo.
- Lint del monorepo.
- Tests existentes.
- Build de producción.

## Riesgos

Un servicio puede cambiar antes de la Fase 5; el endpoint de creación de pedido volverá a validar
la sucursal y todos sus datos antes de persistir.

## Rollback

Revertir la ruta `/pedido`, su feature y el enlace del carrito. No hay datos persistidos ni
migraciones que revertir.

## Progreso

- [x] Alcance y límites definidos.
- [x] Ruta y formulario implementados.
- [x] Servicios de sucursal integrados.
- [x] Validación de recojo, delivery y servicios cubierta con pruebas unitarias.
- [x] `pnpm lint`, `pnpm typecheck` y tests del frontend ejecutados correctamente.
- [ ] Build de producción verificable fuera del sandbox.

## Decisiones

- 2026-10-06: los datos personales no se persisten en navegador para respetar el límite de
  persistencia no sensible.

## Descubrimientos

- 2026-10-06: `pnpm build` alcanza el build de Next.js, pero Turbopack queda bloqueado por el
  sandbox al crear un proceso para procesar CSS (`Operation not permitted` al enlazar un puerto).
  El typecheck, lint y las pruebas unitarias no presentan errores. El intento equivalente con
  Webpack también falla antes de compilar por un error interno de Next al leer `tsconfig`, aunque
  `tsc --showConfig` produce JSON válido. La verificación de build debe repetirse desde una
  terminal local sin esa restricción.

## Resultado final

La preparación de checkout está implementada. Queda pendiente solamente validar el build de
producción fuera del entorno aislado antes de mover este plan a completados.
