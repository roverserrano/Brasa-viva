type DecimalValue = string | { toString(): string };

type PromotionType = 'FIXED_PRICE' | 'PERCENTAGE' | 'FIXED_DISCOUNT' | 'BUNDLE';

export type PurchasableProduct = {
  productId: string;
  name: string;
  unitPrice: DecimalValue;
  quantity: number;
};

export type EligiblePromotion = {
  id: string;
  promotionType: PromotionType;
  promoPrice: DecimalValue | null;
  discountPercent: DecimalValue | null;
  discountAmount: DecimalValue | null;
  products: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type CalculatedOrderLine = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
  appliedPromotionId: string | null;
};

export type CalculatedOrder = {
  lines: CalculatedOrderLine[];
  subtotal: string;
  discountTotal: string;
  total: string;
};

export function moneyToCents(value: DecimalValue): bigint {
  const normalized = value.toString();
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);

  if (!match) {
    throw new Error(`Valor monetario inválido: ${normalized}`);
  }

  const whole = match[1];
  const decimal = match[2] ?? '';

  if (!whole) {
    throw new Error(`Valor monetario inválido: ${normalized}`);
  }

  return BigInt(whole) * 100n + BigInt(decimal.padEnd(2, '0'));
}

export function centsToMoney(value: bigint): string {
  const normalized = value < 0n ? 0n : value;
  const whole = normalized / 100n;
  const decimal = (normalized % 100n).toString().padStart(2, '0');
  return `${whole}.${decimal}`;
}

export function calculateOrder(
  products: PurchasableProduct[],
  promotions: EligiblePromotion[]
): CalculatedOrder {
  let subtotal = 0n;
  let discountTotal = 0n;

  const lines = products.map((product) => {
    const originalUnitPrice = moneyToCents(product.unitPrice);
    const appliedPromotion = selectBestPromotion(product, originalUnitPrice, promotions);
    const finalUnitPrice = appliedPromotion?.unitPrice ?? originalUnitPrice;
    const quantity = BigInt(product.quantity);
    const lineSubtotal = originalUnitPrice * quantity;
    const lineTotal = finalUnitPrice * quantity;
    const discountAmount = lineSubtotal - lineTotal;

    subtotal += lineSubtotal;
    discountTotal += discountAmount;

    return {
      productId: product.productId,
      productName: product.name,
      quantity: product.quantity,
      unitPrice: centsToMoney(originalUnitPrice),
      discountAmount: centsToMoney(discountAmount),
      lineTotal: centsToMoney(lineTotal),
      appliedPromotionId: appliedPromotion?.id ?? null
    };
  });

  return {
    lines,
    subtotal: centsToMoney(subtotal),
    discountTotal: centsToMoney(discountTotal),
    total: centsToMoney(subtotal - discountTotal)
  };
}

function selectBestPromotion(
  product: PurchasableProduct,
  originalUnitPrice: bigint,
  promotions: EligiblePromotion[]
): { id: string; unitPrice: bigint } | null {
  let selected: { id: string; unitPrice: bigint } | null = null;

  for (const promotion of promotions) {
    const productRule = promotion.products.find(
      (promotionProduct) => promotionProduct.productId === product.productId
    );

    if (!productRule || productRule.quantity !== 1 || promotion.promotionType === 'BUNDLE') {
      continue;
    }

    const discountedUnitPrice = calculateDiscountedUnitPrice(promotion, originalUnitPrice);

    if (discountedUnitPrice === null || discountedUnitPrice >= originalUnitPrice) {
      continue;
    }

    if (!selected || discountedUnitPrice < selected.unitPrice) {
      selected = { id: promotion.id, unitPrice: discountedUnitPrice };
    }
  }

  return selected;
}

function calculateDiscountedUnitPrice(
  promotion: EligiblePromotion,
  originalUnitPrice: bigint
): bigint | null {
  switch (promotion.promotionType) {
    case 'FIXED_PRICE':
      return promotion.promoPrice ? nonNegative(moneyToCents(promotion.promoPrice)) : null;
    case 'FIXED_DISCOUNT':
      return promotion.discountAmount
        ? nonNegative(originalUnitPrice - moneyToCents(promotion.discountAmount))
        : null;
    case 'PERCENTAGE': {
      if (!promotion.discountPercent) {
        return null;
      }

      const basisPoints = moneyToCents(promotion.discountPercent);

      if (basisPoints > 10_000n) {
        return null;
      }

      return (originalUnitPrice * (10_000n - basisPoints) + 5_000n) / 10_000n;
    }
    case 'BUNDLE':
      return null;
  }
}

function nonNegative(value: bigint): bigint {
  return value < 0n ? 0n : value;
}
