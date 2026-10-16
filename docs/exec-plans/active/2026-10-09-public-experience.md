# Refinamiento visual y continuidad de navegación

## Objetivo

Mejorar el impacto gastronómico y la facilidad de uso de la web pública existente. La portada
debe mostrar imágenes distintas y una composición más expresiva; el cliente debe poder volver
al menú de su carrito y regresar de un producto a su búsqueda sin empezar otra vez.

## Contexto, diseño e invariantes

Se revisaron AGENTS, ARCHITECTURE, PRODUCT, DOMAIN_RULES, FRONTEND y QUALITY. Se mantiene
Next/Nest/Prisma, precio autoritativo en backend y persistencia antes de WhatsApp. Sin cambios
de esquema, datos remotos ni contratos de API. Fotos editoriales nuevas ilustrativas, WebP y
next/image. La identidad mantiene crema, rojo y carbón, con acentos cobre y oliva.

## Implementación

- [x] Revisar código y documentación.
- [x] Generar dos fotos distintas y optimizarlas.
- [x] Separar las secciones de inicio y refinar composición/estilos.
- [x] Navegación móvil permanente y enlaces al menú con sucursal del carrito.
- [x] Preservar búsqueda/categoría al entrar/salir de un producto.
- [x] Ejecutar lint, tipos y pruebas unitarias; revisar capturas estáticas y documentar límites.
- [ ] Completar build, E2E interactivo y revisión de teclado/zoom en un entorno con sockets.

## Aceptación y pruebas

No se pierde la sucursal explícita de un enlace. El enlace general al menú retoma la sucursal
del carrito hidratado. Las búsquedas toleran tildes y se preservan en el regreso del producto.
La barra móvil y la acción del carrito no se superponen; teclado/foco y reduced-motion funcionan.
Ejecutar lint/typecheck/test/build y E2E de navegación; documentar fallos ambientales sin ocultarlos.

## Riesgos y reversión

Las ilustraciones no deben confundirse con fotos verificadas de productos/sucursales. El carrito
continúa validándose en backend. Reversión limitada a componentes, estilos y assets web.

## Resultado

Implementación terminada. `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan: 51 pruebas
(22 API, 22 web, 7 contratos). Cinco pruebas nuevas cubren contexto de navegación y búsqueda.
Playwright descubre nueve escenarios; dos nuevos cubren regreso a filtros/sucursal y la
separación entre carrito y barra móvil. No se pudieron ejecutar: el fixture no puede escuchar
en 127.0.0.1:4101 (EPERM). `pnpm build` también falla por EPERM al abrir un puerto en Turbopack.
No se cambiaron datos, contratos, esquema ni reglas de pedido.

Se revisó inicio estático a 375, 430, 768 y 1440 px y menú de escritorio, con componentes React,
CSS compilado y fixtures aislados. Esta comprobación no valida hidratación, interacción,
integración real ni métricas de rendimiento. Las capturas y prompts se conservan en
`docs/PUBLIC_DESIGN.md`. El plan permanece activo hasta completar la validación interactiva.
