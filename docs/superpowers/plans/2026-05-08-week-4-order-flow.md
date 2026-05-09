# Week 4 — Order Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ลูกค้า browse menu → add to cart → checkout (guest, name+phone) → order placed → tracking page. Staff เห็นใน Kitchen UI → เปลี่ยน status: PENDING → PREPARING → READY → COMPLETED

**Architecture:** เพิ่ม Order + OrderItem ใน Prisma. NestJS Orders module ที่ atomic create (1 transaction = order + items + price snapshots). FE: Zustand cart store (persist localStorage), checkout flow, polling-based tracking. Kitchen UI ใน new route group `(kitchen)` ป้องกันด้วย middleware (STAFF role).

**Tech Stack:** ทุกอย่างจาก Week 1-3 + Zustand + persist middleware + polling-based queries

**Spec Reference:** [course design spec § Week 4](../specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Pre-requisites:**

- Week 3 complete (admin can CRUD menu, storefront shows real data)
- มี admin + staff users ใน DB (admin จาก Week 2, staff = register ปกติแล้ว default role = STAFF)
- Menu มี categories + products อย่างน้อย 3-4 อย่าง

---

## File Structure (เป้าหมายเมื่อจบ Week 4)

```
course-full-stack/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (storefront)/
│   │   │   │   ├── menu/page.tsx       ← เพิ่มปุ่ม "เพิ่มลงตะกร้า"
│   │   │   │   ├── cart/page.tsx       ← ⭐ ตะกร้า
│   │   │   │   ├── checkout/page.tsx   ← ⭐ checkout form
│   │   │   │   └── order/[id]/
│   │   │   │       └── page.tsx        ← ⭐ tracking page
│   │   │   ├── (kitchen)/              ← ⭐ ใหม่
│   │   │   │   ├── layout.tsx
│   │   │   │   └── kitchen/
│   │   │   │       └── page.tsx        ← order list + status updates
│   │   │   └── (admin)/
│   │   │       └── admin/
│   │   │           └── orders/         ← ⭐ admin orders view (read-only)
│   │   │               └── page.tsx
│   │   ├── components/
│   │   │   ├── cart-icon.tsx           ← ⭐ ปรับใช้ store
│   │   │   ├── cart-line-item.tsx      ← ⭐
│   │   │   └── order-status-badge.tsx  ← ⭐
│   │   ├── stores/
│   │   │   └── cart-store.ts           ← ⭐ Zustand
│   │   ├── lib/
│   │   │   └── auth.ts                 ← เพิ่ม getServerUser (decode role)
│   │   └── middleware.ts               ← เพิ่ม `/kitchen/:path*`
│   │
│   └── api/
│       └── src/
│           └── orders/                 ← ⭐ ใหม่
│               ├── orders.module.ts
│               ├── orders.controller.ts
│               ├── orders.service.ts
│               └── orders.service.spec.ts
│
└── packages/
    └── shared/
        └── src/schemas/
            └── order.ts                ← ⭐ ใหม่
```

---

## Tasks

### Task 1: Order Schemas + Prisma Models

**Files:**

- Create: `packages/shared/src/schemas/order.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1.1: Order Zod schemas**

Create file `packages/shared/src/schemas/order.ts`:

```ts
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
```

- [ ] **Step 1.2: Export**

แก้ `packages/shared/src/index.ts`:

```ts
export * from './types/user';
export * from './schemas/auth';
export * from './schemas/menu';
export * from './schemas/order';
```

- [ ] **Step 1.3: Prisma models**

Append ต่อท้าย `apps/api/prisma/schema.prisma`:

```prisma
model Order {
  id             String       @id @default(cuid())
  orderNumber    String       @unique
  status         OrderStatus  @default(PENDING)
  customerName   String
  customerPhone  String
  subtotal       Decimal      @db.Decimal(10, 2)
  total          Decimal      @db.Decimal(10, 2)
  paidAt         DateTime?
  completedAt    DateTime?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  items          OrderItem[]

  @@index([status])
  @@index([createdAt])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId     String
  product     Product  @relation(fields: [productId], references: [id], onDelete: Restrict)
  productId   String
  productName String
  qty         Int
  unitPrice   Decimal  @db.Decimal(10, 2)
  lineTotal   Decimal  @db.Decimal(10, 2)

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

enum OrderStatus {
  PENDING
  PREPARING
  READY
  COMPLETED
  CANCELLED
}
```

> 🎓 **Concepts**:
>
> - `productName` snapshot — เก็บไว้แม้ product ถูก renamed/deleted
> - `unitPrice` snapshot — historical accuracy
> - `onDelete: Restrict` ที่ Product — ห้ามลบ product ที่มี order (data integrity)
> - `onDelete: Cascade` ที่ Order — ลบ order = ลบ items (ปกติเรา soft-delete แต่ course MVP ใช้ hard-delete)

- [ ] **Step 1.4: Migrate**

```bash
cd apps/api
pnpm prisma migrate dev --name add_orders
cd ../..
```

- [ ] **Step 1.5: Verify ใน DB**

```bash
docker exec coffee-postgres-dev psql -U coffee -d coffee -c "\dt"
# Expected: orders + order_items
```

- [ ] **Step 1.6: Commit**

```bash
git add packages/shared apps/api/prisma
git commit -m "feat: add Order and OrderItem schemas + Prisma models"
```

---

### Task 2: NestJS Orders Module — Atomic Create

**Files:**

- Create: `apps/api/src/orders/orders.module.ts`
- Create: `apps/api/src/orders/orders.service.ts`
- Create: `apps/api/src/orders/orders.controller.ts`

- [ ] **Step 2.1: OrdersService — `create` with transaction**

Create file `apps/api/src/orders/orders.service.ts`:

```ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  OrderStatus as OrderStatusType,
} from '@coffee/shared';

const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrderInput) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch products + verify all exist + active
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        throw new BadRequestException('สินค้าบางรายการไม่พบ');
      }
      const inactive = products.filter((p) => !p.isActive);
      if (inactive.length > 0) {
        throw new BadRequestException(`สินค้าหมด: ${inactive.map((p) => p.name).join(', ')}`);
      }

      // 2. Calculate totals (server-side — never trust FE)
      const productMap = new Map(products.map((p) => [p.id, p]));
      const items = input.items.map((line) => {
        const product = productMap.get(line.productId)!;
        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * line.qty;
        return {
          productId: product.id,
          productName: product.name,
          qty: line.qty,
          unitPrice,
          lineTotal,
        };
      });
      const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
      const total = subtotal; // no tax/discount in MVP

      // 3. Generate orderNumber (last 4 chars of cuid + uppercase)
      const orderNumber = `#${randomOrderNumber()}`;

      // 4. Create order + items
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          subtotal,
          total,
          items: {
            create: items,
          },
        },
        include: { items: true },
      });

      return order;
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return order;
  }

  async findByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { orderBy: { id: 'asc' } } },
    });
    if (!order) throw new NotFoundException('ไม่พบออเดอร์');
    return order;
  }

  async findAll(filter: { status?: OrderStatusType; activeOnly?: boolean } = {}) {
    const where: Prisma.OrderWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.activeOnly) {
      where.status = { in: ['PENDING', 'PREPARING', 'READY'] };
    }

    return this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateStatus(id: string, input: UpdateOrderStatusInput) {
    const order = await this.findOne(id);
    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(input.status)) {
      throw new ConflictException(`เปลี่ยนสถานะจาก ${order.status} → ${input.status} ไม่ได้`);
    }

    const data: Prisma.OrderUpdateInput = { status: input.status };
    if (input.status === 'PREPARING' && !order.paidAt) {
      data.paidAt = new Date(); // mark paid when staff accept
    }
    if (input.status === 'COMPLETED') {
      data.completedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
  }
}

