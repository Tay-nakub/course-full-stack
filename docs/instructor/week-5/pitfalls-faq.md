# Week 5 — Pitfalls & FAQ

**Audience:** instructor — เปิดตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls

### Pitfall #1: cogsSnapshot ไม่ populate

**Symptom**: Order COMPLETED แต่ `order_items.cogs_snapshot` = NULL ใน DB

**Common causes**:
1. Recipe ไม่ได้ set สำหรับ product
2. `deductStockAndSnapshotCogs` ไม่ถูกเรียก (logic check ผิด)
3. `tx.orderItem.update` ใช้ `id: order.id` แทน `id: item.id` (อัปเดตผิด record)

**Quick debug**:
```sql
-- 1. ตรวจ recipe มีไหม
SELECT * FROM recipe_items WHERE product_id = '<product-id>';
-- empty → ลืม set recipe

-- 2. ตรวจ order_items
SELECT id, product_id, qty, cogs_snapshot
FROM order_items
WHERE order_id = '<order-id>';
-- cogs_snapshot null → logic ไม่ทำงาน
```

**Fix**: ดู `deductStockAndSnapshotCogs` — verify logic + recipe presence

---

### Pitfall #2: currentStock ไม่ลด

**Symptom**: Order COMPLETED แต่ ingredient.currentStock เท่าเดิม

**Common causes**:
1. ใช้ `this.prisma.ingredient.update` แทน `tx.ingredient.update` (leak จาก transaction)
2. Transaction rollback (มี error อื่นใน flow)
3. `decrement` ใช้ value ผิดหน่วย

**Quick debug**:
- ดู API logs — มี error message ไหม?
- ดู `stock_movements` table — มี SALE row ของ order นั้นไหม?
  - ถ้าไม่มี → transaction rollback หรือ logic ไม่ทำงาน
  - ถ้ามี → cache update ไม่ทำงาน → run `recompute-stock` endpoint

**Recovery**:
```bash
POST /api/inventory/ingredients/<id>/recompute-stock
# → recalculate currentStock from movements SUM
```

---

### Pitfall #3: Stock ติดลบ

**Symptom**: `currentStock = -36` หรือ negative

**Cause**: Order COMPLETED แต่ stock ไม่พอ. Course default = allow negative (ไม่ throw)

**Why allowed**:
- "Order ตามจริง" — ยังไงลูกค้าก็ได้ของไป (จากบาง batch ที่ไม่นับ stock)
- Negative stock = data quality signal — admin เห็นแล้วต้องตรวจ

**Fix** (manual):
1. ตรวจว่าเปิด order จริงหรือ test
2. PURCHASE adjustment เพื่อ catch up
3. หรือ ADJUSTMENT บวก correct amount

**Stretch (prevent)**:
```ts
// ใน deductStockAndSnapshotCogs:
if (Number(r.ingredient.currentStock) < totalAmount) {
  throw new ConflictException(`Stock ${r.ingredient.name} ไม่พอ`);
}
```

---

### Pitfall #4: Decimal arithmetic drift

**Symptom**: COGS calculation ไม่ตรงกับที่คำนวณเอง (off by 0.0001 etc.)

**Cause**: JS `Number` ไม่ exact precision

**Quick check**:
- ทำตัวอย่างเล็ก: 18 × 0.8 = 14.4 ✓
- ทำใหญ่: 18 × 0.8 + 200 × 0.05 = 24.4 ✓
- หลายหลัก decimal: 18 × 0.8001 + ... = drift

**Course default**: accept small drift (cents level OK สำหรับ learning project)

**Production**: ใช้ decimal.js:
```ts
import Decimal from 'decimal.js';
const cogs = new Decimal(r.quantity).mul(item.qty).mul(r.ingredient.costPerUnit);
```

---

### Pitfall #5: Recharts ไม่ render

**Symptom**: Chart container ว่าง, ไม่มี error

**Common causes**:
1. ResponsiveContainer parent ไม่มี height
2. data array ว่าง
3. dataKey ไม่ตรงกับ field name
4. Chart รัน server-side (Server Component) — Recharts ต้อง browser

