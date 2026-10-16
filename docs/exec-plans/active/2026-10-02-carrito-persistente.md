# Carrito persistente por sucursal

## Resultado esperado

Un cliente puede añadir productos disponibles desde el menú, ajustar cantidades y conservar el
carrito al recargar el navegador. El subtotal se presenta como estimado y no es autoridad para
el pedido.

## Alcance

- Store Zustand con persistencia `localStorage`.
- Botón para añadir productos desde el menú de una sucursal.
- Vista `/carrito` con cantidades, eliminación y subtotal estimado.
- Un carrito queda asociado a una única sucursal para no mezclar precios locales.

## Fuera de alcance

- Variantes, extras, checkout, confirmación de pedido y WhatsApp.

## Invariantes

- Solo persiste configuración del ítem, cantidad, sucursal y precio estimado visible.
- El precio se etiqueta como estimado y se revalidará en NestJS antes de crear un pedido.
- No se mezclan productos de sucursales diferentes en el mismo carrito.

## Pruebas

- Unit pendiente: incremento, decremento, eliminación y restricción de sucursal.
- E2E pendiente: añadir desde menú y persistir al recargar.

## Progreso

- [x] Diseño del store y límite de sucursal definidos.
- [x] UI del menú y carrito implementada.
- [ ] Pruebas ejecutadas con dependencias instaladas.

## Resultado final

Implementación pendiente de pruebas automatizadas y de verificación con dependencias instaladas.
