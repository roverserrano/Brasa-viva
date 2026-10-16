import { z } from 'zod';
import { moneySchema } from './catalog';

const publicSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const orderTypeSchema = z.enum(['PICKUP', 'DELIVERY']);
export const orderStatusSchema = z.enum([
  'RECEIVED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED'
]);

export const orderStatusLabels = {
  RECEIVED: 'Recibido',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY: 'Listo para entregar',
  COMPLETED: 'Entregado',
  CANCELLED: 'Cancelado'
} as const;

export const permittedOrderTransitions: Record<
  z.infer<typeof orderStatusSchema>,
  readonly z.infer<typeof orderStatusSchema>[]
> = {
  RECEIVED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export const createOrderItemRequestSchema = z.object({
  productId: z.uuid(),
  quantity: z.int().min(1).max(99)
});

export const createOrderRequestSchema = z
  .object({
    branchSlug: publicSlugSchema,
    orderType: orderTypeSchema,
    customer: z.object({
      name: z.string().trim().min(2).max(160),
      phone: z
        .string()
        .trim()
        .min(7)
        .max(40)
        .regex(/^[0-9+()\s-]+$/, 'Ingresa un número de teléfono válido.'),
      deliveryAddress: z.string().trim().min(8).max(500).optional(),
      notes: z.string().trim().max(1000).optional()
    }),
    items: z.array(createOrderItemRequestSchema).min(1).max(30)
  })
  .superRefine((request, context) => {
    if (request.orderType === 'DELIVERY' && !request.customer.deliveryAddress) {
      context.addIssue({
        code: 'custom',
        message: 'La dirección es obligatoria para delivery.',
        path: ['customer', 'deliveryAddress']
      });
    }

    const productIds = new Set<string>();
    request.items.forEach((item, index) => {
      if (productIds.has(item.productId)) {
        context.addIssue({
          code: 'custom',
          message: 'Cada producto debe aparecer una sola vez en el pedido.',
          path: ['items', index, 'productId']
        });
      }

      productIds.add(item.productId);
    });
  });

export const orderItemResponseSchema = z.object({
  productId: z.uuid(),
  productName: z.string().min(1),
  quantity: z.int().min(1),
  unitPrice: moneySchema,
  discountAmount: moneySchema,
  lineTotal: moneySchema,
  appliedPromotionId: z.uuid().nullable()
});

export const createOrderResponseSchema = z.object({
  orderCode: z.string().regex(/^BV-\d{6,}$/),
  status: orderStatusSchema,
  branch: z.object({
    id: z.uuid(),
    name: z.string().min(1)
  }),
  orderType: orderTypeSchema,
  items: z.array(orderItemResponseSchema).min(1),
  subtotal: moneySchema,
  discountTotal: moneySchema,
  deliveryFee: moneySchema,
  total: moneySchema,
  whatsappUrl: z.url().nullable()
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
export type CreateOrderResponse = z.infer<typeof createOrderResponseSchema>;
export type OrderItemResponse = z.infer<typeof orderItemResponseSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type OrderType = z.infer<typeof orderTypeSchema>;
