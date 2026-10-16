# REFACTORIZACIÓN INTEGRAL — BRASA VIVA

Actúa como **Staff Software Engineer, Senior Full-Stack Developer, Senior UI/UX Designer y QA Automation Engineer**, con experiencia desarrollando plataformas comerciales escalables.

Tu objetivo es **auditar, refactorizar, optimizar y mejorar profesionalmente el sistema Brasa Viva**, utilizando el código existente, aplicando las skills solicitadas y manteniendo todos los requerimientos funcionales.

**NO reconstruyas el proyecto desde cero. NO cambies su arquitectura por preferencias personales. NO elimines funcionalidades existentes.**

## FASE 1 — Análisis del proyecto

1. Inspecciona el ZIP completo y reconstruye correctamente el monorepo si es necesario.
2. Ten en cuenta que `web.zip` y `api.zip` contienen las aplicaciones por separado.
3. Lee `AGENTS.md`, `ARCHITECTURE.md` y los documentos relevantes de `docs/`.
4. Analiza componentes, estilos, rutas, API, contratos compartidos, base de datos, autenticación y pruebas.
5. Identifica problemas de arquitectura, calidad de código, experiencia de usuario, accesibilidad, rendimiento y seguridad.
6. Registra el estado actual antes de realizar cambios.
7. Crea un ExecPlan para ejecutar la refactorización por etapas.

## FASE 2 — Instalar las skills

Instala y verifica las siguientes skills para Codex:

- Taste Skill: `npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend -a codex`
- Redesign Existing Projects: `npx skills add https://github.com/Leonxlnx/taste-skill --skill redesign-existing-projects -a codex`
- Image to Code: `npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code -a codex`
- Web Design Guidelines: `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines -a codex`
- Awesome Design MD: `npx skills add https://github.com/infometa/workbuddyskills --skill awesome-design-md -a codex`
- Playwright CLI: `npm install -g @playwright/cli@latest`
- Skill Playwright CLI: `playwright-cli install --skills=agents`

Antes de ejecutar scripts de terceros, revisa sus instrucciones, dependencias y permisos. Comprueba la existencia de los archivos `SKILL.md`. No declares una instalación exitosa sin verificarla.

## FASE 3 — Crear el sistema de diseño

Usa Taste Skill y awesome-design-md para establecer un diseño coherente y profesional.

Preserva la identidad de Brasa Viva:

- Marca gastronómica cálida y moderna.
- Rojo brasa, crema, carbón y cobre.
- Fotografías gastronómicas con protagonismo.
- Tipografía clara y jerarquía visual definida.
- Botones y llamadas a la acción atractivos.
- Interfaz responsive, mobile-first.
- Panel administrativo profesional y funcional.

Crea un archivo `DESIGN.md` con tokens, tipografías, colores semánticos, espaciado, componentes, estados, efectos, responsive y reglas de accesibilidad.

No copies la identidad de otras empresas ni conviertas la web en una landing genérica de tecnología.

## FASE 4 — Refactorizar el frontend

Utiliza las skills de diseño para revisar y mejorar:

- Inicio y navegación.
- Menú, filtros y búsqueda.
- Tarjetas y detalles de productos.
- Promociones.
- Sucursales.
- Carrito persistente.
- Checkout y pedidos mediante WhatsApp.
- Login y panel administrativo.
- Dashboard.
- Gestión de productos, usuarios, pedidos y promociones.
- Formularios y estados vacíos, de carga y error.

Implementa componentes reutilizables, estilos centralizados, interacciones intuitivas y navegación accesible.

Refactoriza código duplicado, reduce complejidad innecesaria y mejora la separación de responsabilidades.

Usa `image-to-code` sobre referencias visuales autorizadas disponibles en `docs/design-previews/`, solamente cuando ayude a reconstruir o mejorar componentes reales.

## FASE 5 — Refactorizar y proteger el backend

Mantén estrictamente:

- Next.js + TypeScript para frontend.
- NestJS + TypeScript para backend.
- PostgreSQL + Prisma para persistencia.
- Supabase Auth y Storage.
- API REST `/api/v1`.
- Monolito modular.
- pnpm Workspaces y Turborepo.

Preserva los módulos, contratos y reglas de negocio.

Especialmente:

- Los precios definitivos se calculan en NestJS.
- Los pedidos se registran antes de abrir WhatsApp.
- La disponibilidad depende de cada sucursal.
- Los precios históricos de pedidos permanecen inmutables.
- La autorización administrativa se verifica en backend.
- La auditoría y el soft delete deben conservarse.

No efectúes migraciones destructivas, eliminación de datos ni cambios de producción.

## FASE 6 — Aplicar Web Design Guidelines

Audita todas las interfaces modificadas.

Revisa accesibilidad, navegación por teclado, contraste, formularios, estados de error, jerarquía visual, espaciado, responsive, imágenes y animaciones.

Registra cada problema relevante, indicando archivo, línea, prioridad y corrección.

Vuelve a ejecutar la auditoría después de aplicar las mejoras.

## FASE 7 — Playwright CLI y testing

Inicia la aplicación y realiza pruebas reales en el navegador.

Verifica las siguientes resoluciones:

- 375 px — móvil.
- 430 px — móvil.
- 768 px — tablet.
- 1440 px — escritorio.

Comprueba navegación, búsqueda, filtros, carrito, checkout, inicio de sesión y administración usando datos de prueba.

Genera capturas antes y después del refactor y analiza errores de consola o comportamiento.

Ejecuta las verificaciones existentes:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm test:e2e`

Distingue errores del proyecto de limitaciones del entorno. No declares pruebas aprobadas si no pudieron ejecutarse.

## FASE 8 — Entregables y criterios de calidad

Entrega:

1. Código refactorizado y funcional.
2. Skills instaladas y verificadas.
3. `DESIGN.md` específico de Brasa Viva.
4. Componentes y páginas mejorados.
5. Arquitectura preservada.
6. Tests actualizados cuando corresponda.
7. Capturas de navegador que demuestren los cambios.
8. Documentación y ExecPlan actualizados.
9. Informe de problemas corregidos y pendientes.
10. Resumen de calidad, seguridad y compatibilidad.

**Regla principal:** no te detengas en recomendaciones o un diagnóstico. Ejecuta mejoras graduales, valida cada etapa y documenta los resultados verificables. Prioriza el MVP funcional, la calidad del código y una experiencia de usuario profesional sobre efectos visuales innecesarios.