**Fix**:
```tsx
// 1. Set container height
<div className="h-80">
  <ResponsiveContainer width="100%" height="100%">

// 2. Make sure 'use client' at top
'use client';

// 3. Verify dataKey matches data shape
data: [{ date: '2026-01-01', revenue: 100 }]
<Line dataKey="revenue" />  // ← matches 'revenue'
```

---

### Pitfall #6: $queryRaw error or wrong types

**Symptom**: `Cannot read 'date' of undefined` หรือ types ผิดประเภท

**Common causes**:
1. ลืม type generic: `prisma.$queryRaw<T[]>`
2. SQL returns different column names than expected
3. Decimal returns string but TS thinks number

**Fix**:
```ts
const rows = await prisma.$queryRaw<{ date: string; revenue: number }[]>`
  SELECT
    TO_CHAR(...) as date,
    SUM(total)::float as revenue   -- ← cast to float
  ...
`;
```

> "::float cast = Postgres convert Decimal → float. ตอนกลับ TS = number ถูก type"

---

### Pitfall #7: Recipe whole-replace ลบหมดแม้เพิ่ม 1 ตัว

**Symptom**: Submit ใหม่ → recipe items ทั้งหมดถูก delete + create new

**Expected behavior**: ใช่ — pattern คือ whole-replace

**Pain point**: ถ้า student รำคาญที่ ID เก่าหายไปหลังแก้ — explain trade-off

**Mitigation (stretch)**: implement diff approach
1. Compare incoming items vs existing
2. Identify add/remove/update sets
3. Apply individually

> Course choice: simple > complex. Whole-replace = idempotent, atomic, easier to reason about

---

### Pitfall #8: Reports show ฿0 although orders completed

**Symptom**: /admin/reports → revenue 0 แต่มี orders COMPLETED

**Common causes**:
1. Orders จาก yesterday → today's daily report ไม่นับ
2. completedAt = null (status changed but field not set)
3. Timezone issue — server UTC but expectation Bangkok

**Quick debug**:
```sql
SELECT id, status, completed_at FROM orders WHERE status = 'COMPLETED';
-- check completed_at populated?
-- check timezone match?

-- Today (server time):
SELECT COUNT(*) FROM orders 
WHERE status = 'COMPLETED'
  AND completed_at >= date_trunc('day', NOW());
```

**Fix**:
- Verify Week 4 status logic sets completedAt
- Production: configure timezone via Postgres `timezone` setting + ensure consistent

---

### Pitfall #9: Low stock alert ไม่เห็น แม้ stock < minStock

**Symptom**: stock = 100, minStock = 200, แต่ no alert

**Common causes**:
1. Decimal comparison: `Number(currentStock) <= Number(minStock)` — strings ไม่ parse
2. Filter logic ผิด direction (`>=` แทน `<=`)
3. Front-end cache stale

**Fix**:
```ts
.filter((i) => Number(i.currentStock) <= Number(i.minStock))
//             ^^^^^^^^                 ^^^^^^^^^
//        Critical: convert both
```

---

### Pitfall #10: Seed script error — unique constraint

**Symptom**: `pnpm prisma db seed` fails: "unique constraint email"

**Cause**: Seed รันซ้ำโดยไม่ใช้ `upsert`

**Fix**: ใช้ `upsert` ทุกที่ที่มี unique field:
```ts
await prisma.user.upsert({
  where: { email: 'admin@coffee.com' },
  update: {},     // empty = no update if exists
  create: { ... },
});
```

> "Idempotent seed: รันซ้ำได้โดยไม่ error"

---

## ❓ Extended FAQ

### Inventory Architecture

**Q: ทำไมไม่ใช้ trigger ใน Postgres?**
A: ทำได้ แต่ logic ใน app (NestJS) = visible ใน code. Trigger ใน DB = hidden, hard to test, hard to deploy. Course preference: app logic

**Q: Soft delete ingredients?**
A: Course = hard delete (with constraint check). Real apps: `deletedAt: DateTime?` + filter queries. Stretch

**Q: หลายหน่วยต่อ ingredient (เมล็ดกาแฟ kg + g)?**
A: Course = single unit. Real apps: separate "purchase unit" + "use unit" + conversion factor

