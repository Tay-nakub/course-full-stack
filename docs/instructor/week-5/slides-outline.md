# Week 5 — Slides Outline

**Audience:** instructor

**Total slides target:** ~20 slides

---

## 🎬 Session 1 Slides (10 slides) — Atomic Stock Deduct ⭐

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 5 · Session 1             │
│       Inventory + Stock Deduct ⭐    │
│                                      │
│       Atomic transaction across      │
│       4 tables = THE point           │
└──────────────────────────────────────┘
```

### Slide 1.02 — The Big Idea

```
Real coffee shop owners ask:

  💰 วันนี้ขายได้เท่าไร?
  💸 ต้นทุนเท่าไร?
  📈 กำไรเท่าไร?
  🥤 เมล็ดกาแฟเหลือเท่าไร?
  📊 ขายดีอันดับ 1?

Week 5 = make these answerable
```

### Slide 1.03 — Today's Goal

```
Build:

✓ Ingredient + StockMovement + RecipeItem schemas
✓ Ingredients CRUD (admin)
✓ Stock movements (PURCHASE/WASTE/ADJUSTMENT)
✓ Recipe (Product ↔ Ingredient)
✓ ⭐ Order COMPLETED → atomic
   stock deduct + COGS snapshot
🟡 Reports + UI → Session 2
```

### Slide 1.04 — Event-Sourced Inventory

```
        Source of Truth
        ┌─────────────────┐
        │ stock_movements │ ← every change logged
        │ + 1000 PURCHASE │
        │ -   36 SALE     │
        │ -   50 WASTE    │
        └────────┬────────┘
                 │
              SUM
                 │
                 ▼
        ┌─────────────────┐
        │  ingredients    │ ← cached
        │ currentStock=914│
        └─────────────────┘

  Truth: SUM(quantity)
  Cache: read-fast denormalized
  Recompute possible if cache drift
```

### Slide 1.05 — Decimal Precision

```
JS Float:
  0.1 + 0.2 = 0.30000000000000004 ❌

For money & stock:
  - Drift over thousands of operations
  - ฿0.05 × 1000 orders = visible discrepancy

Prisma Decimal:
  @db.Decimal(precision, scale)

  Decimal(10, 2) = max 99,999,999.99    (money)
  Decimal(10, 4) = max 999,999.9999     (cost/g)
  Decimal(12, 4) = max 99,999,999.9999  (large stock)

  Stored exact in Postgres
  Returned as string in JS — Number() at boundary
```

### Slide 1.06 — Recipe Whole-Replace

```
❌ Diff approach:
   - Compare old recipe vs new
   - Compute add/remove/update
   - Execute each → many queries
   → complex + bug-prone

✅ Whole-replace:
   $transaction:
     1. DELETE all items for product
     2. CREATE new items
   → simple, idempotent, atomic

Trade-off:
   - lose granular audit (which item changed)
   - acceptable for course MVP

HTTP semantic:
   PUT /recipes/product/:id
   (replace entire resource)
```

### Slide 1.07 — Atomic Transaction (4 tables)

```
Order: READY → COMPLETED triggers:

  ┌──────────────────────────────────┐
  │ For each OrderItem:              │
  │   1. Find product recipe          │
  │   2. Calc COGS:                   │
  │      sum(qty × cost)             │
  │   3. UPDATE order_items           │
  │      SET cogs_snapshot           │
  │   4. For each ingredient:         │
  │      a. INSERT stock_movements    │
  │         (-qty, SALE)             │
  │      b. UPDATE ingredients        │
  │         current_stock -= qty     │
  └──────────────────────────────────┘
                │
                ▼
  UPDATE orders SET status, completed_at
                │
                ▼
       COMMIT (or ROLLBACK on error)
```

### Slide 1.08 — Concrete Example

```
Order: 2 Latte
Recipe: 18g coffee + 200ml milk
Costs: ฿0.8/g coffee, ฿0.05/ml milk

Per Latte:
  COGS = 18 × 0.8 + 200 × 0.05
       = 14.4 + 10
       = 24.4

Order COGS = 24.4 × 2 = 48.8

Stock movements:
  - coffee: -36g (18 × 2)
  - milk:  -400ml (200 × 2)

After transaction:
  order_items.cogs_snapshot = 48.8
  ingredients (coffee).current_stock -= 36
  ingredients (milk).current_stock -= 400
  + 2 new stock_movement rows
```

### Slide 1.09 — Recipe Missing — Graceful

```
Some products may lack recipe:
  - Admin forgot
  - "ค่าเข้า" item (no ingredients)
  - Test product

Two strategies:
  ❌ throw → order stuck at READY
     - Customer can't get receipt
     - Staff blocked

  ✅ log warning + cogsSnapshot=0
     - Order completes (UX)
     - Admin sees log → fixes recipe
     - cogsSnapshot=0 visible in reports
       → flag for fix later

  → graceful degradation > strict
```

### Slide 1.10 — Wrap + Homework

```
📝 HOMEWORK (~3 hrs)

Setup full data:
□ 5+ ingredients (coffee, milk, sugar, cup, ...)
□ PURCHASE initial stock
□ Set recipes for all products

Stress test:
□ Place + complete 5+ orders
□ Verify stock matches manual calc
□ Inspect stock_movements

Pre-build (preview Session 2):
□ /admin/inventory page skeleton

─── 🎯 RECAP ───────────────────
1. Atomic transaction COMPLETED — กี่ tables?
2. Recipe missing — handle ยังไง?
3. currentStock = source of truth?
```

---

## 🎬 Session 2 Slides (10 slides) — Reports + UI

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 5 · Session 2             │
│       Reports Backend + Dashboard    │
│                                      │
│       Make the data VISIBLE          │
└──────────────────────────────────────┘
```

