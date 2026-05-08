import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderStatus as OrderStatusType,
} from '@coffee/shared';

const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch products + verify all exist + active
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('สินค้าบางรายการไม่พบ');
      }
      const inactive = products.filter((p) => !p.isActive);
      if (inactive.length > 0) {
        throw new BadRequestException(
          `สินค้าหมด: ${inactive.map((p) => p.name).join(', ')}`,
        );
      }

      // 2. Calculate totals (server-side — never trust FE)
      const productMap = new Map(products.map((p) => [p.id, p]));
      const items = input.items.map((line) => {
        const product = productMap.get(line.productId)!;
        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * line.qty;
        return {
          productId: product.id,
          productName: product.name,
          qty: line.qty,
          unitPrice,
          lineTotal,
        };
      });
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const total = subtotal; // no tax/discount in MVP

      // 3. Generate orderNumber (random short code)
      const orderNumber = `#${randomOrderNumber()}`;

      // 4. Create order + items
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subtotal,
          total,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });

      return order;
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return order;
  }

  async findByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return order;
  }

  async findAll(
    filter: { status?: OrderStatusType; activeOnly?: boolean } = {},
  ) {
    const where: Prisma.OrderWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.activeOnly) {
      where.status = { in: ['PENDING', 'PREPARING', 'READY'] };
    }

    return this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    const order = await this.findOne(id);
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw new ConflictException(
        `เปลี่ยนสถานะจาก ${order.status} → ${input.status} ไม่ได้`,
      );
    }

    const data: Prisma.OrderUpdateInput = { status: input.status };
    if (input.status === 'PREPARING' && !order.paidAt) {
      data.paidAt = new Date(); // mark paid when staff accept
    }
    if (input.status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}

function randomOrderNumber(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // exclude confusing chars
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
