# DESIGN.md — Sistema de diseño Brasa Viva

> Normativo para toda interfaz de Brasa Viva (web pública, checkout y panel administrativo).
> Código nuevo debe consumir los tokens de `apps/web/app/tokens.css`. Si algo no está en este
> documento, decide con criterio y actualiza este archivo — no inventes un sexto lenguaje visual.

## 1. Identidad y atmósfera

Brasa Viva es una **parrilla urbana boliviana**: fuego vivo, mesa compartida y rapidez
operativa. La interfaz traduce eso en dos atmósferas complementarias:

- **Marca pública (crema editorial).** Fondo de papel cálido (`--bv-paper`), tipografía serif
  para titulares, fotografía gastronómica protagonista y una única voz de color: el rojo
  brasa. Secciones oscuras ("momento de fuego": hero, footer, bloques de promoción) aportan
  contraste térmico sin caer en un dark-mode completo.
- **Centro de operaciones (admin ejecutivo).** Verde profundo sereno (`--bv-admin-*`) sobre
  superficies claras, misma tipografía y escala; la marca aparece en el logo y en los
  acentos de datos. Es una herramienta de trabajo: densidad, jerarquía clara y cero
  decoración inútil.

Principios transversales:

1. La fotografía real (pollo dorado, brasa, salón) es el activo visual principal; el color y
   la tipografía la enmarcan, nunca la sustituyen.
2. Un solo acento por superficie. Rojo brasa en público; el rojo no compite con ámbar/cobre
   decorativos.
3. Todo texto es legible: mínimo práctico `0.75rem` (12 px), cómodo `0.875rem+`; nunca texto
   de 8 px sobre fotografías.
4. El movimiento es discreto y respeta `prefers-reduced-motion` (duración 0 forzada global).

## 2. Tokens de color

Definidos en `apps/web/app/tokens.css` como custom properties globales. Valores canónicos:

### Marca — Rojo brasa (público)

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-brasa` | `#ae2b21` | CTA primario, enlaces, precios, acentos |
| `--bv-brasa-strong` | `#8d2119` | Hover/active de botones y enlaces |
| `--bv-brasa-deep` | `#822c22` | Superficies rojas (barra de carrito, bloques) |
| `--bv-brasa-dark` | `#6c1616` | Paradas medias de gradientes oscuros |
| `--bv-brasa-night` | `#2a0e0e` | Fondo oscuro de login administrativo |
| `--bv-brasa-bright` | `#c63825` | Acento sobre superficies oscuras |
| `--bv-focus` | `#b34c00` | Anillo de foco sobre superficies claras (naranja quemado) |

### Crema y papel

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-cream` | `#fff7e8` | Fondo global del documento |
| `--bv-paper` | `#faf5eb` | Fondo de la experiencia pública |
| `--bv-card` | `#fffcf6` | Tarjetas de producto y paneles |
| `--bv-surface` | `#fffaf1` | Superficies elevadas (login, popovers) |

### Carbón y neutros cálidos

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-carbon` | `#1c1917` | Texto principal, footer |
| `--bv-carbon-soft` | `#27241f` | Superficies oscuras secundarias (footer) |
| `--bv-carbon-deep` | `#201b16` | Fondo del hero |
| `--bv-ink` | `#27241f` | Texto editorial (equivalente suave) |
| `--bv-muted` | `#686156` | Texto secundario sobre crema (≥4.5:1) |
| `--bv-line` | `#ded7cb` | Bordes y separadores |
| `--bv-line-strong` | `#c4b9a8` | Bordes enfatizados |

### Cobre (acento cálido)

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-copper` | `#edac7d` | Detalles cálidos, ilustraciones, sobre oscuro |
| `--bv-copper-deep` | `#bf7845` | Hover de acentos cobre, iconos |
| `--bv-copper-bright` | `#e8a15a` | Acento sobre verde/oscuro |

### Admin ejecutivo

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-admin-ink` | `#213632` | Texto principal del panel |
| `--bv-admin-muted` | `#647572` | Texto secundario del panel |
| `--bv-admin-accent` | `#167461` | Datos, gráficos, botones primarios admin |
| `--bv-admin-sidebar` | `#142e2a` | Fondo de la barra lateral |
| `--bv-admin-bg` | `#f3f6f6` | Fondo del área de contenido |
| `--bv-admin-focus` | `#c07836` | Anillo de foco sobre verde oscuro |

