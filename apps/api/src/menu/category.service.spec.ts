import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: {
    category: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    product: { count: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: { count: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CategoryService);
  });

  it('findAll คืนรายการเรียงตาม sortOrder', async () => {
    const items = [{ id: '1', name: 'drink', sortOrder: 0 }];
    prisma.category.findMany.mockResolvedValue(items);

    const result = await service.findAll();

    expect(result).toEqual(items);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { sortOrder: 'asc' },
    });
  });

  it('findOne throws NotFound ถ้าไม่พบ', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('remove throws Conflict ถ้ามี products ในหมวด', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1', name: 'drink' });
    prisma.product.count.mockResolvedValue(3);

    await expect(service.remove('1')).rejects.toThrow(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('remove สำเร็จถ้าไม่มี products', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1' });
    prisma.product.count.mockResolvedValue(0);
    prisma.category.delete.mockResolvedValue({ id: '1' });

    const result = await service.remove('1');

    expect(result).toEqual({ success: true });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