function randomOrderNumber(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // exclude confusing chars
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
```

> 🎓 **Concepts**:
>
> - **`prisma.$transaction(async (tx) => ...)`** — interactive transaction. ทุก query ภายใน atomic
> - **Server-side total calculation** — ห้าม trust FE total (security)
> - **Status transition state machine** — ป้องกัน invalid transitions
> - **Timestamps**: `paidAt` (เมื่อ staff accept), `completedAt` (เมื่อ order เสร็จ)

- [ ] **Step 2.2: OrdersController**

Create file `apps/api/src/orders/orders.controller.ts`:

```ts
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
  create(@Body(new ZodValidationPipe(CreateOrderSchema)) input: CreateOrderInput) {
    return this.service.create(input);
  }

  // ลูกค้า: ดู order ของตัวเอง — public (รู้ ID/number พอ)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Kitchen + Admin: list orders
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  list(@Query('status') status?: string, @Query('activeOnly') activeOnly?: string) {
    const filter: { status?: OrderStatus; activeOnly?: boolean } = {};
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status as OrderStatus;
    }
    if (activeOnly === 'true') filter.activeOnly = true;
    return this.service.findAll(filter);
  }

  // Kitchen + Admin: update status
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STAFF', 'ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) input: UpdateOrderStatusInput,
  ) {
    return this.service.updateStatus(id, input);
  }
}
```

> 🎓 **Permissions**:
>
> - `POST /orders` (create) → public (guest customer)
> - `GET /orders/:id` → public (anyone with ID can view — for tracking)
> - `GET /orders` (list) → STAFF + ADMIN (kitchen view)
> - `PATCH /orders/:id/status` → STAFF + ADMIN

- [ ] **Step 2.3: OrdersModule + register**

Create file `apps/api/src/orders/orders.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
```

แก้ `apps/api/src/app.module.ts` เพิ่ม `OrdersModule` ใน imports.

- [ ] **Step 2.4: Test ใน Postman**

```bash
# Create order (no auth)
POST /api/orders
{
  "customerName": "สมชาย",
  "customerPhone": "0812345678",
  "items": [
    { "productId": "<latte-id>", "qty": 2 },
    { "productId": "<croissant-id>", "qty": 1 }
  ]
}
# → 201 + order with items