### Semánticos

| Token | Valor | Uso |
| :--- | :--- | :--- |
| `--bv-success` / `--bv-success-bg` | `#166534` / `#dcfce7` | Confirmaciones |
| `--bv-danger` / `--bv-danger-bg` | `#991b1b` / `#fee2e2` | Errores y estados destructivos |
| `--bv-amber` | `#fbbf24` | Selección de texto, avisos suaves sobre oscuro |
| `--bv-olive` | `#35483d` | Bloque de sucursales en home |

**Reglas de color:**

- Prohibido hex de marca sueltos en componentes nuevos: siempre `var(--bv-*)`.
- Un elemento interactivo activo nunca cambia de familia de color (el CTA rojo se oscurece a
  `--bv-brasa-strong`, no vira a otro tono).
- Las sombras llevan tinte cálido (negro con matiz marrón) o se derivan de superficie;
  nunca `#000` puro a opacidad alta.
- Estados de pedido (admin) usan la paleta semántica existente del gráfico; no introducir
  colores nuevos por tipo.

## 3. Tipografía

- **Display (titulares):** `Georgia, 'Times New Roman', serif` (`--bv-font-display`). Georgia
  existe en todos los sistemas objetivo, tiene carácter editorial y métricas estables.
- **UI y cuerpo:** `Arial, Helvetica, sans-serif` (`--bv-font-sans`). Se elige por
  estabilidad de métricas entre plataformas y por no depender de fuentes remotas (regla del
  proyecto). Nada de fuentes cargadas por CDN.

| Rol | Familia | Tamaño | Peso | Interlineado | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Display / hero | serif | `clamp(2.6rem, 7vw, 4.9rem)` | 500–600 | 0.98–1.05 | `letter-spacing: -0.01em`, `text-wrap: balance` |
| H1 de página | serif | `clamp(2rem, 4.5vw, 3.2rem)` | 500 | 1.05 | Con `PageIntro` (eyebrow + breadcrumb) |
| H2 de sección | serif | `clamp(1.6rem, 3.4vw, 2.6rem)` | 500 | 1.1 | `text-wrap: balance` |
| H3 de tarjeta | serif | `1.15rem–1.4rem` | 600 | 1.2 | Nombre de producto |
| Cuerpo grande | sans | `1.05–1.25rem` | 400 | 1.6 | Bajadas editoriales, máx. 65ch |
| Cuerpo | sans | `1rem` | 400 | 1.55 | Texto general ≥16px |
| Pequeño | sans | `0.875rem` | 400–700 | 1.5 | Metadatos, ayuda |
| Overline / eyebrow | sans | `0.72–0.78rem` | 800 | 1.2 | MAYÚSCULAS, `letter-spacing: 0.14em`, color brasa |
| Precio | sans | según contexto | 700 | 1 | `font-variant-numeric: tabular-nums`, prefijo `Bs.` |

**Reglas tipográficas:**

- Titulares con `text-wrap: balance`; párrafos con `text-wrap: pretty` cuando el soporte lo
  permita (degradación silenciosa).
- Cifras (precios, dashboard, tablas) siempre `tabular-nums`.
- Puntos suspensivos tipográficos (`…`) en estados de carga y placeholders.
- Nunca texto < 0.75rem; los rótulos sobre fotografía usan mínimo 0.75rem con fondo
  semitransparente oscuro.
- Sentence case en español (no Title Case inglés).

## 4. Espaciado, radios, sombras y capas

- **Escala de espaciado** (base 4 px): `4, 8, 12, 16, 24, 32, 48, 72, 96` px. Las secciones
  públicas usan ritmo amplio (48–96 px vertical); el admin puede ser denso (8–24 px).
- **Contenedores:** público `max-width: 70rem`; admin `max-width: 80rem`; ambos con
  padding lateral `clamp(1.25rem, 4vw, 3rem)`.
- **Radios:** `xs 0.25rem` (tags), `sm 0.55rem` (botones, inputs), `md 0.8rem` (tarjetas),
  `lg 1.35rem` (paneles, login), `xl 7rem` (esquinas escultóricas de retratos/secciones
  editoriales). Píldoras solo en chips de categoría.
