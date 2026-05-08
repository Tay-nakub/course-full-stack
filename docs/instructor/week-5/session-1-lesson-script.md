# Week 5 Session 1 — Inventory + Atomic Stock Deduct ⭐

**Week:** 5
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 4 complete (orders + status transitions working)
**Covers:** Tasks 1-5 of [Week 5 Plan](../../superpowers/plans/2026-05-08-week-5-inventory-reports.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:
- ✅ Inventory schemas + Prisma models (Ingredient, RecipeItem, StockMovement, cogsSnapshot)
- ✅ Ingredients CRUD + stock movements (PURCHASE/WASTE/ADJUSTMENT)
- ✅ Recipe module (whole-replace strategy)
- ✅ ⭐ **Order COMPLETED → atomic transaction** (stock deduct + COGS snapshot)
- ✅ 19+ tests pass

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Demo repo: branch `week5-instructor-start` (Week 4 done + 1 admin + 1 staff)
- [ ] DBeaver พร้อม 4 query tabs: orders, order_items, ingredients, stock_movements
- [ ] Postman collection updated for inventory endpoints
- [ ] Whiteboard: pre-draw atomic transaction diagram
- [ ] Backup: ถ้า student Week 4 ไม่จบ → checkout reference branch

---

## 🗓️ Time-Blocked Agenda

| Time | Block | Activity |
|---|---|---|
| 0-10 | **Recap + Preview** | Quiz Wk 4 + show today's outcome |
| **10-50** | **Block A** | **Schemas + Ingredients + Stock movements** |
| **50-70** | **Block B** | **Recipe module** |
| **70-110** | **Block C ⭐** | **Order COMPLETED → atomic stock deduct + COGS** |
| 110-120 | Wrap-up | Homework + Q&A |

---

## 🟢 Recap + Preview (0-10 min)

### Recap (3 min)
- "Atomic transaction ใน Week 4 — ใช้ตอนไหน?"
- "State machine ของ order — terminal states คืออะไร?"
- "Snapshot pattern — productName + unitPrice ทำไม snapshot?"

### Today's Big Idea (7 min)

📢 **Setup the moment**:
> "Week 5 คือ **‘the point’** ของคอร์ส — ทำให้ร้านกาแฟ **วัดได้**.
>
> เจ้าของร้านอยากรู้: ‘วันนี้ขายได้เท่าไร?’ ‘ต้นทุนเท่าไร?’ ‘กำไรเท่าไร?’ ‘เมล็ดกาแฟเหลือเท่าไร?’"

**Show end-state demo**:
1. Customer place 2 Latte → Staff complete
2. /admin/inventory → coffee stock ลด 36g, milk ลด 400ml
3. /admin/reports → revenue ฿150, cogs ฿57.60, gross profit ฿92.40

📢 **Key today**:
> "หัวใจอยู่ที่ Block C — order COMPLETED → atomic transaction ที่แตะ 4 tables. Block A และ B = setup สำหรับ Block C"

---

## 📦 Block A: Schemas + Ingredients + Stock Movements (10-50 min, 40 min)

### 🎯 Block Goals
- Inventory schemas + Prisma models
- Ingredient CRUD (admin only)
- Stock movements (PURCHASE/WASTE/ADJUSTMENT) with auto-update cache

### 💬 Lecture (~10 min)

**1. Event-sourced inventory pattern** (5 min)

วาดบนกระดาน:
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
        │  ingredients    │ ← cached for fast read
        │ currentStock = 914
        └─────────────────┘

  Ground truth: SUM all movements
  Cache: stored on Ingredient.currentStock
  Verify: recompute periodically (or on demand)
```

📢 **Why event-sourced**:
- Audit trail — เห็นทุก change with timestamp + reason + cost
- Recompute possible — cache ผิดพลาด? recompute จาก movements
- Reporting easy — group by reason, period, etc.

**2. Why Decimal precision matters** (3 min)

```
JS Float problem:
  0.1 + 0.2 = 0.30000000000000004
  
For money or stock:
  0.1g + 0.2g สะสม 1000 ครั้ง → drift
  ฿0.05 + ฿0.10 ในร้านกาแฟ × 1000 orders/วัน → คลาดเคลื่อน

Prisma Decimal type:
  @db.Decimal(precision, scale)
  - Decimal(10, 2) = up to 99,999,999.99 (money)
  - Decimal(10, 4) = up to 999,999.9999 (cost per gram)
  - Decimal(12, 4) = up to 99,999,999.9999 (large stock)

  Stored exactly, calculated exactly in Postgres
  Returned to JS as string → must Number() for display
```

**3. Auto-sign quantity** (2 min)

```
PURCHASE: + (positive — adding to stock)
SALE:     - (negative — automatic from order)
WASTE:    - (negative — admin enters positive, server signs)
ADJUSTMENT: any sign (admin decides)

UX rule: User กรอกเลขบวกเสมอ → server/form auto-sign
```

### 🖥️ Live Demo (~30 min)

**1. Schemas** (Task 1.1 — 7 min)

(พิมพ์ inventory.ts + reports.ts ตาม Plan)

📢 **Highlights**:
- `INGREDIENT_UNITS` const tuple → derive type
- `INGREDIENT_UNIT_LABELS` Thai labels
- `STOCK_MOVEMENT_REASONS` enum
- `RecipeItemSchema` + `SetRecipeSchema` (whole-replace)

**2. Prisma migrate** (Task 1.4-1.6 — 5 min)

(พิมพ์ schema.prisma additions ตาม Plan)

📢 **เน้น indexes**:
- `@@index([refOrderId])` — query stock movements by order (audit)
- `@@index([createdAt])` — time-series report queries

```bash
cd apps/api
pnpm prisma migrate dev --name add_inventory_and_cogs
```

ดู DBeaver — 3 ตารางใหม่ + cogs_snapshot column

**3. IngredientsService + Controller** (Task 2 — 8 min)

(พิมพ์ตาม Plan)

📢 **เน้น class-level decorators**:
```ts
@Controller('inventory/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
```
> "ใส่ที่ class — ทุก method admin only. ไม่ต้องใส่ method-level"

**4. StockMovementsService** (Task 3.1 — 7 min)

(พิมพ์ตาม Plan — focus atomic update)

📢 **อธิบาย $transaction**:
```ts
return this.prisma.$transaction(async (tx) => {
  // 1. Find ingredient
  // 2. Insert movement
  // 3. Update currentStock cache
  // → all atomic
});
```

> "ทำไม atomic? ถ้า movement insert success แต่ cache update fail → cache stale, จะคิดว่าเหลือเยอะกว่าจริง"

**5. ทดสอบ Postman** (Task 3.4 — 3 min)

```bash
# PURCHASE: เพิ่ม coffee 1000g
POST /api/inventory/ingredients
{ name: "เมล็ดกาแฟ", unit: "GRAM", costPerUnit: 0.8, minStock: 200 }

POST /api/inventory/ingredients/movements
{ ingredientId: <id>, quantity: 1000, reason: "PURCHASE", note: "เปิดร้าน" }

GET /api/inventory/ingredients/<id>
# → currentStock: 1000
```

DBeaver:
```sql
SELECT * FROM stock_movements;  -- 1 row
SELECT name, current_stock FROM ingredients;  -- 1000
```

Commit:
```bash
git commit -m "feat(api): Inventory module with stock movements"
```

### ❓ Common Questions (Block A)

| Q | A |
|---|---|
| ทำไม `@@map("ingredients")`? | Postgres convention = lowercase + plural |
| Decimal precision ตอนนี้พอไหม? | ใช่ — 12,4 = พอสำหรับ stock ที่อาจเป็น 50,000.0001g, 0.0500/g |
| Cache + source of truth — race condition? | ภายใน $transaction = atomic. Cross-transaction (เช่น report) อ่าน cache OK เพราะ atomic update |
| Why @@unique on Ingredient.name? | กัน duplicate ingredient (admin error). Real-world: name คือ business key |

---

## 🍵 Block B: Recipe Module (50-70 min, 20 min)

### 🎯 Block Goals
- RecipeItem links Product ↔ Ingredient with quantity
- Whole-replace strategy (idempotent set, not diff)

### 💬 Lecture (~5 min)

**Whole-replace pattern** (5 min)

```
Recipe edit operations:
  ❌ Diff approach (complex):
     - Compare old vs new
     - Compute add/remove/update
     - Handle each separately

  ✅ Whole-replace (simple):
     1. DELETE all recipe items for product
     2. CREATE all new items
     3. (atomic in transaction)

Trade-off:
  + Simple to implement + reason about
  + Idempotent (run twice = same state)
  - No granular audit (which items changed)
  
  Course choice: simple wins for MVP
```

📢 **HTTP semantic**: PUT (replace entire resource) vs PATCH (partial). Recipe = PUT

### 🖥️ Live Demo (~15 min)

**1. RecipesService** (Task 4.1 — 7 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough**:
```ts
return this.prisma.$transaction(async (tx) => {
  // 1. Verify product exists
  // 2. Verify all ingredients exist
  // 3. DELETE all current recipe items for productId
  // 4. INSERT new items
  // 5. Return new state
});
```

> "ทุกอย่างใน 1 transaction. ถ้า INSERT fail → DELETE rolled back, recipe เดิมยังอยู่"

**2. RecipesController** (Task 4.2 — 4 min)

(พิมพ์ตาม Plan)

📢 **เน้น PUT semantics**:
```ts
@Put('product/:productId')
set(@Param('productId') productId: string, @Body() items) {
  return this.service.setRecipe(productId, items);
}
```

> "PUT = replace whole resource. ตรงนิยาม"

**3. ทดสอบ Postman** (Task 4.4 — 4 min)

```bash
PUT /api/inventory/recipes/product/<latte-id>
[
  { ingredientId: <coffee-id>, quantity: 18 },
  { ingredientId: <milk-id>, quantity: 200 }
]
# → recipe items

GET /api/inventory/recipes/product/<latte-id>
# → array with ingredient details
```

DBeaver:
```sql
SELECT * FROM recipe_items;  -- 2 rows
```

Commit:
```bash
git commit -m "feat(api): Recipe module with whole-replace"
```

### ❓ Common Questions (Block B)

| Q | A |
|---|---|
| Recipe versioning? | Course skip. Stretch: add `version` field, immutable history |
| ลบ ingredient ที่อยู่ใน recipe? | onDelete: Restrict — fail. Need delete recipe items first (course = manual) |
| สูตรซ้ำ (latte กับ ice latte ใช้ recipe เดียวกัน)? | Whole-replace each separately. Or share via "recipe template" pattern (stretch) |

---

## ⭐ Block C: Order COMPLETED → Atomic Stock Deduct + COGS (70-110 min, 40 min)

### 🎯 Block Goals (THE WEEK 5 CENTERPIECE)
- เข้าใจ atomic transaction ที่แตะ 4 tables
- Decimal arithmetic for COGS calculation
- Handle missing recipe gracefully (warn but don't break)
- Test multi-table mutations

### 💬 Lecture (~12 min)

**1. The transaction at a glance** (4 min)

วาดบนกระดาน (ใช้กระดานเต็ม):

```
Order status: READY → COMPLETED
        │
        ▼
  ┌─────────────────────────┐
  │ For each OrderItem:     │
  │                          │
  │ 1. Find product recipe   │
  │ 2. Calculate COGS:       │
  │    sum(qty × cost)       │
  │ 3. UPDATE OrderItem      │
  │    SET cogsSnapshot      │
  │ 4. For each ingredient:  │
  │    a. INSERT             │
  │       stock_movement     │
  │       (-qty, SALE)       │
  │    b. UPDATE ingredient  │
  │       currentStock -=    │
  └─────────────────────────┘
        │
        ▼
  UPDATE Order status, completedAt
        │
        ▼
  COMMIT (or ROLLBACK on any error)
```

📢 **Concrete example**:
```
Order: 2 Latte
Latte recipe: 18g coffee + 200ml milk
Coffee cost: 0.8/g
Milk cost: 0.05/ml

Per Latte:
  COGS = 18 × 0.8 + 200 × 0.05 = 14.4 + 10 = 24.4

Order COGS = 24.4 × 2 = 48.8

Stock movements:
  - coffee: -36g (18 × 2)
  - milk: -400ml (200 × 2)

After transaction:
  OrderItem.cogsSnapshot = 48.8
  Coffee.currentStock -= 36
  Milk.currentStock -= 400
  + 2 stock_movement rows (SALE, refOrderId=order.id)
```

**2. What can go wrong** (3 min)

```
Scenarios:
  ✅ Happy path: 4 tables update, COMMIT
  
  ❌ Recipe missing:
     - log warning
     - cogsSnapshot = 0
     - skip stock deduct
     - DON'T throw (let order complete)
  
  ❌ Insufficient stock?
     - Course default: allow negative (just log, alert via lowStock)
     - Stretch: throw + reject COMPLETED transition
  
  ❌ DB error mid-transaction:
     - $transaction rolls back ALL writes
     - Order stays at READY (not COMPLETED)
     - Stock not deducted
     - movements not recorded
     - clean state
```

**3. Why log warning instead of throw?** (3 min)
```
"Recipe missing" scenarios:
  - Admin forgot to set recipe
  - Product is a "ค่าเข้า" item (no ingredients)
  - Course "test" product

If we throw:
  - Order stuck at READY
  - Customer can't get receipt
  - Staff blocked

If we log warning:
  - Order completes (customer happy)
  - Admin sees log → fixes recipe later
  - cogsSnapshot=0 visible in reports → flag for fix

  → choose graceful degradation
```

**4. Decimal precision detail** (2 min)
```ts
// In code:
const totalAmount = Number(r.quantity) * item.qty;
const cost = Number(r.ingredient.costPerUnit) * totalAmount;

// Number() called once at boundary
// Multiplication uses JS number — close-enough precision for ฿
// (For exact precision: use decimal.js — Tier 2 stretch)
```

### 🖥️ Live Demo (~28 min)

**1. ขยาย OrdersService.updateStatus** (Task 5.1 — 18 min)

(พิมพ์ทุกบรรทัดตาม Plan — slow + explain ทุก step)

**Step-by-step**:

```ts
async updateStatus(id: string, input: UpdateOrderStatusInput) {
  return this.prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },   // need items[] for stock deduct
    });
    // ... validation
    
    if (input.status === 'COMPLETED') {
      data.completedAt = new Date();
      await this.deductStockAndSnapshotCogs(tx, order);  // ⭐
    }
    
    return tx.order.update({ ... });
  });
}
```

📢 **Pause to emphasize**: "พิมพ์ `deductStockAndSnapshotCogs(tx, order)` — ส่ง `tx` เข้าไป (ห้ามใช้ `this.prisma` ภายใน)"

**deductStockAndSnapshotCogs implementation** (พิมพ์ตาม Plan):

📢 **Walk through each step**:

1. **Fetch all recipes**:
```ts
const productIds = order.items.map((i) => i.productId);
const recipes = await tx.recipeItem.findMany({
  where: { productId: { in: productIds } },
  include: { ingredient: true },
});
```
> "1 query รวมทุก product ใน order. ดีกว่า N queries"

2. **Group by productId** (for fast lookup):
```ts
const recipesByProduct = new Map();
for (const r of recipes) {
  if (!recipesByProduct.has(r.productId)) {
    recipesByProduct.set(r.productId, []);
  }
  recipesByProduct.get(r.productId)!.push(r);
}
```
> "Map = O(1) lookup. แทนที่ scan ทุก recipe สำหรับแต่ละ orderItem"

3. **Loop through OrderItems**:
```ts
for (const item of order.items) {
  const recipe = recipesByProduct.get(item.productId) ?? [];
  if (recipe.length === 0) {
    this.logger.warn(...);
    await tx.orderItem.update({
      where: { id: item.id },
      data: { cogsSnapshot: 0 },
    });
    continue;   // skip to next item
  }
  
  let cogsTotal = 0;
  
  for (const r of recipe) {
    const totalAmount = Number(r.quantity) * item.qty;
    const ingredientCost = Number(r.ingredient.costPerUnit) * totalAmount;
    cogsTotal += ingredientCost;
    
    // 4. Insert stock movement (SALE)
    await tx.stockMovement.create({
      data: {
        ingredientId: r.ingredientId,
        quantity: -totalAmount,
        reason: 'SALE',
        refOrderId: order.id,
        costAtTime: r.ingredient.costPerUnit,
        note: `Order ${order.id}`,
      },
    });
    
    // 5. Update cached currentStock
    await tx.ingredient.update({
      where: { id: r.ingredientId },
      data: { currentStock: { decrement: totalAmount } },
    });
  }
  
  // 6. Snapshot COGS
  await tx.orderItem.update({
    where: { id: item.id },
    data: { cogsSnapshot: cogsTotal },
  });
}
```

> "ทุก operation ใช้ `tx`. ถ้าตรงไหน fail → ทั้ง transaction rollback. Order stays at READY, stock unchanged"

**2. Tests** (Task 5.2 — 6 min)

(พิมพ์ tests ตาม Plan — focus 2 tests สำคัญ:
- คำนวณ COGS ถูก + stock movements
- Recipe ไม่มี → warn + cogsSnapshot=0)

```bash
pnpm --filter @coffee/api test
# 19+ tests
```

**3. End-to-end demo** (Task 5.4 — 4 min)

DBeaver windows: orders, order_items, ingredients, stock_movements

1. Place order: 2 Latte (via storefront)
2. Staff: PENDING → PREPARING → READY
3. **กด READY → COMPLETED** — pause, ทุกคนดู DBeaver
4. Refresh DBeaver:
   - `orders.completed_at` populated
   - `order_items.cogs_snapshot` populated (e.g., 48.8 หรือใกล้)
   - `ingredients.current_stock` ลด (coffee -36, milk -400)
   - `stock_movements` มี 2 rows ใหม่ (reason=SALE, refOrderId=...)

📢 **"Magic moment"**: ทุกอย่าง update พร้อมกันใน 1 transaction

Commit:
```bash
git commit -m "feat(api): order COMPLETED → atomic stock deduct + COGS"
```

### ❓ Common Questions (Block C)

| Q | A |
|---|---|
| ทำไม `decrement: totalAmount` แทน `set:`? | atomic — หลาย transactions อาจชนกัน. `decrement` = "ลด N" ที่ DB level (atomic ใน Postgres) |
| ทำไม insert stock_movement หลัง update ingredient? | ลำดับใน $transaction ไม่สำคัญ — atomic ทั้งหมด. ที่สำคัญ: ใช้ `tx` consistent |
| ถ้า stock เหลือ 10g แต่ order ใช้ 36g? | Course default: allow negative (currentStock = -26). Stretch: throw + cancel order |
| Decimal precision drift over thousand orders? | Course = OK with JS number. Real prod = decimal.js |

---

## 🏁 Wrap-up + Homework (110-120 min, 10 min)

### Recap (3 min)
- "Atomic transaction in COMPLETED — กี่ tables?"
- "Recipe missing — handle ยังไง?"
- "currentStock = source of truth?"

### Homework (5 min)

📦 **Required** (~3 hrs)

1. **Setup full data**:
   - 5+ ingredients (coffee, milk, sugar, cup, sleeve, etc.)
   - PURCHASE initial stock for all
   - Set recipes for all products (Latte, Espresso, Croissant)

2. **Stress test stock deduct**:
   - Place 5+ orders, complete each
   - Verify ingredients stock matches expected (manual calc)
   - Inspect stock_movements table — should have N rows per order × ingredients

3. **Pre-build IngredientList** (preview Session 2):
   - Skeleton page at /admin/inventory
   - Display ingredients in table (no CRUD form yet)

📚 **Reading** (~30 min)
- [Recharts docs — LineChart](https://recharts.org/en-US/api/LineChart)
- [Prisma docs — groupBy](https://www.prisma.io/docs/orm/reference/prisma-client-reference#groupby)

### Q&A (2 min)

---

## 📝 Post-Session Self-Review (instructor)

| Item | Note |
|---|---|
| Atomic transaction concept ติดที่ใคร? | ___ |
| ใครยังไม่ดู DBeaver ตอน demo? | ___ |
| Decimal precision concept clear? | ___ |
| Block C ใช้เวลามากกว่า 40 นาทีไหม? | ___ |
| Energy ห้องโดยรวม | low / medium / high |
