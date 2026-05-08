import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStockMovementInput } from '@coffee/shared';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStockMovementInput, createdBy: string) {
    // PURCHASE quantity must be positive, SALE/WASTE must be negative
    const sign = input.quantity > 0 ? 1 : -1;
    if (input.reason === 'PURCHASE' && sign < 0) {
      throw new BadRequestException('PURCHASE ต้องเป็นบวก');
    }
    if (
      (input.reason === 'SALE' || input.reason === 'WASTE') &&
      sign > 0
    ) {
      throw new BadRequestException(`${input.reason} ต้องเป็นลบ`);
    }

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: input.ingredientId },
      });
      if (!ingredient) throw new NotFoundException('ไม่พบวัตถุดิบ');

      // Insert movement
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          reason: input.reason,
          costAtTime: ingredient.costPerUnit,
          note: input.note,
          createdBy,
        },
      });

      // Update cached currentStock (signed increment handles +/-)
      await tx.ingredient.update({
        where: { id: input.ingredientId },
        data: {
          currentStock: { increment: input.quantity },
        },
      });

      return movement;
    });
  }

  findByIngredient(ingredientId: string, limit = 50) {
    return this.prisma.stockMovement.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Sanity check: recompute currentStock from movements
  async recomputeStock(ingredientId: string) {
    const result = await this.prisma.stockMovement.aggregate({
      where: { ingredientId },
      _sum: { quantity: true },
    });
    const sum = Number(result._sum.quantity ?? 0);
    await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: sum },
    });
    return { ingredientId, currentStock: sum };
  }
}