**Q: Multi-warehouse?**
A: Stretch — add `warehouseId` FK. Inventory queries scope by warehouse

---

### Atomic Transactions

**Q: ทำไม `tx.ingredient.update` แต่ละ ingredient — ไม่ batch?**
A: Prisma update = single record. Multiple records = loop OR raw SQL. ใน $transaction = ยังคง atomic. Performance OK สำหรับ small recipes (< 10 ingredients)

**Q: Lock rows for update?**
A: Postgres row-level lock อัตโนมัติใน UPDATE ภายใน transaction. ถ้าต้อง explicit: `SELECT ... FOR UPDATE` (raw SQL)

**Q: Long transactions slow down DB?**
A: ใช่ — 5-second default timeout. Course transaction < 1 sec. ถ้าใหญ่ (100+ orders): break into batches

---

### Reports

**Q: Real-time reports?**
A: Course = polling 30 sec. Real-time: SSE หรือ WebSocket (stretch)

**Q: Export reports to Excel/CSV?**
A: Stretch — `exceljs` library + endpoint streams CSV. Common request

**Q: Date range filter?**
A: Course = hardcoded today + last 7 days. Stretch: date picker + flexible endpoint

**Q: Reports for previous months?**
A: Endpoint accepts `?date=YYYY-MM-DD` (Wk 5 daily). Stretch: monthly aggregation

---

### Recharts

**Q: Chart performance with 1000+ points?**
A: Recharts can handle. For huge data: aggregate to weeks/months. Or use Visx (heavy but custom)

**Q: Server-side chart rendering?**
A: Recharts = client only. SSR = render placeholder, hydrate client. Course OK

**Q: Export chart as image?**
A: Stretch — `html2canvas` lib captures DOM → image

**Q: Customize tooltip?**
A: Pass `<Tooltip content={<CustomTooltip />} />`. CustomTooltip is your component receiving `payload` prop

---

### Decimal Precision

**Q: When does drift accumulate to noticeable?**
A: 1000s of multiplications + additions. Course = simple math, drift acceptable

**Q: BigInt for stock?**
A: BigInt = whole numbers only. Stock = decimals (18.5g). Use Decimal

**Q: PostgreSQL NUMERIC type?**
A: Same as Decimal in Prisma. Postgres NUMERIC = arbitrary precision

---

### Seed Scripts

**Q: When should seed run?**
A:
- Once on fresh DB
- After `prisma migrate reset`
- Optional: CI before tests
- **Never** in production (Course MVP — production seed = different model)

**Q: Test data vs seed data?**
A:
- Seed = baseline starting state (admin user, default categories)
- Test data = scenario-specific (in test files)

**Q: Multiple environments?**
A: Course = 1 seed. Real apps: `seed.dev.ts`, `seed.staging.ts`, etc.

---

## 🆘 Emergency Recovery

### Reset DB (clean slate)

```bash
cd apps/api
pnpm prisma migrate reset
# Auto runs seed
# WARNING: deletes all data
```

### Recompute stock from movements

```bash
# For each ingredient
POST /api/inventory/ingredients/<id>/recompute-stock
```

### Manually fix cogsSnapshot for past order

```sql
-- Find affected order
SELECT id, status FROM orders WHERE id = '<order-id>';

-- Manually compute + update (last resort)
UPDATE order_items
SET cogs_snapshot = <computed-value>
WHERE order_id = '<order-id>';
```

### Reports endpoint timeout

```sql
-- Check slow queries
EXPLAIN ANALYZE
SELECT ... FROM orders WHERE status = 'COMPLETED' ...

-- Add missing index
CREATE INDEX idx_orders_completed_at ON orders(completed_at);
```

---

## 📊 Common Mistakes Heatmap (อัปเดตหลังสอน)

| Mistake | Frequency | Notes |
|---|---|---|
| `this.prisma` inside `$transaction` (leak) | TBD | — |
| Decimal not converted with Number() | TBD | — |
| Recharts no parent height | TBD | — |
| Recipe missing — student forgot | TBD | — |
| Stock negative — student panicked | TBD | — |
