import type { CreateOrderRequest } from '@brasa-viva/contracts';
import type { CartItem } from '../cart/cart-store';
import type { CheckoutFields, CheckoutOrderType } from './checkout-validation';

type BuildCreateOrderRequestInput = {
  branchSlug: string;
  fields: CheckoutFields;
  items: CartItem[];
  orderType: CheckoutOrderType;
};

export function buildCreateOrderRequest({
  branchSlug,
  fields,
  items,
  orderType
}: BuildCreateOrderRequestInput): CreateOrderRequest {
  const notes = fields.notes.trim();
  const deliveryAddress = fields.deliveryAddress.trim();

  return {
    branchSlug,
    orderType,
    customer: {
      name: fields.customerName.trim(),
      phone: fields.customerPhone.trim(),
      ...(orderType === 'DELIVERY' && deliveryAddress ? { deliveryAddress } : {}),
      ...(notes ? { notes } : {})
    },
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  };
}
