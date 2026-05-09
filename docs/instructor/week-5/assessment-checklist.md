# Week 5 — Assessment Checklist

**Audience:** instructor — diagnostic, not exam

---

## 🎯 Pass Criteria

Student "พร้อม" เข้า Week 6 ถ้า:

- ✅ Verbal Q ≥ 7/10
- ✅ Live demo: order COMPLETED → 4 tables update + reports show numbers
- ✅ HW-5-Post PR pass acceptance criteria

ถ้า ≤ 6/10 → 1-on-1 ก่อน Week 6 (Week 6 = deploy. Week 5 logic must work first)

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Q1 — Event-sourced inventory

> "currentStock เป็น cache ของอะไร? ถ้า cache drift จะ recompute ยังไง?"

**Acceptable**: Cache ของ SUM(stock_movements.quantity). Recompute = aggregate sum + update Ingredient row

### Q2 — Atomic transaction tables

> "Order COMPLETED → atomic transaction แตะกี่ tables? ตอบทุก table"

**Acceptable**: 4 tables — orders (status, completedAt), order_items (cogsSnapshot), stock_movements (insert), ingredients (currentStock)

### Q3 — Decimal precision

> "Prisma Decimal ใน JS เป็น string. ทำไม? ตอนคำนวณทำยังไง?"

**Acceptable**: JS Number can't exactly represent decimals. String preserves exact value. Use `Number()` at boundary, or decimal.js for production

### Q4 — Recipe missing handling

> "Order COMPLETED แต่ product ไม่มี recipe — เราทำยังไง? ทำไม?"

**Acceptable**: Log warning + cogsSnapshot=0, skip stock deduct. ไม่ throw — เพื่อให้ order complete (graceful degradation > strict)

### Q5 — `tx` vs `prisma`

> "ใน $transaction callback, ห้ามใช้ `this.prisma` ทำไม?"

**Acceptable**: leak ออกจาก transaction — query ภายนอก commit แม้ transaction rollback. ใช้ `tx` consistent ทุกที่

### Q6 — Recipe whole-replace

> "ทำไม Recipe ใช้ DELETE all + CREATE new ไม่ใช่ diff?"

**Acceptable**: Simpler, idempotent, atomic. Trade-off: ขาด granular audit (acceptable for MVP)

### Q7 — Prisma groupBy

> "Top products endpoint — group by อะไร? aggregate ทำไม?"

**Acceptable**: groupBy `productId, productName`. `_sum: { qty }` → SQL SUM. orderBy \_sum desc + take 5

### Q8 — $queryRaw safety

> "ใช้ `$queryRaw\`...${userInput}\`` ปลอดภัยไหม? ทำไม?"

**Acceptable**: ปลอดภัย — Prisma escapes parameters อัตโนมัติ. แต่ห้าม string concat (`'+input+'`) — SQL injection

### Q9 — Recharts SSR

> "ทำไม Recharts components ต้องใส่ `'use client'`?"

**Acceptable**: Recharts ใช้ DOM/SVG measurements + browser APIs. Server-rendering = no DOM. Must be Client Component

### Q10 — Seed idempotency

> "Seed script รันซ้ำ 5 ครั้ง — ผลลัพธ์เหมือนกันไหม?"

**Acceptable**: ใช่ — ใช้ `upsert`. Where clause matches → no-op หรือ update. ไม่ duplicate

---

## 📋 Homework PR Code Review Checklist

### Backend (Tasks 1-6)

- [ ] Inventory schemas (Ingredient, StockMovement, Recipe)
- [ ] Reports schemas (DailyReport, TopProduct, LowStockItem)
- [ ] Migration applied (3 new tables + cogsSnapshot column)
- [ ] IngredientsService + Controller (admin only)
- [ ] StockMovementsService with auto-update cache
- [ ] RecipesService whole-replace strategy in $transaction
- [ ] OrdersService.updateStatus extended with stock deduct + COGS
- [ ] ReportsService: daily, topProducts, lowStock, revenueLastDays
- [ ] Tests: 19+ pass (incl. stock deduct atomic)

### Frontend (Tasks 7-9)

- [ ] /admin/inventory: list + form + stock movement entry
- [ ] /admin/menu: "สูตร" button → RecipeEditor dialog
- [ ] /admin/reports: KpiCards + RevenueChart + TopProductsTable + LowStockAlerts
- [ ] Recharts installed + working
- [ ] Polling refetchInterval reasonable (30-60s)
- [ ] Sidebar links to inventory + reports

### Data Quality (Task 10)

- [ ] Seed script with upsert
- [ ] Initial PURCHASE stock for all ingredients
- [ ] Recipes set for all products
- [ ] Run seed → fresh state

### Quality

- [ ] `pnpm typecheck` pass
- [ ] No `any` (except mocks)
- [ ] Decimal converted with Number() at display
- [ ] No console.log in production paths
- [ ] HW-5-Post: chart polish + ingredient usage + recipe cost preview

---

## 🧪 Live Build Checkpoints

### Session 1 — Block A

