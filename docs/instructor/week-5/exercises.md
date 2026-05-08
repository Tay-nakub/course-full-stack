# Week 5 — Exercises

**Audience:** instructor (with solutions)

---

## 📋 Exercise Map

| # | Type | When | Difficulty | Time |
|---|---|---|---|---|
| **EX-5.1** | In-class | Session 1, Block A end | ⭐⭐ | 5 min |
| **EX-5.2** | In-class | Session 1, Block C end | ⭐⭐⭐ | 7 min |
| **HW-5-mid** | Homework | Between sessions | ⭐⭐⭐ | 3 hrs |
| **EX-5.3** | In-class | Session 2, Block E | ⭐⭐⭐ | 10 min |
| **HW-5-post** | Homework | After Session 2 | ⭐⭐⭐ | 3-4 hrs |
| **HW-5-stretch** | Optional | Anytime | ⭐⭐⭐⭐ | 3-5 hrs |

---

## EX-5.1 — Decimal Precision Quiz

**When**: Session 1, Block A end
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

ตอบคำถาม:

1. JS: `0.1 + 0.2` = ?
2. ทำไมต้องใช้ `Decimal` แทน `Float` สำหรับ money?
3. `Decimal(10, 2)` — max value คือ?
4. ทำไม Prisma return Decimal เป็น string?

### 🟢 Solution

1. `0.30000000000000004` (IEEE 754 floating point)
2. Float drift over many operations. Money requires exact precision (esp. compound: tax, discount, splits)
3. `99,999,999.99` (10 digits total, 2 after decimal)
4. JS Number can't exactly represent some Decimals. String preserves precision. Convert with `Number()` only at display boundary

> **Teaching point**: convert at boundary, calculate in DB when possible

---

## EX-5.2 — Trace the Atomic Transaction

**When**: Session 1, Block C end
**Difficulty**: ⭐⭐⭐
**Time**: 7 min

### Task

Given:
- Order: 3 Croissant
- Croissant recipe: 50g flour + 10g butter
- Flour cost: ฿0.10/g, current stock: 5000g
- Butter cost: ฿0.50/g, current stock: 800g

When status changes READY → COMPLETED:

ตอบ:
1. คำนวณ COGS per Croissant
2. Order COGS total?
3. หลัง transaction:
   - flour.currentStock = ?
   - butter.currentStock = ?
4. กี่ rows สร้างใน stock_movements?
5. ถ้า INSERT stock_movement สำหรับ butter fail → จะเกิดอะไร?

### 🟢 Solution

1. Per Croissant: `50 × 0.10 + 10 × 0.50 = 5.0 + 5.0 = ฿10.0`
2. Order COGS: `10.0 × 3 = ฿30.0`
3. After:
   - flour: `5000 - 150 = 4850g` (50 × 3)
   - butter: `800 - 30 = 770g` (10 × 3)
4. **2 rows** (1 per ingredient × 1 OrderItem). If 2 OrderItems with different products → 2-4 rows.
5. **Rollback**: order stays at READY, stock unchanged, no movements recorded. Clean state.

> **Teaching point**: 2 ingredients × 1 OrderItem = 2 movement rows. Atomic = all or nothing

---

## HW-5-Mid — Setup Full Test Data

**When**: Between Session 1 and 2
**Difficulty**: ⭐⭐⭐
**Time**: ~3 hours

### Task

1. **Create 5+ ingredients** via Postman:
   - เมล็ดกาแฟ (GRAM, ฿0.8/g, minStock 200)
   - นม (MILLILITER, ฿0.05/ml, minStock 1000)
   - น้ำตาล (GRAM, ฿0.02/g, minStock 500)
   - แก้ว (PIECE, ฿2/piece, minStock 50)
   - ฝาแก้ว (PIECE, ฿0.5/piece, minStock 50)

2. **PURCHASE initial stock**:
   - Coffee: 5000g
   - Milk: 10000ml
   - Sugar: 2000g
   - Cup: 100 pieces
   - Lid: 100 pieces

3. **Set recipes** (via PUT):
   - Espresso: 18g coffee + 1 cup + 1 lid
   - Latte: 18g coffee + 200ml milk + 1 cup + 1 lid
   - Cappuccino: 18g coffee + 150ml milk + 1 cup + 1 lid
   - Americano: 18g coffee + 1 cup + 1 lid (basic — same as espresso)

4. **Stress test**:
   - Place 5 orders (mix of products)
   - Complete each
   - Manual calc expected stock + COGS
   - Compare with DB
   - Document discrepancies (should be 0!)

5. **Pre-build inventory list** (preview):
   - `/admin/inventory` page with `useQuery` displaying ingredients
   - Just table, no CRUD yet

