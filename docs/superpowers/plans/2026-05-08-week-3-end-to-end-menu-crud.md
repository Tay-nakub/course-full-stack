# Week 3 — End-to-End Menu CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เชื่อม FE ↔ BE — admin login ใน Next.js → CRUD เมนู (Categories + Products) ผ่าน UI → ลูกค้าเห็นเมนูจริงบน storefront. Schema เดียว 2 ฝั่ง

**Architecture:** เพิ่ม Category + Product modules ใน NestJS (CRUD + protection ด้วย JwtAuthGuard/RolesGuard). FE: TanStack Query + httpOnly cookie auth + admin route group ที่ protected ด้วย Next.js middleware. Dev environment ใช้ Next.js rewrites proxy `/api/*` → `http://localhost:4000/api/*` (same-origin cookies)

**Tech Stack:** ทุก stack ของ Week 1+2 + TanStack Query 5, Next.js Middleware, Route Handlers (`app/api/`), httpOnly cookies

**Spec Reference:** [course design spec § Week 3](../specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Pre-requisites:**

- Week 1 + 2 complete (Next.js + NestJS + Postgres + Auth working)
- Admin user ที่ promote เป็น ADMIN role แล้ว (ทำใน Week 2 homework หรือผ่าน Studio: `UPDATE users SET role='ADMIN' WHERE email='...'`)

---

## File Structure (เป้าหมายเมื่อจบ Week 3)

```
course-full-stack/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (storefront)/
│   │   │   │   └── menu/page.tsx       ← ปรับใช้ API จริง (จาก mock)
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx          ← ⭐ admin layout + sidebar
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx        ← redirect → /admin/menu
│   │   │   │       └── menu/
│   │   │   │           ├── page.tsx    ← ⭐ menu management
│   │   │   │           └── components/
│   │   │   │               ├── category-list.tsx
│   │   │   │               ├── category-form.tsx
│   │   │   │               ├── product-list.tsx
│   │   │   │               └── product-form.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx            ← ⭐ login form
│   │   │   └── api/
│   │   │       └── auth/
│   │   │           ├── login/route.ts  ← ⭐ proxies to NestJS, sets cookie
│   │   │           └── logout/route.ts
│   │   ├── components/
│   │   │   └── providers/
│   │   │       └── query-provider.tsx  ← ⭐ TanStack Query setup
│   │   ├── lib/
│   │   │   ├── api-client.ts           ← ⭐ fetch wrapper
│   │   │   ├── auth.ts                 ← ⭐ getServerToken, etc.
│   │   │   └── query-keys.ts           ← ⭐ centralized cache keys
│   │   ├── middleware.ts               ← ⭐ protect /admin routes
│   │   └── next.config.ts              ← ⭐ add rewrites
│   │
│   └── api/
│       └── src/
│           └── menu/                   ← ⭐ ใหม่
│               ├── menu.module.ts
│               ├── category.controller.ts
│               ├── category.service.ts
│               ├── category.service.spec.ts
│               ├── product.controller.ts
│               ├── product.service.ts
│               └── product.service.spec.ts
│
└── packages/
    └── shared/
        └── src/
            └── schemas/
                ├── auth.ts             ← จาก Week 2
                └── menu.ts             ← ⭐ Category + Product schemas
```

---

## Tasks

### Task 1: Menu Schemas in `packages/shared`

**Files:**

- Create: `packages/shared/src/schemas/menu.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1.1: สร้าง menu schemas**

Create file `packages/shared/src/schemas/menu.ts`:

```ts
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
  imageUrl: z.string().url('ลิงก์รูปต้องเป็น URL').nullable().optional(),
  isActive: z.boolean().default(true),
  categoryId: z.string().min(1, 'ต้องเลือกหมวด'),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
```

- [ ] **Step 1.2: Export จาก index**

แก้ `packages/shared/src/index.ts`:

```ts
export * from './types/user';
export * from './schemas/auth';
export * from './schemas/menu';
```

- [ ] **Step 1.3: Verify**

```bash
pnpm --filter @coffee/shared typecheck
```

- [ ] **Step 1.4: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add Category and Product Zod schemas"
```

---

### Task 2: Update Prisma Schema + Migration

**Files:**

- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 2.1: เพิ่ม Category + Product models**

Append ต่อท้าย `apps/api/prisma/schema.prisma`:

```prisma
model Category {
  id        String    @id @default(cuid())
  name      String
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]

  @@map("categories")
}

model Product {
  id         String   @id @default(cuid())
  name       String
  price      Decimal  @db.Decimal(10, 2)
  imageUrl   String?
  isActive   Boolean  @default(true)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  categoryId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([categoryId])
  @@map("products")
}
```

> 🎓 **Concept**:
>
> - `Decimal(10, 2)` = exact monetary precision (vs Float ที่ rounding error)
> - `onDelete: Restrict` = ถ้า category มี products → ลบไม่ได้ (ป้องกัน orphan)
> - `@@index([categoryId])` = explicit index สำหรับ JOIN performance

- [ ] **Step 2.2: รัน migration**

```bash
cd apps/api
pnpm prisma migrate dev --name add_menu
cd ../..
```

- [ ] **Step 2.3: Verify ใน DB**

```bash
docker exec coffee-postgres-dev psql -U coffee -d coffee -c "\dt"
# Expected: categories + products tables
```

- [ ] **Step 2.4: Commit**

```bash
git add apps/api/prisma
git commit -m "feat(api): add Category and Product Prisma models with relation"
```

---

### Task 3: NestJS Category Module

**Files:**

- Create: `apps/api/src/menu/menu.module.ts`
- Create: `apps/api/src/menu/category.controller.ts`
- Create: `apps/api/src/menu/category.service.ts`
- Create: `apps/api/src/menu/category.service.spec.ts`

- [ ] **Step 3.1: CategoryService**

Create file `apps/api/src/menu/category.service.ts`:

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCategoryInput, UpdateCategoryInput } from '@coffee/shared';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('ไม่พบหมวดหมู่');
    return category;
  }

  async create(input: CreateCategoryInput) {
    return this.prisma.category.create({ data: input });
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.findOne(id); // ensure exists
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    await this.findOne(id);
    const productCount = await this.prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new ConflictException(`ลบไม่ได้: หมวดนี้มี ${productCount} สินค้า — ย้ายสินค้าก่อน`);
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
```

- [ ] **Step 3.2: CategoryController**

Create file `apps/api/src/menu/category.controller.ts`:

```ts
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
  CreateCategorySchema,
  UpdateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CategoryService } from './category.service';