- **Sombras:** tintadas en marrón cálido (`rgb(33 22 15 / 23%)` para elevación flotante,
  `rgb(28 25 23 / 5%)` para tarjetas admin). Una sola dirección de luz (arriba).
- **Capas (z-index):** sticky header `10`, dock/barras flotantes `20`, skip-link `100`,
  overlays de diálogo `200`. No usar valores arbitrarios fuera de esta escala.
- **Layout:** CSS Grid para estructuras; flex para alineación en línea. Sin `100vh` (usar
  `100dvh`). Sin anchos en px fijos salvo iconos y decoración.

## 5. Componentes

### Botones

| Variante | Fondo | Texto | Uso |
| :--- | :--- | :--- | :--- |
| Primario | `--bv-brasa` (hover `--bv-brasa-strong`) | blanco | "Pedir ahora", "Añadir al carrito", "Confirmar pedido" |
| Secundario | transparente con borde `--bv-line-strong` | `--bv-ink` | Acciones alternativas |
| Fantasma/texto | sin fondo | `--bv-brasa` subrayado al hover | "Ver menú", acciones terciarias |
| Admin primario | `--bv-admin-accent` | blanco | Guardar/cambiar en panel |

Altura mínima táctil 44 px; radio `sm`; feedback `:hover` (oscurecer), `:active`
(`translateY(1px)`), `:focus-visible` (anillo de foco), `:disabled` (opacidad 0.6,
`cursor: wait` durante envío).

### Tarjeta de producto

Foto 4:3 con `next/image` (fallback a placeholder con icono y "Foto próximamente"), badge
"DESTACADO DEL MENÚ" (borde brasa, fondo crema), nombre serif, descripción corta, precio
tabular con `Bs.`, CTA primario full-width en móvil. Estados: disponible / destacado /
promoción (badge ámbar) / agotado (foto desaturada + etiqueta, CTA deshabilitado).

### Chips y navegación de categorías

Chip activo: fondo `--bv-carbon`, texto crema. Inactivo: borde `--bv-line`, texto `--bv-ink`.
Píldora completa. Nunca truncar nombres de categoría a menos de 3 caracteres legibles.

### Formularios

Label siempre visible (nunca solo placeholder) con `for`/`id` estable y sin acentos;
`autocomplete` y `inputmode` correctos; error inline bajo el campo con `aria-invalid` y
`role="alert"`; foco automático al primer campo inválido al enviar; `hint` disponible para
ayuda contextual.

### Estados de pedido (admin)

Badges de color con etiqueta textual (nunca solo color): Recibido, Confirmado, En
preparación, Listo, Entregado, Cancelado. En tablas y dashboard se acompaña siempre de la
palabra.

### Navegación

Header sticky con blur sobre papel; link activo `aria-current="page"` con punto inferior;
dock inferior fijo en móvil (<768 px) para carrito; barra flotante de carrito en escritorio;
Escape cierra menús y devuelve el foco al disparador.

## 6. Estados de interfaz (obligatorios)

Toda pantalla que carga datos debe definir cuatro estados:

1. **Carga:** esqueleto con la forma del contenido (no spinner suelto). Mínimo: título +
   bloques. El texto de carga termina en `…` ("Cargando menú…").
2. **Vacío:** mensaje claro + acción de salida (ver categorías completas, limpiar filtros).
   Nunca un espacio en blanco sin explicación.