# Get order
GET /api/orders/<order-id>
# → 200 + order details

# List orders (STAFF token)
GET /api/orders?activeOnly=true
# → 200 + array

# Update status (STAFF token)
PATCH /api/orders/<id>/status
{ "status": "PREPARING" }
# → 200 + updated order with paidAt set

# Try invalid transition
PATCH /api/orders/<id>/status
{ "status": "PENDING" }
# → 409 Conflict
```

- [ ] **Step 2.5: Commit**

```bash
git add apps/api/src
git commit -m "feat(api): add Orders module with atomic create and status transitions"
```

---

### Task 3: OrdersService Tests

**Files:**

- Create: `apps/api/src/orders/orders.service.spec.ts`

- [ ] **Step 3.1: Tests**

Create file `apps/api/src/orders/orders.service.spec.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let tx: any;
  let prisma: any;

  beforeEach(async () => {
    tx = {
      product: { findMany: vi.fn() },
      order: { create: vi.fn() },
    };
    prisma = {
      $transaction: vi.fn((fn: (tx: typeof tx) => unknown) => fn(tx)),
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(OrdersService);
  });

  describe('create', () => {
    it('throws BadRequest ถ้า product ไม่มี', async () => {
      tx.product.findMany.mockResolvedValue([]);
      await expect(
        service.create({
          customerName: 'A',
          customerPhone: '0800000000',
          items: [{ productId: 'missing', qty: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequest ถ้า product inactive', async () => {
      tx.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Latte', price: 75, isActive: false },
      ]);
      await expect(
        service.create({
          customerName: 'A',
          customerPhone: '0800000000',
          items: [{ productId: 'p1', qty: 1 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('สร้าง order + items + คำนวณ total ฝั่ง server', async () => {
      tx.product.findMany.mockResolvedValue([
        { id: 'p1', name: 'Latte', price: 75, isActive: true },
        { id: 'p2', name: 'Croissant', price: 65, isActive: true },
      ]);
      tx.order.create.mockResolvedValue({
        id: 'o1',
        orderNumber: '#ABCDE',
        customerName: 'A',
        subtotal: 215,
        total: 215,
        items: [],
      });

      const result = await service.create({
        customerName: 'A',
        customerPhone: '0800000000',
        items: [
          { productId: 'p1', qty: 2 },
          { productId: 'p2', qty: 1 },
        ],
      });

      expect(tx.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 215, // 75*2 + 65*1
            total: 215,
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({ productId: 'p1', qty: 2, unitPrice: 75, lineTotal: 150 }),
                expect.objectContaining({ productId: 'p2', qty: 1, unitPrice: 65, lineTotal: 65 }),
              ]),
            },
          }),
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('throws Conflict ถ้า invalid transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'COMPLETED',
        items: [],
      });

      await expect(service.updateStatus('o1', { status: 'PENDING' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('PENDING → PREPARING ตั้ง paidAt', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'PENDING',
        paidAt: null,
        items: [],
      });
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('o1', { status: 'PREPARING' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PREPARING',
            paidAt: expect.any(Date),
          }),
        }),
      );
    });

    it('READY → COMPLETED ตั้ง completedAt', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: 'READY',
        paidAt: new Date(),
        items: [],
      });
      prisma.order.update.mockResolvedValue({});

      await service.updateStatus('o1', { status: 'COMPLETED' });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'COMPLETED',
            completedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFound ถ้าไม่มี', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });
});
```

- [ ] **Step 3.2: รัน tests**

```bash
pnpm --filter @coffee/api test
# Expect 14+ pass (5 auth + 4 cat + 3 prod + 5 orders)
```

- [ ] **Step 3.3: Commit**

```bash
git add apps/api/src/orders
git commit -m "test(api): add OrdersService unit tests for create and status transitions"
```

---

### Task 4: Zustand Cart Store

**Files:**

- Create: `apps/web/stores/cart-store.ts`

- [ ] **Step 4.1: Install Zustand**

```bash
cd apps/web
pnpm add zustand
cd ../..
```

- [ ] **Step 4.2: Cart store**

Create file `apps/web/stores/cart-store.ts`:

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  name: string;
  unitPrice: number;
  imageUrl: string | null;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  add: (product: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalQty: () => number;
  subtotal: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, qty = 1) => {
        const existing = get().items.find((i) => i.productId === product.productId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === product.productId ? { ...i, qty: i.qty + qty } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...product, qty }] });
        }
      },
      setQty: (productId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
      totalQty: () => get().items.reduce((s, i) => s + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    }),
    { name: 'coffee-cart' },
  ),
);
```

> 🎓 **Concepts**:
>
> - `persist` middleware → save to localStorage automatically
> - `name: 'coffee-cart'` → key in localStorage
> - Selectors as functions (`totalQty`, `subtotal`) — call ใน component: `useCart((s) => s.totalQty())`
> - `add` consolidates same product (merge qty)

- [ ] **Step 4.3: ปรับ CartIcon ให้ใช้ store**

แก้ `apps/web/components/cart-icon.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useCart } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const totalQty = useCart((s) => s.totalQty());

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href="/cart">🛒 Cart ({totalQty})</Link>
    </Button>
  );
}
```

> 📝 **Note**: แทน `useState` ของ Week 1 → ใช้ store จริง. Click → ไป `/cart` page

- [ ] **Step 4.4: เพิ่มปุ่ม "เพิ่มลงตะกร้า" ใน MenuCard**

แก้ `apps/web/components/menu-card.tsx`:

```tsx
'use client'; // ⭐ เปลี่ยนเป็น Client Component (button needs onClick)

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/stores/cart-store';
import type { Product } from '@coffee/shared';

export function MenuCard({ item }: { item: Product }) {
  const add = useCart((s) => s.add);

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
      <CardContent className="flex items-center justify-between">
        <span className="text-lg font-semibold">฿{Number(item.price)}</span>
        <Button
          size="sm"
          onClick={() =>
            add({
              productId: item.id,
              name: item.name,
              unitPrice: Number(item.price),
              imageUrl: item.imageUrl,
            })
          }
        >
          เพิ่มลงตะกร้า
        </Button>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4.5: ทดสอบ**

1. เปิด `/menu`
2. กดเพิ่มสินค้า 2-3 ตัว
3. CartIcon header → count เพิ่มขึ้น
4. Refresh page → count คงเดิม (persist ทำงาน)
5. DevTools → Application → Local Storage → `coffee-cart` มี items

- [ ] **Step 4.6: Commit**

```bash
git add apps/web/stores apps/web/components apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add Zustand cart store with persist + add-to-cart UI"
```

---

### Task 5: Cart Page

**Files:**

- Create: `apps/web/app/(storefront)/cart/page.tsx`
- Create: `apps/web/components/cart-line-item.tsx`

- [ ] **Step 5.1: CartLineItem component**

Create file `apps/web/components/cart-line-item.tsx`:

```tsx
'use client';

import { useCart, type CartItem } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';

export function CartLineItem({ item }: { item: CartItem }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);

  return (
    <div className="flex items-center gap-4 border-b py-4">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-100 text-2xl">
          ☕
        </div>
      )}

      <div className="flex-1">
        <div className="font-semibold">{item.name}</div>
        <div className="text-sm text-gray-500">฿{item.unitPrice} / ชิ้น</div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setQty(item.productId, item.qty - 1)}>
          −
        </Button>
        <span className="w-8 text-center font-medium">{item.qty}</span>
        <Button variant="outline" size="sm" onClick={() => setQty(item.productId, item.qty + 1)}>
          +
        </Button>
      </div>

      <div className="w-20 text-right font-semibold">฿{item.qty * item.unitPrice}</div>
      <Button variant="ghost" size="sm" onClick={() => remove(item.productId)}>
        ✕
      </Button>
    </div>
  );
}
```

- [ ] **Step 5.2: Cart page**

Create file `apps/web/app/(storefront)/cart/page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useCart } from '@/stores/cart-store';
import { Button } from '@/components/ui/button';
import { CartLineItem } from '@/components/cart-line-item';