@Controller('menu/categories')
export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  list() {
    return this.service.findAll();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(CreateCategorySchema)) input: CreateCategoryInput) {
    return this.service.create(input);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCategorySchema)) input: UpdateCategoryInput,
  ) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

> 🎓 **Pattern**: GET endpoints public (storefront ดู menu ได้). POST/PATCH/DELETE = admin only

- [ ] **Step 3.3: Service tests**

Create file `apps/api/src/menu/category.service.spec.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let prisma: {
    category: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    product: { count: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      product: { count: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [CategoryService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(CategoryService);
  });

  it('findAll คืนรายการเรียงตาม sortOrder', async () => {
    const items = [{ id: '1', name: 'drink', sortOrder: 0 }];
    prisma.category.findMany.mockResolvedValue(items);

    const result = await service.findAll();

    expect(result).toEqual(items);
    expect(prisma.category.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: 'asc' } });
  });

  it('findOne throws NotFound ถ้าไม่พบ', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('remove throws Conflict ถ้ามี products ในหมวด', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1', name: 'drink' });
    prisma.product.count.mockResolvedValue(3);

    await expect(service.remove('1')).rejects.toThrow(ConflictException);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('remove สำเร็จถ้าไม่มี products', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: '1' });
    prisma.product.count.mockResolvedValue(0);
    prisma.category.delete.mockResolvedValue({ id: '1' });

    const result = await service.remove('1');

    expect(result).toEqual({ success: true });
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
```

- [ ] **Step 3.4: MenuModule**

Create file `apps/api/src/menu/menu.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class MenuModule {}
```

