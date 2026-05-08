import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  ORDER_STATUSES,
  type CreateOrderInput,
  type UpdateOrderStatusInput,
  type OrderStatus,
} from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // ลูกค้า: สั่งของ — public (no auth)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body(new ZodValidationPipe(CreateOrderSchema)) input: CreateOrderInput,
  ) {
    return this.service.create(input);
  }

  // Kitchen + Admin: list orders — declared BEFORE the dynamic ':id' route
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  list(
    @Query('status') status?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const filter: { status?: OrderStatus; activeOnly?: boolean } = {};
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status as OrderStatus;
    }
    if (activeOnly === 'true') filter.activeOnly = true;
    return this.service.findAll(filter);
  }

  // ลูกค้า: ดู order ของตัวเอง — public (รู้ ID/number พอ)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Kitchen + Admin: update status
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema))
    input: UpdateOrderStatusInput,
  ) {
    return this.service.updateStatus(id, input);
  }
}
