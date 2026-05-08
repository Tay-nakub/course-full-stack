import { z } from 'zod';

// Category
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number().int(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'ชื่อหมวดต้องไม่ว่าง').max(50),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = CreateCategorySchema.partial();
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

// Product
export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
  categoryId: z.string(),
  category: CategorySchema.optional(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'ชื่อสินค้าต้องไม่ว่าง').max(100),
  price: z.number().positive('ราคาต้องมากกว่า 0'),
  imageUrl: z.url('ลิงก์รูปต้องเป็น URL').nullable().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1, 'ต้องเลือกหมวด'),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