แก้ `apps/api/src/app.module.ts` เพิ่ม MenuModule ใน imports.

- [ ] **Step 3.5: Test**

```bash
pnpm --filter @coffee/api test
# 5 (auth) + 4 (category) = 9 tests pass
```

ทดสอบ manual ใน Postman:

```bash
# Login เป็น admin → get token
# POST /api/menu/categories with Bearer token
{ "name": "เครื่องดื่ม", "sortOrder": 1 }
# → 201 + category

# GET /api/menu/categories (no auth)
# → 200 + array
```

- [ ] **Step 3.6: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): add Category CRUD with admin guards and tests"
```

---

### Task 4: NestJS Product Module

**Files:**

- Create: `apps/api/src/menu/product.controller.ts`
- Create: `apps/api/src/menu/product.service.ts`
- Create: `apps/api/src/menu/product.service.spec.ts`
- Modify: `apps/api/src/menu/menu.module.ts`

- [ ] **Step 4.1: ProductService**

Create file `apps/api/src/menu/product.service.ts`:

```ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductInput, UpdateProductInput } from '@coffee/shared';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(opts?: { onlyActive?: boolean }) {
    return this.prisma.product.findMany({
      where: opts?.onlyActive ? { isActive: true } : undefined,
      include: { category: true },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('ไม่พบสินค้า');
    return product;
  }

  async create(input: CreateProductInput) {
    await this.assertCategoryExists(input.categoryId);
    return this.prisma.product.create({
      data: { ...input, imageUrl: input.imageUrl ?? null },
      include: { category: true },
    });
  }

  async update(id: string, input: UpdateProductInput) {
    await this.findOne(id);
    if (input.categoryId) await this.assertCategoryExists(input.categoryId);
    return this.prisma.product.update({
      where: { id },
      data: input,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  private async assertCategoryExists(categoryId: string) {
    const exists = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!exists) throw new BadRequestException('หมวดที่เลือกไม่มีอยู่');
  }
}
```

- [ ] **Step 4.2: ProductController**

Create file `apps/api/src/menu/product.controller.ts`:

```ts
import {
  Body,
  Controller,
  Delete,
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
  CreateProductSchema,
  UpdateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '@coffee/shared';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductService } from './product.service';

@Controller('menu/products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get()
  list(@Query('active') active?: string) {
    return this.service.findAll({ onlyActive: active === 'true' });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(CreateProductSchema)) input: CreateProductInput) {
    return this.service.create(input);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductSchema)) input: UpdateProductInput,
  ) {
    return this.service.update(id, input);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

> 🎓 **Pattern**: `?active=true` query param เพื่อ filter — storefront ใช้ค่าเดียวกันทุกที่

- [ ] **Step 4.3: ProductService tests**

Create file `apps/api/src/menu/product.service.spec.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      product: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      category: { findUnique: vi.fn() },
    };

    const module = await Test.createTestingModule({
      providers: [ProductService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(ProductService);
  });

  it('create throws BadRequest ถ้า category ไม่มีอยู่', async () => {
    prisma.category.findUnique.mockResolvedValue(null);
    await expect(
      service.create({
        name: 'Latte',
        price: 75,
        categoryId: 'missing',
        isActive: true,
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('create สำเร็จเมื่อ category มี', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'c1' });
    const created = { id: 'p1', name: 'Latte', price: 75, categoryId: 'c1' };
    prisma.product.create.mockResolvedValue(created);

    const result = await service.create({
      name: 'Latte',
      price: 75,
      categoryId: 'c1',
      isActive: true,
    } as any);

    expect(result).toEqual(created);
  });

  it('findAll filter active=true', async () => {
    prisma.product.findMany.mockResolvedValue([]);
    await service.findAll({ onlyActive: true });
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });
});
```

- [ ] **Step 4.4: Register ProductController ใน MenuModule**

แก้ `apps/api/src/menu/menu.module.ts`:

```ts
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [CategoryController, ProductController],
  providers: [CategoryService, ProductService],
  exports: [CategoryService, ProductService],
})
export class MenuModule {}
```

- [ ] **Step 4.5: ทดสอบ Postman**

```bash
# POST /api/menu/products (admin token)
{
  "name": "Latte",
  "price": 75,
  "imageUrl": "https://example.com/latte.jpg",
  "categoryId": "<category-id-from-task-3>",
  "isActive": true
}
# → 201 + product with category

# GET /api/menu/products
# → 200 + array

# GET /api/menu/products?active=true
# → 200 + filtered
```

- [ ] **Step 4.6: Commit**

```bash
git add apps/api/src/menu
git commit -m "feat(api): add Product CRUD with category guard and tests"
```

---

### Task 5: Next.js API Rewrites + API Client

**Files:**

- Modify: `apps/web/next.config.ts`
- Create: `apps/web/lib/api-client.ts`

> 🎓 **Concept**: Dev server ของ Next.js (3000) และ NestJS (4000) คนละ origin → cookie ไม่แชร์. แก้โดย Next.js rewrite proxy `/api/*` → `http://localhost:4000/api/*` → same-origin

- [ ] **Step 5.1: เพิ่ม rewrites ใน next.config.ts**

แก้ `apps/web/next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
```

> 📝 **Note**: Dev = `http://localhost:4000/api/:path*`. Prod = ใช้ Caddy → `/api/*` ภายในเดียวกัน → ไม่ต้อง rewrite (Week 6)

- [ ] **Step 5.2: API client wrapper**

Create file `apps/web/lib/api-client.ts`:

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiFetch<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include', // ส่ง cookie
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let details: unknown = null;
    try {
      details = await response.json();
    } catch {}
    throw new ApiError(response.status, `${response.status}: ${response.statusText}`, details);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}
```

> 🎓 **Concept**:
>
> - `credentials: 'include'` = browser ส่ง httpOnly cookie ไปด้วย
> - Path เริ่มด้วย `/api` → Next.js rewrite proxy ไป NestJS
> - `ApiError` class → controlled error handling ที่ component จับได้

- [ ] **Step 5.3: Verify**

```bash
pnpm dev
```

ทดสอบใน browser console:

```js
await fetch('/api/healthz').then((r) => r.json());
// → { status: 'ok', database: 'connected', ... }
```

- [ ] **Step 5.4: Commit**

```bash
git add apps/web/next.config.ts apps/web/lib/api-client.ts
git commit -m "feat(web): add Next.js API rewrites and apiFetch wrapper"
```

---

### Task 6: TanStack Query Setup

**Files:**

- Create: `apps/web/components/providers/query-provider.tsx`
- Create: `apps/web/lib/query-keys.ts`
- Modify: `apps/web/app/layout.tsx`

- [ ] **Step 6.1: Install**

```bash
cd apps/web
pnpm add @tanstack/react-query @tanstack/react-query-devtools
cd ../..
```

- [ ] **Step 6.2: QueryProvider (Client Component)**

Create file `apps/web/components/providers/query-provider.tsx`:

```tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
```

> 🎓 **Concept**: QueryClient ต้องถูก instantiate ใน Client (`useState`) → กัน re-create ทุก render. ถ้าใส่นอก `useState` → SSR + multiple clients per server

- [ ] **Step 6.3: Centralized query keys**

Create file `apps/web/lib/query-keys.ts`:

```ts
export const queryKeys = {
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  products: (filter?: { active?: boolean }) => ['products', filter] as const,
  product: (id: string) => ['products', id] as const,
};
```

> 🎓 **Pattern**: centralize cache keys → invalidate ตรงๆ ได้, ไม่ typo

- [ ] **Step 6.4: Wrap root layout**

แก้ `apps/web/app/layout.tsx`:

```tsx
import { QueryProvider } from '@/components/providers/query-provider';
// ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="...">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6.5: Verify**

```bash
pnpm dev
```

เปิด http://localhost:3000/menu — ควรเห็น React Query Devtools floating button (มุมซ้ายล่าง). คลิกเพื่อ open panel

- [ ] **Step 6.6: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "feat(web): add TanStack Query with provider, devtools, and key registry"
```

---

### Task 7: Login Flow with httpOnly Cookie

**Files:**

- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/login/page.tsx`
- Create: `apps/web/components/login-form.tsx`
- Create: `apps/web/lib/auth.ts`

> 🎓 **Architecture**: ใช้ Next.js Route Handler เป็น proxy:
>
> 1. FE → POST `/api/auth/login` (Next.js Route Handler)
> 2. Route Handler → POST `http://localhost:4000/api/auth/login` (NestJS)
> 3. ได้ accessToken → ใส่ใน httpOnly cookie → return user info
> 4. Subsequent requests: cookie auto-sent → middleware/Server Component ดึง token

- [ ] **Step 7.1: Auth utilities**

Create file `apps/web/lib/auth.ts`:

```ts
import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'coffee_token';

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
```

> 📝 **Note**: Next.js 15 — `cookies()` returns Promise (เปลี่ยนจาก v14)

- [ ] **Step 7.2: Login Route Handler**

Create file `apps/web/app/api/auth/login/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { LoginSchema } from '@coffee/shared';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  const upstream = await fetch(`${NESTJS_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: data.accessToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
```

> 📢 **เน้น**: Route Handler รันที่ server side. fetch ไป NestJS internal (กัน FE เห็น JWT). Cookie set ที่ Next.js domain. **ไม่ส่ง accessToken กลับ JSON** — เก็บใน cookie อย่างเดียว

- [ ] **Step 7.3: Logout Route Handler**

Create file `apps/web/app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
```

- [ ] **Step 7.4: LoginForm component**

Create file `apps/web/components/login-form.tsx`:

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LoginSchema, type LoginInput } from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(LoginSchema) });

  const onSubmit = async (input: LoginInput) => {
    setServerError(null);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const error = await res.json();
      setServerError(error.message ?? 'เข้าสู่ระบบไม่สำเร็จ');
      return;
    }

    router.push('/admin/menu');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
      </div>
      {serverError && (
        <p className="border-destructive/50 bg-destructive/10 text-destructive rounded border p-2 text-sm">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 7.5: Login page**

Create file `apps/web/app/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm items-center px-4">
      <div className="w-full">
        <h1 className="mb-6 text-2xl font-bold">เข้าสู่ระบบ</h1>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 7.6: ทดสอบ**

```bash
pnpm dev
```

1. เปิด http://localhost:3000/login
2. กรอก admin credentials → submit
3. ควร redirect ไป `/admin/menu` (หน้านี้ยังไม่มี — 404 OK ตอนนี้, จะสร้าง Task 8-9)
4. เปิด DevTools → Application → Cookies → เห็น `coffee_token` (httpOnly: true)

- [ ] **Step 7.7: Commit**

```bash
git add apps/web/app/api apps/web/app/login apps/web/components/login-form.tsx apps/web/lib/auth.ts
git commit -m "feat(web): add login flow with httpOnly cookie via Route Handler"
```

---

### Task 8: Auth Middleware + Admin Layout

**Files:**

- Create: `apps/web/middleware.ts`
- Create: `apps/web/app/(admin)/layout.tsx`
- Create: `apps/web/app/(admin)/admin/page.tsx`

- [ ] **Step 8.1: Auth middleware**

Create file `apps/web/middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

> 🎓 **Concept**: Edge middleware รัน **ก่อน** route. ตรวจ cookie → redirect ถ้าไม่มี. **ไม่ verify JWT** ตรงนี้ (NestJS verify เอง) — แค่ short-circuit

- [ ] **Step 8.2: Admin layout**

Create file `apps/web/app/(admin)/layout.tsx`:

```tsx
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-gray-50 p-4">
        <h2 className="mb-4 text-lg font-semibold">☕ Coffee Admin</h2>
        <nav className="space-y-1">
          <Link href="/admin/menu" className="block rounded px-3 py-2 hover:bg-gray-200">
            จัดการเมนู
          </Link>
          <Link href="/admin/orders" className="block rounded px-3 py-2 hover:bg-gray-200">
            ออเดอร์ <span className="text-xs text-gray-500">(Week 4)</span>
          </Link>
          <Link href="/admin/reports" className="block rounded px-3 py-2 hover:bg-gray-200">
            รายงาน <span className="text-xs text-gray-500">(Week 5)</span>
          </Link>
          <form action="/api/auth/logout" method="POST" className="pt-4">
            <button className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50">
              ออกจากระบบ
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 8.3: Admin index page (redirect)**

Create file `apps/web/app/(admin)/admin/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function AdminPage() {
  redirect('/admin/menu');
}
```

- [ ] **Step 8.4: ทดสอบ middleware**

1. Logout ก่อน (ลบ cookie ใน DevTools)
2. เปิด http://localhost:3000/admin → redirect ไป `/login?redirectTo=/admin`
3. Login → redirect → `/admin` → redirect → `/admin/menu` (404 — Task 9 ค่อยสร้าง)

- [ ] **Step 8.5: Commit**

```bash
git add apps/web/middleware.ts apps/web/app/\(admin\)
git commit -m "feat(web): add auth middleware and admin route group with sidebar"
```

---

### Task 9: Admin Menu CRUD UI

**Files:**

- Create: `apps/web/app/(admin)/admin/menu/page.tsx`
- Create: `apps/web/app/(admin)/admin/menu/components/category-list.tsx`
- Create: `apps/web/app/(admin)/admin/menu/components/category-form.tsx`
- Create: `apps/web/app/(admin)/admin/menu/components/product-list.tsx`
- Create: `apps/web/app/(admin)/admin/menu/components/product-form.tsx`

- [ ] **Step 9.1: Add shadcn dialog component**

```bash
cd apps/web
pnpm dlx shadcn@latest add dialog table
cd ../..
```

- [ ] **Step 9.2: Menu page**

Create file `apps/web/app/(admin)/admin/menu/page.tsx`:

```tsx
import { CategoryList } from './components/category-list';
import { ProductList } from './components/product-list';

export default function AdminMenuPage() {
  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">จัดการเมนู</h1>
      <CategoryList />
      <ProductList />
    </div>
  );
}
```

- [ ] **Step 9.3: CategoryList (Client Component with TanStack Query)**

Create file `apps/web/app/(admin)/admin/menu/components/category-list.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Category } from '@coffee/shared';
import { CategoryForm } from './category-form';

export function CategoryList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<Category[]>('/menu/categories'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
    onError: (error) => alert(`ลบไม่ได้: ${error.message}`),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">หมวดหมู่</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>+ เพิ่มหมวด</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มหมวดใหม่</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-gray-500">กำลังโหลด...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ลำดับ</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.sortOrder}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(c)}>
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirm(`ลบ "${c.name}"?`) && removeMutation.mutate(c.id)}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขหมวด</DialogTitle>
          </DialogHeader>
          {editing && <CategoryForm category={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
```

- [ ] **Step 9.4: CategoryForm**

Create file `apps/web/app/(admin)/admin/menu/components/category-form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateCategorySchema, type CreateCategoryInput, type Category } from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function CategoryForm({
  category,
  onSuccess,
}: {
  category?: Category;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: category ? { name: category.name, sortOrder: category.sortOrder } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      apiFetch(isEdit ? `/menu/categories/${category!.id}` : '/menu/categories', {
        method: isEdit ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.categories });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อหมวด</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="sortOrder">ลำดับ</Label>
        <Input id="sortOrder" type="number" {...register('sortOrder', { valueAsNumber: true })} />
        {errors.sortOrder && <p className="text-destructive text-sm">{errors.sortOrder.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 9.5: ProductList + ProductForm**

> 📝 **Note**: Pattern เหมือน Category — copy + ปรับ field. ดูใน Plan ฉบับ student references; instructor demo จะพิมพ์สด แต่ structure ตรงนี้

Create file `apps/web/app/(admin)/admin/menu/components/product-list.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Product } from '@coffee/shared';
import { ProductForm } from './product-form';

export function ProductList() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: queryKeys.products(),
    queryFn: () => apiFetch<Product[]>('/menu/products'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/menu/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.products() }),
  });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">สินค้า</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger asChild>
            <Button>+ เพิ่มสินค้า</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
            </DialogHeader>
            <ProductForm onSuccess={() => setCreating(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ชื่อ</TableHead>
              <TableHead>ราคา</TableHead>
              <TableHead>หมวด</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>฿{Number(p.price)}</TableCell>
                <TableCell>{p.category?.name ?? '—'}</TableCell>
                <TableCell>{p.isActive ? 'ขาย' : 'ปิด'}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setEditing(p)}>
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirm(`ลบ "${p.name}"?`) && removeMutation.mutate(p.id)}
                  >
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า</DialogTitle>
          </DialogHeader>
          {editing && <ProductForm product={editing} onSuccess={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}
```

Create file `apps/web/app/(admin)/admin/menu/components/product-form.tsx`:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateProductSchema,
  type CreateProductInput,
  type Product,
  type Category,
} from '@coffee/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export function ProductForm({ product, onSuccess }: { product?: Product; onSuccess: () => void }) {
  const qc = useQueryClient();
  const isEdit = !!product;

  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<Category[]>('/menu/categories'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductInput>({
    resolver: zodResolver(CreateProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          price: Number(product.price),
          imageUrl: product.imageUrl ?? undefined,
          isActive: product.isActive,
          categoryId: product.categoryId,
        }
      : { isActive: true },
  });

  const mutation = useMutation({
    mutationFn: (input: CreateProductInput) =>
      apiFetch(isEdit ? `/menu/products/${product!.id}` : '/menu/products', {
        method: isEdit ? 'PATCH' : 'POST',
        body: input,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      onSuccess();
    },
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อสินค้า</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">ราคา (บาท)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
          />
          {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="categoryId">หมวด</Label>
          <select
            id="categoryId"
            {...register('categoryId')}
            className="border-input bg-background flex h-10 w-full rounded-md border px-3 text-sm"
          >
            <option value="">-- เลือกหมวด --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-destructive text-sm">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="imageUrl">URL รูป (optional)</Label>
        <Input id="imageUrl" type="url" {...register('imageUrl')} />
        {errors.imageUrl && <p className="text-destructive text-sm">{errors.imageUrl.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input id="isActive" type="checkbox" {...register('isActive')} />
        <Label htmlFor="isActive">เปิดขาย</Label>
      </div>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isEdit ? 'บันทึก' : 'เพิ่ม'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 9.6: ทดสอบ end-to-end**

1. Login เป็น admin
2. ไป `/admin/menu` — เห็น 2 sections (Categories, Products) ทั้ง empty
3. กด "+ เพิ่มหมวด" → กรอก "เครื่องดื่ม", sortOrder 1 → save → เห็นใน list
4. กด "+ เพิ่มสินค้า" → กรอก Latte, ราคา 75, เลือก เครื่องดื่ม → save → เห็นใน list
5. แก้ไข + ลบ → ทำงาน
6. ลองลบหมวดที่มี product → 409 Conflict (alert)

- [ ] **Step 9.7: Commit**

```bash
git add apps/web/app/\(admin\)/admin/menu apps/web/components/ui pnpm-lock.yaml apps/web/package.json
git commit -m "feat(web): add admin Menu CRUD UI for Categories and Products"
```

---

### Task 10: Wire Storefront to Live API

**Files:**

- Modify: `apps/web/app/(storefront)/menu/page.tsx`
- Delete: `apps/web/lib/data/menu.ts` (or convert to types-only)

- [ ] **Step 10.1: ปรับ menu page เป็น Server Component fetch**

แทนที่ `apps/web/app/(storefront)/menu/page.tsx`:

```tsx
import { MenuCard } from '@/components/menu-card';
import type { Product, Category } from '@coffee/shared';
import { getServerToken } from '@/lib/auth';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL ?? 'http://localhost:4000';

async function fetchProducts(): Promise<Product[]> {
  const token = await getServerToken();
  const res = await fetch(`${NESTJS_URL}/api/menu/products?active=true`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store', // ตอนนี้ไม่ cache; Week 5 ค่อย optimize
  });
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${NESTJS_URL}/api/menu/categories`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export default async function MenuPage() {
  const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);

  if (products.length === 0) {
    return (
      <div>
        <h1 className="mb-6 text-3xl font-bold">เมนู</h1>
        <p className="text-gray-500">ยังไม่มีเมนู — admin ยังไม่เพิ่ม</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">เมนู</h1>
      {categories.map((category) => {
        const items = products.filter((p) => p.categoryId === category.id);
        if (items.length === 0) return null;
        return (
          <section key={category.id} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">{category.name}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 10.2: ปรับ MenuCard ให้รับ Product (ไม่ใช่ MenuItem mock)**

แก้ `apps/web/components/menu-card.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Product } from '@coffee/shared';

