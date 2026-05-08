import {
  Injectable,
  Logger,
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
  private readonly logger = new Logger(OrdersService.name);

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
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException('ไม่พบออเดอร์');

      const allowed = VALID_TRANSITIONS[order.status];
      if (!allowed.includes(input.status)) {
        throw new ConflictException(
          `เปลี่ยนสถานะจาก ${order.status} → ${input.status} ไม่ได้`,
        );
      }

      const data: Prisma.OrderUpdateInput = { status: input.status };
      if (input.status === 'PREPARING' && !order.paidAt) {
        data.paidAt = new Date();
      }
      if (input.status === 'COMPLETED') {
        data.completedAt = new Date();

        // 🎯 Stock deduct + COGS snapshot — atomic 4-table transaction
        await this.deductStockAndSnapshotCogs(tx, order);
      }

      return tx.order.update({
        where: { id },
        data,
        include: { items: true },
      });
    });
  }

  /**
   * Atomic stock deduction + COGS snapshot — runs inside the parent transaction.
   *
   * For each OrderItem:
   *   - Look up the Product's recipe (RecipeItem[] with Ingredient).
   *   - Compute total ingredient deduction (qtyPerUnit × orderItem.qty).
   *   - Insert one StockMovement (type=SALE, signed-negative quantity, refOrderId set).
   *   - Decrement Ingredient.currentStock by that amount.
   *   - Sum (ingredient.costPerUnit × deductedQty) → write OrderItem.cogsSnapshot.
   *
   * Behavior on edge cases:
   *   - Recipe missing for a product → log warn, snapshot 0, skip stock changes.
   *     (Business decision: don't block sales for misconfigured products; admin
   *     fixes recipe later. Recipe should normally exist for active products.)
   *
   * If any step throws, the parent transaction rolls back the entire status
   * change — order stays in its prior state, no stock movement persists.
   */
  private async deductStockAndSnapshotCogs(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      items: Array<{ id: string; productId: string; qty: number }>;
    },
  ) {
    // 1. Fetch recipes for all products in this order
    const productIds = order.items.map((i) => i.productId);
    const recipes = await tx.recipeItem.findMany({
      where: { productId: { in: productIds } },
      include: { ingredient: true },
    });

    // Group by productId for lookup
    const recipesByProduct = new Map<string, typeof recipes>();
    for (const r of recipes) {
      const existing = recipesByProduct.get(r.productId);
      if (existing) {
        existing.push(r);
      } else {
        recipesByProduct.set(r.productId, [r]);
      }
    }

    // 2. For each OrderItem: calculate COGS + create StockMovements
    for (const item of order.items) {
      const recipe = recipesByProduct.get(item.productId) ?? [];
      if (recipe.length === 0) {
        this.logger.warn(
          `Order ${order.id} OrderItem ${item.id} (productId=${item.productId}) has no recipe — COGS = 0, no stock deduct`,
        );
        // เก็บ cogsSnapshot = 0 เพื่อให้ report ทำงาน
        await tx.orderItem.update({
          where: { id: item.id },
          data: { cogsSnapshot: 0 },
        });
        continue;
      }

      let cogsTotal = 0;

      for (const r of recipe) {
        const totalAmount = Number(r.quantity) * item.qty; // amount used
        const ingredientCost = Number(r.ingredient.costPerUnit) * totalAmount;
        cogsTotal += ingredientCost;

        // Create stock movement (SALE = negative)
        await tx.stockMovement.create({
          data: {
            ingredientId: r.ingredientId,
            quantity: -totalAmount, // signed negative
            reason: 'SALE',
            refOrderId: order.id,
            costAtTime: r.ingredient.costPerUnit,
            note: `Order ${order.id} item ${item.id}`,
          },
        });

        // Update cached currentStock
        await tx.ingredient.update({
          where: { id: r.ingredientId },
          data: { currentStock: { decrement: totalAmount } },
        });
      }

      // 3. Snapshot COGS into OrderItem
      await tx.orderItem.update({
        where: { id: item.id },
        data: { cogsSnapshot: cogsTotal },
      });
    }
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
