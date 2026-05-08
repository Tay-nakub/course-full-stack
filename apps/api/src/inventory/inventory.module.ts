import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';
import { StockMovementsService } from './stock-movements.service';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  controllers: [IngredientsController, RecipesController],
  providers: [IngredientsService, StockMovementsService, RecipesService],
  exports: [IngredientsService, StockMovementsService, RecipesService],
})
export class InventoryModule {}
