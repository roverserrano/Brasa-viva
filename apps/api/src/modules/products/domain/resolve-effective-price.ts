type DecimalValue = string | { toString(): string };

export type PriceResolutionInput = {
  basePrice: string;
  priceOverride: string | null;
  productActive: boolean;
  branchAvailable: boolean;
};

export type PriceResolution =
  | { available: true; price: string }
  | { available: false; price: null };

/**
 * Precio efectivo de un producto en una sucursal: la sobreescritura de sucursal
 * prevalece sobre el precio base. Única fuente de esta regla para menú y pedidos.
 */
export function effectivePrice(
  basePrice: DecimalValue,
  priceOverride: DecimalValue | null
): DecimalValue {
  return priceOverride ?? basePrice;
}

export function resolveEffectivePrice(input: PriceResolutionInput): PriceResolution {
  if (!input.productActive || !input.branchAvailable) {
    return { available: false, price: null };
  }

  return {
    available: true,
    price: effectivePrice(input.basePrice, input.priceOverride).toString()
  };
}
