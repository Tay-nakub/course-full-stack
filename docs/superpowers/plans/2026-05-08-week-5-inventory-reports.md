# Week 5 — Inventory + Reports Implementation Plan ⭐

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ใส่ "หัวใจ business logic" ของร้านกาแฟ — ทุกครั้งที่ order COMPLETED → atomic transaction → คำนวณ COGS + ลด stock + log movement → admin เห็นกำไร/ทุนวันนี้ + low stock alerts ใน dashboard

**Architecture:** Event-sourced inventory (currentStock = sum of all StockMovements). Recipe ผูก Product ↔ Ingredient (with quantity). Order COMPLETED transition → atomic transaction ที่แตะ 4 tables (OrderItem + StockMovement + Ingredient cache + Order). Reports endpoints aggregate via Prisma raw queries. Reports dashboard ใช้ Recharts

**Tech Stack:** ทุกอย่าง Week 1-4 + Recharts (chart library) + Prisma raw queries (`$queryRaw`)

**Spec Reference:** [course design spec § Week 5](../specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Pre-requisites:**
- Week 4 complete (Order flow + Kitchen UI + state transitions)
- มี orders ใน DB อย่างน้อย 5-10 records (mix statuses) สำหรับ test reports
- Admin user promoted แล้ว

---

## File Structure (เป้าหมายเมื่อจบ Week 5)

```
course-full-stack/
├── apps/
│   ├── web/
│   │   └── app/(admin)/admin/
│   │       ├── inventory/              ← ⭐ ใหม่
│   │       │   ├── page.tsx
│   │       │   └── components/
│   │       │       ├── ingredient-list.tsx
│   │       │       ├── ingredient-form.tsx
│   │       │       └── stock-movement-form.tsx
│   │       ├── menu/
│   │       │   └── components/
│   │       │       └── recipe-editor.tsx  ← ⭐ ใหม่
│   │       └── reports/                ← ⭐ ใหม่
│   │           ├── page.tsx
│   │           └── components/
│   │               ├── kpi-cards.tsx
│   │               ├── revenue-chart.tsx
│   │               ├── top-products-table.tsx
│   │               └── low-stock-alerts.tsx
│   │
│   └── api/
│       └── src/
│           ├── inventory/              ← ⭐ ใหม่
│           │   ├── inventory.module.ts
│           │   ├── ingredients.controller.ts
│           │   ├── ingredients.service.ts
│           │   ├── recipes.controller.ts
│           │   ├── recipes.service.ts
│           │   ├── stock-movements.service.ts
│           │   └── inventory.service.spec.ts
│           ├── orders/
│           │   ├── orders.service.ts   ← ขยาย: stock deduct + COGS
│           │   └── orders.service.spec.ts ← เพิ่ม tests
│           └── reports/                ← ⭐ ใหม่
│               ├── reports.module.ts
│               ├── reports.controller.ts
│               └── reports.service.ts
│
└── packages/
    └── shared/
        └── src/schemas/
            ├── inventory.ts            ← ⭐ ใหม่
            └── reports.ts              ← ⭐ ใหม่
```

---

## Tasks

### Task 1: Inventory + Reports Schemas + Prisma Models

**Files:**
- Create: `packages/shared/src/schemas/inventory.ts`
- Create: `packages/shared/src/schemas/reports.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1.1: Inventory schemas**

Create file `packages/shared/src/schemas/inventory.ts`:

```ts
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

export const SetRecipeSchema = z.object({
  productId: z.string(),
  items: z.array(z.object({
    ingredientId: z.string(),
    quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  })),
});
export type SetRecipeInput = z.infer<typeof SetRecipeSchema>;
```

- [ ] **Step 1.2: Reports schemas**

Create file `packages/shared/src/schemas/reports.ts`:

```ts
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
```

- [ ] **Step 1.3: Export**

แก้ `packages/shared/src/index.ts`:
```ts
export * from './types/user';
export * from './schemas/auth';
export * from './schemas/menu';
export * from './schemas/order';
export * from './schemas/inventory';
export * from './schemas/reports';
```

- [ ] **Step 1.4: Prisma models**

Append ต่อท้าย `apps/api/prisma/schema.prisma`:

```prisma
model Ingredient {
  id           String          @id @default(cuid())
  name         String          @unique
  unit         IngredientUnit
  costPerUnit  Decimal         @db.Decimal(10, 4)
  currentStock Decimal         @default(0) @db.Decimal(12, 4)
  minStock     Decimal         @default(0) @db.Decimal(10, 2)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  recipeItems  RecipeItem[]
  movements    StockMovement[]

  @@map("ingredients")
}

model RecipeItem {
  id           String     @id @default(cuid())
  product      Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId    String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Restrict)
  ingredientId String
  quantity     Decimal    @db.Decimal(10, 4)

  @@unique([productId, ingredientId])
  @@index([productId])
  @@map("recipe_items")
}

model StockMovement {
  id           String              @id @default(cuid())
  ingredient   Ingredient          @relation(fields: [ingredientId], references: [id], onDelete: Restrict)
  ingredientId String
  quantity     Decimal             @db.Decimal(12, 4)  // signed (+ purchase, - sale)
  reason       StockMovementReason
  refOrderId   String?
  costAtTime   Decimal             @db.Decimal(10, 4)
  note         String?
  createdAt    DateTime            @default(now())
  createdBy    String?

  @@index([ingredientId])
  @@index([createdAt])
  @@index([refOrderId])
  @@map("stock_movements")
}

enum IngredientUnit {
  GRAM
  MILLILITER
  PIECE
}

enum StockMovementReason {
  PURCHASE
  SALE
  WASTE
  ADJUSTMENT
}
```

- [ ] **Step 1.5: เพิ่ม `cogsSnapshot` ใน OrderItem**

หาบรรทัด `model OrderItem` ใน schema.prisma แล้วเพิ่ม:

```prisma
model OrderItem {
  id           String   @id @default(cuid())
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId      String
  product      Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  productId    String
  productName  String
  qty          Int
  unitPrice    Decimal  @db.Decimal(10, 2)
  lineTotal    Decimal  @db.Decimal(10, 2)
  cogsSnapshot Decimal? @db.Decimal(12, 4)    // ⭐ เพิ่มบรรทัดนี้

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}
```

- [ ] **Step 1.6: Migrate**

```bash
cd apps/api
pnpm prisma migrate dev --name add_inventory_and_cogs
cd ../..
```

- [ ] **Step 1.7: Verify**

```bash
docker exec coffee-postgres-dev psql -U coffee -d coffee -c "\dt"
# Expected: ingredients, recipe_items, stock_movements + orders/order_items มี cogs_snapshot column
```

- [ ] **Step 1.8: Commit**

```bash
git add packages/shared apps/api/prisma
git commit -m "feat: add inventory schemas + Prisma models with cogsSnapshot"
```

---

### Task 2: Ingredients CRUD

**Files:**
- Create: `apps/api/src/inventory/inventory.module.ts`
- Create: `apps/api/src/inventory/ingredients.service.ts`
- Create: `apps/api/src/inventory/ingredients.controller.ts`

- [ ] **Step 2.1: IngredientsService**

Create file `apps/api/src/inventory/ingredients.service.ts`:

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateIngredientInput, UpdateIngredientInput } from '@coffee/shared';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('ไม่พบวัตถุดิบ');
    return item;
  }

  create(input: CreateIngredientInput) {
    return this.prisma.ingredient.create({ data: input });
  }

  async update(id: string, input: UpdateIngredientInput) {
    await this.findOne(id);
    return this.prisma.ingredient.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOne(id);
    const recipeCount = await this.prisma.recipeItem.count({ where: { ingredientId: id } });
    if (recipeCount > 0) {
      throw new ConflictException(`ลบไม่ได้ — วัตถุดิบนี้ถูกใช้ใน ${recipeCount} สูตร`);
    }
    await this.prisma.ingredient.delete({ where: { id } });
    return { success: true };
  }
}
```