export function MenuCard({ item }: { item: Product }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="aspect-square w-full rounded object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center rounded bg-gray-100 text-4xl">
            ☕
          </div>
        )}
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">฿{Number(item.price)}</div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 10.3: ลบ mock data**

```bash
rm apps/web/lib/data/menu.ts
rmdir apps/web/lib/data    # if empty
```

- [ ] **Step 10.4: Verify end-to-end**

1. Logout (storefront ไม่ต้อง auth)
2. ไป http://localhost:3000/menu → เห็น real products จาก DB

หาก DB ว่าง — login admin → เพิ่ม category + products → กลับ `/menu` → เห็น

- [ ] **Step 10.5: Commit**

```bash
git add apps/web
git commit -m "feat(web): wire storefront /menu to live NestJS API (replace mock)"
```

---

## Acceptance Criteria — Week 3 Done When:

- [ ] **Backend**
  - [ ] `GET /api/menu/categories` → public, returns array
  - [ ] `POST/PATCH/DELETE /api/menu/categories` → require ADMIN
  - [ ] `GET /api/menu/products` (with `?active=true` filter) → public
  - [ ] `POST/PATCH/DELETE /api/menu/products` → require ADMIN
  - [ ] Delete category with products → 409 Conflict
  - [ ] `pnpm --filter @coffee/api test` → 9+ tests pass (auth + category + product)
