import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async daily(dateStr?: string) {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const completed = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: start, lt: end },
      },
      include: { items: true },
    });

    const revenue = completed.reduce((s, o) => s + Number(o.total), 0);
    const cogs = completed.reduce(
      (s, o) =>
        s + o.items.reduce((s2, i) => s2 + Number(i.cogsSnapshot ?? 0), 0),
      0,
    );
    const grossProfit = revenue - cogs;
    const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      date: start.toISOString().slice(0, 10),
      revenue,
      cogs,
      grossProfit,
      grossMarginPct,
      orderCount: completed.length,
    };
  }

  async topProducts(days = 7, limit = 5) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const grouped = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        order: {
          status: 'COMPLETED',
          completedAt: { gte: since },
        },
      },
      _sum: { qty: true, lineTotal: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: limit,
    });

    return grouped.map((g) => ({
      productId: g.productId,
      productName: g.productName,
      totalQty: Number(g._sum.qty ?? 0),
      totalRevenue: Number(g._sum.lineTotal ?? 0),
    }));
  }

  async lowStock() {
    // Ingredients ที่ currentStock <= minStock
    const all = await this.prisma.ingredient.findMany({
      orderBy: { name: 'asc' },
    });

    return all
      .filter((i) => Number(i.currentStock) <= Number(i.minStock))
      .map((i) => ({
        ingredientId: i.id,
        name: i.name,
        unit: i.unit,
        currentStock: Number(i.currentStock),
        minStock: Number(i.minStock),
        shortfall: Number(i.minStock) - Number(i.currentStock),
      }));
  }

  async revenueLastDays(days = 7) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - days + 1);

    // Use raw SQL for date grouping (Prisma groupBy can't truncate dates)
    // Note: column names map via Prisma @map; here Postgres has columns
    // exactly as the model fields (no @map for these). Tables: orders,
    // order_items.
    const rows = await this.prisma.$queryRaw<
      Array<{ date: string; revenue: number; cogs: number }>
    >`
      SELECT
        TO_CHAR(date_trunc('day', "completedAt"), 'YYYY-MM-DD') as date,
        SUM(total)::float as revenue,
        COALESCE(SUM(
          (SELECT COALESCE(SUM("cogsSnapshot"), 0) FROM order_items WHERE "orderId" = orders.id)
        ), 0)::float as cogs
      FROM orders
      WHERE status = 'COMPLETED' AND "completedAt" >= ${since}
      GROUP BY date_trunc('day', "completedAt")
      ORDER BY date ASC;
    `;

    return rows.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      cogs: Number(r.cogs),
      grossProfit: Number(r.revenue) - Number(r.cogs),
    }));
  }
}
