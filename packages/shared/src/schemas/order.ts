import { z } from 'zod';

export const ORDER_STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const OrderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  qty: z.number().int(),
  unitPrice: z.number(),
  lineTotal: z.number(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.enum(ORDER_STATUSES),
  customerName: z.string(),
  customerPhone: z.string(),
  subtotal: z.number(),
  total: z.number(),
  paidAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  createdAt: z.string(),
  items: z.array(OrderItemSchema),
});
export type Order = z.infer<typeof OrderSchema>;

// Input ตอน checkout
export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive('จำนวนต้องมากกว่า 0'),
});
export type CreateOrderItemInput = z.infer<typeof CreateOrderItemSchema>;

export const CreateOrderSchema = z.object({
  customerName: z.string().min(1, 'กรุณากรอกชื่อ').max(50),
  customerPhone: z.string().min(9, 'เบอร์โทรไม่ครบ').max(15),
  items: z.array(CreateOrderItemSchema).min(1, 'ตะกร้าต้องมีของอย่างน้อย 1 อย่าง'),
});
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
