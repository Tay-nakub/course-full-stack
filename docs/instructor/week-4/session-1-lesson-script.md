# Week 4 Session 1 — Backend Orders + Cart Store

**Week:** 4
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 3 complete (admin can CRUD menu, storefront live data)
**Covers:** Tasks 1-5 of [Week 4 Plan](../../superpowers/plans/2026-05-08-week-4-order-flow.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ Order + OrderItem schemas + Prisma models migrated
- ✅ NestJS Orders module: atomic create + status transitions + tests
- ✅ Zustand cart store with persist (localStorage)
- ✅ Add to cart UI working — count updates ใน CartIcon

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify Week 3 deliverables (admin CRUD + storefront live)
- [ ] เช็ค menu data: ≥3 categories + ≥4 products in DB
- [ ] Demo repo: branch `week4-instructor-start` (Week 3 จบ + seed users)
- [ ] เปิด Prisma docs: Transactions
- [ ] เปิด Zustand docs: persist middleware

---

## 🗓️ Time-Blocked Agenda

| Time       | Block               | Activity                                        |
| ---------- | ------------------- | ----------------------------------------------- |
| 0-10       | **Recap + Preview** | Quiz Week 3 + show today's outcome              |
| **10-55**  | **Block A**         | **Order schemas + Prisma + atomic transaction** |
| **55-75**  | **Block B**         | **Tests + state transitions**                   |
| **75-110** | **Block C**         | **Zustand cart + add to cart UI**               |
| 110-120    | Wrap-up             | Homework + Q&A                                  |

---

## 🟢 Recap + Preview (0-10 min)

### Recap (3 min)

- "TanStack Query useMutation onSuccess ทำอะไร?"
- "Schema เดียวสองฝั่ง — ตัวอย่างจาก Week 3?"
- "Cookie httpOnly ดียังไง?"

### Today's Preview (7 min)

**Show end-state**:

1. Customer (incognito browser): /menu → add to cart → /cart → /checkout → place order
2. Tracking page shows order
3. Staff browser: /kitchen → see order → "รับออเดอร์" → "ทำเสร็จ" → "ลูกค้ารับแล้ว"
4. Tracking page (customer) auto-updates within 5 sec

📢 **Big idea**:

> "วันนี้ + Session 2 = use Week 3 patterns + 1 new pattern (transactions). 80% practice, 20% new"

---

## 📦 Block A: Order Schemas + Prisma + Atomic Transaction (10-55 min, 45 min)

### 🎯 Block Goals

- Define Order/OrderItem schemas (input vs output)
- Migrate Prisma with relations + indexes
- Implement `prisma.$transaction` for atomic create
- Server-side total calculation (security pattern)

### 💬 Lecture (~15 min)

**1. Why atomic transaction for order create** (5 min)

วาดบนกระดาน:

```
Order create involves:
  1. Validate products exist + active
  2. Calculate totals
  3. INSERT order
  4. INSERT order items (3-5 rows)

If step 3 succeeds but step 4 fails:
  ❌ Order with no items in DB (corrupt state)

Solution: Wrap all in transaction
  - All succeed → COMMIT
  - Any fail → ROLLBACK (no partial state)
```

```ts
await prisma.$transaction(async (tx) => {
  // ทุก query ใช้ tx แทน prisma
  const products = await tx.product.findMany({ ... });
  // ...
  const order = await tx.order.create({ ... });
});
```

📢 **Key**: "$transaction = isolation. ใน block นี้ atomic. Throw → rollback"

**2. Snapshot pattern** (4 min)

```
Today: Product Latte = 75 บาท
       Customer orders 2 Latte
       OrderItem: { productId, productName: "Latte",
                    qty: 2, unitPrice: 75, lineTotal: 150 }

Tomorrow: Admin changes Latte price to 80
       Old order still shows 75 (snapshot)
       Reports use snapshot, not current price
```

📢 **Key**: "Historical accuracy — past records ห้ามเปลี่ยน. Current price for new orders only"

**3. Server-side total calculation** (3 min)

```ts
// ❌ Bad: trust FE
await tx.order.create({
  data: {
    total: input.total,   // FE could lie
    ...
  }
});

// ✅ Good: server calculates
const total = items.reduce(
  (s, i) => s + i.qty * Number(productMap.get(i.productId)!.price),
  0,
);
```

📢 **Security**: "FE สามารถส่ง { total: 1 } แทน 215. Server ต้องคำนวณเอง"

**4. State machine for order status** (3 min)

```
PENDING ──► PREPARING ──► READY ──► COMPLETED
   │            │            │
   └────────────┴────────────┴──► CANCELLED

Invalid: COMPLETED → PREPARING (can't undo)
         PENDING → READY (skip step)

Pattern: VALID_TRANSITIONS map
  PENDING:    ['PREPARING', 'CANCELLED']
  PREPARING:  ['READY', 'CANCELLED']
  ...
```

### 🖥️ Live Demo (~30 min)

**1. Order schemas in shared** (Task 1.1-1.2 — 5 min)

(พิมพ์ตาม Plan)

📢 **Highlight**:

- `OrderItemSchema` = output (with id, all fields)
- `CreateOrderItemSchema` = input (just productId + qty)
- `CreateOrderSchema.items.min(1)` — must have ≥1 item

**2. Prisma migrate** (Task 1.3-1.5 — 5 min)

(พิมพ์ตาม Plan)

📢 **เน้น indexes**:

- `@@index([status])` — kitchen filter by status (faster)
- `@@index([createdAt])` — orderBy createdAt (faster)

```bash
cd apps/api
pnpm prisma migrate dev --name add_orders
```

ดู DBeaver — orders + order_items tables

**3. OrdersService — create method** (Task 2.1 — 12 min)

พิมพ์ทุกบรรทัดตาม Plan. Walkthrough:

```ts
return this.prisma.$transaction(async (tx) => {
  // 1. Fetch products (verify exist + active)
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
  });

  if (products.length !== productIds.length) {
    throw new BadRequestException('สินค้าบางรายการไม่พบ');
  }
  ...
});
```

📢 **อธิบายแต่ละ step**:

1. ดึง products → validate ทุกตัวมี + active
2. Map productId → product (สะดวก lookup)
3. คำนวณ items + subtotal **ฝั่ง server**
4. Generate orderNumber (random 5-char)
5. `tx.order.create` with `items: { create: [...] }` (nested write — atomic)

**4. OrdersController** (Task 2.2 — 5 min)

(พิมพ์ตาม Plan)

📢 **เน้น permissions**:

- `POST /orders` — ไม่มี guard (public — guest checkout)
- `GET /orders/:id` — ไม่มี guard (track via ID)
- `GET /orders` — STAFF/ADMIN
- `PATCH /orders/:id/status` — STAFF/ADMIN

**5. Test ใน Postman** (Task 2.4 — 3 min)

```bash
POST /api/orders {
  customerName: "สมชาย",
  customerPhone: "0812345678",
  items: [{ productId: "<latte-id>", qty: 2 }]
}
# → 201 + order with snapshot data

# Verify ใน DBeaver:
SELECT * FROM orders;
SELECT * FROM order_items;
```

Commit:

```bash
git commit -m "feat(api): add Orders module with atomic create"
```

### ❓ Common Questions (Block A)

| Q                                                         | A                                                                                                              |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `tx` กับ `this.prisma` ต่างกันไง?                         | `tx` คือ transaction client. ทุก query ใน callback ใช้ `tx` ไม่ใช่ `this.prisma` (กัน leak ออกจาก transaction) |
| Nested write `items: { create: [...] }` ทำงานยังไง?       | Prisma single insert ที่สร้าง parent + children ใน 1 query (atomic implicitly)                                 |
| ถ้า product ที่อยู่ใน DB ลบไปแล้ว — order เก่าทำงานยังไง? | OrderItem ใช้ `productName` snapshot — แต่ FK constraint `Restrict` ห้ามลบ. Soft delete = stretch              |
| State machine — ทำไมไม่ใช่ enum direct check?             | `VALID_TRANSITIONS` declarative + extensible. Add new state = update map                                       |

---

## 🧪 Block B: Tests + State Transitions (55-75 min, 20 min)

### 🎯 Block Goals

- Mock `$transaction` ใน Vitest
- Test state machine transitions
- Verify server-side total calculation

### 💬 Lecture (~5 min)

**Mocking $transaction** (5 min)

```ts
prisma = {
  $transaction: vi.fn((fn) => fn(tx)), // execute callback with mock tx
  // ...
};
```

📢 **Pattern**: `$transaction` mock = "run callback inline with tx mock". Tests กลายเป็น sync-ish

### 🖥️ Live Demo (~15 min)

**1. OrdersService.spec.ts** (Task 3.1 — 12 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough tests**:

- `throws BadRequest ถ้า product ไม่มี` — basic guard
- `throws BadRequest ถ้า inactive` — business rule
- `คำนวณ total ฝั่ง server` — verify with `expect.objectContaining`
- `state transition COMPLETED → PENDING throws` — state machine
- `PENDING → PREPARING ตั้ง paidAt` — side effect
- `READY → COMPLETED ตั้ง completedAt` — side effect
- `findOne throws NotFound` — basic

```bash
pnpm --filter @coffee/api test
# 17+ tests pass
```

Commit:

```bash
git commit -m "test(api): OrdersService tests for create + state transitions"
```

### ❓ Common Questions (Block B)

| Q                                  | A                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| ทำไม mock $transaction simple?     | เป้าหมาย unit test = test business logic, ไม่ใช่ DB. Real transaction tests = integration tests |
| Test ProductMap collisions?        | Service ดึงทุก product ครั้งเดียว → no N+1. ถ้าซ้ำ key, Map keeps last (acceptable behavior)    |
| Test orderNumber random collision? | Course skip — chance ต่ำมาก. Production: add unique constraint + retry                          |

---

## 🛒 Block C: Zustand Cart + Add to Cart UI (75-110 min, 35 min)

### 🎯 Block Goals

- Setup Zustand with persist middleware
- Build cart store with selectors
- Add "เพิ่มลงตะกร้า" button to MenuCard
- Update CartIcon to use real count

### 💬 Lecture (~10 min)

**1. Zustand vs Redux vs Context** (4 min)

```
Redux:               Context:              Zustand:
─────────────        ─────────────         ─────────────
Boilerplate heavy    Re-renders heavy      Minimal API
Reducer + actions    No selector           Selectors built-in
Time-travel debug    No persistence        Middleware ecosystem
                                            Easy hook usage
```

📢 **Why Zustand for cart**: small store, persist needed, simple API. Course choice = pragmatic

**2. Persist middleware** (3 min)

```ts
import { persist } from 'zustand/middleware';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      /* state + actions */
    }),
    { name: 'coffee-cart' }, // localStorage key
  ),
);
```

📢 **What it does**:

- Save state to localStorage on every update
- Hydrate from localStorage on app start
- SSR-safe (loaded after hydration)

**3. Selector pattern** (3 min)

```tsx
// ❌ Bad: subscribe to entire store
const cart = useCart();
return <p>{cart.items.length}</p>;

// ✅ Good: subscribe to specific value
const count = useCart((s) => s.totalQty());
return <p>{count}</p>;
```

> "Selector → component re-renders only when subscribed value changes. Performance"

### 🖥️ Live Demo (~25 min)

**1. Install + cart store** (Task 4.1-4.2 — 8 min)

```bash
cd apps/web
pnpm add zustand
```

(พิมพ์ store ตาม Plan)

📢 **เน้น add() consolidation**:

```ts
add: (product, qty = 1) => {
  const existing = get().items.find(...);
  if (existing) {
    // merge qty
  } else {
    // append
  }
}
```

> "Add ทำให้ duplicate productId รวมกัน — UX ที่ดี (กด Latte 2 ครั้ง = qty 2, ไม่ใช่ 2 entries)"

**2. CartIcon** (Task 4.3 — 3 min)

(พิมพ์ตาม Plan — short)

```tsx
const totalQty = useCart((s) => s.totalQty());

return (
  <Button asChild>
    <Link href="/cart">🛒 Cart ({totalQty})</Link>
  </Button>
);
```

📢 **เปลี่ยน**: useState (Week 1) → real store (Week 4). Click → navigate to `/cart`

**3. MenuCard with Add button** (Task 4.4 — 8 min)

(พิมพ์ตาม Plan)

📢 **เน้น `'use client'`**:

> "Week 1 MenuCard เป็น Server Component. ตอนนี้ต้องเป็น Client เพราะมี `onClick`. เปลี่ยน boundary"

**4. Test persistence** (Task 4.5 — 6 min)

1. Add 3 items
2. CartIcon updates: "Cart (3)"
3. Refresh page → "Cart (3)" คงเดิม ✓
4. DevTools → Application → Local Storage → `coffee-cart` มี items
5. Click Cart icon → navigate `/cart` → 404 OK (Session 2 จะสร้าง)

Commit:

```bash
git commit -m "feat(web): Zustand cart + add-to-cart UI"
```

### ❓ Common Questions (Block C)

| Q                                                  | A                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Zustand store ใน Server Component ได้ไหม?          | ไม่ได้ — Zustand = browser state. Server Component pure read DB. ใช้ใน Client Component เท่านั้น     |
| Persistence ตอน user login ใหม่ — cart ต้อง clear? | Course MVP: cart persist across logins (anonymous). Real apps: associate with user — clear on logout |
| Multiple tabs sync cart?                           | Default ไม่ sync. ใช้ Zustand `subscribeWithSelector` + `BroadcastChannel` API → stretch             |
| Cart price stale ถ้า admin เปลี่ยนราคา?            | Yes — cart snapshot price. Server validate ตอน checkout (re-fetch products) → recalculate            |

---

## 🏁 Wrap-up + Homework (110-120 min, 10 min)

### Recap (3 min)

- "atomic transaction ใช้เพื่ออะไรใน order create?"
- "Snapshot pattern แก้ปัญหาอะไร?"
- "Zustand selectors ดียังไง?"

### Homework (5 min)

📦 **Required** (~3 hrs)

1. **Polish cart UX**:
   - Empty cart state ("ตะกร้าว่าง" + button "ดูเมนู")
   - Add animation on +/- (Framer Motion or CSS transition)

2. **Pre-build Cart page** (preview Session 2 — Task 5):
   - `/cart` page using cart store
   - List items with qty controls
   - Show subtotal + button "ไปชำระเงิน" (link to /checkout, will 404 OK)

3. **Pre-build CheckoutForm skeleton** (Task 6):
   - File: `app/(storefront)/checkout/page.tsx`
   - Form: customerName + customerPhone (Zod validation)
   - Display order summary (from cart store)
   - **Don't wire mutation yet** — Session 2

📚 **Reading** (~30 min)

- [TanStack Query — refetchInterval](https://tanstack.com/query/latest/docs/react/reference/useQuery)
- [Zustand — Patterns](https://zustand.docs.pmnd.rs/getting-started/introduction)

### Q&A (2 min)

---

## 📝 Post-Session Self-Review (instructor)

| Item                                  | Note                |
| ------------------------------------- | ------------------- |
| Atomic transaction concept ติดที่ใคร? | \_\_\_              |
| State machine ติดไหม?                 | \_\_\_              |
| Zustand setup ทุกคนผ่าน?              | \_\_\_              |
| Block ไหน over-run?                   | \_\_\_              |
| Energy ห้องโดยรวม                     | low / medium / high |
