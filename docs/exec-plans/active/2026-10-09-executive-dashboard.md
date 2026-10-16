# Panel ejecutivo y experiencia administrativa

## Objetivo y alcance

Convertir el resumen en una vista ejecutiva interactiva y mejorar la navegación administrativa
con sidebar, contexto de página y diseño responsive. Indicadores reales, filtros de 7/30/90 días
y sucursal, evolución diaria, estados, comparación de sucursales y accesos operativos.

## Diseño e invariantes

Next consume un endpoint Nest autorizado con contrato Zod. Prisma agrega pedidos en PostgreSQL,
sin descargar todo el historial. No cambiar esquema, persistencia de pedidos ni permisos.
Los usuarios locales ven solo sucursales asignadas, incluso al manipular filtros. Importes de
pedidos no equivalen a cobros. Sin métricas inventadas, dependencias gráficas ni datos personales
en el nuevo endpoint. Calendario America/La_Paz; incluye hoy parcial; compara días anteriores.

## Progreso

- [x] Leer arquitectura, producto, dominio, seguridad, frontend, backend, datos y calidad.
- [x] Contrato, agregación y autorización con pruebas.
- [x] Shell ejecutivo, filtros, gráficos accesibles y estados vacíos/error/carga.
- [x] Escribir escenarios E2E y revisar capturas estáticas responsive.
- [x] Ejecutar lint, tipos, unitarias, build y E2E; documentar resultados.
- [ ] Completar build web, E2E interactivo e integración con datos de staging en entorno con sockets.

## Aceptación

Ninguna sucursal fuera del alcance aparece en opciones o agregados. Cancelados se excluyen del
importe/ticket pero permanecen en conteos y distribución. Días sin pedidos se muestran en cero;
comparación sin base no inventa un porcentaje. Cambios rápidos de filtro no muestran respuestas
obsoletas. Todos los controles permiten teclado y el gráfico ofrece tabla de datos.

## Riesgos y reversión

Revisar SQL parametrizado y zona horaria con pruebas; mantener endpoint antiguo compatible.
Revertir archivos de dashboard/shell, módulo y contrato si es necesario; no hay migraciones.
Limitación conocida: este entorno puede impedir sockets requeridos por build y E2E.

## Decisiones y descubrimientos

- 2026-10-09: endpoint separado `dashboard/insights` para conservar compatibilidad del resumen
  anterior. Sin cambios de esquema, dependencias o permisos; no hay datos personales en reportes.
- Los importes agregados requieren un esquema de respuesta sin transformaciones para generar
  OpenAPI. Se corrigió la incompatibilidad encontrada durante validación y se añadió regresión.
- El diseño y los gráficos usan CSS/SVG; las cifras de capturas son fixtures aislados. Producción
  consume exclusivamente Nest. No se ejecutó seed ni se modificó Supabase.

## Resultado

Implementación y documentación en `docs/ADMIN_DASHBOARD.md`. Lint y typecheck pasan; 63 pruebas
unitarias pasan (31 API, 23 web, 9 contratos). Build backend pasa. Build Next falla al abrir un
puerto en Turbopack; E2E web no inicia fixture en 4101 y seis pruebas HTTP Nest fallan al abrir
socket local, todos por EPERM. Playwright descubre 14 escenarios. Revisión estática a
375/430/768/1440 px; no equivale a validación de interacción o integración real. Este plan queda
activo únicamente por la validación externa pendiente, con pasos concretos en el documento.
