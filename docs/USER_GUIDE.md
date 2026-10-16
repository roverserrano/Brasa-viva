# Guía de uso de Brasa Viva

## Hacer un pedido

1. Abre **Menú** y elige la sucursal donde deseas pedir.
2. Busca por nombre o elige una categoría. Pulsa **Añadir al carrito**.
3. Entra a **Carrito** o pulsa **Revisar pedido**. Ajusta cantidades con +/− y quita lo que no necesitas.
4. Pulsa **Continuar con el pedido**. Elige recojo o delivery, según los servicios de la sucursal.
5. Ingresa tu nombre y teléfono. Para delivery, añade la dirección.
6. Pulsa **Confirmar y registrar pedido**. Espera a que aparezca el código BV y el total confirmado.
7. Pulsa **Continuar por WhatsApp** y envía el mensaje a la sucursal para coordinar la atención.

No necesitas una cuenta. El carrito se conserva en ese navegador. Los precios mostrados antes
de confirmar son estimados; se comprueban otra vez al registrar. El costo de delivery se acuerda
con la sucursal. Si cambias de sucursal, la pantalla pide confirmar antes de quitar el carrito anterior.

## Ingresar al panel

Entra a `/admin/login` con el correo y contraseña habilitados para el personal. Cada rol ve las
secciones que puede usar. Puedes mostrar la contraseña mientras la escribes. Si la olvidaste,
ingresa el correo y pulsa **Restablecer contraseña**; abre el enlace del correo y guarda la nueva.

## Publicar un producto

1. Crea primero su categoría en **Categorías** si todavía no existe.
2. En **Productos**, escribe nombre, categoría, precio y descripción. El enlace se genera con el nombre.
3. Crea el producto. En su tarjeta, elige una sucursal en **Ofrecer en otra sucursal**.
4. Usa **Cambiar precio** si esa sucursal vende a otro precio. Deja el campo vacío para volver al precio base.
5. Usa **Ocultar** cuando una sucursal no pueda ofrecerlo y **Habilitar** cuando vuelva a estar disponible.
6. Abre **Ver menú público** para comprobar el resultado. Las lecturas públicas consultan datos actuales.

La imagen se ingresa como enlace público. La carga directa de archivos a Storage aún requiere
un flujo propio y permisos del bucket; no se presenta como una capacidad disponible.

## Sucursales y promociones

En **Sucursales**, edita dirección, teléfono, WhatsApp, estado y enlace de Maps. Activa los
servicios reales y configura los días/horas de atención. WhatsApp debe incluir el código de país.
Guardar conserva los servicios seleccionados; desactivar una sucursal conserva el historial.

En **Promociones**, selecciona productos, tipo de descuento y fechas. Selecciona sucursales si
la oferta es local; sin selección es global. Una promoción sin productos aparece como incompleta:
edítala antes de publicarla. Una promoción vencida conserva su registro y no se muestra como vigente.

## Atender pedidos

1. Abre **Pedidos** y pulsa **Actualizar pedidos** para revisar lo reciente.
2. Pulsa **Ver productos y entrega** para leer cantidades, notas y dirección.
3. Cambia a **Confirmado**, después a **En preparación**, **Listo para entregar** y **Entregado**.
4. Si corresponde cancelar, el panel pide confirmación. Un pedido finalizado conserva su historial.

Solo aparecen los siguientes estados permitidos. Si otra persona ya cambió un pedido, actualiza
la pantalla antes de actuar nuevamente. Usa **Anterior** y **Siguiente** para consultar otras páginas.

## Usuarios y configuración

El propietario habilita usuarios por el mismo correo de su cuenta administrativa. Los roles se
muestran en español; gerentes y operadores deben recibir las sucursales que van a atender. La
creación de credenciales se realiza en Supabase Auth por la persona responsable de la instalación.
Puedes seleccionar las sucursales al habilitar el usuario, sin tener que editarlo después.
En **Configuración**, el nombre de marca se registra mediante un campo normal; no hace falta JSON.

## Problemas frecuentes

- **No carga el menú:** pulsa volver a cargar o prueba otra sucursal.
- **No puedes guardar:** lee el mensaje, corrige los campos indicados y vuelve a guardar.
- **Falló la conexión:** los datos del formulario se mantienen. Revisa tu conexión antes de repetir.
- **El pedido ya se registró:** conserva el código BV. No confirmes otro pedido para reenviar WhatsApp.
- **Sesión expirada:** vuelve a ingresar. Una interrupción temporal de red permite reintentar sin cerrar la sesión.

Los formularios de creación bloquean el envío mientras se guarda. No confirmes un pedido en
varias pestañas: la API todavía no dispone de claves de idempotencia entre solicitudes independientes.
