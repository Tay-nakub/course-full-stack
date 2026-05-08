import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('daily')
  daily(@Query('date') date?: string) {
    return this.service.daily(date);
  }

  @Get('top-products')
  topProducts(
    @Query('days') days?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.topProducts(
      days ? parseInt(days, 10) : 7,
      limit ? parseInt(limit, 10) : 5,
    );
  }

  @Get('low-stock')
  lowStock() {
    return this.service.lowStock();
  }

  @Get('revenue-last-days')
  revenueLastDays(@Query('days') days?: string) {
    return this.service.revenueLastDays(days ? parseInt(days, 10) : 7);
  }
}
