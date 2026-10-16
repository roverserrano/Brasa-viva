# Fuentes y precedencia

## Documentos originales

Este paquete fue elaborado a partir de dos especificaciones suministradas para Brasa Viva:

- `requerimientos.txt`: visión, alcance, flujos, administración, UX, MVP y roadmap.
- `arquitectura.txt`: arquitectura técnica revisada y más reciente.

## Regla de precedencia

Cuando ambos documentos originales discrepan:

### Producto

La intención funcional de `requerimientos.txt` se conserva.

Ejemplos:

- menú por sucursal;
- carrito;
- pedido;
- WhatsApp;
- promociones;
- admin;
- roles;
- auditoría;
- MVP vs fases futuras.

### Tecnología

`arquitectura.txt` prevalece.

Ejemplo principal:

El documento inicial de requerimientos mostraba una arquitectura simplificada
Next.js → Supabase. La arquitectura revisada define:

```text
Next.js → NestJS → PostgreSQL/Supabase
```

Por tanto, **NestJS es la fuente central de reglas de negocio y acceso a datos**.

## Decisiones añadidas en estas guías

Algunos detalles no estaban definidos explícitamente en los documentos originales y se
fijan aquí para reducir ambigüedad de implementación:

- `Decimal` para dinero en DB;
- UUID internos + order number humano;
- snapshots históricos en `order_items`;
- UTC para persistencia temporal con presentación/reglas locales en `America/La_Paz`;
- estructura de logs/errores y disciplina de migrations.

Estas decisiones son estándares de implementación derivados de los requisitos de integridad,
historial y seguridad. Si se desea cambiarlas, hacerlo mediante tarea/ExecPlan explícito.