export default function CartPage() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-4 text-2xl font-bold">ตะกร้าว่างเปล่า</h1>
        <Button asChild>
          <Link href="/menu">เลือกเมนู</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ตะกร้า</h1>
      <div className="rounded border">
        {items.map((item) => (
          <CartLineItem key={item.productId} item={item} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={clear}>
          ล้างตะกร้า
        </Button>
        <div className="text-right">
          <div className="text-sm text-gray-500">รวม</div>
          <div className="text-2xl font-bold">฿{subtotal}</div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" asChild>
          <Link href="/menu">เพิ่มสินค้า</Link>
        </Button>
        <Button asChild>
          <Link href="/checkout">ไปชำระเงิน</Link>
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.3: ทดสอบ**

1. เพิ่มสินค้าในตะกร้า → ไป `/cart`
2. ทดลอง +/- qty, remove, clear
3. Refresh → state คงเดิม
4. กด "ไปชำระเงิน" → ไป `/checkout` (ยังไม่มี — 404 OK)

- [ ] **Step 5.4: Commit**

```bash
git add apps/web/app/\(storefront\)/cart apps/web/components/cart-line-item.tsx
git commit -m "feat(web): add cart page with qty controls and subtotal"
```

---

### Task 6: Checkout + Place Order

**Files:**

- Create: `apps/web/app/(storefront)/checkout/page.tsx`

- [ ] **Step 6.1: Checkout page**

Create file `apps/web/app/(storefront)/checkout/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { CreateOrderSchema, type Order } from '@coffee/shared';
import { useCart } from '@/stores/cart-store';
import { apiFetch, ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Customer-facing checkout schema (subset of CreateOrderSchema)
const CheckoutSchema = z.object({
  customerName: z.string().min(1, 'กรุณากรอกชื่อ'),
  customerPhone: z.string().min(9, 'เบอร์โทรไม่ครบ'),
});
type CheckoutInput = z.infer<typeof CheckoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotal());
  const clear = useCart((s) => s.clear);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(CheckoutSchema),
  });

  const placeOrder = useMutation({
    mutationFn: (input: CheckoutInput) =>
      apiFetch<Order>('/orders', {
        method: 'POST',
        body: {
          ...input,
          items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        },
      }),
    onSuccess: (order) => {
      clear();
      router.push(`/order/${order.id}`);
    },
  });

  if (items.length === 0) {
    return <p className="py-12 text-center">ตะกร้าว่างเปล่า</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Customer info form */}
      <div>
        <h1 className="mb-6 text-2xl font-bold">ชำระเงิน</h1>
        <form onSubmit={handleSubmit((d) => placeOrder.mutate(d))} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="customerName">ชื่อ</Label>
            <Input id="customerName" {...register('customerName')} />
            {errors.customerName && (
              <p className="text-destructive text-sm">{errors.customerName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="customerPhone">เบอร์โทร</Label>
            <Input id="customerPhone" {...register('customerPhone')} />
            {errors.customerPhone && (
              <p className="text-destructive text-sm">{errors.customerPhone.message}</p>
            )}
          </div>

          {placeOrder.error instanceof ApiError && (
            <p className="border-destructive/50 bg-destructive/10 text-destructive rounded border p-2 text-sm">
              {(placeOrder.error.details as any)?.message ?? 'สั่งซื้อไม่สำเร็จ'}
            </p>
          )}

          <Button type="submit" disabled={placeOrder.isPending} className="w-full">
            {placeOrder.isPending ? 'กำลังสั่ง...' : `ยืนยันสั่ง ฿${subtotal}`}
          </Button>
        </form>
      </div>

      {/* Order summary */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">สรุปออเดอร์</h2>
        <div className="rounded border p-4">
          {items.map((i) => (
            <div key={i.productId} className="flex justify-between py-1">
              <span>
                {i.name} × {i.qty}
              </span>
              <span>฿{i.qty * i.unitPrice}</span>
            </div>
          ))}
          <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
            <span>รวม</span>
            <span>฿{subtotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

> 🎓 **Concepts**:
>
> - แยก CheckoutSchema (just customer info) จาก CreateOrderSchema (full)
> - `placeOrder.mutate(d)` → on success: clear cart + navigate to tracking
> - Error from server → show banner

- [ ] **Step 6.2: ทดสอบ end-to-end**

1. เพิ่มสินค้าในตะกร้า
2. ไป `/checkout`
3. กรอกชื่อ + เบอร์โทร → ยืนยัน
4. Cart cleared → redirect ไป `/order/<id>` (ยังไม่มี — 404 OK)
5. ตรวจ DB ผ่าน DBeaver: `SELECT * FROM orders;` — มี order ใหม่
6. `SELECT * FROM order_items;` — มี items

- [ ] **Step 6.3: Commit**

```bash
git add apps/web/app/\(storefront\)/checkout
git commit -m "feat(web): add checkout flow with form validation and place order mutation"
```

---

### Task 7: Order Tracking Page (Polling)

**Files:**

- Create: `apps/web/app/(storefront)/order/[id]/page.tsx`
- Create: `apps/web/components/order-status-badge.tsx`

- [ ] **Step 7.1: OrderStatusBadge**

Create file `apps/web/components/order-status-badge.tsx`:

```tsx
import type { OrderStatus } from '@coffee/shared';

const LABELS: Record<OrderStatus, string> = {
  PENDING: 'รอชำระ',
  PREPARING: 'กำลังเตรียม',
  READY: 'พร้อมรับ',
  COMPLETED: 'เสร็จสิ้น',
  CANCELLED: 'ยกเลิก',
};

const COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PREPARING: 'bg-blue-100 text-blue-800',
  READY: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${COLORS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
```

- [ ] **Step 7.2: Tracking page (Client Component for polling)**

Create file `apps/web/app/(storefront)/order/[id]/page.tsx`:

```tsx
'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { OrderStatusBadge } from '@/components/order-status-badge';
import type { Order } from '@coffee/shared';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', id],
    queryFn: () => apiFetch<Order>(`/orders/${id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'CANCELLED') return false;
      return 5000; // poll every 5 sec until terminal
    },
  });

  if (isLoading) return <p className="py-12 text-center">กำลังโหลด...</p>;
  if (error || !order) return <p className="py-12 text-center text-red-600">ไม่พบออเดอร์</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">ออเดอร์ {order.orderNumber}</h1>
        <p className="mb-4 text-gray-500">
          {order.customerName} · {order.customerPhone}
        </p>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-4 rounded border p-4">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between py-1">
            <span>
              {i.productName} × {i.qty}
            </span>
            <span>฿{Number(i.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-3 flex justify-between border-t pt-3 text-lg font-bold">
          <span>รวม</span>
          <span>฿{Number(order.total)}</span>
        </div>
      </div>

      <p className="text-center text-sm text-gray-500">🔄 หน้านี้รีเฟรชอัตโนมัติทุก 5 วินาที</p>
    </div>
  );
}
```

> 🎓 **Concepts**:
>
> - `use(params)` — Next.js 15 unwrap Promise params (Client Component)
> - `refetchInterval` (function) — poll dynamically. Return false → stop polling
> - Stop polling เมื่อถึง terminal state (COMPLETED/CANCELLED) → ประหยัด requests

- [ ] **Step 7.3: ทดสอบ**

1. Place order → ลงไปที่ tracking page
2. Status = PENDING
3. ใน Postman / via Kitchen UI later: PATCH status → PREPARING
4. กลับ tracking page → ภายใน 5 วินาที status update เป็น "กำลังเตรียม"
5. PATCH → READY → 5 วินาที update
6. PATCH → COMPLETED → polling stops (ดูใน DevTools Network tab)

- [ ] **Step 7.4: Commit**

```bash
git add apps/web/app/\(storefront\)/order apps/web/components/order-status-badge.tsx
git commit -m "feat(web): add order tracking page with smart polling"
```

---

### Task 8: Kitchen Route Group + Middleware

**Files:**

- Modify: `apps/web/middleware.ts`
- Create: `apps/web/app/(kitchen)/layout.tsx`
- Modify: `apps/web/lib/auth.ts`

- [ ] **Step 8.1: ขยาย middleware ให้ครอบ /kitchen**

แก้ `apps/web/middleware.ts`:

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
  matcher: ['/admin/:path*', '/kitchen/:path*'],
};
```

> 📝 **Note**: middleware แค่ check token exists. Role check (STAFF/ADMIN) ทำที่ NestJS guards. Edge runtime + crypto = ลำบาก

- [ ] **Step 8.2: Kitchen layout**

Create file `apps/web/app/(kitchen)/layout.tsx`:

```tsx
import Link from 'next/link';

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-amber-50">
      <header className="bg-amber-700 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/kitchen" className="text-xl font-bold">
            🍳 Kitchen Display
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm underline">ออกจากระบบ</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 8.3: ทดสอบ middleware**

1. Logout
2. Go to `/kitchen` → redirect to `/login`
3. Login เป็น staff → ไป `/kitchen` → 404 OK (ยังไม่สร้าง page)

- [ ] **Step 8.4: Commit**

```bash
git add apps/web/middleware.ts apps/web/app/\(kitchen\)
git commit -m "feat(web): add kitchen route group with auth middleware"
```

---

### Task 9: Kitchen UI — List + Status Updates

**Files:**

- Create: `apps/web/app/(kitchen)/kitchen/page.tsx`
- Create: `apps/web/app/(kitchen)/kitchen/components/order-card.tsx`

- [ ] **Step 9.1: OrderCard component**

Create file `apps/web/app/(kitchen)/kitchen/components/order-card.tsx`:

```tsx
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderStatus } from '@coffee/shared';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY', label: 'ทำเสร็จ' },
  READY: { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};

export function OrderCard({ order }: { order: Order }) {
  const qc = useQueryClient();

  const advance = useMutation({
    mutationFn: (next: OrderStatus) =>
      apiFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const cancel = useMutation({
    mutationFn: () =>
      apiFetch(`/orders/${order.id}/status`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });

  const transition = NEXT_STATUS[order.status];

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="text-lg font-bold">{order.orderNumber}</div>
          <div className="text-sm text-gray-500">
            {order.customerName} · {order.customerPhone}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mb-3 space-y-1 border-t pt-3">
        {order.items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>
              {i.productName} × {i.qty}
            </span>
            <span className="text-gray-500">฿{Number(i.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <span className="font-bold">฿{Number(order.total)}</span>

        <div className="flex gap-2">
          {transition && (
            <Button
              size="sm"
              onClick={() => advance.mutate(transition.next)}
              disabled={advance.isPending}
            >
              {transition.label}
            </Button>
          )}
          {(order.status === 'PENDING' || order.status === 'PREPARING') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => confirm('ยกเลิกออเดอร์?') && cancel.mutate()}
            >
              ยกเลิก
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 9.2: Kitchen page**

Create file `apps/web/app/(kitchen)/kitchen/page.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { Order } from '@coffee/shared';
import { OrderCard } from './components/order-card';

export default function KitchenPage() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', { activeOnly: true }],
    queryFn: () => apiFetch<Order[]>('/orders?activeOnly=true'),
    refetchInterval: 5000, // poll every 5 sec
  });

  if (isLoading) return <p>กำลังโหลด...</p>;

  if (orders.length === 0) {
    return <div className="py-12 text-center text-gray-500">🎉 ยังไม่มีออเดอร์ค้าง</div>;
  }

  // Group by status for visual order
  const byStatus = {
    PENDING: orders.filter((o) => o.status === 'PENDING'),
    PREPARING: orders.filter((o) => o.status === 'PREPARING'),
    READY: orders.filter((o) => o.status === 'READY'),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ออเดอร์ที่ค้าง ({orders.length})</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Column title="🕐 รอชำระ" orders={byStatus.PENDING} />
        <Column title="🔥 กำลังเตรียม" orders={byStatus.PREPARING} />
        <Column title="✅ พร้อมรับ" orders={byStatus.READY} />
      </div>
    </div>
  );
}

function Column({ title, orders }: { title: string; orders: Order[] }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold">
        {title} ({orders.length})
      </h2>
      <div className="space-y-3">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400">ว่าง</p>
        ) : (
          orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}
```

> 🎓 **Pattern**: Kanban-style — 3 columns (Pending / Preparing / Ready). ไม่แสดง Completed/Cancelled (active only filter)

- [ ] **Step 9.3: ทดสอบ end-to-end**

1. Customer side: place order
2. Login as staff (different browser หรือ incognito)
3. ไป `/kitchen` → เห็น order ใน "รอชำระ"
4. กด "รับออเดอร์" → ย้าย "กำลังเตรียม"
5. กด "ทำเสร็จ" → "พร้อมรับ"
6. กด "ลูกค้ารับแล้ว" → หาย (active only)
7. ทุกอย่างนี้ — order tracking page (customer) update ภายใน 5 วินาที

- [ ] **Step 9.4: Commit**

```bash
git add apps/web/app/\(kitchen\)/kitchen
git commit -m "feat(web): add Kitchen UI with kanban board and status mutations"
```

---

### Task 10: Admin Orders View (Read-only)

**Files:**

- Create: `apps/web/app/(admin)/admin/orders/page.tsx`

> 📝 **Note**: Admin = ดูภาพรวม. Status updates ทำที่ Kitchen UI

- [ ] **Step 10.1: Admin orders page**

Create file `apps/web/app/(admin)/admin/orders/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatusBadge } from '@/components/order-status-badge';
import type { Order, OrderStatus } from '@coffee/shared';

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', { status: filter }],
    queryFn: () => apiFetch<Order[]>(filter === 'ALL' ? '/orders' : `/orders?status=${filter}`),
    refetchInterval: 10_000,
  });

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ออเดอร์ทั้งหมด</h1>

      <div className="mb-4 flex gap-2">
        {['ALL', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`rounded px-3 py-1 text-sm ${
              filter === s ? 'bg-amber-700 text-white' : 'bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>กำลังโหลด...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">ไม่มีออเดอร์ในช่วงนี้</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>เลขออเดอร์</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>รายการ</TableHead>
              <TableHead>รวม</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>เวลา</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono">{o.orderNumber}</TableCell>
                <TableCell>{o.customerName}</TableCell>
                <TableCell>{o.items.reduce((s, i) => s + i.qty, 0)} ชิ้น</TableCell>
                <TableCell>฿{Number(o.total)}</TableCell>
                <TableCell>
                  <OrderStatusBadge status={o.status} />
                </TableCell>
                <TableCell className="text-xs text-gray-500">
                  {new Date(o.createdAt).toLocaleString('th-TH')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 10.2: ทดสอบ**

1. Login admin
2. ไป `/admin/orders` → เห็นทุก orders
3. Filter ตาม status

- [ ] **Step 10.3: Commit**

```bash
git add apps/web/app/\(admin\)/admin/orders
git commit -m "feat(web): add admin orders view with status filter"
```

---

## Acceptance Criteria — Week 4 Done When:

- [ ] **Backend**
  - [ ] POST `/api/orders` creates order atomically (no auth)
  - [ ] GET `/api/orders/:id` returns order + items (public)
  - [ ] GET `/api/orders` lists orders (STAFF/ADMIN, with filter)
  - [ ] PATCH `/api/orders/:id/status` validates state transition
  - [ ] OrdersService tests pass (5+ tests)
  - [ ] Total ≥17 tests pass (auth + cat + prod + orders)
- [ ] **Frontend**
  - [ ] Cart store persists across refresh
  - [ ] `/menu` "เพิ่มลงตะกร้า" works → CartIcon updates
  - [ ] `/cart` qty +/- + remove + clear
  - [ ] `/checkout` validates form + places order + clears cart
  - [ ] `/order/[id]` polls every 5 sec until terminal status
  - [ ] `/kitchen` shows kanban board with active orders, status transitions work
  - [ ] `/admin/orders` shows all orders with filter
- [ ] **Integration**
  - [ ] End-to-end: customer places order → kitchen sees → kitchen advances → customer tracking updates within 5 sec

## Self-Review Notes

**Spec coverage:**

- ✅ Day 1-2 (Cart Zustand): Tasks 4-5
- ✅ Day 3-4 (Order module + atomic): Tasks 1-3, 6
- ✅ Day 5 (Tracking page polling): Task 7
- ✅ Day 6-7 (Kitchen UI + role guard): Tasks 8-9
- ✅ Bonus: admin orders view (Task 10)

**Concepts taught:**

- Prisma `$transaction` (atomic operations)
- State machine pattern (status transitions)
- Server-side total calculation (security)
- Snapshot pattern (productName, unitPrice in OrderItem)
- Zustand + persist middleware
- Smart polling (`refetchInterval` function form)
- Kanban-style UI

**Out of Week 4 scope:**

- ❌ Real payment (mock — just POST creates order)
- ❌ Customer signup (guest only)
- ❌ Email/SMS notification
- ❌ WebSocket realtime (polling sufficient)
- ❌ Stock auto-deduct (Week 5)
- ❌ COGS calculation (Week 5)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-week-4-order-flow.md`.**

Next: Week 4 Instructor Pack
