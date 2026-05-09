import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductInput, UpdateProductInput } from '@coffee/shared';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts?: { onlyActive?: boolean }) {
    return this.prisma.product.findMany({
      where: opts?.onlyActive ? { isActive: true } : undefined,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return product;
  }

  async create(input: CreateProductInput) {
    await this.assertCategoryExists(input.categoryId);
    return this.prisma.product.create({
      data: { ...input, imageUrl: input.imageUrl ?? null },
      include: { category: true },
    });
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findOne(id);
    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    return this.prisma.product.update({
      where: { id },
      data: input,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!exists) throw new BadRequestException('หมวดที่เลือกไม่มีอยู่');
  }
}
