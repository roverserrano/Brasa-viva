# Plantilla de tarea para Codex

Usar esta plantilla al pedir una implementación concreta.

## Título

`feat: ...` / `fix: ...` / `chore: ...`

## Objetivo

Qué debe poder hacer el usuario/sistema al terminar.

## Contexto

Rutas, módulos o pantallas relevantes.

## Requisitos

- ...
- ...

## No hacer

- No cambiar arquitectura.
- No ampliar el alcance.
- No introducir dependencias sin justificar.
- Añadir restricciones específicas de la tarea.

## Criterios de aceptación

- [ ] Comportamiento 1.
- [ ] Comportamiento 2.
- [ ] Errores/edge cases.
- [ ] Permisos.
- [ ] Responsive/a11y si aplica.

## Pruebas esperadas

- unit:
- integration:
- e2e:

## Comandos de verificación

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
# pnpm test:e2e si aplica
```

## Notas de migración / env

Indicar explícitamente si existen.

---

## Ejemplo

### Objetivo

Permitir que un cliente confirme un pedido y reciba un número `BV-xxxxxx` antes de
continuar a WhatsApp.

### Requisitos

- `POST /api/v1/orders`.
- Revalidar sucursal/productos/precios.
- Ignorar cualquier total enviado por navegador.
- Guardar order + items en una transacción.
- Crear snapshots de nombre/precio.
- Devolver `orderNumber`, total final y texto/datos necesarios para WhatsApp.
- No integrar WhatsApp API; solo continuación desde frontend.

### Aceptación

- [ ] Pedido válido se guarda.
- [ ] Producto no disponible devuelve error claro y no crea pedido.
- [ ] Precio manipulado desde cliente no afecta total.
- [ ] WhatsApp solo se habilita después de crear pedido.
- [ ] E2E cubre flujo principal.
