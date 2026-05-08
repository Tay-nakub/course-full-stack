import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateIngredientInput,
  UpdateIngredientInput,
} from '@coffee/shared';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('ไม่พบวัตถุดิบ');
    return item;
  }

  create(input: CreateIngredientInput) {
    return this.prisma.ingredient.create({ data: input });
  }

  async update(id: string, input: UpdateIngredientInput) {
    await this.findOne(id);
    return this.prisma.ingredient.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOne(id);
    const recipeCount = await this.prisma.recipeItem.count({
      where: { ingredientId: id },
    });
    if (recipeCount > 0) {
      throw new ConflictException(
        `ลบไม่ได้ — วัตถุดิบนี้ถูกใช้ใน ${recipeCount} สูตร`,
      );
    }
    await this.prisma.ingredient.delete({ where: { id } });
    return { success: true };
  }
}