- [ ] **Step 2.2: IngredientsController**

Create file `apps/api/src/inventory/ingredients.controller.ts`:

```ts
import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import {
  CreateIngredientSchema, UpdateIngredientSchema,
  type CreateIngredientInput, type UpdateIngredientInput,
} from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IngredientsService } from './ingredients.service';

@Controller('inventory/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class IngredientsController {
  constructor(private readonly service: IngredientsService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(CreateIngredientSchema)) input: CreateIngredientInput) {
    return this.service.create(input);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateIngredientSchema)) input: UpdateIngredientInput,
  ) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

> 🎓 **Pattern**: ทั้ง class ใส่ `@UseGuards` + `@Roles('ADMIN')` — ทุก method admin only (inventory = sensitive)

- [ ] **Step 2.3: InventoryModule**

Create file `apps/api/src/inventory/inventory.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { IngredientsController } from './ingredients.controller';
import { IngredientsService } from './ingredients.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService],
  exports: [IngredientsService],
})
export class InventoryModule {}
```

แก้ `apps/api/src/app.module.ts` เพิ่ม `InventoryModule` ใน imports

- [ ] **Step 2.4: ทดสอบ Postman**

```bash
# Login admin → Bearer token
POST /api/inventory/ingredients
{
  "name": "เมล็ดกาแฟ",
  "unit": "GRAM",
  "costPerUnit": 0.8,
  "minStock": 500
}
# → 201
```

ทดลองเพิ่ม 5-6 ingredients: เมล็ดกาแฟ, นม, น้ำตาล, แก้ว, แป้งครัวซองต์, ช็อกโกแลต

- [ ] **Step 2.5: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): add Ingredients CRUD with admin guards"
```

---

### Task 3: Stock Movements (Manual Entry)

**Files:**
- Create: `apps/api/src/inventory/stock-movements.service.ts`
- Modify: `apps/api/src/inventory/inventory.module.ts`
- Add endpoints to: `apps/api/src/inventory/ingredients.controller.ts` (or new `stock-movements.controller.ts`)

> 🎓 **Concept**: Stock movements = single source of truth. `currentStock` = denormalized cache. รัน `currentStock = SUM(quantity)` ผ่าน aggregator → รับประกัน accuracy

- [ ] **Step 3.1: StockMovementsService**

Create file `apps/api/src/inventory/stock-movements.service.ts`:

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateStockMovementInput } from '@coffee/shared';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateStockMovementInput, createdBy: string) {
    // PURCHASE quantity must be positive, SALE/WASTE must be negative
    const sign = input.quantity > 0 ? 1 : -1;
    if (input.reason === 'PURCHASE' && sign < 0) {
      throw new BadRequestException('PURCHASE ต้องเป็นบวก');
    }
    if ((input.reason === 'SALE' || input.reason === 'WASTE') && sign > 0) {
      throw new BadRequestException(`${input.reason} ต้องเป็นลบ`);
    }

    return this.prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: input.ingredientId },
      });
      if (!ingredient) throw new NotFoundException('ไม่พบวัตถุดิบ');

      // Insert movement
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: input.ingredientId,
          quantity: input.quantity,
          reason: input.reason,
          costAtTime: ingredient.costPerUnit,
          note: input.note,
          createdBy,
        },
      });

      // Update cached currentStock
      await tx.ingredient.update({
        where: { id: input.ingredientId },
        data: {
          currentStock: { increment: input.quantity }, // Prisma handles signed
        },
      });

      return movement;
    });
  }

  findByIngredient(ingredientId: string, limit = 50) {
    return this.prisma.stockMovement.findMany({
      where: { ingredientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Sanity check: recompute currentStock from movements
  async recomputeStock(ingredientId: string) {
    const result = await this.prisma.stockMovement.aggregate({
      where: { ingredientId },
      _sum: { quantity: true },
    });
    const sum = Number(result._sum.quantity ?? 0);
    await this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: { currentStock: sum },
    });
    return sum;
  }
}
```

- [ ] **Step 3.2: เพิ่ม endpoints ใน IngredientsController**

แก้ `apps/api/src/inventory/ingredients.controller.ts`, เพิ่ม:

```ts
import { CreateStockMovementSchema, type CreateStockMovementInput } from '@coffee/shared';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { StockMovementsService } from './stock-movements.service';

// ใน constructor เพิ่ม:
constructor(
  private readonly service: IngredientsService,
  private readonly movements: StockMovementsService,
) {}

// เพิ่ม methods:

@Post('movements')
@HttpCode(HttpStatus.CREATED)
recordMovement(
  @Body(new ZodValidationPipe(CreateStockMovementSchema)) input: CreateStockMovementInput,
  @CurrentUser() user: AuthUser,
) {
  return this.movements.create(input, user.id);
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
```

- [ ] **Step 3.3: Register service**

แก้ `apps/api/src/inventory/inventory.module.ts`:
```ts
import { StockMovementsService } from './stock-movements.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService, StockMovementsService],
  exports: [IngredientsService, StockMovementsService],
})
export class InventoryModule {}
```

- [ ] **Step 3.4: ทดสอบ**

```bash
# PURCHASE (initial stock)
POST /api/inventory/ingredients/movements
{
  "ingredientId": "<coffee-bean-id>",
  "quantity": 1000,
  "reason": "PURCHASE",
  "note": "ครั้งแรก เปิดร้าน"
}
# → 201

# Verify currentStock updated
GET /api/inventory/ingredients/<id>
# → currentStock: 1000

