# ExecPlans para Brasa Viva

Un **ExecPlan** es un plan de ejecución versionado que permite a un agente implementar una
feature compleja sin depender de memoria externa o de conversaciones previas.

Úsalo para trabajo transversal o de varias horas/sesiones.

## Ubicación

Plan activo:

```text
docs/exec-plans/active/YYYY-MM-DD-nombre-corto.md
```

Al completar:

```text
docs/exec-plans/completed/YYYY-MM-DD-nombre-corto.md
```

## Requisitos de un ExecPlan

Debe ser autocontenido. Un agente nuevo debe poder leer el repositorio y el plan y continuar.

Plantilla:

```md
# <Título>

## Resultado esperado

Describe comportamiento observable, no “crear archivos”.

## Contexto

Qué existe hoy y por qué se necesita el cambio.

## Alcance

Incluye.

## Fuera de alcance

No incluye.

## Invariantes

Lista reglas de AGENTS/arquitectura/dominio que no pueden romperse.

## Diseño

Frontend, backend, datos, contratos, auth, cache, etc.

## Cambios de datos

Schema, migraciones, backfill, rollback.

## API / contratos

Endpoints y shapes afectados.

## Plan de implementación

1. ...
2. ...
3. ...

Cada paso debe producir un estado verificable.

## Criterios de aceptación

- [ ] ...
- [ ] ...

## Pruebas

Unit, integration, E2E, comandos.

## Riesgos

Riesgo → mitigación.

## Rollback

Cómo revertir si se despliega parcialmente.

## Progreso

- [ ] ...
- [ ] ...

## Decisiones

- YYYY-MM-DD: decisión y motivo.

## Descubrimientos

Hechos encontrados durante implementación que cambian o aclaran el plan.

## Resultado final

Completar al terminar: qué se entregó y qué quedó fuera.
```

## Reglas de mantenimiento

- Actualiza `Progreso`, `Decisiones` y `Descubrimientos` durante la ejecución.
- Si la realidad contradice el plan, corrige el plan antes de seguir ciegamente.
- No uses un ExecPlan para esconder incertidumbre; investiga el repositorio.
- Mantén criterios verificables.
- No incluyas secretos.
- Si cambia una decisión arquitectónica estable, actualiza también `ARCHITECTURE.md`.
- Si cambia una regla funcional estable, actualiza `docs/PRODUCT.md` o `docs/DOMAIN_RULES.md`.

## Cuándo NO usarlo

No hace falta para:

- typo;
- estilo local;
- bug pequeño con causa clara;
- test unitario aislado;
- cambio de copy;
- refactor local sin contratos/esquema.
