# Confirmación transaccional de pedidos

## Resultado esperado

Desde un carrito válido, una persona puede confirmar un pedido. NestJS vuelve a validar la
sucursal, el tipo de atención, la disponibilidad, los precios y las promociones; persiste el
pedido y sus snapshots en una transacción; devuelve un código humano `BV-000001` y habilita la
continuación a WhatsApp solo después de una creación exitosa.

## Contexto

Las fases de catálogo, promociones, carrito y preparación de checkout ya están disponibles. La
base Supabase contiene el esquema inicial y sus datos semilla. El carrito conserva precios solo
como estimaciones y no existe aún `POST /api/v1/orders`.

## Alcance

- Contratos compartidos de creación y respuesta de pedido.
- `POST /api/v1/orders` con validación Zod y errores HTTP consistentes.
- Revalidación transaccional de sucursal, servicio, productos, disponibilidad y precio efectivo.
- Promociones simples vigentes por producto: precio fijo, porcentaje y descuento fijo.
- Persistencia de cliente liviano, pedido e ítems con snapshots y código humano.
- URL y mensaje de WhatsApp construidos exclusivamente a partir del pedido persistido.
- Confirmación cliente en `/pedido`; el carrito se vacía después de éxito y no antes.
- Pruebas unitarias de cálculo, validación y serialización del payload de checkout.

## Fuera de alcance

- Pagos, delivery propio, seguimiento, cupones, variantes, extras y promociones `BUNDLE`.
- WhatsApp Business API; el MVP solo abre una URL de WhatsApp.
- Persistencia de datos personales en el navegador.
- Listado o gestión administrativa de pedidos antes de Supabase Auth y RBAC de la Fase 6.

## Invariantes

- Next.js no accede a PostgreSQL; solo llama a NestJS.
- El navegador nunca envía ni decide precios, descuentos, subtotales o totales autoritativos.
- La asociación `branch_products` determina disponibilidad y precio local.
- Pedido e ítems se guardan juntos o no se guarda ninguno.
- Los ítems conservan nombre, precio y descuento como snapshots históricos.
- La URL de WhatsApp aparece únicamente tras recibir una respuesta exitosa del servidor.
- Delivery requiere dirección y ambos tipos de atención deben estar habilitados en la sucursal.

## Diseño

El módulo `orders` seguirá Controller → Application Service → Repository → Prisma. El servicio
abre la transacción por medio del repositorio, carga todos los registros relevantes dentro de
ella, calcula importes en centavos mediante `bigint`, persiste las entidades y forma el código
`BV-` a partir del `order_number` autoincremental.

Una promoción se aplica solo si está activa, dentro de su ventana, tiene alcance global o incluye
la sucursal y referencia el producto. Cuando más de una promoción simple resulta elegible, se
elige la que deja el menor precio unitario. `BUNDLE` queda sin aplicar hasta contar con una regla
de composición explícita.

El formulario de checkout conserva los datos personales en estado React. Envía solo slug de
sucursal, tipo de pedido, contacto, dirección/notas y pares `productId`/cantidad. Tras la
respuesta, muestra el total del servidor y el enlace de WhatsApp; entonces vacía el carrito.

## Cambios de datos

No hay migración. Se usan los modelos existentes `Customer`, `Order` y `OrderItem`. El código
humano se completa en la misma transacción después de obtener el `order_number` autoincremental.

## API / contratos

- `POST /api/v1/orders`
- Request: sucursal, tipo, datos mínimos de contacto e ítems por ID/cantidad.
- Response: código, estado, resumen calculado, snapshots de ítems y URL de WhatsApp opcional.

## Plan de implementación

1. Añadir contratos Zod de pedido y helpers de dinero/promoción con pruebas.
2. Crear módulo, repositorio, servicio y controlador de pedidos con transacción.
3. Conectar el checkout al endpoint y mostrar confirmación posterior a la persistencia.
4. Probar los casos de precio manipulado, producto no disponible, delivery sin dirección y éxito.
5. Ejecutar lint, typecheck, pruebas y build cuando el entorno lo permita.

## Criterios de aceptación

- [ ] Un pedido válido crea cliente, pedido e ítems con snapshots y código `BV-xxxxxx`.
- [ ] El total proviene del backend y un precio enviado o almacenado en cliente no lo modifica.
- [ ] Un producto inactivo, agotado o no disponible rechaza todo el pedido sin persistirlo.
- [ ] Una promoción vigente aplicable actualiza el descuento; una vencida no.
- [ ] Delivery sin dirección y un servicio deshabilitado se rechazan.
- [ ] WhatsApp se ofrece solo tras la respuesta exitosa y usa el total del servidor.
- [ ] El carrito se vacía solo tras la creación exitosa.

## Pruebas

- Unit: cálculo de importes/promociones y servicio de creación de pedido.
- Unit: serialización del payload de checkout sin importes del cliente.
- Manual: menú → carrito → pedido → persistencia → WhatsApp.
- Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e` cuando
  exista un flujo E2E de pedido.

## Riesgos

- Un catálogo puede cambiar entre la pantalla y la confirmación → las lecturas y persistencia
  ocurren en la transacción y el servidor rechaza datos ya inválidos.
- La combinación de promociones complejas puede requerir reglas no definidas → `BUNDLE` queda
  fuera de este incremento.
- WhatsApp de sucursal ausente o mal formado → el pedido se crea y la respuesta no ofrece URL.

## Rollback

Revertir el módulo, contratos y confirmación de checkout. Los pedidos ya persistidos se
conservan como historial y no se eliminan mediante rollback de código.

## Progreso

- [x] Alcance, invariantes y diseño definidos.
- [x] Contratos, reglas de cálculo y validación de payload implementados.
- [x] Módulo transaccional de pedidos implementado.
- [x] Checkout conectado a la confirmación posterior a la persistencia.
- [x] Unit tests, typecheck y lint ejecutados correctamente.
- [ ] Verificación manual contra Supabase y prueba HTTP E2E fuera del sandbox.

## Decisiones

- 2026-10-06: se pospone el listado administrativo de pedidos a la Fase 6 para no exponer datos
  personales sin Supabase Auth y RBAC.
- 2026-10-06: la aritmética monetaria del pedido se ejecuta con centavos `bigint` para no usar
  `float` como fuente de verdad.
- 2026-10-06: `unit_price` conserva el precio efectivo previo a promoción y `discount_amount`
  registra el descuento total de la línea; `line_total` conserva el importe final cobrado.

## Descubrimientos

- Los modelos Prisma existentes cubren la persistencia del pedido sin migración adicional.
- El Session Pooler de Supabase usa una sesión persistente, por lo que permite la transacción
  interactiva usada al crear un pedido.
- La prueba HTTP E2E usa el servidor interno de Nest/Supertest. El sandbox impide abrir sockets
  locales (`EPERM`), por lo que debe ejecutarse desde una terminal de desarrollo sin esa
  restricción.
- `pnpm build` alcanza Turbopack pero el sandbox vuelve a impedir que su procesador CSS abra un
  puerto. El API sí completa `pnpm --filter @brasa-viva/api build`; lint, typecheck y pruebas
  unitarias del monorepo pasan.

## Resultado final

Pendiente.