# WASTE
POST /api/inventory/ingredients/movements
{ "ingredientId": "<id>", "quantity": -50, "reason": "WASTE", "note": "หมดอายุ" }
# → 201, currentStock = 950
```

- [ ] **Step 3.5: Commit**

```bash
git add apps/api/src/inventory
git commit -m "feat(api): add stock movements (PURCHASE/SALE/WASTE/ADJUSTMENT)"
```

---

### Task 4: Recipe Module (Product ↔ Ingredient)

**Files:**
- Create: `apps/api/src/inventory/recipes.service.ts`
- Create: `apps/api/src/inventory/recipes.controller.ts`
- Modify: `apps/api/src/inventory/inventory.module.ts`

- [ ] **Step 4.1: RecipesService**

Create file `apps/api/src/inventory/recipes.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { SetRecipeInput } from '@coffee/shared';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByProduct(productId: string) {
    return this.prisma.recipeItem.findMany({
      where: { productId },
      include: { ingredient: true },
      orderBy: { ingredient: { name: 'asc' } },
    });
  }

  // Replace entire recipe (idempotent — easier than diff)
  async setRecipe(productId: string, items: SetRecipeInput['items']) {
    return this.prisma.$transaction(async (tx) => {
      // Verify product exists
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new NotFoundException('ไม่พบสินค้า');

      // Verify all ingredients exist
      const ingredientIds = items.map((i) => i.ingredientId);
      const ingredients = await tx.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });
      if (ingredients.length !== ingredientIds.length) {
        throw new NotFoundException('วัตถุดิบบางรายการไม่พบ');
      }

      // Delete + re-insert (idempotent)
      await tx.recipeItem.deleteMany({ where: { productId } });

      if (items.length > 0) {
        await tx.recipeItem.createMany({
          data: items.map((i) => ({
            productId,
            ingredientId: i.ingredientId,
            quantity: i.quantity,
          })),
        });
      }

      return tx.recipeItem.findMany({
        where: { productId },
        include: { ingredient: true },
      });
    });
  }
}
```

> 🎓 **Pattern — replace strategy**: Recipe edits = "replace entire" ไม่ใช่ diff. ง่ายกว่า, idempotent, atomic in transaction. Trade-off: lose audit trail ของ individual changes (acceptable สำหรับ MVP)

- [ ] **Step 4.2: RecipesController**

Create file `apps/api/src/inventory/recipes.controller.ts`:

```ts
import {
  Body, Controller, Get, Param, Put, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { SetRecipeSchema, type SetRecipeInput } from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RecipesService } from './recipes.service';

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
    @Body(new ZodValidationPipe(SetRecipeSchema.shape.items.array())) items: SetRecipeInput['items'],
  ) {
    return this.service.setRecipe(productId, items);
  }
}
```

> 📝 **Note**: PUT (replace) vs POST (create new) — recipe = whole-replace operation, PUT semantics ถูกต้อง

- [ ] **Step 4.3: Register**

แก้ `apps/api/src/inventory/inventory.module.ts`:
```ts
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  controllers: [IngredientsController, RecipesController],
  providers: [IngredientsService, StockMovementsService, RecipesService],
  exports: [IngredientsService, StockMovementsService, RecipesService],
})
export class InventoryModule {}
```

- [ ] **Step 4.4: ทดสอบ**

```bash
# Set recipe สำหรับ Latte
PUT /api/inventory/recipes/product/<latte-id>
[
  { "ingredientId": "<coffee-bean-id>", "quantity": 18 },     # 18g
  { "ingredientId": "<milk-id>", "quantity": 200 },           # 200ml
  { "ingredientId": "<cup-id>", "quantity": 1 }               # 1 piece
]
# → 200 + recipe items

# Get recipe
GET /api/inventory/recipes/product/<latte-id>
# → array of RecipeItem with ingredient details
```

- [ ] **Step 4.5: Commit**

```bash
git add apps/api/src/inventory
git commit -m "feat(api): add Recipe module with whole-replace strategy"
```

---

### Task 5: ⭐ Order COMPLETED → Stock Deduct + COGS (THE BIG ONE)

**Files:**
- Modify: `apps/api/src/orders/orders.service.ts`
- Create: `apps/api/src/orders/orders.service.spec.ts` (extend existing tests)

> 🎯 **THIS IS THE WEEK 5 CENTERPIECE**: เมื่อ order เปลี่ยนเป็น COMPLETED → atomic transaction ที่:
> 1. คำนวณ COGS ของแต่ละ OrderItem จาก recipe
> 2. Update OrderItem.cogsSnapshot
> 3. Create StockMovement (SALE) สำหรับ ingredient ทุกตัวใน recipe
> 4. Update Ingredient.currentStock cache
> 5. ทุกอย่างใน 1 transaction → all-or-nothing

- [ ] **Step 5.1: ขยาย OrdersService.updateStatus**

แก้ `apps/api/src/orders/orders.service.ts`:

```ts
// เพิ่ม import
import { Logger } from '@nestjs/common';

// ใน class OrdersService — เพิ่ม logger
private readonly logger = new Logger(OrdersService.name);

// แทนที่ updateStatus method ทั้งหมด:
async updateStatus(id: string, input: UpdateOrderStatusInput) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw new ConflictException(
        `เปลี่ยนสถานะจาก ${order.status} → ${input.status} ไม่ได้`,
      );
    }

    const data: Prisma.OrderUpdateInput = { status: input.status };
    if (input.status === 'PREPARING' && !order.paidAt) {
      data.paidAt = new Date();
    }
    if (input.status === 'COMPLETED') {
      data.completedAt = new Date();

      // 🎯 Stock deduct + COGS snapshot
      await this.deductStockAndSnapshotCogs(tx, order);
    }

    return tx.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  });
}

