import { Inject, Injectable } from '@nestjs/common';
import { OrderType, Prisma, StockStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type OrderTransaction = Prisma.TransactionClient;

export type PersistedOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  lineTotal: string;
  appliedPromotionId: string | null;
};

export type PersistOrderInput = {
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
  orderType: 'PICKUP' | 'DELIVERY';
  subtotal: string;
  discountTotal: string;
  total: string;
  items: PersistedOrderItem[];
};

@Injectable()
export class OrdersRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async withTransaction<T>(operation: (transaction: OrderTransaction) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((transaction) => operation(transaction));
  }

  async findActiveBranch(transaction: OrderTransaction, slug: string) {
    return transaction.branch.findFirst({
      where: {
        slug,
        deletedAt: null,
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        whatsapp: true,
        services: {
          where: {
            deletedAt: null,
            enabled: true
          },
          select: { serviceType: true }
        }
      }
    });
  }

  async findPurchasableProducts(
    transaction: OrderTransaction,
    branchId: string,
    productIds: string[]
  ) {
    return transaction.branchProduct.findMany({
      where: {
        branchId,
        productId: { in: productIds },
        available: true,
        stockStatus: { not: StockStatus.OUT_OF_STOCK },
        deletedAt: null,
        product: {
          active: true,
          deletedAt: null
        }
      },
      select: {
        productId: true,
        priceOverride: true,
        product: {
          select: {
            name: true,
            basePrice: true
          }
        }
      }
    });
  }

  async findEligiblePromotions(
    transaction: OrderTransaction,
    branchId: string,
    productIds: string[],
    now: Date
  ) {
    return transaction.promotion.findMany({
      where: {
        active: true,
        deletedAt: null,
        startsAt: { lte: now },
        endsAt: { gt: now },
        products: {
          some: {
            productId: { in: productIds },
            deletedAt: null
          }
        },
        OR: [
          { branches: { none: { deletedAt: null } } },
          { branches: { some: { branchId, deletedAt: null } } }
        ]
      },
      select: {
        id: true,
        promotionType: true,
        promoPrice: true,
        discountPercent: true,
        discountAmount: true,
        products: {
          where: {
            productId: { in: productIds },
            deletedAt: null
          },
          select: {
            productId: true,
            quantity: true
          }
        }
      }
    });
  }

  async findOrCreateCustomer(
    transaction: OrderTransaction,
    customer: { fullName: string; phone: string }
  ) {
    const existingCustomer = await transaction.customer.findFirst({
      where: {
        phone: customer.phone,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true }
    });

    if (existingCustomer) {
      return transaction.customer.update({
        where: { id: existingCustomer.id },
        data: { fullName: customer.fullName },
        select: { id: true }
      });
    }

    return transaction.customer.create({
      data: customer,
      select: { id: true }
    });
  }

  async createOrder(transaction: OrderTransaction, input: PersistOrderInput) {
    const order = await transaction.order.create({
      data: {
        branchId: input.branchId,
        customerId: input.customerId,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        notes: input.notes,
        orderType: input.orderType as OrderType,
        status: 'RECEIVED',
        subtotal: input.subtotal,
        discountTotal: input.discountTotal,
        deliveryFee: '0.00',
        total: input.total,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            productNameSnapshot: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            lineTotal: item.lineTotal,
            appliedPromotionId: item.appliedPromotionId
          }))
        }
      },
      select: {
        id: true,
        orderNumber: true
      }
    });
    const orderCode = `BV-${order.orderNumber.toString().padStart(6, '0')}`;

    return transaction.order.update({
      where: { id: order.id },
      data: { orderCode },
      select: {
        orderCode: true,
        status: true
      }
    });
  }
}
