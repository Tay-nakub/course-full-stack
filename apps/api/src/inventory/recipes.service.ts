import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SetRecipeInput } from '@coffee/shared';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  getByProduct(productId: string) {
    return this.prisma.recipeItem.findMany({
      where: { productId },
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  // Replace entire recipe (idempotent — easier than diff)
  async setRecipe(productId: string, items: SetRecipeInput['items']) {
    return this.prisma.$transaction(async (tx) => {
      // Verify product exists
      const product = await tx.product.findUnique({
        where: { id: productId },
      });
      if (!product) throw new NotFoundException('ไม่พบสินค้า');

      // Verify all ingredients exist
      const ingredientIds = items.map((i) => i.ingredientId);
      if (ingredientIds.length > 0) {
        const ingredients = await tx.ingredient.findMany({
          where: { id: { in: ingredientIds } },
        });
        if (ingredients.length !== new Set(ingredientIds).size) {
          throw new NotFoundException('วัตถุดิบบางรายการไม่พบ');
        }
      }

      // Delete + re-insert (idempotent)
      await tx.recipeItem.deleteMany({ where: { productId } });

      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((i) => ({
            productId,
            ingredientId: i.ingredientId,
            quantity: i.quantity,
          })),
        });
      }

      return tx.recipeItem.findMany({
        where: { productId },
        include: { ingredient: true },
      });
    });
  }
}