### Acceptance Criteria
- [ ] All 5 ingredients in DB with correct stock after PURCHASE
- [ ] All recipes set
- [ ] After 5 orders completed: stock matches manual calc
- [ ] No "recipe missing" warnings in API logs

### 🟢 Solution
ดู Plan Tasks 7-8 สำหรับ UI

### Common Mistakes
- ลืม PURCHASE → currentStock = 0 → orders complete แต่ stock = -36 etc.
- ใส่ recipe quantity เป็น string ไม่ใช่ number → Zod fail
- Recipe missing สำหรับบาง product → log warning + cogsSnapshot=0 (acceptable but flag in HW)

---

## EX-5.3 — Build Recipe Editor

**When**: Session 2, Block E (live in-class)
**Difficulty**: ⭐⭐⭐
**Time**: 10 min

### Task

ทำ RecipeEditor component (instructor demos scaffold, students complete submit):

- Receives `product: Product` prop
- Displays current recipe items (fetch via `useQuery`)
- Allow add/remove ingredient rows
- Each row: ingredient name + quantity input
- "บันทึกสูตร" button submits PUT (whole-replace)
- onSuccess: invalidate cache + close

### 🟢 Solution
ดู Plan Task 8 — full code

### Hints (when stuck)
- "Use `useEffect` to sync existing recipe → state"
- "Available ingredients = all ingredients - those already in current rows"
- "Submit body = array of { ingredientId, quantity }"

### Common Mistakes
- Submit ส่งแค่ rows ที่ไม่ว่าง (incorrect — empty rows allowed during edit, filter on submit)
- Quantity = 0 — Zod fail (`.positive()`)
- Forget useEffect → form starts empty even if recipe exists

---

## HW-5-Post — Charts + Recipe UI Polish

**When**: After Session 2
**Difficulty**: ⭐⭐⭐
**Time**: ~3-4 hrs
**Deliverable**: PR `week5-homework`

### Required

1. **Improve RevenueChart**:
   - Add area gradient under line (LineChart → AreaChart)
   - Show ฿ format on Y-axis (Tooltip + tickFormatter)
   - Tooltip shows formatted Thai date

2. **Add COGS breakdown table** to /admin/reports:
   - Per ingredient: quantity used (last 7 days), cost
   - Sort by cost desc
   - New endpoint: GET /reports/ingredient-usage

3. **Recipe Editor enhancement**:
   - Show "estimated cost per product" — sum quantities × ingredient.costPerUnit
   - Compare with product.price → show margin %
   - Visual: red if margin < 30%, green if ≥ 50%

### 🟢 Solution sketch

**AreaChart**:
```tsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
    </linearGradient>
  </defs>
  <YAxis tickFormatter={(v) => `฿${v.toLocaleString()}`} />
  <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#revenue)" />
</AreaChart>
```

**Ingredient usage endpoint**:
```ts
async ingredientUsage(days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return this.prisma.stockMovement.groupBy({
    by: ['ingredientId'],
    where: {
      reason: 'SALE',
      createdAt: { gte: since },
    },
    _sum: { quantity: true },
  });
  // Then join with ingredient + cost
}
```

**Recipe cost preview**:
```tsx
const ingredients = useQuery({...});
const estimatedCost = rows.reduce((s, r) => {
  const ing = ingredients.find((i) => i.id === r.ingredientId);
  return s + (ing ? Number(ing.costPerUnit) * r.quantity : 0);
}, 0);
const margin = product.price - estimatedCost;
const marginPct = (margin / product.price) * 100;
```

### Acceptance Criteria
- [ ] Chart polished (gradient + formatted)
- [ ] Ingredient usage table working
- [ ] Recipe editor shows estimated COGS + margin

---

## HW-5-Stretch — Optional Challenges

**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Stock Reorder Suggestion (3 hrs)
- Algorithm: predict avg daily usage from last 14 days
- Suggest reorder amount: (target days × avg daily) - current stock
- Show on inventory page next to low stock alert
- Endpoint: GET /reports/reorder-suggestions

### Stretch 2: Cost Variance Tracking (2 hrs)
- When admin updates ingredient `costPerUnit` → log price change
- New table `ingredient_price_history`
- Reports show how cost changes affect margin
- Admin sees price history line chart

### Stretch 3: Recipe Versioning (4 hrs)
- Make RecipeItem immutable history (don't delete on update)
- Add `version` field, `replacedAt` field
- Order COGS uses recipe version active at order time
- Important for: "ดูสูตรเก่าตอนคำนวณกำไรเดือนก่อน"

### Stretch 4: Real-time Reports with SSE (3 hrs)
- NestJS SSE endpoint streams report updates
- FE subscribes via EventSource
- KPI cards update instantly when order completes
- vs polling: less latency, less server load

---

## 📤 Student-Facing Format

ก่อนแชร์ — strip solutions
