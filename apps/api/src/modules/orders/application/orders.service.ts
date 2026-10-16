import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  createOrderResponseSchema,
  type CreateOrderRequest,
  type CreateOrderResponse
} from '@brasa-viva/contracts';
import { calculateOrder } from '../domain/order-pricing';
import { buildWhatsAppUrl } from '../domain/whatsapp';
import { OrdersRepository } from '../infrastructure/orders.repository';

@Injectable()
export class OrdersService {
  constructor(@Inject(OrdersRepository) private readonly ordersRepository: OrdersRepository) {}

  async create(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.ordersRepository.withTransaction(async (transaction) => {
      const branch = await this.ordersRepository.findActiveBranch(transaction, request.branchSlug);

      if (!branch) {
        throw new NotFoundException({
          code: 'BRANCH_NOT_FOUND',
          message: 'La sucursal no está disponible para recibir pedidos.'
        });
      }

      const receivesSelectedOrderType = branch.services.some(
        (service) => service.serviceType === request.orderType
      );

      if (!receivesSelectedOrderType) {
        throw new ConflictException({
          code: 'ORDER_TYPE_NOT_AVAILABLE',
          message: 'La sucursal ya no ofrece el tipo de atención seleccionado.'
        });
      }

      const productIds = request.items.map((item) => item.productId);
      const branchProducts = await this.ordersRepository.findPurchasableProducts(
        transaction,
        branch.id,
        productIds
      );

      if (branchProducts.length !== productIds.length) {
        throw new ConflictException({
          code: 'PRODUCT_UNAVAILABLE',
          message: 'Uno o más productos ya no están disponibles en esta sucursal.'
        });
      }

      const requestedQuantityByProductId = new Map(
        request.items.map((item) => [item.productId, item.quantity])
      );
      const promotions = await this.ordersRepository.findEligiblePromotions(
        transaction,
        branch.id,
        productIds,
        new Date()
      );
      const calculatedOrder = calculateOrder(
        branchProducts.map((branchProduct) => ({
          productId: branchProduct.productId,
          name: branchProduct.product.name,
          unitPrice: branchProduct.priceOverride ?? branchProduct.product.basePrice,
          quantity: requestedQuantityByProductId.get(branchProduct.productId) ?? 0
        })),
        promotions
      );
      const customer = await this.ordersRepository.findOrCreateCustomer(transaction, {
        fullName: request.customer.name,
        phone: request.customer.phone
      });
      const persistedOrder = await this.ordersRepository.createOrder(transaction, {
        branchId: branch.id,
        customerId: customer.id,
        customerName: request.customer.name,
        customerPhone: request.customer.phone,
        deliveryAddress:
          request.orderType === 'DELIVERY' ? (request.customer.deliveryAddress ?? null) : null,
        notes: request.customer.notes ?? null,
        orderType: request.orderType,
        subtotal: calculatedOrder.subtotal,
        discountTotal: calculatedOrder.discountTotal,
        total: calculatedOrder.total,
        items: calculatedOrder.lines
      });

      if (!persistedOrder.orderCode) {
        throw new Error('No se pudo generar el código público del pedido.');
      }

      const whatsappUrl = buildWhatsAppUrl(branch.whatsapp, {
        ...calculatedOrder,
        orderCode: persistedOrder.orderCode,
        branchName: branch.name,
        customerName: request.customer.name,
        orderType: request.orderType,
        deliveryAddress:
          request.orderType === 'DELIVERY' ? (request.customer.deliveryAddress ?? null) : null,
        notes: request.customer.notes ?? null
      });

      return createOrderResponseSchema.parse({
        orderCode: persistedOrder.orderCode,
        status: persistedOrder.status,
        branch: {
          id: branch.id,
          name: branch.name
        },
        orderType: request.orderType,
        items: calculatedOrder.lines,
        subtotal: calculatedOrder.subtotal,
        discountTotal: calculatedOrder.discountTotal,
        deliveryFee: '0.00',
        total: calculatedOrder.total,
        whatsappUrl
      });
    });
  }
}
