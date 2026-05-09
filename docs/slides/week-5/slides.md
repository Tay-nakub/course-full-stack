---
theme: seriph
title: 'Coffee Shop Course — Week 5'
info: |
  ## Week 5 ⭐ — Inventory + Atomic Stock Deduct + Reports
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

## Week 5 · Session 1

### Inventory + Stock Deduct ⭐

<div class="muted mt-8 text-sm">
Atomic transaction across <span class="coffee">4 tables</span> = THE point
</div>

<!--
Week 5 = centerpiece. Atomic transaction across 4 tables.
ถ้าคนฟังเข้าใจ block นี้ครบ — เขา 'get' real-world business logic แล้ว.
-->

---

## layout: center

# The Big Idea

<div class="text-lg muted mb-6">Real coffee shop owners ask:</div>

<div class="text-2xl space-y-3">

- 💰 วันนี้ขายได้เท่าไร?
- 💸 ต้นทุนเท่าไร?
- 📈 กำไรเท่าไร?
- 🥤 เมล็ดกาแฟเหลือเท่าไร?
- 📊 ขายดีอันดับ 1?

</div>

<div class="mt-10 text-center text-xl coffee">
Week 5 = make these answerable
</div>

---

# Today's Goal

<div class="mt-6 text-lg">

Build:

<v-clicks>

- ✅ `Ingredient` + `StockMovement` + `RecipeItem` schemas
- ✅ Ingredients CRUD (admin)
- ✅ Stock movements (`PURCHASE` / `WASTE` / `ADJUSTMENT`)
- ✅ Recipe (Product ↔ Ingredient)
- ✅ ⭐ Order COMPLETED → atomic stock deduct + COGS snapshot
- 🟡 Reports + UI <span class="muted">→ Session 2</span>

</v-clicks>

</div>

---

## layout: center

# Event-Sourced Inventory

```text
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
```

<div class="mt-4 muted text-center">
Truth: <code>SUM(quantity)</code> · Cache: read-fast denormalized · Recompute possible if drift
</div>

---

# Decimal Precision

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ JS Float

```js
0.1 + 0.2;
// 0.30000000000000004
```

For money & stock:

- Drift over thousands of operations
- ฿0.05 × 1000 orders = visible discrepancy

</div>

<div>

### ✅ Prisma Decimal

```prisma
@db.Decimal(precision, scale)
```

- `Decimal(10, 2)` = max ฿99,999,999.99 <span class="muted">(money)</span>
- `Decimal(10, 4)` = max 999,999.9999 <span class="muted">(cost/g)</span>
- `Decimal(12, 4)` = max 99,999,999.9999 <span class="muted">(stock)</span>

</div>

</div>

<div class="mt-6 muted text-center text-sm">
Stored exact in Postgres · Returned as <code>string</code> in JS — <code>Number()</code> at boundary
</div>

---

# Recipe Whole-Replace

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ Diff approach

- Compare old vs new
- Compute add/remove/update
- Execute each → many queries

→ complex + bug-prone

</div>

<div>

### ✅ Whole-replace <span class="coffee">←</span>

```text
$transaction:
  1. DELETE all items for product
  2. CREATE new items
```

→ simple, idempotent, atomic

</div>

</div>

<div class="mt-8 text-center">

HTTP semantic: <code class="coffee">PUT /recipes/product/:id</code> <span class="muted">(replace entire resource)</span>

</div>

<div class="mt-4 muted text-center text-sm">
Trade-off: lose granular audit (which item changed) — acceptable for course MVP
</div>

---

## layout: center

# ⭐ Atomic Transaction (4 tables)

<div class="text-lg muted mb-3">Order: READY → COMPLETED triggers:</div>

<v-clicks>

<div>

```text
1. Find product recipe
```

</div>

<div>

```text
2. Calc COGS:
   sum(qty × cost)
```

</div>

<div>

```text
3. UPDATE order_items
   SET cogs_snapshot
```

</div>

<div>