### Slide 2.02 — Today's Outcome

```
End state:

  /admin/inventory:
    Ingredients list + stock entry

  /admin/menu:
    "สูตร" button per product → editor

  /admin/reports:
    KPI cards (revenue, cogs, profit, margin)
    7-day chart (revenue + cogs + profit)
    Top 5 products
    Low stock alerts

  + seed script for fresh dev
```

### Slide 2.03 — Aggregation Strategies

```
Need 4 different aggregations:

1. Daily summary (single row)
   → fetch + JS reduce

2. Top products (group)
   → Prisma groupBy
   → orderBy _sum desc

3. Low stock (filter)
   → fetch all + JS filter
   → Postgres comparison fine too

4. Revenue chart (time series)
   → date_trunc('day') needs SQL
   → use $queryRaw
```

### Slide 2.04 — Prisma groupBy

```ts
const grouped = await prisma.orderItem.groupBy({
  by: ['productId', 'productName'],
  where: {
    order: {
      status: 'COMPLETED',
      completedAt: { gte: since },
    },
  },
  _sum: {
    qty: true,
    lineTotal: true,
  },
  orderBy: {
    _sum: { qty: 'desc' },
  },
  take: 5,
});

  → SQL: SELECT product_id, product_name,
            SUM(qty), SUM(line_total)
         FROM order_items
         WHERE ... GROUP BY product_id, product_name
         ORDER BY SUM(qty) DESC
         LIMIT 5;
```

### Slide 2.05 — $queryRaw for Date Truncation

```ts
const rows = await prisma.$queryRaw<DayRow[]>`
  SELECT
    TO_CHAR(date_trunc('day', completed_at),
            'YYYY-MM-DD') as date,
    SUM(total)::float as revenue,
    SUM((SELECT SUM(cogs_snapshot)
         FROM order_items
         WHERE order_id = orders.id))::float as cogs
  FROM orders
  WHERE status = 'COMPLETED'
    AND completed_at >= ${since}
  GROUP BY date_trunc('day', completed_at)
  ORDER BY date ASC
`;

  ✅ ${since} = parameterized (Prisma escapes)
  ❌ '+date+' = SQL injection
```

### Slide 2.06 — Recharts Pattern

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="revenue"
          stroke="#2563eb" name="รายได้" />
    <Line type="monotone" dataKey="cogs"
          stroke="#ea580c" name="ต้นทุน" />
    <Line type="monotone" dataKey="grossProfit"
          stroke="#16a34a" name="กำไร" />
  </LineChart>
</ResponsiveContainer>

  ResponsiveContainer = adapt to parent
  dataKey = field name in data array
  Multiple Lines = overlay metrics
```

### Slide 2.07 — Stock Movement UX (Auto-sign)

```
User UX: enter positive number always
Reason → server signs

PURCHASE: + (add stock)
WASTE:    - (remove stock)
ADJUSTMENT: any (admin chooses)
SALE:     - (auto from order completion)

In form:
  reason="PURCHASE", quantity=1000
  → server: +1000 ✓

  reason="WASTE", quantity=50
  → server: -50

Code:
  const signed = reason === 'PURCHASE'
    ? Math.abs(qty)
    : reason === 'WASTE'
    ? -Math.abs(qty)
    : qty;
```

### Slide 2.08 — KPI Card Design

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ รายได้วันนี้ │ │ ต้นทุนวันนี้ │ │ กำไรขั้นต้น │
│   ฿1,250    │ │    ฿450     │ │    ฿800     │
│ (blue bg)   │ │ (orange bg) │ │ (green bg)  │
└─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│ อัตรากำไร   │ │ จำนวนออเดอร์│
│    64%      │ │     12      │
│ (green ≥50%)│ │ (gray)      │
└─────────────┘ └─────────────┘

Color signals health:
  Margin ≥ 50% = green
  Margin < 50% = yellow (alert)
  Always negative = red (problem)
```

### Slide 2.09 — Seed Script

```ts
// prisma/seed.ts
async function main() {
  // Idempotent upsert
  await prisma.user.upsert({
    where: { email: 'admin@coffee.com' },
    update: {},
    create: { email, password: hash, role: 'ADMIN' },
  });

  // ... ingredients, products, recipes
  // ... initial PURCHASE stock movements
}

// Trigger:
//   pnpm prisma db seed
//   (auto on `prisma migrate reset`)

Use cases:
  - Fresh dev environment
  - CI/CD test data
  - Demo setup
  - Onboarding new dev
```

### Slide 2.10 — Wrap + Week 6 Preview

```
🎉 Coffee shop is now MEASURABLE

Week 6 — DEPLOY 🚀
─────────────────────────────────
🆕 Provision Hetzner VPS
🆕 SSH hardening + ufw + fail2ban
🆕 Multi-stage Dockerfiles
🆕 Caddy auto-HTTPS reverse proxy
🆕 GitHub Actions CI/CD
🆕 pg_dump backup cron

Pre-class:
□ Verify Docker Desktop running
□ Have a domain ready (or buy one)
□ Have credit card for VPS (~€4.5/mo)

  Final week: ขึ้น production!
```

---

## 🛠️ Build Notes

### Critical Visual Aids

- **DBeaver multi-tab open**: orders, order_items, ingredients, stock_movements (Session 1)
- **Whiteboard atomic transaction diagram** — pre-drawn, refer to ทุก demo
- **Postman collection ready** with all endpoints

### Live Coding Tips

- Block C ⭐ (atomic stock deduct) is the densest 40 min — pause frequently
- Block F (Recharts) — use first chart as live demo, others = student build
