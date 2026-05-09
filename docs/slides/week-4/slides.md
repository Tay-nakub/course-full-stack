---
theme: seriph
title: 'Coffee Shop Course — Week 4'
info: |
  ## Week 4 — Order Flow + Cart + Kitchen
  Coffee Shop Full-Stack Course (6 weeks)
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: fade
mdc: true
fonts:
  sans: 'Inter, ui-sans-serif, system-ui'
  mono: 'JetBrains Mono, Fira Code, ui-monospace, monospace'
defaults:
  layout: default
---

# ☕ Coffee Shop Course

## Week 4 · Session 1

### Order Backend + Cart Store

<div class="muted mt-8 text-sm">
atomic transaction · state machine · Zustand persist
</div>

<!--
Welcome to Week 4. Week 3 = first slice. Week 4 = second slice + 1 new tool (transactions).
80% practice ของ pattern เดิม + 20% ของใหม่.
-->

---

## layout: center

# Where We Are

```text
Week 1: FE foundation         ✅
Week 2: BE foundation         ✅
Week 3: First slice (menu)    ✅
Week 4: Second slice (order)  ⬅ HERE
Week 5: Stock + reports
Week 6: Deploy
```

<div class="mt-8 text-center text-xl coffee">
Today = "use Week 3 patterns + 1 new (transactions)"
</div>

<div class="mt-4 muted text-center">80% practice · 20% new</div>

---

# Today's Goal

<div class="mt-6 text-lg">

จบ Session นี้:

<v-clicks>

- ✅ `Order` + `OrderItem` schemas + Prisma
- ✅ NestJS Orders module (atomic create + state transitions)
- ✅ <span class="coffee">17+ tests</span> passing
- ✅ Zustand cart store with `persist`
- ✅ "เพิ่มลงตะกร้า" UI working
- 🟡 Checkout + tracking + Kitchen <span class="muted">→ Session 2</span>

</v-clicks>

</div>

---

## layout: center

# Why Atomic Transaction

<div class="text-lg muted mb-4">Order create involves multiple inserts:</div>

```text
  1. INSERT Order
  2. INSERT OrderItem 1
  3. INSERT OrderItem 2
  4. INSERT OrderItem 3
```

<div class="mt-6 text-lg coffee">If step 3 fails:</div>

```text
  ❌ Order in DB but missing items (corrupt state)
```

<div class="mt-6 text-lg coffee">Solution: $transaction</div>

```ts
await prisma.$transaction(async (tx) => {
  await tx.product.findMany(...)
  await tx.order.create(...)
});
```

<div class="mt-2 muted text-center">All succeed → COMMIT · any fail → ROLLBACK</div>

---

# Snapshot Pattern

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Today

```text
Product Latte = 75 บาท

Customer orders 2 → OrderItem snapshot:
  { productName: "Latte",
    unitPrice: 75 }
```

</div>

<div>

### Tomorrow

```text
Admin changes Latte → 80 บาท

Old order STILL shows 75
(snapshot frozen)
```

</div>

</div>

<div class="mt-6 text-center">

- Reports: use snapshot <span class="muted">(historical accuracy)</span>
- New orders: use current price

</div>

<div class="mt-6 muted text-center text-sm">
Pattern in: <code>orderItem (price)</code> · <code>invoiceItem (price+tax)</code> · <code>AuditLog</code>
</div>

---

# Server-side Total Calculation

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ Bad — trust FE

```ts
await tx.order.create({
  data: { total: input.total },
  //               ↑ FE could lie
});
```

</div>

<div>

### ✅ Good — server calculates

```ts
const total = items.reduce((s, i) => s + i.qty * productMap.get(i.productId)!.price, 0);
```

</div>

</div>

<div class="mt-8 text-center text-xl coffee">
"Anything money-related → server calculates"
</div>

<div class="mt-4 muted text-center text-sm">
Customer can submit <code>{ total: 1 }</code> for ฿250 of coffee.<br>Server must compute & verify.
</div>

---

## layout: center

# State Machine for Order Status

```text
PENDING ──► PREPARING ──► READY ──► COMPLETED
   │            │            │
   └────────────┴────────────┴──► CANCELLED
```

```ts
const VALID_TRANSITIONS = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // terminal
  CANCELLED: [], // terminal
};
```

<div class="mt-4 muted text-center text-sm">
Invalid: COMPLETED → PREPARING · PENDING → READY · CANCELLED → anywhere
</div>

---

# Zustand vs Redux vs Context

<div class="grid grid-cols-3 gap-4 mt-4 text-sm">

<div>

### Redux

- Boilerplate
- Reducer + actions
- Time-travel
- Mature ecosystem

</div>

<div>

### Context

- Re-renders heavy
- No selectors
- No persistence
- Built into React

</div>

<div>

### Zustand <span class="coffee">←</span>

- Minimal API
- Selectors built-in
- `persist` middleware
- Easy hook usage

</div>

</div>

<div class="mt-8">

### Course = Zustand

- Cart = small store
- Persistence = required (cart survives refresh)
- Simple API = fast onboarding

</div>

---

# 📝 Homework + Recap

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Homework <span class="muted">(~3 hrs)</span>

**Polish cart UX:**

- [ ] Empty state
- [ ] Animations on +/-

**Pre-build pages** <span class="muted">(preview S2):</span>

- [ ] Cart page (using cart store)
- [ ] Checkout form skeleton (no mutation yet)

**Reading:**

- [ ] TanStack Query `refetchInterval`
- [ ] Zustand patterns

</div>

<div>