- [ ] **Frontend**
  - [ ] Login flow: `/login` → enter credentials → cookie set → redirect to `/admin/menu`
  - [ ] Middleware: visiting `/admin/*` without cookie → redirect to `/login`
  - [ ] `/admin/menu`: CRUD ทั้ง Categories + Products ผ่าน UI
  - [ ] Logout: button ใน sidebar → POST `/api/auth/logout` → cookie cleared → redirect to `/login`
  - [ ] `/menu` (storefront): แสดง products จริงจาก DB
- [ ] **Quality**
  - [ ] `pnpm typecheck` pass ทั้งหมด
  - [ ] React Query Devtools ใช้งานได้ใน dev
  - [ ] No `any` (except mock prisma in tests)

## Self-Review Notes

**Spec coverage:**

- ✅ Week 3 Day 1 (shared schemas): Task 1
- ✅ Day 2-3 (NestJS Menu module): Tasks 2-4
- ✅ Day 4-5 (TanStack Query setup): Tasks 5-6
- ✅ Day 6-7 (Admin CRUD UI): Tasks 7-9, 10

**Concepts taught:**

- NestJS CRUD service pattern + service layer testing
- Prisma relations (Category ← Product) + onDelete behavior
- Same Zod schema in FE form + BE validation pipe
- Next.js Route Handlers (proxy pattern), httpOnly cookies, edge middleware
- TanStack Query: `useQuery`, `useMutation`, cache invalidation
- Server Component data fetching (Week 1+ refresh)

**Out of Week 3 scope:**

- ❌ Image file upload (Tier 1 self-study) — URL only
- ❌ Search / pagination — small dataset, not needed
- ❌ Bulk operations
- ❌ Audit log (who edited what)
- ❌ Optimistic updates (could add as stretch — straightforward with TanStack Query)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-week-3-end-to-end-menu-crud.md`.**

**Recommendation สำหรับ instructor**: Self-execute — plan นี้คือ "demo source-of-truth" ใน live class
