import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductService', () => {
  let service: ProductService;

  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      category: { findUnique: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [ProductService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProductService);
  });

  it('create throws BadRequest ถ้า category ไม่มีอยู่', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(
      service.create({
        name: 'Latte',
        price: 75,
        categoryId: 'missing',
        isActive: true,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('create สำเร็จเมื่อ category มี', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
    const created = { id: 'p1', name: 'Latte', price: 75, categoryId: 'c1' };
    prisma.product.create.mockResolvedValue(created);

    const result = await service.create({
      name: 'Latte',
      price: 75,
      categoryId: 'c1',
      isActive: true,
    });

    expect(result).toEqual(created);
  });

  it('findAll filter active=true', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.findAll({ onlyActive: true });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
