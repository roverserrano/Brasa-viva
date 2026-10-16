# Flujo de trabajo para Codex

## Antes de tocar código

1. Leer `AGENTS.md`.
2. Leer `ARCHITECTURE.md`.
3. Leer documentos del dominio afectado.
4. Inspeccionar implementaciones existentes similares.
5. Confirmar el alcance de la tarea.
6. Si el cambio es grande, crear ExecPlan.

## Qué cuenta como cambio grande

Usar ExecPlan si ocurre una o más:

- cambia esquema de DB con migración no trivial;
- cambia contratos API públicos;
- toca web + API + DB;
- introduce un módulo funcional grande;
- cambia auth/RBAC;
- refactor transversal;
- migración de framework/dependencia major;
- implica varias etapas de implementación;
- el agente no puede explicar la solución en un diff pequeño/coherente.

## Implementación incremental

Preferir vertical slices:

Ejemplo:

```text
producto básico end-to-end
→ disponibilidad por sucursal
→ carrito
→ order creation
→ admin de producto
```

Evitar construir toda la base de datos, después toda la API y finalmente toda la UI durante
semanas sin un flujo ejecutable.

## Branch/commit

Si el entorno usa Git:

- branch descriptiva;
- commits pequeños/coherentes;
- no mezclar refactors no relacionados;
- no reescribir trabajo ajeno sin necesidad.

Convención sugerida:

```text
feat/orders-create
fix/product-branch-price
chore/ci-typecheck
docs/order-rules
```

## Pull request / resumen de tarea

El reporte final debe explicar:

- qué cambió;
- por qué;
- archivos principales;
- pruebas ejecutadas;
- riesgos o follow-ups;
- migraciones/env vars si existen.

No afirmar “todo funciona” si no se ejecutaron pruebas.

## Dependencias

Antes de añadir una dependencia:

1. ¿ya existe una herramienta en el stack?
2. ¿se puede resolver con plataforma estándar?
3. ¿es mantenida?
4. ¿es necesaria en runtime?
5. ¿complica bundle/seguridad?

No añadir una librería por una función trivial.

## Actualizaciones de versión

No actualizar Next/Nest/Prisma/Tailwind/React majors como parte incidental.

Crear tarea separada con:
- notas de migración;
- tests;
- rollback;
- cambios incompatibles.

## Cambios arquitectónicos

Registrar en un ExecPlan y, si la decisión es estable, actualizar `ARCHITECTURE.md`.

Preguntas mínimas:

- problema;
- opciones;
- decisión;
- consecuencias;
- migración;
- cómo verificar.

## Migraciones DB

Proceso:

1. modificar schema Prisma;
2. generar migración;
3. revisar SQL;
4. actualizar seed/tests;
5. correr migración en DB de desarrollo/test;
6. ejecutar tests;
7. documentar cambios destructivos.

No usar producción para “probar”.

## Nueva feature

Checklist:

- historia/aceptación definida;
- autorización analizada;
- validación;
- API contract;
- persistencia;
- UI;
- errores/empty/loading;
- pruebas;
- analytics si es KPI de producto;
- docs si corresponde.

## Bugfix

1. reproducir;
2. añadir test que falla cuando sea posible;
3. identificar causa raíz;
4. corregir la causa más pequeña;
5. probar regresión;
6. revisar casos similares.

No “parchar” únicamente la UI si el bug está en dominio/backend.

## Documentación

Actualizar documentos cuando:

- cambia regla de dominio;
- cambia arquitectura;
- cambia endpoint/contrato;
- cambia modelo de datos;
- cambia procedimiento de seguridad/operación;
- cambia definición del MVP.

No actualizar docs por cambios puramente cosméticos.

## Deuda técnica

Si una solución consciente deja deuda:

- describirla;
- explicar impacto;
- crear entrada/tarea rastreable;
- no esconderla en un comentario vago.

## Revisión por capas

Antes de terminar:

### Producto
¿cumple el caso de uso?

### Dominio
¿las reglas están en backend?

### Seguridad
¿permisos, inputs y secretos están correctos?

### Datos
¿integridad e historial se conservan?

### Frontend
¿mobile/a11y/errores funcionan?

### Calidad
¿tests/types/lint/build pasan?
