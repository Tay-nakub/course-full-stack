import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

interface MockTx {
  product: { findMany: ReturnType<typeof vi.fn> };
  order: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  recipeItem: { findMany: ReturnType<typeof vi.fn> };
  stockMovement: { create: ReturnType<typeof vi.fn> };
  ingredient: { update: ReturnType<typeof vi.fn> };
  orderItem: { update: ReturnType<typeof vi.fn> };
}

interface MockPrisma {
  $transaction: ReturnType<typeof vi.fn>;
  order: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: MockTx;
  let prisma: MockPrisma;

  beforeEach(async () => {
    tx = {
      product: { findMany: vi.fn() },
      order: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
      recipeItem: { findMany: vi.fn().mockResolvedValue([]) },
      stockMovement: { create: vi.fn().mockResolvedValue({}) },
      ingredient: { update: vi.fn().mockResolvedValue({}) },
      orderItem: { update: vi.fn().mockResolvedValue({}) },
    };
    prisma = {
      $transaction: vi.fn((fn: (tx: MockTx) => unknown) => fn(tx)),
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('throws BadRequest ถ้า product ไม่มี', async () => {
      tx.product.findMany.mockResolvedValue([]);
      await expect(
        service.create({
          customerName: 'A',
          customerPhone: '0800000000',
          items: [{ productId: 'missing', qty: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequest ถ้า product inactive', async () => {
      tx.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Latte', price: 75, isActive: false },
      ]);
      await expect(
        service.create({
          customerName: 'A',
          customerPhone: '0800000000',
          items: [{ productId: 'p1', qty: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('สร้าง order + items + คำนวณ total ฝั่ง server', async () => {
      tx.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Latte', price: 75, isActive: true },
        { id: 'p2', name: 'Croissant', price: 65, isActive: true },
      ]);
      tx.order.create.mockResolvedValue({
        id: 'o1',
        orderNumber: '#ABCDE',
        customerName: 'A',
        subtotal: 215,
        total: 215,
        items: [],
      });

      await service.create({
        customerName: 'A',
        customerPhone: '0800000000',
        items: [
          { productId: 'p1', qty: 2 },
          { productId: 'p2', qty: 1 },
        ],
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 215, // 75*2 + 65*1
            total: 215,
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  productId: 'p1',
                  qty: 2,
                  unitPrice: 75,
                  lineTotal: 150,
                }),
                expect.objectContaining({
                  productId: 'p2',
                  qty: 1,
                  unitPrice: 65,
                  lineTotal: 65,
                }),
              ]),
            },
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('throws Conflict ถ้า invalid transition', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'COMPLETED',
        items: [],
      });

      await expect(
        service.updateStatus('o1', { status: 'PENDING' }),
      ).rejects.toThrow(ConflictException);
    });

    it('PENDING → PREPARING ตั้ง paidAt', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paidAt: null,
        items: [],
      });

      await service.updateStatus('o1', { status: 'PREPARING' });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PREPARING',
            paidAt: expect.any(Date),
          }),
        }),
      );
    });

    it('READY → COMPLETED ตั้ง completedAt', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [],
      });

      await service.updateStatus('o1', { status: 'COMPLETED' });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('PENDING → CANCELLED ทำได้', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paidAt: null,
        items: [],
      });

      await service.updateStatus('o1', { status: 'CANCELLED' });

      expect(tx.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });

    it('regression: COMPLETED → COMPLETED still rejected (idempotency guard)', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'COMPLETED',
        items: [],
      });

      await expect(
        service.updateStatus('o1', { status: 'COMPLETED' }),
      ).rejects.toThrow(ConflictException);

      // No double-deduct: stockMovement.create must never have been called.
      expect(tx.stockMovement.create).not.toHaveBeenCalled();
      expect(tx.ingredient.update).not.toHaveBeenCalled();
      expect(tx.orderItem.update).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus → COMPLETED stock deduct (atomic)', () => {
    it('คำนวณ COGS ถูกต้องและบันทึก stock movements + decrement currentStock', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [{ id: 'oi1', productId: 'p-latte', qty: 2 }],
      });

      tx.recipeItem.findMany.mockResolvedValue([
        {
          productId: 'p-latte',
          ingredientId: 'i-coffee',
          quantity: 18, // 18g per latte
          ingredient: { id: 'i-coffee', costPerUnit: 0.8 },
        },
        {
          productId: 'p-latte',
          ingredientId: 'i-milk',
          quantity: 200, // 200ml per latte
          ingredient: { id: 'i-milk', costPerUnit: 0.05 },
        },
      ]);

      await service.updateStatus('o1', { status: 'COMPLETED' });

      // One StockMovement per ingredient (SALE)
      expect(tx.stockMovement.create).toHaveBeenCalledTimes(2);
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ingredientId: 'i-coffee',
            quantity: -36, // 18g × 2 latte = 36g out
            reason: 'SALE',
            refOrderId: 'o1',
          }),
        }),
      );
      expect(tx.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ingredientId: 'i-milk',
            quantity: -400, // 200ml × 2 = 400ml out
            reason: 'SALE',
            refOrderId: 'o1',
          }),
        }),
      );

      // currentStock decrement called for each ingredient
      expect(tx.ingredient.update).toHaveBeenCalledTimes(2);
      expect(tx.ingredient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'i-coffee' },
          data: { currentStock: { decrement: 36 } },
        }),
      );

      // cogsSnapshot = (18*0.8 + 200*0.05) * 2 = (14.4 + 10) * 2 = 24.4 * 2 = 48.8
      // Wait recompute: per-latte: 18*0.8 = 14.4, 200*0.05 = 10, total per latte = 24.4
      // For qty=2: total = 14.4*2 + 10*2 = 28.8 + 20 = 48.8
      expect(tx.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'oi1' },
          data: { cogsSnapshot: 48.8 },
        }),
      );
    });

    it('product ไม่มี recipe — log warn + cogsSnapshot=0, ไม่สร้าง stock movement', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [{ id: 'oi1', productId: 'p-no-recipe', qty: 1 }],
      });

      tx.recipeItem.findMany.mockResolvedValue([]); // no recipe

      await service.updateStatus('o1', { status: 'COMPLETED' });

      expect(tx.stockMovement.create).not.toHaveBeenCalled();
      expect(tx.ingredient.update).not.toHaveBeenCalled();
      expect(tx.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'oi1' },
          data: { cogsSnapshot: 0 },
        }),
      );
    });

    it('mixed: order has 2 items — one with recipe, one without', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [
          { id: 'oi1', productId: 'p-latte', qty: 1 },
          { id: 'oi2', productId: 'p-no-recipe', qty: 3 },
        ],
      });

      tx.recipeItem.findMany.mockResolvedValue([
        {
          productId: 'p-latte',
          ingredientId: 'i-coffee',
          quantity: 18,
          ingredient: { id: 'i-coffee', costPerUnit: 0.8 },
        },
      ]);

      await service.updateStatus('o1', { status: 'COMPLETED' });

      expect(tx.stockMovement.create).toHaveBeenCalledTimes(1);
      // p-latte: 18*0.8 = 14.4
      expect(tx.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'oi1' },
          data: { cogsSnapshot: 14.4 },
        }),
      );
      // p-no-recipe: snapshot 0
      expect(tx.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'oi2' },
          data: { cogsSnapshot: 0 },
        }),
      );
    });

    it('rolls back: tx callback throws → no order.update applied', async () => {
      tx.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [{ id: 'oi1', productId: 'p-latte', qty: 1 }],
      });
      tx.recipeItem.findMany.mockResolvedValue([
        {
          productId: 'p-latte',
          ingredientId: 'i-coffee',
          quantity: 18,
          ingredient: { id: 'i-coffee', costPerUnit: 0.8 },
        },
      ]);
      tx.ingredient.update.mockRejectedValueOnce(new Error('DB write failed'));

      await expect(
        service.updateStatus('o1', { status: 'COMPLETED' }),
      ).rejects.toThrow('DB write failed');

      // tx.order.update is the FINAL step inside the transaction; if anything
      // else in the transaction throws, the tx callback bubbles, so order.update
      // is never invoked. This proves rollback semantics in the mock.
      expect(tx.order.update).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('throws NotFound ถ้าไม่มี', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