// เพิ่ม private method:
private async deductStockAndSnapshotCogs(
  tx: Prisma.TransactionClient,
  order: { id: string; items: Array<{ id: string; productId: string; qty: number }> },
) {
  // 1. Fetch recipes for all products in this order
  const productIds = order.items.map((i) => i.productId);
  const recipes = await tx.recipeItem.findMany({
    where: { productId: { in: productIds } },
    include: { ingredient: true },
  });

  // Group by productId for lookup
  const recipesByProduct = new Map<string, typeof recipes>();
  for (const r of recipes) {
    if (!recipesByProduct.has(r.productId)) {
      recipesByProduct.set(r.productId, []);
    }
    recipesByProduct.get(r.productId)!.push(r);
  }

  // 2. For each OrderItem: calculate COGS + create StockMovements
  for (const item of order.items) {
    const recipe = recipesByProduct.get(item.productId) ?? [];
    if (recipe.length === 0) {
      this.logger.warn(
        `Order ${order.id} OrderItem ${item.id} (productId=${item.productId}) has no recipe — COGS = 0, no stock deduct`,
      );
      // เก็บ cogsSnapshot = 0 เพื่อให้ report ทำงาน
      await tx.orderItem.update({
        where: { id: item.id },
        data: { cogsSnapshot: 0 },
      });
      continue;
    }

    let cogsTotal = 0;

    for (const r of recipe) {
      const totalAmount = Number(r.quantity) * item.qty; // amount used
      const ingredientCost = Number(r.ingredient.costPerUnit) * totalAmount;
      cogsTotal += ingredientCost;

      // Create stock movement (SALE = negative)
      await tx.stockMovement.create({
        data: {
          ingredientId: r.ingredientId,
          quantity: -totalAmount,            // signed negative
          reason: 'SALE',
          refOrderId: order.id,
          costAtTime: r.ingredient.costPerUnit,
          note: `Order ${order.id} item ${item.id}`,
        },
      });

      // Update cached currentStock
      await tx.ingredient.update({
        where: { id: r.ingredientId },
        data: { currentStock: { decrement: totalAmount } },
      });
    }

    // 3. Snapshot COGS into OrderItem
    await tx.orderItem.update({
      where: { id: item.id },
      data: { cogsSnapshot: cogsTotal },
    });
  }
}
```

> 🎓 **Critical concepts**:
> - **One transaction**: ทุก operation atomic. ถ้าระหว่างกลางมี error → rollback ทุกอย่าง (รวม order status update)
> - **Recipe ที่ไม่มี**: log warning + cogsSnapshot=0, ไม่ throw (ให้ business ทำงานต่อ — admin ค่อยตามไปแก้ recipe ทีหลัง)
> - **Decimal arithmetic**: Number() conversion. Production: ใช้ decimal.js สำหรับ exact precision (course OK with Number)
> - **Recipe หลาย ingredient**: loop. N ingredients = N stock_movement rows + N ingredient updates

- [ ] **Step 5.2: เพิ่ม Tests**

แก้ `apps/api/src/orders/orders.service.spec.ts`, เพิ่ม:

```ts
describe('updateStatus → COMPLETED stock deduct', () => {
  beforeEach(() => {
    // Add additional mocks
    tx.recipeItem = { findMany: vi.fn() };
    tx.stockMovement = { create: vi.fn() };
    tx.ingredient = { update: vi.fn() };
    tx.orderItem = { update: vi.fn() };
  });

  it('คำนวณ COGS ถูกต้องและบันทึก stock movements', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'READY',
      items: [
        { id: 'oi1', productId: 'p-latte', qty: 2 },
      ],
    });

    tx.recipeItem.findMany.mockResolvedValue([
      {
        productId: 'p-latte',
        ingredientId: 'i-coffee',
        quantity: 18,            // 18g per latte
        ingredient: { id: 'i-coffee', costPerUnit: 0.8 },
      },
      {
        productId: 'p-latte',
        ingredientId: 'i-milk',
        quantity: 200,           // 200ml per latte
        ingredient: { id: 'i-milk', costPerUnit: 0.05 },
      },
    ]);

    prisma.$transaction = vi.fn((fn) => fn(tx));

    await service.updateStatus('o1', { status: 'COMPLETED' });

    // Verify stock movements created
    expect(tx.stockMovement.create).toHaveBeenCalledTimes(2);
    expect(tx.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ingredientId: 'i-coffee',
        quantity: -36,                  // 18g × 2 latte = 36g out
        reason: 'SALE',
        refOrderId: 'o1',
      }),
    }));

    // Verify currentStock decremented
    expect(tx.ingredient.update).toHaveBeenCalledTimes(2);

    // Verify cogsSnapshot = 18×0.8 + 200×0.05 (per latte) × 2 = 28.8 × 2 = 57.6
    expect(tx.orderItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'oi1' },
      data: { cogsSnapshot: 57.6 },
    }));
  });

  it('product ไม่มี recipe — log warn + cogsSnapshot=0, ไม่ throw', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'o1',
      status: 'READY',
      items: [{ id: 'oi1', productId: 'p-no-recipe', qty: 1 }],
    });

    tx.recipeItem.findMany.mockResolvedValue([]);  // no recipe

    await service.updateStatus('o1', { status: 'COMPLETED' });

    expect(tx.stockMovement.create).not.toHaveBeenCalled();
    expect(tx.orderItem.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { cogsSnapshot: 0 },
    }));
  });
});
```

- [ ] **Step 5.3: รัน tests**

```bash
pnpm --filter @coffee/api test
# Expect 19+ tests pass
```

- [ ] **Step 5.4: ทดสอบ end-to-end**

```bash
# Setup: ingredient + recipe ผ่าน Postman
# 1. ใส่ stock เริ่มต้น: PURCHASE 1000g coffee bean
# 2. Set recipe: Latte = 18g coffee bean

# Customer place order: 2 Latte
# Staff: PENDING → PREPARING → READY → COMPLETED

# Verify in DBeaver:
SELECT name, current_stock FROM ingredients;
# coffee bean: 1000 - (18 × 2) = 964

SELECT * FROM stock_movements WHERE reason = 'SALE';
# 1 row (or N rows = N ingredients in recipe)

SELECT id, cogs_snapshot FROM order_items WHERE order_id = '<id>';
# cogs_snapshot populated
```

- [ ] **Step 5.5: Commit**

```bash
git add apps/api/src/orders
git commit -m "feat(api): order COMPLETED → atomic stock deduct + COGS snapshot"
```

---

### Task 6: Reports Module — Daily Summary

**Files:**
- Create: `apps/api/src/reports/reports.module.ts`
- Create: `apps/api/src/reports/reports.service.ts`
- Create: `apps/api/src/reports/reports.controller.ts`

- [ ] **Step 6.1: ReportsService**

Create file `apps/api/src/reports/reports.service.ts`:

```ts
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
      (s, o) => s + o.items.reduce((s2, i) => s2 + Number(i.cogsSnapshot ?? 0), 0),
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

    // Use Prisma groupBy
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

    // Use raw SQL for date grouping
    const rows = await this.prisma.$queryRaw<{ date: string; revenue: number; cogs: number }[]>`
      SELECT
        TO_CHAR(date_trunc('day', completed_at), 'YYYY-MM-DD') as date,
        SUM(total)::float as revenue,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(cogs_snapshot), 0) FROM order_items WHERE order_id = orders.id)
        ), 0)::float as cogs
      FROM orders
      WHERE status = 'COMPLETED' AND completed_at >= ${since}
      GROUP BY date_trunc('day', completed_at)
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
```

> 🎓 **Concepts**:
> - **Prisma `groupBy`** — aggregate per `productId`. `_sum: { qty: true }` = SUM(qty)
> - **`$queryRaw`** for date grouping — Prisma `groupBy` ไม่ support truncate date
> - **`gte` + `lt`** for day range — half-open interval (gte 00:00, lt next day 00:00)

- [ ] **Step 6.2: ReportsController**

Create file `apps/api/src/reports/reports.controller.ts`:

