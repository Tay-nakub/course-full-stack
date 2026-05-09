import { z } from 'zod';

export const INGREDIENT_UNITS = ['GRAM', 'MILLILITER', 'PIECE'] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, string> = {
  GRAM: 'กรัม',
  MILLILITER: 'มิลลิลิตร',
  PIECE: 'ชิ้น',
};

export const STOCK_MOVEMENT_REASONS = ['PURCHASE', 'SALE', 'WASTE', 'ADJUSTMENT'] as const;
export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.enum(INGREDIENT_UNITS),
  costPerUnit: z.number(),
  currentStock: z.number(),
  minStock: z.number(),
});
export type Ingredient = z.infer<typeof IngredientSchema>;

export const CreateIngredientSchema = z.object({
  name: z.string().min(1, 'ต้องกรอกชื่อ').max(50),
  unit: z.enum(INGREDIENT_UNITS),
  costPerUnit: z.number().nonnegative('ต้นทุนต้องไม่ติดลบ'),
  minStock: z.number().nonnegative().default(0),
});
export type CreateIngredientInput = z.infer<typeof CreateIngredientSchema>;

export const UpdateIngredientSchema = CreateIngredientSchema.partial();
export type UpdateIngredientInput = z.infer<typeof UpdateIngredientSchema>;

// Stock movement (manual entry by admin)
export const CreateStockMovementSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().refine((v) => v !== 0, 'จำนวนต้องไม่เป็น 0'),
  reason: z.enum(STOCK_MOVEMENT_REASONS),
  note: z.string().optional(),
});
export type CreateStockMovementInput = z.infer<typeof CreateStockMovementSchema>;

// Recipe (Product ↔ Ingredient)
export const RecipeItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ingredientId: z.string(),
  quantity: z.number(),
  ingredient: IngredientSchema.optional(),
});
export type RecipeItem = z.infer<typeof RecipeItemSchema>;

export const SetRecipeItemSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
});
export type SetRecipeItemInput = z.infer<typeof SetRecipeItemSchema>;

export const SetRecipeSchema = z.object({
  productId: z.string(),
  items: z.array(SetRecipeItemSchema),
});
export type SetRecipeInput = z.infer<typeof SetRecipeSchema>;
