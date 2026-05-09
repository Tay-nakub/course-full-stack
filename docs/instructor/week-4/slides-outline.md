# Week 4 — Slides Outline

**Audience:** instructor

**Total slides target:** ~18 slides

---

## 🎬 Session 1 Slides (9 slides) — Backend Orders + Cart

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 4 · Session 1             │
│       Order Backend + Cart Store     │
│                                      │
│ atomic transaction + state machine + │
│        Zustand persist               │
└──────────────────────────────────────┘
```

### Slide 1.02 — Where We Are

```
Week 1: FE foundation         ✅
Week 2: BE foundation         ✅
Week 3: First slice (menu)    ✅
Week 4: Second slice (order)  ⬅ HERE
Week 5: Stock + reports
Week 6: Deploy

  Today = "use Week 3 patterns + 1 new (transactions)"
  80% practice, 20% new
```

### Slide 1.03 — Today's Goal

```
จบ Session นี้:

✓ Order + OrderItem schemas + Prisma
✓ NestJS Orders module (atomic create + state transitions)
✓ 17+ tests passing
✓ Zustand cart store with persist
✓ "เพิ่มลงตะกร้า" UI working
🟡 Checkout + tracking + Kitchen → Session 2
```

### Slide 1.04 — Why Atomic Transaction

```
Order create involves multiple inserts:

  1. INSERT Order
  2. INSERT OrderItem 1
  3. INSERT OrderItem 2
  4. INSERT OrderItem 3

If step 3 fails:
  ❌ Order in DB but missing items (corrupt state)

Solution: $transaction
  - All succeed → COMMIT
  - Any fail → ROLLBACK
  - No partial state ever visible

  await prisma.$transaction(async (tx) => {
    await tx.product.findMany(...)
    await tx.order.create(...)
  });
```

### Slide 2.05 — Snapshot Pattern

```
Today:
  Product Latte = 75 บาท
  Customer orders 2 → OrderItem snapshot:
    { productName: "Latte", unitPrice: 75 }

Tomorrow:
  Admin changes Latte price → 80 บาท
  Old order STILL shows 75 (snapshot frozen)

  Reports: use snapshot (historical accuracy)
  New orders: use current price

  Pattern in: orderItem (price), invoiceItem (price+tax),
  AuditLog (state at time)
```

### Slide 1.06 — Server-side Total Calculation

```
❌ Bad — trust FE:
  await tx.order.create({
    data: { total: input.total }  ← FE could lie
  });

✅ Good — server calculates:
  const total = items.reduce(
    (s, i) => s + i.qty * productMap.get(i.productId)!.price,
    0
  );

  Security rule:
  "Anything money-related → server calculates"
  Customer can submit { total: 1 } for ฿250 of coffee
  Server must compute & verify
```

### Slide 1.07 — State Machine for Order Status

```
PENDING ──► PREPARING ──► READY ──► COMPLETED
   │            │            │
   └────────────┴────────────┴──► CANCELLED

