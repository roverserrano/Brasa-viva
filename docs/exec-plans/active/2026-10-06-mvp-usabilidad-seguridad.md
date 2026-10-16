# Preparación del MVP para uso cotidiano

## Resultado esperado

Clientes pueden elegir sucursal, comprar y continuar por WhatsApp con instrucciones claras en
teléfono o computadora. Administradores pueden mantener catálogo, servicios y pedidos sin
interpretar enums, JSON ni errores técnicos. Los cambios conservan autorización y auditoría.

## Contexto

Se revisaron AGENTS, ARCHITECTURE y PRODUCT, DOMAIN_RULES, SECURITY, BACKEND, FRONTEND,
DATA_MODEL y QUALITY. Existe el flujo comercial y RBAC. La revisión encontró sobrescritura de
servicios al editar sucursales, imposibilidad de limpiar priceOverride, cambios de estado ofrecidos
incorrectamente, formularios sin bloqueo de doble envío y fallos de red confundidos con logout.

## Alcance

Usabilidad pública/administrativa, controles móviles, validación compartida, recuperación de
errores, límites de carrito, headers y rate limiting, concurrencia de estados/permisos,
documentación operativa y pruebas. Se conserva Next/Nest/Prisma/Supabase y monolito modular.

## Fuera de alcance

Pagos, delivery propio, inventario, nuevas cuentas de clientes y despliegue de infraestructura.

## Diseño e invariantes

Nest valida precio, promoción, alcance y permisos. Pedido y auditoría son transaccionales.
No se modifica el esquema ni se requiere una migración. El admin usa contratos Zod compartidos;
los formularios bloquean envíos repetidos. La configuración común usa campos de marca y el
pedido muestra estados en español y únicamente transiciones válidas. Se limita el abuso por IP
con memoria acotada por instancia y se documenta la configuración del proxy de producción.

## API / contratos

Se mantienen endpoints. Se comparte la máquina de estados y se valida la promoción completa
después de combinar un PATCH con su estado persistido. Errores seguros incluyen requestId.

## Plan de implementación y progreso

- [x] Revisar documentación y diagnosticar flujos existentes.
- [x] Corregir servicios, precios por sucursal y promociones parciales.
- [x] Mejorar formularios, listados, estados, sesión y navegación móvil.
- [x] Proteger API y mutaciones concurrentes.
- [x] Ejecutar lint, tipos, tests, build y E2E; registrar limitaciones reales.
- [x] Entregar guía para personal y preparación de lanzamiento.
- [ ] Completar build web, pruebas HTTP/navegador y QA integrado en un entorno que permita sockets.

## Criterios de aceptación

No se pierden servicios/estado al editar. El precio especial se puede borrar. No se ofrecen
transiciones inválidas. Los formularios impiden doble envío y los mensajes son accionables.
El menú y panel son utilizables a 375/430/768/1440 px. No hay secretos en respuestas/logs.

## Pruebas

Lint y typecheck completos pasan; 42 tests pasan (22 API, 13 web, 7 contratos). El build de API pasa.
Unitarias de carrito, contratos, límites de solicitudes, sesión y workflow. HTTP y navegador
para pedido/admin; pnpm lint, typecheck, test, build y test:e2e. Si el sandbox impide sockets,
registrarlo y entregar comandos/escenarios para QA en un entorno permitido.

## Riesgos y rollback

Límites por instancia requieren protección adicional en el proxy al escalar horizontalmente.
No reintentar automáticamente POST. Revertir API y web juntos; no se altera base remota.

## Decisiones y descubrimientos

- 2026-10-06: no introducir dependencias ni servicios externos para estas correcciones.
- Las ventanas de solicitudes normalizan mayúsculas y trailing slash para no permitir variantes
  de ruta como bypass. Los proxies se configuran por direcciones reales, sin confiar globalmente.
- Prisma Decimal puede producir importes con un decimal. Los contratos monetarios normalizan
  esos valores y admiten coma decimal familiar, conservando cálculo autoritativo en Nest.
- Se incorporó una guía operativa y una lista de condiciones de lanzamiento con pruebas de UI
  aisladas de Supabase; no se realizaron cambios de datos remotos.
- Turbopack y las pruebas HTTP/navegador fallan por EPERM al abrir sockets. Un intento alternativo
  con webpack falló al leer la salida de `tsc --showConfig`; el mismo comando tsc directo funciona.
  No se modificó la configuración estándar de build para ocultar estos resultados.

## Resultado final

Se implementó la preparación funcional y de seguridad descrita. Se mantienen pendientes las
verificaciones externas detalladas en `docs/RELEASE_READINESS.md`, incluido el QA real de Auth,
base de datos y móvil. El plan queda activo hasta comprobar esas condiciones de lanzamiento.
