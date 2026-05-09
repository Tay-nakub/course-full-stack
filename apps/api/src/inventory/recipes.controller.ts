import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { SetRecipeItemSchema, type SetRecipeItemInput } from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RecipesService } from './recipes.service';

const RecipeItemArraySchema = z.array(SetRecipeItemSchema);

@Controller('inventory/recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class RecipesController {
  constructor(private readonly service: RecipesService) {}

  @Get('product/:productId')
  get(@Param('productId') productId: string) {
    return this.service.getByProduct(productId);
  }

  @Put('product/:productId')
  @HttpCode(HttpStatus.OK)
  set(
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(RecipeItemArraySchema))
    items: SetRecipeItemInput[],
  ) {
    return this.service.setRecipe(productId, items);
  }
}