3. **Error:** mensaje directo y en voz activa ("No pudimos cargar el menú. Revisa tu
   conexión."), con botón de reintento cuando exista. `role="alert"` solo para errores
   dinámicos que aparecen tras una acción; los vacíos estáticos no son alertas.
4. **Éxito:** confirmación visible y `aria-live="polite"` en acciones de una sola página
   (añadir al carrito, guardar en admin). Sin exclamaciones ("¡Listo!" → "Pedido confirmado").

Confirmaciones destructivas: `window.confirm()` es aceptable en MVP; preferir diálogo propio
accesible cuando la acción destruya datos del usuario (carrito completo). Nunca `alert()`.

## 7. Accesibilidad (requisitos mínimos)

- Contraste ≥ 4.5:1 en texto normal, ≥ 3:1 en texto grande (≥24 px o 19 px bold) e
  indicadores de foco/estado.
- Anillo de foco visible con `:focus-visible`, nunca `outline: none` sin sustituto:
  `--bv-focus` en superficies claras, `--bv-admin-focus` sobre verde, y variante clara
  sobre fondos oscuros del público.
- Skip-link "Saltar al contenido" siempre presente en los tres layouts (público, checkout,
  admin).
- Un solo `<h1>` por página; jerarquía sin saltos.
- Iconos decorativos `aria-hidden="true"`; botones solo-icono con `aria-label` en español.
- Los mensajes dinámicos usan una región `aria-live` única (no anidar `role="status"` dentro
  de enlaces).
- Objetivos táctiles ≥ 44×44 px; `touch-action: manipulation`.
- `prefers-reduced-motion: reduce` desactiva transiciones y scroll suave (ya global).
- Zoom del navegador nunca bloqueado (`user-scalable` intacto).
- Formularios: autocompletar correcto (`name`, `email`, `tel`, `street-address`), `for`/`id`
  y errores asociados.

## 8. Responsive

Breakpoints canónicos (mobile-first; los existentes 479/600/639/767/1023/1199/1500 se
mantienen por compatibilidad, nuevas reglas usan la escala):

| Nombre | Min-width | Uso |
| :--- | :--- | :--- |
| `sm` | 480 px | Tarjetas en columnas, ajustes finos de dock |
| `md` | 768 px | Dock móvil desaparece, buscador a la derecha, menú admin 2 columnas |
| `lg` | 1024 px | Balanced editorial, grids 3 columnas, sidebar admin fija |
| `xl` | 1200 px | Márgenes generosos, hero a 2 columnas completa |

Reglas: sin scroll horizontal en 375/430/768/1440; el dock y la barra de carrito respetan
`env(safe-area-inset-bottom)`; las tablas admin colapsan a lista de tarjetas en <640 px con
etiquetas `data-label`.

## 9. Imágenes y fotografía

- `next/image` siempre con `width`/`height` o `fill` + `sizes`; formatos WebP/AVIF en
  `public/images/`.
- Hero: `fetchpriority="high"` (`priority`) y el resto `loading="lazy"`.
- Relación recomendada: 4:3 para producto, 3:2 para hero, 1:1 para avatares de equipo.
- Las fotografías ilustrativas llevan caption "Imagen ilustrativa" cuando no representan el
  plato real; las decorativas llevan `alt=""`.
- Nunca fotos de stock genéricas ni rostros inventados: solo material propio aprobado.

## 10. Copy y localización

- Español de Bolivia, segunda persona ("Elige tu sucursal"), voz activa, sin clichés
  ("eleva", "sinergia", "revoluciona").
- Moneda siempre `Bs.` con `Intl.NumberFormat('es-BO')` y `tabular-nums`.
- Fechas con `Intl.DateTimeFormat('es-BO')`; zona horaria del negocio: `America/La_Paz`.
- Errores: qué pasó y qué hacer ("No pudimos registrar tu pedido. Revisa los datos e
  inténtalo de nuevo.").
- Los textos de marca ("Brasa Viva", "BV-000142") no se traducen: `translate="no"` donde
  aplique.

## 11. Aplicación en código

- `apps/web/app/tokens.css` se importa primero en `globals.css`; es la única fuente de
  colores de marca.
- Público y checkout usan clases BEM (`public-*`, `home-*`, `checkout-*`) sobre los tokens;
  el admin ejecutivo usa `executive.css` con sus tokens `--bv-admin-*`.
- Tailwind v4 está disponible (postcss) pero no es la fuente de verdad visual: no mezclar
  utilidades sueltas en pantallas nuevas salvo en el panel admin donde ya exista el patrón.
- Antes de cambiar estilos: capturar pantalla (script `apps/web/scripts/capture-screenshots.mjs`),
  aplicar, volver a capturar y comparar en 375/430/768/1440.

## 12. Gobernanza

- Cambios de tokens se anuncian en este archivo (tabla) y en el ExecPlan activo.
- Cada iteración visual debe verse en navegador real (Playwright) antes de considerarse
  terminada.
- Este documento prevalece sobre preferencias de estilo; las reglas de dominio y
  accesibilidad prevalecen sobre este documento.
