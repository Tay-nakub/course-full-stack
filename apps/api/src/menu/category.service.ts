import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryInput, UpdateCategoryInput } from '@coffee/shared';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('ไม่พบหมวดหมู่');
    return category;
  }

  async create(input: CreateCategoryInput) {
    return this.prisma.category.create({ data: input });
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.findOne(id); // ensure exists
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOne(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new ConflictException(
        `ลบไม่ได้: หมวดนี้มี ${productCount} สินค้า — ย้ายสินค้าก่อน`,
      );
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
