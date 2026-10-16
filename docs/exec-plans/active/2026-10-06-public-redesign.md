# Rediseño de la experiencia pública

## Resultado esperado

Una web gastronómica cálida, reconocible y adaptable a móvil: inicio con fotografías protagonistas,
menú fácil de explorar, sucursales y promociones claras, y acceso persistente al pedido.

## Contexto y alcance

Se revisaron AGENTS, ARCHITECTURE, PRODUCT, DOMAIN_RULES, FRONTEND y QUALITY. La web tiene
el flujo comercial implementado, pero solo una fotografía de portada, tarjetas sin imagen y
páginas secundarias con poca jerarquía. Se rediseñan inicio, navegación, footer y páginas públicas.
No se cambian contratos, persistencia, precios, RBAC ni el flujo transaccional de pedidos.

## Diseño

Crema, rojo brasa y carbón; titulares editoriales serif, texto de lectura sans, controles de 44 px,
fotografía grande, espacios amplios y secciones con acciones concretas. CSS acotado a la web
pública. Imágenes locales WebP y next/image; fotografías de producto procedentes del catálogo.
Los ambientes generados llevan identificación ilustrativa, sin afirmar que son sucursales reales.
No se inventan reseñas, horarios, descuentos, precios ni disponibilidad.

## Invariantes

Server Components para contenido, cliente solo para filtros/navegación/carrito. La sucursal se
elige antes de añadir productos; Nest sigue confirmando precios/pedidos antes de WhatsApp.
Fotos del catálogo remotas solo desde el Storage del proyecto configurado, sin abrir hosts arbitrarios.

## Progreso

- [x] Revisar documentación y vistas existentes.
- [x] Crear y guardar fotografías de presentación.
- [x] Implementar sistema visual, navegación y páginas públicas.
- [x] Ejecutar lint, tipos, pruebas, build y E2E; revisar capturas estáticas y registrar restricciones.
- [x] Documentar assets y resultados de QA.
- [ ] Completar compilación y E2E interactivo en un entorno con sockets permitidos.

## Criterios de aceptación y pruebas

Menú y carrito conservan el flujo existente. Navegación activa, usable con teclado y móvil,
sin desbordamiento a 375/430/768/1440. Imágenes con alt y tamaños responsivos. Estados vacíos
y fallos de API con recuperación. Se ejecutan pnpm lint/typecheck/test/build/test:e2e.
Si el entorno impide servidores/browser, se registra el error y no se afirma QA visual completado.

## Riesgos y rollback

Sustituir assets ilustrativos por fotos aprobadas antes de presentar ambientes como reales.
Revertir únicamente componentes/estilos/assets públicos, sin migraciones ni cambios de datos.

## Resultado

Se rediseñaron inicio, header/footer, menú, producto, promociones, sucursales/detalle, nosotros
y contacto. Se generaron dos imágenes y optimizaron en WebP. Lint, typecheck y 46 tests pasan.
Las capturas estáticas de inicio escritorio/móvil y menú móvil se revisaron con CSS real compilado.
Turbopack, Next dev y E2E fallan por EPERM; quedan pendientes en local/CI. No se modificaron
contratos, API, tablas ni datos remotos. Ver `docs/PUBLIC_DESIGN.md` para assets, prompts y QA.
