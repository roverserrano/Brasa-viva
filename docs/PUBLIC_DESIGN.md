# Brasa Viva — Sistema de Diseño Público ("Obsidian & Ember")

## 1. Filosofía Visual (Taste Skill)
- **Personalidad:** Parrilla urbana contemporánea, fuego vivo, hospitalidad boliviana y rapidez operativa.
- **Contraste Térmico:** Superficies oscuras cálidas (`#110E0C`) para el impacto visual del fuego y el humo, combinadas con tarjetas de lectura de alto contraste y acentos en Rojo Brasa (`#E13A1F`) y Ámbar Fuego (`#F59E0B`).
- **Moneda y Localización:** Todos los precios se expresan en Bolivianos (`Bs.`) con formato tabular (`font-variant-numeric: tabular-nums`).

## 2. Design Tokens (CSS Variables)
| Token | Valor | Uso Semántico |
| :--- | :--- | :--- |
| `--bv-bg-obsidian` | `#0F0C0A` | Fondo principal de alto contraste y Hero |
| `--bv-bg-surface` | `#1A1512` | Tarjetas de producto, barras flotantes y modales |
| `--bv-bg-elevated` | `#251E1A` | Estados hover, selectores activos e inputs |
| `--bv-text-primary` | `#FAF5EE` | Títulos, nombres de cortes y precios |
| `--bv-text-muted` | `#B5A698` | Descripciones de ingredientes y metadatos |
| `--bv-ember-red` | `#E13A1F` | CTA primario ("Agregar a la brasa", "Confirmar pedido") |
| `--bv-flame-amber` | `#F59E0B` | Badges de promociones, horarios y alertas de stock |
| `--bv-herb-green` | `#10B981` | Indicador de sucursal abierta y confirmación WhatsApp/QR |

## 3. Reglas de Ergonomía y Rendimiento (web-design-guidelines)
1. **LCP Hero Asset:** Usar `fetchpriority="high"` y formato `.webp` optimizado sobre los activos de `public/images/`.
2. **Thumb-Zone Mobile:** Barra inferior fija en viewports `< 768px` para abrir el carrito y finalizar compra con una sola mano (`min-height: 48px`).
3. **Estados Obligatorios por Componente:**
   - `BranchSelector`: Abierto (`emerald`), Pronto a cerrar (`amber`), Cerrado (`rose`).
   - `ProductCard`: Disponible, Promoción activa (`PromotionProduct`), Últimas unidades, Agotado en sucursal (`BranchProduct`).