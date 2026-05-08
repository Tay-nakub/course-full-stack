import { z } from 'zod';

export const DailyReportSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  cogs: z.number(),
  grossProfit: z.number(),
  grossMarginPct: z.number(),
  orderCount: z.number(),
});
export type DailyReport = z.infer<typeof DailyReportSchema>;

export const TopProductSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  totalQty: z.number(),
  totalRevenue: z.number(),
});
export type TopProduct = z.infer<typeof TopProductSchema>;

export const LowStockItemSchema = z.object({
  ingredientId: z.string(),
  name: z.string(),
  unit: z.string(),
  currentStock: z.number(),
  minStock: z.number(),
  shortfall: z.number(),
});
export type LowStockItem = z.infer<typeof LowStockItemSchema>;

export const RevenueDayRowSchema = z.object({
  date: z.string(),
  revenue: z.number(),
  cogs: z.number(),
  grossProfit: z.number(),
});
export type RevenueDayRow = z.infer<typeof RevenueDayRowSchema>;