```text
4. For each ingredient:
   a. INSERT stock_movements (-qty, SALE)
   b. UPDATE ingredients current_stock -= qty
```

</div>

<div>

```text
5. UPDATE orders SET status, completed_at
```

</div>

<div class="mt-4 text-center coffee text-xl">
COMMIT (or ROLLBACK on error)
</div>

</v-clicks>

<!--
Show this slide step-by-step. Each click = 1 step. End: emphasize "all or nothing".
-->

---

# Concrete Example

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Setup

```text
Order: 2 Latte
Recipe: 18g coffee + 200ml milk
Costs:  ฿0.8/g coffee
        ฿0.05/ml milk
```

### Per Latte COGS

```text
= 18 × 0.8 + 200 × 0.05
= 14.4 + 10
= 24.4
```

</div>

<div>

### Order COGS

```text
24.4 × 2 = 48.8
```

### Stock movements

```text
- coffee: -36g  (18 × 2)
- milk:  -400ml (200 × 2)
```

### After commit

```text
order_items.cogs_snapshot = 48.8
ingredients (coffee).current_stock -= 36
ingredients (milk).current_stock -= 400
+ 2 new stock_movement rows
```

</div>

</div>

---

# Recipe Missing — Graceful

<div class="text-lg muted mb-3">Some products may lack recipe:</div>

- Admin forgot
- "ค่าเข้า" item (no ingredients)
- Test product

<div class="grid grid-cols-2 gap-6 mt-6">

<div>

### ❌ Strict — throw

- Order stuck at READY
- Customer can't get receipt
- Staff blocked

</div>

<div>

### ✅ Graceful <span class="coffee">←</span>

- Log warning + `cogsSnapshot=0`
- Order completes (UX)
- Admin sees log → fixes
- `cogsSnapshot=0` flagged in reports

</div>

</div>

<div class="mt-8 text-center text-xl coffee">
graceful degradation > strict
</div>

---

# 📝 Homework + Recap

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Homework <span class="muted">(~3 hrs)</span>

**Setup full data:**

- [ ] 5+ ingredients (coffee, milk, sugar, cup, ...)
- [ ] PURCHASE initial stock
- [ ] Set recipes for all products

**Stress test:**

- [ ] Place + complete 5+ orders
- [ ] Verify stock matches manual calc
- [ ] Inspect `stock_movements`

**Pre-build:**

- [ ] `/admin/inventory` skeleton

</div>

<div>

### 🎯 Recap quiz

<v-clicks>

1. Atomic transaction COMPLETED — กี่ tables?
2. Recipe missing — handle ยังไง?
3. `currentStock` = source of truth?

</v-clicks>

</div>

</div>

---

## layout: cover

# ☕ Session 2

## Week 5 · Session 2

### Reports Backend + Dashboard

<div class="muted mt-8 text-sm">Make the data VISIBLE</div>

---

## layout: center

# Today's Outcome

<div class="grid grid-cols-2 gap-8 mt-4 text-sm">

<div>

### `/admin/inventory`

- Ingredients list
- Stock entry form

### `/admin/menu`

- "สูตร" button per product → editor

</div>

<div>

### `/admin/reports`

- KPI cards (revenue, cogs, profit, margin)
- 7-day chart (revenue + cogs + profit)
- Top 5 products
- Low stock alerts

### Bonus

- Seed script for fresh dev

</div>

</div>

---

# Aggregation Strategies

<div class="text-lg muted mb-3">Need 4 different aggregations:</div>

<v-clicks>

<div class="grid grid-cols-2 gap-3 text-sm mt-2">

<div>

**1. Daily summary** <span class="muted">(single row)</span>
→ fetch + JS reduce

</div>

<div>

**2. Top products** <span class="muted">(group)</span>
→ Prisma `groupBy` + `orderBy _sum desc`

</div>

<div>

**3. Low stock** <span class="muted">(filter)</span>
→ fetch all + JS filter
<span class="muted">(Postgres comparison fine too)</span>

</div>

<div>

