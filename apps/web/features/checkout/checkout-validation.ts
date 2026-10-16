import { createOrderRequestSchema } from '@brasa-viva/contracts';

export type CheckoutOrderType = 'PICKUP' | 'DELIVERY';

export type CheckoutFields = {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  notes: string;
};

export type CheckoutErrors = Partial<Record<keyof CheckoutFields | 'orderType', string>>;

type ValidateCheckoutInput = {
  availableOrderTypes: CheckoutOrderType[];
  fields: CheckoutFields;
  orderType: CheckoutOrderType;
  servicesError: boolean;
  servicesLoading: boolean;
};

export function validateCheckout({
  availableOrderTypes,
  fields,
  orderType,
  servicesError,
  servicesLoading
}: ValidateCheckoutInput): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (servicesLoading || servicesError || availableOrderTypes.length === 0) {
    errors.orderType = 'Confirma los servicios disponibles de la sucursal para continuar.';
  } else if (!availableOrderTypes.includes(orderType)) {
    errors.orderType = 'El tipo de atención elegido ya no está disponible en esta sucursal.';
  }

  const customer = createOrderRequestSchema.shape.customer.safeParse({
    name: fields.customerName,
    phone: fields.customerPhone,
    ...(orderType === 'DELIVERY' ? { deliveryAddress: fields.deliveryAddress } : {}),
    notes: fields.notes
  });
  if (!customer.success) {
    const fieldNames: Record<string, keyof CheckoutFields> = {
      name: 'customerName',
      phone: 'customerPhone',
      deliveryAddress: 'deliveryAddress',
      notes: 'notes'
    };
    const messages: Record<keyof CheckoutFields, string> = {
      customerName: 'Ingresa tu nombre, entre 2 y 160 caracteres.',
      customerPhone: 'Ingresa un teléfono válido, sin letras, entre 7 y 40 caracteres.',
      deliveryAddress:
        'Indica una dirección de entre 8 y 500 caracteres para coordinar el delivery.',
      notes: 'Resume las indicaciones en un máximo de 1000 caracteres.'
    };
    for (const issue of customer.error.issues) {
      const field = fieldNames[String(issue.path[0])];
      if (field) errors[field] = messages[field];
    }
  }

  return errors;
}
