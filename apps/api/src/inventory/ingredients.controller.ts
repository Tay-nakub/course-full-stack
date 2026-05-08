import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateIngredientSchema,
  UpdateIngredientSchema,
  CreateStockMovementSchema,
  type CreateIngredientInput,
  type UpdateIngredientInput,
  type CreateStockMovementInput,
} from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { IngredientsService } from './ingredients.service';
import { StockMovementsService } from './stock-movements.service';

@Controller('inventory/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class IngredientsController {
  constructor(
    private readonly service: IngredientsService,
    private readonly movements: StockMovementsService,
  ) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateIngredientSchema))
    input: CreateIngredientInput,
  ) {
    return this.service.create(input);
  }

  // Stock movement endpoints — declared BEFORE the dynamic ':id' route
  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  recordMovement(
    @Body(new ZodValidationPipe(CreateStockMovementSchema))
    input: CreateStockMovementInput,
    @CurrentUser() user: AuthUser,
  ) {
    return this.movements.create(input, user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIngredientSchema))
    input: UpdateIngredientInput,
  ) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Get(':id/movements')
  listMovements(@Param('id') id: string) {
    return this.movements.findByIngredient(id);
  }

  @Post(':id/recompute-stock')
  @HttpCode(HttpStatus.OK)
  recompute(@Param('id') id: string) {
    return this.movements.recomputeStock(id);
  }
}