**4. Revenue chart** <span class="muted">(time series)</span>
→ `date_trunc('day')` needs SQL
→ use `$queryRaw`

</div>

</div>

</v-clicks>

---

# Prisma `groupBy`

```ts
const grouped = await prisma.orderItem.groupBy({
  by: ['productId', 'productName'],
  where: {
    order: {
      status: 'COMPLETED',
      completedAt: { gte: since },
    },
  },
  _sum: { qty: true, lineTotal: true },
  orderBy: { _sum: { qty: 'desc' } },
  take: 5,
});
```

```text
→ SQL: SELECT product_id, product_name,
              SUM(qty), SUM(line_total)
       FROM order_items
       WHERE ...
       GROUP BY product_id, product_name
       ORDER BY SUM(qty) DESC
       LIMIT 5;
```

---

# `$queryRaw` for Date Truncation

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
```

<div class="mt-4 grid grid-cols-2 gap-4 text-sm">

<div>✅ <code>${since}</code> = parameterized <span class="muted">(Prisma escapes)</span></div>
<div>❌ <code>'+date+'</code> = SQL injection</div>

</div>

---

# Recharts Pattern

```tsx
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
```

<div class="mt-4 muted text-sm">

`ResponsiveContainer` adapts to parent · `dataKey` = field in data array · multiple `<Line>` overlay metrics

</div>

---

# Stock Movement UX (Auto-sign)

<div class="text-lg mt-4">User UX: enter <span class="coffee">positive number</span> always · Reason → server signs</div>

```text
PURCHASE:    + (add stock)
WASTE:       - (remove stock)
ADJUSTMENT:  any (admin chooses)
SALE:        - (auto from order completion)
```

```ts
const signed = reason === 'PURCHASE' ? Math.abs(qty) : reason === 'WASTE' ? -Math.abs(qty) : qty;
```

<div class="mt-4 muted text-sm">

In form: `reason="PURCHASE"`, `quantity=1000` → server: `+1000` ✓<br>
In form: `reason="WASTE"`, `quantity=50` → server: `-50` ✓

</div>

---

## layout: center

# KPI Card Design

```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ รายได้วันนี้│ │ ต้นทุนวันนี้│ │ กำไรขั้นต้น │
│   ฿1,250    │ │    ฿450     │ │    ฿800     │
│ (blue bg)   │ │ (orange bg) │ │ (green bg)  │
└─────────────┘ └─────────────┘ └─────────────┘
┌─────────────┐ ┌─────────────┐
│ อัตรากำไร   │ │ จำนวนออเดอร์│
│    64%      │ │     12      │
│ (green ≥50%)│ │ (gray)      │
└─────────────┘ └─────────────┘
```

<div class="mt-6 muted text-center">
Color signals health: ≥50% green · &lt;50% yellow · negative red
</div>

---

# Seed Script

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
```

```text
Trigger:
  pnpm prisma db seed
  (auto on `prisma migrate reset`)
```

<div class="mt-4 muted text-sm">

Use cases: fresh dev env · CI/CD test data · demo setup · onboarding new dev

</div>

---

# 🎉 Coffee shop is now MEASURABLE

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Week 6 — DEPLOY 🚀

<v-clicks>

- 🆕 Provision Hetzner VPS
- 🆕 SSH hardening + ufw + fail2ban
- 🆕 Multi-stage Dockerfiles
- 🆕 Caddy auto-HTTPS reverse proxy
- 🆕 GitHub Actions CI/CD
- 🆕 `pg_dump` backup cron

</v-clicks>

</div>

<div>

### Pre-class

- [ ] Verify Docker Desktop running
- [ ] Have a domain ready (or buy one)
- [ ] Have credit card for VPS <span class="muted">(~€4.5/mo)</span>

<div class="mt-8 text-center text-xl coffee">
Final week:<br>ขึ้น production!
</div>

</div>

</div>

<style>
.coffee { color: #f5a623; font-weight: 600; }
.muted { color: #a6adc8; }
</style>
