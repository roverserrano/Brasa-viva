# Producto — Brasa Viva

## Visión

Brasa Viva es una plataforma digital para una cadena de restaurantes de comida rápida
con múltiples sucursales en Cochabamba.

No es una web institucional. Debe funcionar como canal práctico para:

- descubrir el menú;
- saber qué está disponible y a qué precio;
- encontrar una sucursal;
- conocer promociones;
- construir un pedido;
- iniciar el pedido por WhatsApp;
- administrar menú, promociones, sucursales y pedidos sin depender del desarrollador.

Principio de experiencia:

> Entrar → elegir qué comer → ver precio → seleccionar sucursal → pedir.

## Problemas que debe resolver

| Problema | Solución de producto |
|---|---|
| Menú disperso | Menú oficial centralizado |
| Información distinta por local | Fichas y configuración por sucursal |
| Pedido informal | Carrito + pedido estructurado |
| Promociones efímeras | Módulo de promociones programables |
| Dependencia del desarrollador | Panel administrativo |

## Usuarios

### Cliente final

No necesita cuenta en el MVP.

Necesita poder:

- navegar menú;
- filtrar/entender categorías;
- revisar producto, precio, variantes/extras cuando existan;
- seleccionar sucursal;
- ver disponibilidad;
- añadir/quitar/cambiar cantidades;
- escoger recojo o delivery coordinado;
- ingresar sus datos;
- confirmar;
- continuar por WhatsApp con un pedido ya registrado.

### Propietario / administrador

Necesita controlar toda la plataforma.

### Gerente de sucursal

Gestiona información/operación dentro del alcance de su sucursal según permisos.

### Editor

Gestiona productos y promociones según permisos.

### Operador

Gestiona/consulta pedidos según permisos.

## Sitemap público MVP

```text
/
├─ menu
│  └─ [product-slug]
├─ promociones
│  └─ [promotion-slug]   (si se implementa detalle)
├─ sucursales
│  └─ [branch-slug]
├─ nosotros
├─ contacto
├─ carrito
└─ pedido
```

CTA principal permanente: **Pedir ahora**.

## Home

La primera pantalla debe vender, no explicar la empresa extensamente.

Orden recomendado:

1. Hero con fotografía de producto y CTA.
2. Productos destacados/favoritos.
3. Promociones activas.
4. Sucursales.
5. Información breve de marca.
6. Redes/contacto.

## Menú

Categorías iniciales esperadas:

- Broaster
- Spiedo
- Combos
- Hamburguesas
- Salchipapas
- Platos
- Bebidas
- Promociones

Estas categorías son contenido, no enums rígidos. El administrador debe poder gestionarlas.

Datos funcionales de producto:

- nombre;
- descripción;
- precio base;
- imagen;
- categoría;
- activo/disponible;
- destacado;
- marca de nuevo cuando aplique;
- variantes cuando aplique;
- extras cuando aplique;
- sucursales donde se ofrece;
- precio/disponibilidad por sucursal;
- vínculo opcional con promociones.

## Sucursales

Cada sucursal debe poder tener:

- nombre;
- dirección;
- coordenadas;
- horarios;
- teléfono;
- WhatsApp;
- estado;
- servicios;
- imagen;
- enlace/datos de mapa;
- disponibilidad de productos.

Servicios previstos:

- recojo;
- delivery coordinado;
- consumo en local;
- pago QR como dato informativo si corresponde.

## Carrito

El carrito existe aunque el MVP no tenga pago online.

Debe permitir:

- agregar producto;
- cambiar cantidad;
- eliminar;
- conservar selección al recargar/cerrar navegador;
- mostrar subtotal estimado;
- continuar al flujo de pedido.

El subtotal mostrado en cliente es orientativo hasta que el backend confirma precios.

## Pedido

Flujo:

```text
Producto
  ↓
Carrito
  ↓
Sucursal
  ↓
Tipo de pedido
  ↓
Datos del cliente
  ↓
Confirmar
  ↓
Persistir pedido
  ↓
WhatsApp
```

Tipos MVP:

- recojo en sucursal;
- delivery coordinado por WhatsApp.

Para delivery, el MVP no calcula ni opera una flota propia. La sucursal puede confirmar
el costo/condiciones por WhatsApp.

## Identificador de pedido

Formato visible esperado:

```text
BV-000142
```

La implementación puede usar UUID internamente, pero siempre debe existir un número/código
humano legible único.

## Promociones

El admin puede:

- crear;
- editar;
- publicar/despublicar;
- definir inicio;
- definir fin;
- asociar productos;
- limitar a una o varias sucursales.

Una promoción fuera de su ventana temporal no debe aparecer como activa.

## Panel administrativo MVP

Secciones mínimas:

```text
/admin
├─ dashboard
├─ productos
├─ categorias
├─ sucursales
├─ promociones
├─ pedidos
├─ usuarios
└─ configuracion
```

Capacidades mínimas:

- crear/editar/desactivar producto;
- cambiar precio;
- cambiar imagen;
- destacar producto;
- asignar a sucursales;
- controlar disponibilidad;
- gestionar categorías;
- gestionar promociones;
- gestionar sucursales;
- consultar pedidos;
- controlar usuarios/roles según autorización;
- conservar auditoría de cambios sensibles.

## Dashboard

Los indicadores pueden crecer gradualmente. El producto busca medir:

- visitas al menú;
- productos añadidos;
- pedidos iniciados;
- pedidos enviados;
- sucursal seleccionada;
- promociones abiertas;
- productos más consultados;
- clientes recurrentes cuando exista identificación suficiente.

No inventar métricas que todavía no se registran.

## SEO

Páginas indexables relevantes:

```text
/menu/[slug]
/sucursales/[slug]
/promociones/[slug]
```

Preparar:

- metadata;
- sitemap;
- robots;
- Open Graph;
- JSON-LD cuando aplique:
  - Restaurant
  - LocalBusiness
  - Product
  - Offer
  - BreadcrumbList

## UX y diseño

- Mobile-first.
- Prioridad aproximada de diseño: 375, 430, 768 y 1440 px.
- Identidad provisional: rojo intenso, amarillo cálido, crema, negro carbón, blanco.
- Fotografía de producto con alta importancia visual.
- CTA claros.
- Evitar apariencia genérica o corporativa pesada.
- Navegación simple.

## Accesibilidad y rendimiento

Objetivos:

- WCAG 2.1 AA cuando sea razonablemente aplicable.
- LCP < 2.5 s.
- CLS < 0.1.
- INP < 200 ms.
- Lighthouse Performance 90+.
- SEO 95+.
- Accessibility 90+.

Son objetivos, no excusa para trucar mediciones.

## Definición funcional de éxito del MVP

Un cliente debe poder, sin asistencia:

```text
entrar desde una campaña
→ ver promoción/producto
→ añadir al carrito
→ elegir sucursal
→ elegir tipo de pedido
→ confirmar datos
→ registrar pedido
→ abrir/enviar WhatsApp
```

Un encargado autorizado debe poder, sin asistencia del desarrollador:

```text
entrar al admin
→ cambiar precio/disponibilidad
→ editar producto
→ crear promoción
→ publicar cambios
```

## Fuera de alcance del MVP

No implementar salvo solicitud explícita:

- clientes registrados;
- seguimiento de pedido en tiempo real;
- cupones;
- fidelización/puntos;
- notificaciones;
- PWA;
- pedidos programados;
- pago online automatizado;
- delivery propio/repartidores;
- inventario;
- POS;
- facturación;
- business intelligence avanzado;
- app Android/iOS;
- chatbot/IA;
- blockchain;
- ERP.