- [ ] Postman: POST ingredient → 201
- [ ] Postman: POST stock movement (PURCHASE 1000) → currentStock = 1000
- [ ] DBeaver: stock_movements row exists

### Session 1 — Block B

- [ ] PUT /recipes/product/<id> with 2 ingredients → recipe set
- [ ] DBeaver: recipe_items has 2 rows
- [ ] PUT again with 1 ingredient → DELETE old + INSERT new (1 row only)

### Session 1 — Block C ⭐

- [ ] Place order → status PENDING → ... → COMPLETED
- [ ] DBeaver — verify SIMULTANEOUSLY:
  - [ ] orders.completed_at set
  - [ ] order_items.cogs_snapshot populated
  - [ ] ingredients.current_stock decreased
  - [ ] stock_movements has SALE rows with refOrderId
- [ ] Tests pass: 19+

### Session 2 — Block D

- [ ] GET /reports/daily → numbers calculated correctly
- [ ] GET /reports/top-products → sorted by qty desc
- [ ] GET /reports/low-stock → only ingredients ≤ minStock

### Session 2 — Block E

- [ ] /admin/inventory shows ingredients with low stock highlighted
- [ ] Stock movement form auto-signs based on reason
- [ ] Recipe editor allows add/remove ingredients + quantity

### Session 2 — Block F

- [ ] /admin/reports KPI cards match calculated numbers
- [ ] Revenue chart shows 7-day data
- [ ] Top products table populated
- [ ] Low stock alerts conditional banner

### Session 2 — Block G

- [ ] `pnpm prisma db seed` succeeds
- [ ] Fresh DB → admin login + menu + ingredients all there

---

## 📊 Student Self-Assessment

```
Week 5 Self-Assessment

Concept depth (1-5):
□ Event-sourced inventory pattern              [1] [2] [3] [4] [5]
□ Atomic transaction across 4 tables           [1] [2] [3] [4] [5]
□ Decimal precision (Prisma + JS)              [1] [2] [3] [4] [5]
□ Recipe whole-replace strategy                 [1] [2] [3] [4] [5]
□ Prisma groupBy + aggregations                [1] [2] [3] [4] [5]
□ $queryRaw + parameterized queries            [1] [2] [3] [4] [5]
□ Recharts integration                          [1] [2] [3] [4] [5]
□ Seed scripts                                  [1] [2] [3] [4] [5]
□ Cross-stack debugging (DB inspection)        [1] [2] [3] [4] [5]

Overall confidence Week 5:                     [1] [2] [3] [4] [5]

Hardest concept:
_________________________________________________

Most surprising "aha!":
_________________________________________________

ก่อน Week 6 — ฉันมั่นใจว่า:
□ ระบบทุก feature ทำงานในเครื่องตัวเอง
□ DB transaction ทำงานถูก
□ Reports show numbers ถูก
```

---

## 📈 Tracking Sheet

| Student   | Q1-10   | Atomic Demo | HW-5-Post | Confidence | 1-on-1? |
| --------- | ------- | ----------- | --------- | ---------- | ------- |
| Student A | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |
| Student B | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |
| Student C | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |
| Student D | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |
| Student E | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |
| Student F | \_\_/10 | ✅/❌       | ✅/❌     | \_\_/5     | Yes/No  |

---

## 🎯 Concepts Used in Week 6

| Concept (Week 5)              | Used In         | How                                |
| ----------------------------- | --------------- | ---------------------------------- |
| Seed script                   | Wk 6 deploy     | Bootstrap fresh prod DB            |
| Atomic transactions           | Wk 6 production | Same code, prod DB                 |
| Reports + Charts              | Wk 6 verify     | Smoke test after deploy            |
| Healthcheck (Wk 2) + DB query | Wk 6 deployment | Verify DB connectivity post-deploy |
| Decimal precision             | Wk 6 production | Same correctness needed            |

---

## 🔁 Catch-up Plans

### Score 5-6/10

- DM: review atomic transaction flow specifically
- 30-min 1-on-1 — walk through `deductStockAndSnapshotCogs` line-by-line
- Pair with strong student in Week 6

### Score ≤ 4/10

- 60-min 1-on-1 — required ก่อน Week 6
- Re-implement Task 5 live with instructor watching
- Run end-to-end demo + verify DB

### Atomic Demo Failed

- Bisect: schema OK? recipe set? logic correct?
- Use git diff vs `week5-session1-reference` branch
- Verify all 4 tables update before Week 6

---

## 📝 Week 5 Instructor Reflection

```
What worked:
___________________________________________________

What didn't:
___________________________________________________

Atomic transaction demo wow factor:
___________________________________________________

Decimal precision discussion clear?
___________________________________________________

Time-block over/under:
- S1 Block A: ____ min
- S1 Block B: ____ min
- S1 Block C: ____ min ⭐ (most critical)
- S2 Block D: ____ min
- S2 Block E: ____ min
- S2 Block F: ____ min
- S2 Block G: ____ min

New pitfalls to add:
___________________________________________________

Pre-Week 6 readiness:
___________________________________________________

Note: Week 6 = deploy. ALL Week 1-5 features must work
locally before deploying. Verify before Session 6.1.
```