Invalid transitions:
  COMPLETED → PREPARING  (can't undo done work)
  PENDING → READY        (skip steps)
  CANCELLED → anywhere   (terminal)

Code:
  const VALID_TRANSITIONS = {
    PENDING:    ['PREPARING', 'CANCELLED'],
    PREPARING:  ['READY', 'CANCELLED'],
    READY:      ['COMPLETED', 'CANCELLED'],
    COMPLETED:  [],   // terminal
    CANCELLED:  [],   // terminal
  };
```

### Slide 1.08 — Zustand vs Redux vs Context

```
Redux              Context             Zustand
──────────────     ────────────────    ────────────────
Boilerplate        Re-renders heavy    Minimal API
Reducer + actions  No selectors        Selectors built-in
Time-travel        No persistence      persist middleware
                                        Easy hook usage

Course = Zustand
  - Cart = small store
  - Persistence = required (cart survives refresh)
  - Simple API = fast onboarding
```

### Slide 1.09 — Wrap + Homework

```
📝 HOMEWORK (~3 hrs)

Polish cart UX:
□ Empty state
□ Animations on +/-

Pre-build pages (preview Session 2):
□ Cart page (using cart store)
□ Checkout form skeleton (no mutation yet)

Reading:
□ TanStack Query refetchInterval
□ Zustand patterns

─── 🎯 RECAP ───────────────────
1. Atomic transaction — for what?
2. Snapshot pattern — solves what?
3. Zustand selectors — why use?
```

---

## 🎬 Session 2 Slides (9 slides) — Checkout, Tracking, Kitchen

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 4 · Session 2             │
│       Checkout + Tracking + Kitchen  │
│                                      │
│       Multi-actor flow goes LIVE     │
└──────────────────────────────────────┘
```

### Slide 2.02 — Today's Outcome

```
End state — multi-actor flow:

  Customer (incognito):
    /menu → cart → checkout
        ↓
    /order/<id> (tracking, polling 5s)

  Staff (regular browser):
    /kitchen (kanban)
    [รับออเดอร์] → [ทำเสร็จ] → [ลูกค้ารับแล้ว]

  ↑ Same DB. Both update each other in 5 sec.
```

### Slide 2.03 — Mutation Flow

```
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

### Slide 2.04 — Don't Trust Client Snapshot

```
Cart store has:
  { productId, name, unitPrice, imageUrl, qty }

API request sends ONLY:
  { productId, qty }

Why NOT send unitPrice?
  - Server has source of truth
  - Client could be stale (admin changed price)
  - Client could tamper (security)

Pattern:
  "Send IDs + intent, server fills in details"
```

### Slide 2.05 — Smart Polling

```
useQuery({
  queryKey: ['order', id],
  refetchInterval: (query) => {
    const status = query.state.data?.status;
    if (status === 'COMPLETED') return false;
    if (status === 'CANCELLED') return false;
    return 5000;     // poll every 5 sec
  },
});

  Function form > static number:
  - Stop when terminal state
  - Save server load
  - Save battery (mobile)
```

### Slide 2.06 — Polling vs WebSocket

```
                  Polling           WebSocket
                  ────────────      ───────────────
Setup             Trivial           Server + client
Latency           5-10 sec          Instant
Server load       Higher (req/sec)  Lower (push)
Reliability       Auto-reconnect    Need handle drops
Firewall          HTTP = OK         Some block WS

Course choice: Polling
  - 1-shop scale = sufficient
  - Simpler debug
  - Tier 2 stretch: switch to Socket.io
```

### Slide 2.07 — Kitchen Kanban Layout

```
┌─ รอชำระ (3) ────┬─ กำลังเตรียม (1) ─┬─ พร้อมรับ (2) ──┐
│                  │                    │                  │
│  Order A123     │  Order B456        │  Order C789     │
│  สมชาย          │  สมหญิง            │  สมศักดิ์        │
│  Latte × 2      │  Croissant × 1     │  Brownie × 3    │
│  ฿150           │  ฿65               │  ฿210           │
│  [รับออเดอร์]    │  [ทำเสร็จ]          │  [รับแล้ว]       │
│  [ยกเลิก]       │  [ยกเลิก]          │                  │
│                  │                    │                  │
│  Order A124     │                    │                  │
│  ...            │                    │                  │
└──────────────────┴────────────────────┴──────────────────┘

  Visual workflow → easy scan urgency
  COMPLETED + CANCELLED hidden (active only)
```

### Slide 2.08 — State Transition UI

```
const NEXT_STATUS = {
  PENDING:   { next: 'PREPARING', label: 'รับออเดอร์' },
  PREPARING: { next: 'READY',     label: 'ทำเสร็จ' },
  READY:     { next: 'COMPLETED', label: 'ลูกค้ารับแล้ว' },
};

  Each card shows ONE primary action
  Plus cancel option (PENDING/PREPARING only)

  No "go back" button — match physical kitchen workflow
  (you don't un-prepare a coffee)
```

### Slide 2.09 — Wrap + Week 5 Preview

```
🎉 Multi-actor end-to-end works!

Week 5 — Inventory + Reports ⭐
─────────────────────────────────
🆕 Ingredient + Recipe + StockMovement
🆕 Recipe CRUD UI (link product ↔ ingredient)
🆕 CRITICAL: order COMPLETED →
     atomic transaction →
       cogsSnapshot + stock deduct + log
🆕 Reports: revenue, COGS, gross profit
🆕 Recharts dashboard

  Week 5 = "the point" of the course
  Real business value: cost + profit visibility
```

---

## 🛠️ Build Notes (instructor)

### Visual Aids Critical for Week 4

- **2 browser windows side by side** during demo (customer + staff)
- **DevTools Network tab** showing polling requests
- **Real-time updates visible** — when staff clicks button, customer page updates within 5 sec

### Live Coding Tips

- Block A (atomic transaction): pause และเชิงให้ student เขียน VALID_TRANSITIONS table ใน notebook ตัวเอง
- Block F (Kitchen): split tasks — instructor ทำ KitchenPage, student ทำ OrderCard parallel (15 min)
