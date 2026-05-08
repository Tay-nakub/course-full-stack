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
  order: { create: ReturnType<typeof vi.fn> };
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
      order: { create: vi.fn() },
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
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'COMPLETED',
        items: [],
      });

      await expect(
        service.updateStatus('o1', { status: 'PENDING' }),
      ).rejects.toThrow(ConflictException);
    });

    it('PENDING → PREPARING ตั้ง paidAt', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paidAt: null,
        items: [],
      });
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('o1', { status: 'PREPARING' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PREPARING',
            paidAt: expect.any(Date),
          }),
        }),
      );
    });

    it('READY → COMPLETED ตั้ง completedAt', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [],
      });
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('o1', { status: 'COMPLETED' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('PENDING → CANCELLED ทำได้', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paidAt: null,
        items: [],
      });
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('o1', { status: 'CANCELLED' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
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
