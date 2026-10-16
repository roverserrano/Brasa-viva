# Calidad y pruebas

## Objetivo

La calidad se evalúa por comportamiento correcto, mantenibilidad, seguridad y experiencia,
no por cantidad de código.

## Gates mínimos

Antes de considerar una tarea lista, ejecutar según aplique:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

El repositorio debe ofrecer scripts raíz que orquesten los workspaces.

## Unit tests

Prioridad alta para reglas:

- precio efectivo por sucursal;
- override de precio;
- promoción activa/inactiva;
- cálculo de total;
- generación de order number;
- roles/permisos;
- validación de horarios/estado de sucursal si se implementa;
- selectors/store de carrito.

## Integration tests

Prioridad:

- Prisma repositories;
- transacción de creación de pedido;
- constraints;
- relación branch-product;
- audit log;
- auth mapping cuando sea posible.

## E2E crítico

Flujo obligatorio:

```text
Menú
→ Producto
→ Carrito
→ Sucursal
→ Datos
→ Confirmar
→ Pedido persistido
→ Continuación WhatsApp
```

También probar admin:

```text
Login
→ editar producto/precio/disponibilidad
→ publicar
→ verificar cambio público
```

## Casos límite obligatorios

- producto eliminado/desactivado mientras está en carrito;
- producto no disponible en sucursal;
- sucursal cerrada/desactivada si la regla existe;
- precio cambiado antes de confirmar;
- producto agotado;
- WhatsApp faltante/incorrecto;
- promoción vencida;
- carrito vacío;
- API caída;
- imagen rota;
- usuario admin sin permiso;
- payload manipulado con total/precio falso.

## Browser/device

Validar al menos:

- Chromium/Chrome;
- Edge cuando la infraestructura lo permita;
- Safari/WebKit mediante Playwright o dispositivo real;
- Android viewport/dispositivo;
- iPhone viewport/dispositivo;
- tablet;
- desktop.

Priorizar teléfono real en QA manual.

## Accesibilidad

Automático ayuda, pero no basta.

Validar:

- teclado;
- foco;
- labels;
- headings;
- contraste;
- lector de pantalla en flujos clave cuando sea posible;
- mensajes de error;
- modales/drawers;
- targets táctiles.

## Performance

Objetivos:

- LCP < 2.5 s;
- CLS < 0.1;
- INP < 200 ms;
- Lighthouse Performance 90+.

Medir páginas representativas:

- home;
- menú;
- detalle;
- sucursal;
- admin principal (objetivo funcional más que SEO).

## Test data

Seeds de dev/test deben:

- incluir varias sucursales;
- un producto con mismo precio;
- un producto con override por sucursal;
- un producto no disponible en una sucursal;
- promoción activa;
- promoción expirada;
- roles administrativos.

No usar datos personales reales.

## Flaky tests

No ocultar flakiness con retries excesivos.
Identificar causa.

Retries de E2E pueden existir en CI, pero un test consistentemente inestable es deuda.

## Done

Una tarea está terminada cuando:

- cumple aceptación;
- no rompe invariantes;
- tests relevantes pasan;
- tipos pasan;
- lint pasa;
- build pasa cuando aplica;
- docs cambian si cambió comportamiento/arquitectura;
- no deja TODOs críticos sin registrar.