```ts
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
  topProducts(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.service.topProducts(
      days ? parseInt(days) : 7,
      limit ? parseInt(limit) : 5,
    );
  }

  @Get('low-stock')
  lowStock() {
    return this.service.lowStock();
  }

  @Get('revenue-last-days')
  revenueLastDays(@Query('days') days?: string) {
    return this.service.revenueLastDays(days ? parseInt(days) : 7);
  }
}
```

- [ ] **Step 6.3: ReportsModule**

Create file `apps/api/src/reports/reports.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
```

แก้ `apps/api/src/app.module.ts` เพิ่ม `ReportsModule`

- [ ] **Step 6.4: ทดสอบ**

```bash
GET /api/reports/daily
# → { date, revenue, cogs, grossProfit, grossMarginPct, orderCount }

GET /api/reports/top-products?days=30
# → top 5 products with totalQty + totalRevenue

GET /api/reports/low-stock
# → array ingredients ที่ stock <= minStock

GET /api/reports/revenue-last-days?days=7
# → array { date, revenue, cogs, grossProfit }
```

- [ ] **Step 6.5: Commit**

```bash
git add apps/api/src/reports
git commit -m "feat(api): Reports module with daily summary, top products, low stock"
```

---

### Task 7: Admin UI — Ingredients

**Files:**
- Create: `apps/web/app/(admin)/admin/inventory/page.tsx`
- Create: `apps/web/app/(admin)/admin/inventory/components/ingredient-list.tsx`
- Create: `apps/web/app/(admin)/admin/inventory/components/ingredient-form.tsx`
- Create: `apps/web/app/(admin)/admin/inventory/components/stock-movement-form.tsx`

> 📝 **Note**: Pattern เหมือน Week 3 Categories — instructor demo Ingredients, students apply pattern

- [ ] **Step 7.1: Page**

Create file `apps/web/app/(admin)/admin/inventory/page.tsx`:

```tsx
import { IngredientList } from './components/ingredient-list';

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">วัตถุดิบ</h1>
      <IngredientList />
    </div>
  );
}
```

- [ ] **Step 7.2: IngredientList**

Create file `apps/web/app/(admin)/admin/inventory/components/ingredient-list.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { type Ingredient, INGREDIENT_UNIT_LABELS } from '@coffee/shared';
import { IngredientForm } from './ingredient-form';
import { StockMovementForm } from './stock-movement-form';

export function IngredientList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [creating, setCreating] = useState(false);
  const [recordingMovement, setRecordingMovement] = useState<Ingredient | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => apiFetch<Ingredient[]>('/inventory/ingredients'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/inventory/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
    onError: (e) => alert(`ลบไม่ได้: ${e.message}`),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          จำนวน {items.length} รายการ — Stock เปลี่ยนผ่าน Stock Movement (PURCHASE / SALE / WASTE / ADJUSTMENT)
        </p>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild><Button>+ เพิ่มวัตถุดิบ</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>เพิ่มวัตถุดิบใหม่</DialogTitle></DialogHeader>
            <IngredientForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p>กำลังโหลด...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>หน่วย</TableHead>
              <TableHead>ต้นทุน/หน่วย</TableHead>
              <TableHead>Stock ปัจจุบัน</TableHead>
              <TableHead>ขั้นต่ำ</TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => {
              const isLow = Number(i.currentStock) <= Number(i.minStock);
              return (
                <TableRow key={i.id} className={isLow ? 'bg-red-50' : ''}>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{INGREDIENT_UNIT_LABELS[i.unit]}</TableCell>
                  <TableCell>฿{Number(i.costPerUnit)}</TableCell>
                  <TableCell className={isLow ? 'font-bold text-red-700' : ''}>
                    {Number(i.currentStock)}
                  </TableCell>
                  <TableCell>{Number(i.minStock)}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setRecordingMovement(i)}>
                      ปรับ Stock
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditing(i)}>แก้ไข</Button>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => confirm(`ลบ "${i.name}"?`) && removeMutation.mutate(i.id)}
                    >ลบ</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>แก้ไขวัตถุดิบ</DialogTitle></DialogHeader>
          {editing && <IngredientForm ingredient={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!recordingMovement} onOpenChange={() => setRecordingMovement(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>ปรับ Stock: {recordingMovement?.name}</DialogTitle></DialogHeader>
          {recordingMovement && (
            <StockMovementForm
              ingredient={recordingMovement}
              onSuccess={() => setRecordingMovement(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
```

- [ ] **Step 7.3: IngredientForm**

Create file `apps/web/app/(admin)/admin/inventory/components/ingredient-form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateIngredientSchema, INGREDIENT_UNITS, INGREDIENT_UNIT_LABELS,
  type CreateIngredientInput, type Ingredient,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

export function IngredientForm({
  ingredient, onSuccess,
}: { ingredient?: Ingredient; onSuccess: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!ingredient;

  const {
    register, handleSubmit, formState: { errors, isSubmitting },
  } = useForm<CreateIngredientInput>({
    resolver: zodResolver(CreateIngredientSchema),
    defaultValues: ingredient ? {
      name: ingredient.name,
      unit: ingredient.unit,
      costPerUnit: Number(ingredient.costPerUnit),
      minStock: Number(ingredient.minStock),
    } : { unit: 'GRAM', costPerUnit: 0, minStock: 0 },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateIngredientInput) =>
      apiFetch(
        isEdit ? `/inventory/ingredients/${ingredient!.id}` : '/inventory/ingredients',
        { method: isEdit ? 'PATCH' : 'POST', body: input },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="unit">หน่วย</Label>
          <select
            id="unit" {...register('unit')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {INGREDIENT_UNITS.map((u) => (
              <option key={u} value={u}>{INGREDIENT_UNIT_LABELS[u]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="costPerUnit">ต้นทุน/หน่วย (บาท)</Label>
          <Input
            id="costPerUnit" type="number" step="0.0001"
            {...register('costPerUnit', { valueAsNumber: true })}
          />
          {errors.costPerUnit && <p className="text-sm text-destructive">{errors.costPerUnit.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="minStock">Stock ขั้นต่ำ (เพื่อแจ้งเตือน)</Label>
        <Input
          id="minStock" type="number" step="0.01"
          {...register('minStock', { valueAsNumber: true })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 7.4: StockMovementForm**

Create file `apps/web/app/(admin)/admin/inventory/components/stock-movement-form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateStockMovementSchema, STOCK_MOVEMENT_REASONS,
  type CreateStockMovementInput, type Ingredient, INGREDIENT_UNIT_LABELS,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';

const ALLOWED_REASONS = STOCK_MOVEMENT_REASONS.filter((r) => r !== 'SALE');

