# Validación de lanzamiento MVP

## Estado verificable

Se implementaron mejoras del menú, carrito, formularios, servicios/horarios, precios por sucursal,
workflow de pedidos, paginación, recuperación de contraseña y protección HTTP. No se alteró el
esquema ni se modificó la base remota. El despliegue requiere QA integrado y configuración real.

Verificación del 2026-10-06: `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan. Se ejecutaron
42 pruebas: 22 de API, 13 de web y 7 de contratos. `pnpm --filter @brasa-viva/api build` también pasa;
las comprobaciones de web y E2E tienen las restricciones descritas al final de este documento.

## Verificación en una terminal con permisos de procesos y red

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Playwright usa puertos 3100/4101 y datos ficticios. No escribe en Supabase. Si no está instalado
Chromium, ejecuta `pnpm --filter @brasa-viva/web exec playwright install chromium`.
Estas pruebas ejercitan UI y contratos con fixtures; no demuestran persistencia en la base real.
Los tests HTTP de Nest prueban validación y rechazo 401/403 con servicios sustituidos.

## Prueba integrada en staging

- Realiza el flujo menú → carrito → datos → confirmar → WhatsApp. Comprueba pedido e items en
  el panel y base antes de continuar. Verifica que el total se recalcula al cambiar un precio.
- Desactiva un producto/sucursal mientras está en el carrito y verifica el rechazo sin pedido parcial.
- Comprueba promoción vencida, carrito vacío, API caída y dirección faltante para delivery.
- Inicia sesión como propietario, editor, gerente y operador. Verifica acceso permitido y rechazo
  por la API fuera de rol/sucursal. Comprueba la auditoría de precios, servicios y estados.
- Edita una sucursal que tenga delivery/consumo/QR; verifica que no pierde servicios ni horarios.
- Restablece una contraseña mediante correo real; configura en Supabase la URL permitida
  `https://DOMINIO/admin/restablecer` y su variante local de desarrollo.
- Prueba teclado, zoom 200%, 375/430/768/1440 px, teléfono real y WebKit/Safari. Los tests
  automáticos de anchura no sustituyen la revisión de lectura, foco y controles táctiles.

## Infraestructura y operación

- Define `NEXT_PUBLIC_SITE_URL` con el dominio HTTPS real para metadata, robots y sitemap.
- Configura API/Supabase/origen por entorno; usa los valores públicos únicamente en la web.
- Define `TRUSTED_PROXY_ADDRESSES` con IPs/subredes de proxies reales. Nunca confiar en cualquier
  X-Forwarded-For. El API aplica presupuestos por IP/minuto: pedidos 10, escrituras admin 30,
  lecturas admin 120 y consultas públicas 300, por instancia.
- Al escalar a varias instancias, configura límites globales en el ingreso y considera las redes
  compartidas; los contadores locales no son una protección distribuida ni idempotencia de pedidos.
- Swagger está desactivado en producción salvo `ENABLE_API_DOCS=true`.
- Verifica RLS/permisos de Supabase y backups restaurables en staging. El usuario de base de datos
  debe disponer solo de privilegios operativos necesarios. No usar migrate reset en producción.
- Acuerda retención de datos de clientes, responsables de errores/pedidos y procedimientos de soporte.
- Analytics de visitas/conversión y carga directa de imágenes a Storage aún requieren integración
  y validación. No se inventan esas métricas en el dashboard.

## Restricciones del entorno de implementación

El sandbox bloquea sockets. El build con Turbopack falla con `binding to a port / EPERM`;
Playwright no puede iniciar su servidor y Supertest no puede escuchar en 127.0.0.1. Estas
comprobaciones deben completarse en la terminal de desarrollo o CI antes de autorizar lanzamiento.
El intento alternativo con webpack también falló al interpretar `tsc --showConfig`, aunque el
comando de TypeScript directo produjo configuración válida. Se conserva el build estándar.