### 🎯 Recap quiz

<v-clicks>

1. Atomic transaction — for what?
2. Snapshot pattern — solves what?
3. Zustand selectors — why use?

</v-clicks>

</div>

</div>

---

## layout: cover

# ☕ Session 2

## Week 4 · Session 2

### Checkout + Tracking + Kitchen

<div class="muted mt-8 text-sm">Multi-actor flow goes LIVE</div>

---

## layout: center

# Today's Outcome — Multi-Actor

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Customer (incognito)

```text
/menu → cart → checkout
       ↓
/order/<id>
(tracking, polling 5s)
```

</div>

<div>

### Staff (regular browser)

```text
/kitchen (kanban)
[รับออเดอร์]
   ↓
[ทำเสร็จ]
   ↓
[ลูกค้ารับแล้ว]
```

</div>

</div>

<div class="mt-10 text-center text-xl coffee">
↑ Same DB. Both update each other in 5 sec.
</div>

---

# Mutation Flow

```text
User submits checkout form
   ↓
mutation.mutate(input)
   ↓
apiFetch POST /orders {
  customerName, customerPhone,
  items: [{ productId, qty }]   ← only what server needs
}
   ↓
NestJS $transaction
   ↓
Response: full order with snapshot
   ↓
onSuccess:
   - cart.clear()
   - router.push(/order/${id})
   ↓
Tracking page begins polling
```

---

# Don't Trust Client Snapshot

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Cart store has

```ts
{
  (productId,
    name,
    unitPrice, // ← stale risk
    imageUrl,
    qty);
}
```

</div>

<div>

### API request sends ONLY

```ts
{
  (productId, qty);
}
```

</div>

</div>

<div class="mt-6">

### Why NOT send `unitPrice`?

<v-clicks>

- Server has source of truth
- Client could be stale (admin changed price)
- Client could tamper (security)

</v-clicks>

</div>

<div class="mt-6 text-center coffee text-lg">
"Send IDs + intent, server fills in details"
</div>

---

# Smart Polling

```ts
useQuery({
  queryKey: ['order', id],
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (status === 'COMPLETED') return false;
    if (status === 'CANCELLED') return false;
    return 5000; // poll every 5 sec
  },
});
```

<div class="mt-6">

### Function form > static number

<v-clicks>

- Stop when terminal state
- Save server load
- Save battery (mobile)

</v-clicks>

</div>

---

# Polling vs WebSocket

<div class="text-sm mt-4">

|                 | Polling          | WebSocket         |
| --------------- | ---------------- | ----------------- |
| **Setup**       | Trivial          | Server + client   |
| **Latency**     | 5-10 sec         | Instant           |
| **Server load** | Higher (req/sec) | Lower (push)      |
| **Reliability** | Auto-reconnect   | Need handle drops |
| **Firewall**    | HTTP = OK        | Some block WS     |

</div>

<div class="mt-8 text-center">

### Course choice: <span class="coffee">Polling</span>

- 1-shop scale = sufficient
- Simpler debug
- Tier 2 stretch: switch to Socket.io

</div>

---

## layout: center

# Kitchen Kanban Layout

```text
┌─ รอชำระ (3) ────┬─ กำลังเตรียม (1) ─┬─ พร้อมรับ (2) ──┐
│                  │                    │                  │
│  Order A123      │  Order B456        │  Order C789      │
│  สมชาย           │  สมหญิง            │  สมศักดิ์        │
│  Latte × 2       │  Croissant × 1     │  Brownie × 3     │
│  ฿150            │  ฿65               │  ฿210            │
│  [รับออเดอร์]    │  [ทำเสร็จ]         │  [รับแล้ว]       │
│  [ยกเลิก]        │  [ยกเลิก]          │                  │
│                  │                    │                  │
│  Order A124      │                    │                  │
└──────────────────┴────────────────────┴──────────────────┘
```

<div class="mt-4 muted text-center">
Visual workflow → easy scan urgency · COMPLETED + CANCELLED hidden
</div>

---

# State Transition UI

```ts
const NEXT_STATUS = {
  PENDING: { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY', label: 'ทำเสร็จ' },
  READY: { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};
```

<div class="mt-6 grid grid-cols-2 gap-6">

<div>

### Each card

- ONE primary action
- Plus cancel <span class="muted">(PENDING/PREPARING only)</span>

</div>

<div>

### No "go back"

- Match physical kitchen workflow
- You don't un-prepare a coffee

</div>

</div>

---

# 🎉 Week 5 Preview ⭐

<div class="text-xl coffee mt-2">Inventory + Reports — "the point" of the course</div>

<div class="grid grid-cols-2 gap-8 mt-6">

<div>

### What's new

<v-clicks>

- 🆕 `Ingredient` + `Recipe` + `StockMovement`
- 🆕 Recipe CRUD UI (link product ↔ ingredient)
- 🆕 ⭐ order COMPLETED → atomic txn:<br>cogsSnapshot + stock deduct + log
- 🆕 Reports: revenue, COGS, gross profit
- 🆕 Recharts dashboard

</v-clicks>

</div>

<div>

### Real business value

- Cost visibility
- Profit visibility
- Stock visibility

<div class="mt-6 muted text-sm">
Real coffee shop owners ask:<br>
"วันนี้ขายได้เท่าไร?" · "กำไรเท่าไร?" · "เมล็ดเหลือเท่าไร?"<br>
Week 5 = make these answerable.
</div>

</div>

</div>

<style>
.coffee { color: #f5a623; font-weight: 600; }
.muted { color: #a6adc8; }
</style>