export function StockMovementForm({
  ingredient, onSuccess,
}: { ingredient: Ingredient; onSuccess: () => void }) {
  const qc = useQueryClient();

  const {
    register, handleSubmit, watch, formState: { errors, isSubmitting },
  } = useForm<CreateStockMovementInput>({
    resolver: zodResolver(CreateStockMovementSchema),
    defaultValues: { ingredientId: ingredient.id, reason: 'PURCHASE' as const, quantity: 0 },
  });

  const reason = watch('reason');

  const mutation = useMutation({
    mutationFn: (input: CreateStockMovementInput) => {
      // Auto sign based on reason
      const signedQuantity =
        input.reason === 'PURCHASE'
          ? Math.abs(input.quantity)
          : input.reason === 'WASTE'
          ? -Math.abs(input.quantity)
          : input.quantity;
      return apiFetch('/inventory/ingredients/movements', {
        method: 'POST',
        body: { ...input, quantity: signedQuantity },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      onSuccess();
    },
    onError: (e) => alert(`ผิดพลาด: ${e.message}`),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="reason">ประเภท</Label>
        <select
          id="reason" {...register('reason')}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {ALLOWED_REASONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="quantity">
          จำนวน ({INGREDIENT_UNIT_LABELS[ingredient.unit]})
          {reason === 'WASTE' && <span className="text-red-500"> — จะลด stock</span>}
          {reason === 'PURCHASE' && <span className="text-green-700"> — จะเพิ่ม stock</span>}
          {reason === 'ADJUSTMENT' && <span className="text-gray-500"> — ใส่ +/- ตามที่ต้องการ</span>}
        </Label>
        <Input
          id="quantity" type="number" step="0.0001"
          {...register('quantity', { valueAsNumber: true })}
        />
        {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="note">หมายเหตุ</Label>
        <Input id="note" {...register('note')} placeholder="เช่น ซื้อจากร้าน X" />
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        บันทึก
      </Button>
    </form>
  );
}
```

> 🎓 **UX detail**: Reason → auto-sign quantity. User กรอกตัวเลขบวกเสมอ → form ทำสัญลักษณ์ให้

- [ ] **Step 7.5: เพิ่ม link ใน admin sidebar**

แก้ `apps/web/app/(admin)/layout.tsx`, เปลี่ยน "(Week 5)" เป็น link จริง:

```tsx
<Link href="/admin/inventory" className="block rounded px-3 py-2 hover:bg-gray-200">
  วัตถุดิบ
</Link>
<Link href="/admin/reports" className="block rounded px-3 py-2 hover:bg-gray-200">
  รายงาน
</Link>
```

- [ ] **Step 7.6: ทดสอบ**

1. Login admin → /admin/inventory
2. เพิ่ม ingredient ใหม่ (เช่น น้ำเชื่อม, 0.05 บาท/ml)
3. ปรับ Stock → PURCHASE 1000 ml → currentStock = 1000
4. ปรับอีกครั้ง → WASTE 50 ml → currentStock = 950

- [ ] **Step 7.7: Commit**

```bash
git add apps/web/app/\(admin\)/admin/inventory apps/web/app/\(admin\)/layout.tsx
git commit -m "feat(web): admin Ingredients UI with stock movement entry"
```

---

### Task 8: Recipe Editor (Per Product)

**Files:**
- Create: `apps/web/app/(admin)/admin/menu/components/recipe-editor.tsx`
- Modify: `apps/web/app/(admin)/admin/menu/components/product-list.tsx`

- [ ] **Step 8.1: RecipeEditor component**

Create file `apps/web/app/(admin)/admin/menu/components/recipe-editor.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Product, Ingredient, RecipeItem, INGREDIENT_UNIT_LABELS,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api-client';

interface RecipeRow {
  ingredientId: string;
  quantity: number;
}

export function RecipeEditor({
  product, onSuccess,
}: { product: Product; onSuccess: () => void }) {
  const qc = useQueryClient();

  const { data: ingredients = [] } = useQuery({
    queryKey: ['ingredients'],
    queryFn: () => apiFetch<Ingredient[]>('/inventory/ingredients'),
  });

  const { data: existing = [], isLoading } = useQuery({
    queryKey: ['recipe', product.id],
    queryFn: () => apiFetch<RecipeItem[]>(`/inventory/recipes/product/${product.id}`),
  });

  const [rows, setRows] = useState<RecipeRow[]>([]);

  // Sync existing → state when load
  useEffect(() => {
    if (!isLoading) {
      setRows(existing.map((e) => ({
        ingredientId: e.ingredientId,
        quantity: Number(e.quantity),
      })));
    }
  }, [isLoading, existing]);

  const saveMutation = useMutation({
    mutationFn: (items: RecipeRow[]) =>
      apiFetch(`/inventory/recipes/product/${product.id}`, {
        method: 'PUT',
        body: items,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipe', product.id] });
      onSuccess();
    },
  });

  if (isLoading) return <p>กำลังโหลด...</p>;

  const usedIds = new Set(rows.map((r) => r.ingredientId));
  const available = ingredients.filter((i) => !usedIds.has(i.id));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        ระบุปริมาณวัตถุดิบที่ใช้ต่อ 1 หน่วยของ "{product.name}"
      </p>

      {rows.length === 0 && (
        <p className="text-gray-400 text-center py-4">ยังไม่มีวัตถุดิบในสูตร</p>
      )}

      {rows.map((row, idx) => {
        const ing = ingredients.find((i) => i.id === row.ingredientId);
        return (
          <div key={row.ingredientId} className="flex items-center gap-2">
            <span className="flex-1 font-medium">{ing?.name ?? '?'}</span>
            <Input
              type="number" step="0.0001" className="w-32"
              value={row.quantity}
              onChange={(e) => {
                const q = parseFloat(e.target.value);
                setRows(rows.map((r, i) => i === idx ? { ...r, quantity: q } : r));
              }}
            />
            <span className="text-sm text-gray-500 w-16">
              {ing ? INGREDIENT_UNIT_LABELS[ing.unit] : ''}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => setRows(rows.filter((_, i) => i !== idx))}
            >ลบ</Button>
          </div>
        );
      })}

      {available.length > 0 && (
        <div className="border-t pt-4">
          <Label htmlFor="add-ing" className="block mb-2">เพิ่มวัตถุดิบ</Label>
          <select
            id="add-ing"
            onChange={(e) => {
              if (!e.target.value) return;
              setRows([...rows, { ingredientId: e.target.value, quantity: 0 }]);
              e.target.value = '';
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">-- เลือกวัตถุดิบ --</option>
            {available.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({INGREDIENT_UNIT_LABELS[i.unit]})
              </option>
            ))}
          </select>
        </div>
      )}

      <Button
        onClick={() => saveMutation.mutate(rows)}
        disabled={saveMutation.isPending}
        className="w-full"
      >
        {saveMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกสูตร'}
      </Button>
    </div>
  );
}

import { Label } from '@/components/ui/label';
```

> 📝 **Move imports** to the top of the file.

- [ ] **Step 8.2: เพิ่ม "แก้สูตร" button ใน ProductList**

แก้ `apps/web/app/(admin)/admin/menu/components/product-list.tsx`, เพิ่ม:

```tsx
import { RecipeEditor } from './recipe-editor';

// ใน component, เพิ่ม state:
const [recipeFor, setRecipeFor] = useState<Product | null>(null);

// ในแต่ละ row, เพิ่ม button:
<Button variant="outline" size="sm" onClick={() => setRecipeFor(p)}>
  สูตร
</Button>

// ปลายๆ component, เพิ่ม dialog:
<Dialog open={!!recipeFor} onOpenChange={() => setRecipeFor(null)}>
  <DialogContent className="max-w-lg">
    <DialogHeader><DialogTitle>สูตร: {recipeFor?.name}</DialogTitle></DialogHeader>
    {recipeFor && <RecipeEditor product={recipeFor} onSuccess={() => setRecipeFor(null)} />}
  </DialogContent>
</Dialog>
```

- [ ] **Step 8.3: ทดสอบ**

1. /admin/menu → กด "สูตร" บน Latte
2. เพิ่ม วัตถุดิบ: เมล็ดกาแฟ 18g, นม 200ml, แก้ว 1 ชิ้น → บันทึก
3. ทดลอง: place order Latte → COMPLETED → ตรวจ DBeaver:
   - `SELECT * FROM stock_movements WHERE reason='SALE'` — มี 3 rows
   - `SELECT * FROM ingredients` — currentStock ลด
   - `SELECT cogs_snapshot FROM order_items` — populated

- [ ] **Step 8.4: Commit**

```bash
git add apps/web/app/\(admin\)/admin/menu
git commit -m "feat(web): RecipeEditor — link product to ingredients"
```

---

### Task 9: Reports Dashboard

**Files:**
- Create: `apps/web/app/(admin)/admin/reports/page.tsx`
- Create: `apps/web/app/(admin)/admin/reports/components/kpi-cards.tsx`
- Create: `apps/web/app/(admin)/admin/reports/components/revenue-chart.tsx`
- Create: `apps/web/app/(admin)/admin/reports/components/top-products-table.tsx`
- Create: `apps/web/app/(admin)/admin/reports/components/low-stock-alerts.tsx`

- [ ] **Step 9.1: Install Recharts**

```bash
cd apps/web
pnpm add recharts
cd ../..
```

- [ ] **Step 9.2: KPI Cards**

Create file `apps/web/app/(admin)/admin/reports/components/kpi-cards.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { DailyReport } from '@coffee/shared';

export function KpiCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'daily'],
    queryFn: () => apiFetch<DailyReport>('/reports/daily'),
    refetchInterval: 30_000,
  });

  if (isLoading || !data) return <p>กำลังโหลด...</p>;

  const cards = [
    { label: 'รายได้วันนี้', value: `฿${data.revenue.toFixed(2)}`, color: 'text-blue-700 bg-blue-50' },
    { label: 'ต้นทุนวันนี้', value: `฿${data.cogs.toFixed(2)}`, color: 'text-orange-700 bg-orange-50' },
    { label: 'กำไรขั้นต้น', value: `฿${data.grossProfit.toFixed(2)}`, color: 'text-green-700 bg-green-50' },
    {
      label: 'อัตรากำไร',
      value: `${data.grossMarginPct.toFixed(1)}%`,
      color: data.grossMarginPct >= 50 ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50',
    },
    { label: 'จำนวนออเดอร์', value: data.orderCount.toString(), color: 'text-gray-700 bg-gray-50' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`rounded p-4 ${c.color}`}>
          <div className="text-xs uppercase opacity-70">{c.label}</div>
          <div className="text-2xl font-bold mt-1">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 9.3: Revenue chart**

Create file `apps/web/app/(admin)/admin/reports/components/revenue-chart.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { apiFetch } from '@/lib/api-client';

interface DayRow {
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
}

export function RevenueChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'revenue-last-7'],
    queryFn: () => apiFetch<DayRow[]>('/reports/revenue-last-days?days=7'),
    refetchInterval: 60_000,
  });

  if (isLoading) return <p>กำลังโหลด...</p>;
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-12">ยังไม่มีข้อมูลรายได้</p>;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">รายได้ 7 วันที่ผ่านมา</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="รายได้" />
          <Line type="monotone" dataKey="cogs" stroke="#ea580c" name="ต้นทุน" />
          <Line type="monotone" dataKey="grossProfit" stroke="#16a34a" name="กำไร" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 9.4: Top products + Low stock**

Create file `apps/web/app/(admin)/admin/reports/components/top-products-table.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TopProduct } from '@coffee/shared';

export function TopProductsTable() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['reports', 'top-products', 7],
    queryFn: () => apiFetch<TopProduct[]>('/reports/top-products?days=7&limit=5'),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">เมนูขายดี (7 วัน)</h2>
      {isLoading ? <p>กำลังโหลด...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>อันดับ</TableHead>
              <TableHead>เมนู</TableHead>
              <TableHead>จำนวน</TableHead>
              <TableHead>ยอดขาย</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-gray-500">
                ไม่มีข้อมูล
              </TableCell></TableRow>
            ) : data.map((p, i) => (
              <TableRow key={p.productId}>
                <TableCell>#{i + 1}</TableCell>
                <TableCell>{p.productName}</TableCell>
                <TableCell>{p.totalQty} ชิ้น</TableCell>
                <TableCell>฿{p.totalRevenue.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

Create file `apps/web/app/(admin)/admin/reports/components/low-stock-alerts.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { LowStockItem } from '@coffee/shared';

export function LowStockAlerts() {
  const { data = [] } = useQuery({
    queryKey: ['reports', 'low-stock'],
    queryFn: () => apiFetch<LowStockItem[]>('/reports/low-stock'),
    refetchInterval: 60_000,
  });

  if (data.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800">
        ✅ Stock ทุกตัวอยู่ในเกณฑ์
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded p-4">
      <h3 className="font-bold text-red-800 mb-2">⚠️ Stock ใกล้หมด</h3>
      <ul className="space-y-1 text-sm">
        {data.map((i) => (
          <li key={i.ingredientId}>
            <span className="font-medium">{i.name}</span>:
            {' '}เหลือ {i.currentStock} {i.unit} (ขั้นต่ำ {i.minStock})
            {' — '}
            <span className="text-red-700">ขาด {i.shortfall.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 9.5: Reports page**

Create file `apps/web/app/(admin)/admin/reports/page.tsx`:

```tsx
import { KpiCards } from './components/kpi-cards';
import { RevenueChart } from './components/revenue-chart';
import { TopProductsTable } from './components/top-products-table';
import { LowStockAlerts } from './components/low-stock-alerts';

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">รายงาน</h1>
      <LowStockAlerts />
      <KpiCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RevenueChart />
        <TopProductsTable />
      </div>
    </div>
  );
}
```

- [ ] **Step 9.6: ทดสอบ end-to-end**

1. ตรวจว่ามี orders COMPLETED + recipes ทุกตัว
2. /admin/reports
3. ควรเห็น:
   - KPI cards (revenue, cogs, gross profit, margin, order count)
   - Revenue chart 7 วัน
   - Top products table
   - Low stock alerts (ถ้ามี)

- [ ] **Step 9.7: Commit**

```bash
git add apps/web/app/\(admin\)/admin/reports apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): Reports dashboard — KPIs + chart + top products + alerts"
```

---

### Task 10: Manual End-to-End Test + Seed Script

**Files:**
- Create: `apps/api/prisma/seed.ts` (optional but recommended)

- [ ] **Step 10.1: เขียน seed script (สำหรับ reset DB)**

Create file `apps/api/prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Users
  const adminHash = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@coffee.com' },
    update: {},
    create: { email: 'admin@coffee.com', password: adminHash, role: 'ADMIN' },
  });

  const staffHash = await bcrypt.hash('staff1234', 10);
  await prisma.user.upsert({
    where: { email: 'staff@coffee.com' },
    update: {},
    create: { email: 'staff@coffee.com', password: staffHash, role: 'STAFF' },
  });

  // Categories
  const drinks = await prisma.category.upsert({
    where: { name: 'เครื่องดื่ม' } as any,
    update: {},
    create: { name: 'เครื่องดื่ม', sortOrder: 1 },
  });

  // Products
  const latte = await prisma.product.upsert({
    where: { name: 'Latte' } as any,
    update: {},
    create: {
      name: 'Latte', price: 75, isActive: true, categoryId: drinks.id,
    },
  });

  // Ingredients
  const coffee = await prisma.ingredient.upsert({
    where: { name: 'เมล็ดกาแฟ' },
    update: {},
    create: {
      name: 'เมล็ดกาแฟ', unit: 'GRAM', costPerUnit: 0.8, minStock: 200,
    },
  });
  const milk = await prisma.ingredient.upsert({
    where: { name: 'นม' },
    update: {},
    create: {
      name: 'นม', unit: 'MILLILITER', costPerUnit: 0.05, minStock: 1000,
    },
  });

  // Recipe: Latte = 18g coffee + 200ml milk
  await prisma.recipeItem.deleteMany({ where: { productId: latte.id } });
  await prisma.recipeItem.createMany({
    data: [
      { productId: latte.id, ingredientId: coffee.id, quantity: 18 },
      { productId: latte.id, ingredientId: milk.id, quantity: 200 },
    ],
  });

  // Initial stock (PURCHASE)
  await prisma.stockMovement.createMany({
    data: [
      {
        ingredientId: coffee.id, quantity: 5000, reason: 'PURCHASE',
        costAtTime: 0.8, note: 'Initial seed',
      },
      {
        ingredientId: milk.id, quantity: 10000, reason: 'PURCHASE',
        costAtTime: 0.05, note: 'Initial seed',
      },
    ],
  });
  // Sync currentStock cache
  await prisma.ingredient.update({
    where: { id: coffee.id },
    data: { currentStock: 5000 },
  });
  await prisma.ingredient.update({
    where: { id: milk.id },
    data: { currentStock: 10000 },
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 10.2: เพิ่ม seed config + tsx**

```bash
cd apps/api
pnpm add -D tsx
cd ../..
```

แก้ `apps/api/package.json`:
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 10.3: รัน seed**

```bash
cd apps/api
pnpm prisma db seed
cd ../..
```

- [ ] **Step 10.4: Final E2E test**

1. Reset DB: `pnpm prisma migrate reset` (ตอบ y, รัน seed อัตโนมัติ)
2. Login admin → /admin/reports → KPIs ทั้งหมด = 0
3. Customer (incognito): place 2 Latte
4. Staff: PENDING → PREPARING → READY → COMPLETED
5. Refresh /admin/reports →
   - Revenue: ฿150
   - COGS: 18×0.8 + 200×0.05 (per latte) × 2 = 28.8 × 2 = ~฿57.60
   - Gross profit: ~฿92.40
   - Margin: ~61.6%
   - Order count: 1
6. /admin/inventory → coffee stock = 5000 - 36 = 4964; milk = 10000 - 400 = 9600

✅ เป็นไปตามคาด — สำเร็จ!

- [ ] **Step 10.5: Commit**

```bash
git add apps/api/prisma/seed.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add Prisma seed script for fresh dev environment"
```

---

## Acceptance Criteria — Week 5 Done When:

- [ ] **Backend**
  - [ ] Ingredients CRUD + stock movements + recompute endpoint
  - [ ] Recipe set/get (whole-replace)
  - [ ] **Order COMPLETED → atomic stock deduct + COGS snapshot** ⭐
  - [ ] Reports endpoints: daily, top-products, low-stock, revenue-last-days
  - [ ] Tests: 19+ pass (incl. stock deduct tests)
- [ ] **Frontend**
  - [ ] /admin/inventory: ingredients list + form + stock movement entry
  - [ ] /admin/menu: "สูตร" button per product → RecipeEditor dialog
  - [ ] /admin/reports: KPI cards + chart + top products + low stock alerts
- [ ] **Integration**
  - [ ] Place order → COMPLETED → stock decreases visible on /admin/inventory
  - [ ] /admin/reports updates within 30 sec of order COMPLETED
  - [ ] Low stock alert appears when ingredient ≤ minStock
- [ ] **Quality**
  - [ ] Seed script seed initial data
  - [ ] `pnpm typecheck` pass
  - [ ] No console.log in production paths

## Self-Review Notes

**Spec coverage:**
- ✅ Day 1 (Ingredient + StockMovement schema): Tasks 1-3
- ✅ Day 2 (Recipe CRUD): Task 4
- ✅ Day 3-4 (Transaction COMPLETED → COGS+stock): Task 5 ⭐ centerpiece
- ✅ Day 5 (Reports endpoint): Task 6
- ✅ Day 6-7 (Reports dashboard): Tasks 7-9 + seed (Task 10)

**Concepts taught:**
- Event-sourced inventory (StockMovement = source of truth, currentStock = cache)
- Atomic transaction across 4 tables (OrderItem + StockMovement + Ingredient + Order)
- Recipe whole-replace strategy (idempotent)
- Prisma `groupBy` aggregation
- `$queryRaw` for date truncation
- Recharts for visualizations
- Seed script pattern

**Out of Week 5 scope:**
- ❌ Stock auto-reorder (Tier 3)
- ❌ Multi-warehouse / multi-shop (Tier 3 — multi-tenant)
- ❌ Predictive analytics (Tier 3)
- ❌ Cost variance reporting (Tier 2 — when costPerUnit changes)
- ❌ Recipe versioning (could add but YAGNI for course)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-week-5-inventory-reports.md`.**

Next: Week 5 Instructor Pack
