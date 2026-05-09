# Week 4 Session 2 — Checkout, Tracking, Kitchen UI

**Week:** 4
**Session:** 2 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 4 Session 1 complete + homework (cart page + checkout skeleton)
**Covers:** Tasks 6-10 of [Week 4 Plan](../../superpowers/plans/2026-05-08-week-4-order-flow.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ Checkout page → place order via mutation → redirect to tracking
- ✅ Tracking page polls every 5 sec until terminal state
- ✅ Kitchen UI (kanban) shows active orders + status transitions work
- ✅ Admin orders view (read-only with filter)
- ✅ End-to-end: customer place → kitchen advance → tracking auto-update

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify Session 1 deliverables (Orders backend + Zustand cart)
- [ ] เปิด 2 browser windows (customer incognito + staff regular)
- [ ] DBeaver inspect orders tabs ready
- [ ] DevTools Network tab open (ดู polling)

---

## 🗓️ Time-Blocked Agenda

| Time        | Block                       | Activity                                 |
| ----------- | --------------------------- | ---------------------------------------- |
| 0-10        | **Recap + Homework Review** | Cart skeleton showcase                   |
| **10-45**   | **Block D**                 | **Checkout flow + place order mutation** |
| **45-65**   | **Block E**                 | **Order tracking with smart polling**    |
| **65-105**  | **Block F**                 | **Kitchen UI (kanban + transitions)**    |
| **105-115** | **Block G**                 | **Admin orders view**                    |
| 115-120     | Wrap-up                     | Week 5 preview                           |

---

## 🟢 Recap + Homework Review (0-10 min)

### Recap (2 min)

- "Prisma `$transaction` ใช้เพื่ออะไร?"
- "Snapshot pattern แก้ปัญหาอะไร?"

### Homework Showcase (8 min)

Show 1-2 student PR — common items:

- Cart page UX (empty state, qty controls)
- Subtotal calculation correct?
- Checkout skeleton form

📢 **Common discussion**: "ใครทำ animation? — Framer Motion vs Tailwind transition"

---

## 💳 Block D: Checkout Flow (10-45 min, 35 min)

### 🎯 Block Goals

- Wire CheckoutForm to mutation
- Place order → clear cart → redirect
- Handle server errors gracefully

### 💬 Lecture (~10 min)

**1. Mutation flow** (5 min)

```
User submits form
   ↓
mutation.mutate(input)
   ↓
apiFetch POST /orders { customerName, phone, items: [...] }
   ↓
NestJS: $transaction → create order + items
   ↓
Response: order with ID
   ↓
onSuccess:
   - clear cart
   - router.push(`/order/${order.id}`)
   ↓
Tracking page (Session 2 Block E)
```

**2. Mapping cart store → API input** (5 min)

```ts
// Cart store has: { productId, name, unitPrice, imageUrl, qty }
// API expects:    { items: [{ productId, qty }] }

const apiItems = cartItems.map((i) => ({
  productId: i.productId,
  qty: i.qty,
}));

// Discard local snapshot — let server re-snapshot
```

📢 **Why send only productId + qty?** "Server มี source of truth ของ price + name. Don't trust client snapshot — could be stale or tampered"

### 🖥️ Live Demo (~25 min)

**1. Checkout form schema + validation** (Task 6.1 — 8 min)

```ts
const CheckoutSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(9),
});
```

📢 **เน้นทำไมแยก schema**: "CheckoutSchema = subset (just customer fields). FE collect แค่ 2 fields. Items มาจาก cart store"

(พิมพ์ form structure — RHF + Zod, two inputs)

**2. Place order mutation** (Task 6.1 — 7 min)

```ts
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
```

📢 **อธิบาย onSuccess**:

1. `clear()` — empty cart store (persist update → localStorage)
2. `router.push` — navigate to tracking
3. ถ้า fail → mutation.error → display banner

**3. Order summary display** (Task 6.1 — 5 min)

(แสดงตาม Plan — sticky right column)

**4. Test end-to-end** (5 min)

1. เปิด /menu (incognito) → add 3 items
2. /cart → +/- qty
3. /checkout → กรอก ชื่อ "สมชาย" เบอร์ "0812345678" → ยืนยัน
4. **เห็น mutation ใน Network tab** → POST /api/orders → 201
5. Cart cleared ✓
6. Redirect to /order/<id> (404 OK — Block E จะสร้าง)
7. ตรวจ DBeaver: orders + order_items มี row ใหม่

Commit:

```bash
git commit -m "feat(web): checkout flow with place order mutation"
```

### ❓ Common Questions (Block D)

| Q                                                        | A                                                                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Cart cleared แต่ user back-button — เห็น checkout เปล่า? | ใช่ — UX issue. Solution: keep cart in sessionStorage until tracking page mounted (stretch) |
| Server error 400 (invalid item) → user งง?               | mutation.error → display Thai message. Could improve: highlight specific item               |
| Inventory check at checkout?                             | Course Week 4 = no stock check. Week 5 จะ deduct stock ตอน COMPLETED — separate concern     |

---

## 📡 Block E: Order Tracking with Polling (45-65 min, 20 min)

### 🎯 Block Goals

- Customer-facing order detail page
- TanStack Query smart polling (`refetchInterval`)
- Stop polling when terminal state

### 💬 Lecture (~5 min)

**Smart polling pattern** (5 min)

```ts
useQuery({
  queryKey: ['order', id],
  queryFn: () => fetch(...),
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (status === 'COMPLETED' || status === 'CANCELLED') return false;
    return 5000;
  },
});
```

📢 **Why function form**:

- Static `refetchInterval: 5000` = poll forever (waste)
- Function form = decide based on current data
- Return `false` → stop polling

**Trade-offs**:

- Polling = simple, works offline-friendly
- WebSocket = realtime but complex setup
- Course choice: polling (sufficient for 1-shop scale)

### 🖥️ Live Demo (~15 min)

**1. OrderStatusBadge component** (Task 7.1 — 5 min)

(พิมพ์ตาม Plan)

📢 **เน้น mapping**:

```ts
const LABELS: Record<OrderStatus, string> = {
  PENDING: 'รอชำระ',
  PREPARING: 'กำลังเตรียม',
  ...
};
```

> "Centralize labels + colors. Reuse Kitchen UI + Admin"

**2. Tracking page** (Task 7.2 — 8 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough**:

- `use(params)` — Next.js 15 unwrap async params
- `refetchInterval` callback — return false on terminal
- Polling indicator at bottom (transparent UX)

**3. Test polling** (2 min)

1. หลัง place order → มาที่ tracking page
2. เปิด DevTools Network → ดู GET /api/orders/<id> ทุก 5 sec
3. ใน Postman / DBeaver: UPDATE orders SET status='PREPARING'
4. รอ 5 sec — page auto-refresh
5. PATCH ผ่าน status → ดูว่า badge เปลี่ยน
6. PATCH → COMPLETED — polling หยุด (Network tab confirm)

Commit:

```bash
git commit -m "feat(web): tracking page with smart polling"
```

### ❓ Common Questions (Block E)

| Q                                 | A                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `query.state.data` มี types ไหม?  | ใช่ — TanStack Query infers จาก queryFn return                                                 |
| Polling เพิ่ม load ที่ DB?        | 1 query ต่อ 5 sec = ~17 req/min/order. Small scale OK. Optimize: cache headers + Last-Modified |
| Stop polling ถ้า user switch tab? | TanStack default: pause when window blurred. ใช้ `refetchOnWindowFocus` config                 |

---

## 🍳 Block F: Kitchen UI (65-105 min, 40 min)

### 🎯 Block Goals

- New `(kitchen)` route group with auth middleware
- Kanban board: 3 columns (Pending / Preparing / Ready)
- OrderCard with status transition mutations
- Polling for new orders

### 💬 Lecture (~8 min)

**1. Kanban pattern** (4 min)

```
┌─ รอชำระ ────┬─ กำลังเตรียม ─┬─ พร้อมรับ ──┐
│ Order A123  │ Order B456    │ Order C789  │
│ [รับออเดอร์]│ [ทำเสร็จ]      │ [รับแล้ว]   │
│             │               │             │
│ Order A124  │               │             │
└─────────────┴───────────────┴─────────────┘
```

📢 **Why kanban**: Visual, matches kitchen workflow, easy to scan urgency

**2. State transition UI pattern** (4 min)

```ts
const NEXT_STATUS = {
  PENDING: { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY', label: 'ทำเสร็จ' },
  READY: { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};
```

> "Each status → exactly 1 forward action. Plus cancel option"

### 🖥️ Live Demo (~32 min)

**1. Kitchen layout** (Task 8.1-8.2 — 5 min)

(พิมพ์ middleware update + layout — short)

📢 **เน้น middleware matcher**:

```ts
matcher: ['/admin/:path*', '/kitchen/:path*'],
```

> "Same middleware ใช้ทั้ง admin + kitchen. Both need auth, both go to /login if no token"

**2. OrderCard component** (Task 9.1 — 10 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough mutations**:

```ts
const advance = useMutation({
  mutationFn: (next) => apiFetch(...),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
});

const cancel = useMutation({
  mutationFn: () => apiFetch(... { status: 'CANCELLED' } ...),
  onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
});
```

> "2 mutations, both invalidate same key → list refetch"

**3. Kitchen page** (Task 9.2 — 10 min)

(พิมพ์ตาม Plan)

📢 **เน้น polling**:

```ts
useQuery({
  queryKey: ['orders', { activeOnly: true }],
  queryFn: () => apiFetch(...),
  refetchInterval: 5000,
});
```

> "Static 5sec polling. ไม่ stop เพราะ kitchen always active"

**4. Group by status — Column component** (5 min)

(พิมพ์ตาม Plan — kanban layout)

**5. End-to-end test** (2 min)

Setup: 2 browser windows

- Customer (incognito): place order
- Staff: /kitchen

1. Place order → ดู Kitchen "รอชำระ" column ภายใน 5 sec
2. กด "รับออเดอร์" → ย้ายไป "กำลังเตรียม"
3. กด "ทำเสร็จ" → "พร้อมรับ"
4. กด "ลูกค้ารับแล้ว" → หาย (active only)
5. ขณะเดียวกัน — customer tracking page เห็น status update ทุก 5 sec

📢 **Big moment**:

> "🎉 First multi-actor flow! Customer + Staff working with shared state via DB"

Commit:

```bash
git commit -m "feat(web): Kitchen UI kanban with status transitions"
```

### ❓ Common Questions (Block F)

| Q                                                  | A                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Kitchen UI ใช้ websocket แทน polling ได้ไหม?       | ได้ — Tier 2 stretch (Socket.io). Polling 5 sec = sufficient for course                                 |
| 2 staff คลิก same order พร้อมกัน — race condition? | NestJS state machine block invalid transition (409). Whoever loses sees error. Stretch: optimistic lock |
| Order ที่ pending ค้างนาน — alert?                 | Stretch: highlight ถ้า PENDING > 5 min (visual aging)                                                   |
| Ringtone notification เมื่อ order ใหม่?            | Stretch — `<audio>` element + diff detection (new id ใน list)                                           |

---

## 📊 Block G: Admin Orders View (105-115 min, 10 min)

### 🎯 Block Goals

- Read-only admin view of all orders
- Status filter

### 🖥️ Live Demo (~10 min)

**1. Admin orders page** (Task 10.1 — 8 min)

(พิมพ์ตาม Plan)

📢 **Highlights**:

- Filter buttons (ALL / per status)
- Polling slower (10s — admin = monitor, not realtime)
- Read-only (no mutation buttons)

**2. Test** (2 min)

1. Login admin → /admin/orders
2. Filter "ALL" → ทุก orders
3. Filter "COMPLETED" → only completed
4. ตรวจ time formatted ภาษาไทย

Commit:

```bash
git commit -m "feat(web): admin orders view with status filter"
```

---

## 🏁 Wrap-up + Week 5 Preview (115-120 min, 5 min)

### Recap (2 min)

- "Smart polling — function form ทำอะไร?"
- "Kanban UI ในห้องครัว — ทำไม visual?"

### Week 5 Preview (3 min)

Goal: **Heart of business logic** — Recipe + Stock auto-deduct + Reports

จะเพิ่ม:

- 🆕 Ingredient + Recipe + StockMovement (Prisma + schemas)
- 🆕 Recipe CRUD UI
- 🆕 Critical: order COMPLETED → atomic transaction → cogsSnapshot + stock deduct + log movement
- 🆕 Reports endpoint: revenue, COGS, gross profit, top 5
- 🆕 Reports dashboard with Recharts

ใช้:

- ✅ Atomic transaction (Wk 4)
- ✅ NestJS module pattern
- ✅ TanStack Query
- ✅ Admin layout

> "Week 5 = the **point** of the coffee shop course. Stock + cost + profit = real business value"

### Final Q&A

รับคำถาม

---

## 📝 Post-Session Self-Review (instructor)

| Item                             | Note   |
| -------------------------------- | ------ |
| End-to-end demo สำเร็จทุกคน?     | \_\_\_ |
| Polling concept ติดที่ใคร?       | \_\_\_ |
| Kitchen kanban — UI build จบไหม? | \_\_\_ |
| Block ไหน over-run?              | \_\_\_ |
| Pre-Week 5 readiness             | \_\_\_ |
