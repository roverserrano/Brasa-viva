export type PriceResolutionInput = {
  basePrice: string;
  priceOverride: string | null;
  productActive: boolean;
  branchAvailable: boolean;
};

export type PriceResolution =
  | { available: true; price: string }
  | { available: false; price: null };

export function resolveEffectivePrice(input: PriceResolutionInput): PriceResolution {
  if (!input.productActive || !input.branchAvailable) {
    return { available: false, price: null };
  }

  return {
    available: true,
    price: input.priceOverride ?? input.basePrice
  };
}
