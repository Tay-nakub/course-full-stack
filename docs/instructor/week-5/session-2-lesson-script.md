# Week 5 Session 2 — Reports + Admin UI

**Week:** 5
**Session:** 2 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 5 Session 1 complete (atomic stock deduct working)
**Covers:** Tasks 6-10 of [Week 5 Plan](../../superpowers/plans/2026-05-08-week-5-inventory-reports.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:
- ✅ Reports backend: daily, top-products, low-stock, revenue chart
- ✅ Admin Inventory UI (ingredients + stock movement entry)
- ✅ Recipe Editor UI (per product)
- ✅ Reports dashboard with KPIs + Recharts chart
- ✅ Seed script for repeatable dev environment

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify Session 1 atomic deduct working ทุกคน (ขอ screenshot DBeaver)
- [ ] Demo data: ingredients + recipes + completed orders มีพอใน DB
- [ ] Recharts docs tab open
- [ ] DBeaver order_items + ingredients ready

---

## 🗓️ Time-Blocked Agenda

| Time | Block | Activity |
|---|---|---|
| 0-10 | **Recap + Verify** | Atomic deduct working ทุกคนหรือยัง? |
| **10-30** | **Block D** | **Reports backend** |
| **30-65** | **Block E** | **Inventory + Recipe UI** |
| **65-110** | **Block F** | **Reports dashboard + Recharts** |
| **110-115** | **Block G** | **Seed script** |
| 115-120 | Wrap-up | Week 6 preview |

---

## 🟢 Recap + Verify (0-10 min)

### Recap (3 min)
- "Atomic transaction COMPLETED แตะกี่ tables?"
- "Recipe missing — ทำไม log warn ไม่ throw?"
- "currentStock = cache. Source of truth = ?"

### Verify Session 1 worked (7 min)

ขอ student ทำพร้อมกัน:
1. Postman → place order → COMPLETED
2. DBeaver → check 4 tables update
3. Snap photo / screenshot

ถ้า ใครไม่ผ่าน → 1-on-1 หลังคลาส (Block ต่อๆ ไป assume Session 1 work)

---

## 📊 Block D: Reports Backend (10-30 min, 20 min)

### 🎯 Block Goals
- Daily summary: revenue, COGS, gross profit, margin
- Aggregations: top products (groupBy), low stock alerts, revenue chart

### 💬 Lecture (~5 min)

**Aggregation strategies** (5 min)

```
Need 4 different aggregations for reports:

1. Daily summary (single row):
   → fetch orders WHERE completed_at = today
   → loop in JS, sum

2. Top products:
   → groupBy productId, _sum: { qty }
   → orderBy _sum desc, take 5

3. Low stock:
   → fetch all ingredients
   → filter currentStock <= minStock

4. Revenue chart (date series):
   → date_trunc('day') in SQL
   → groupBy day
   → → use $queryRaw
```

📢 **When to use $queryRaw**:
> "Prisma `groupBy` ไม่ support truncate date (group ทุก ms). ใช้ raw SQL พอ — ปลอดภัยถ้า parameterize อย่างถูกต้อง"

### 🖥️ Live Demo (~15 min)

**1. ReportsService — daily** (Task 6.1 — 5 min)

(พิมพ์ตาม Plan)

📢 **อธิบาย date range**:
```ts
const start = new Date(targetDate);
start.setHours(0, 0, 0, 0);          // floor to midnight
const end = new Date(start);
end.setDate(end.getDate() + 1);      // next midnight

where: {
  completedAt: { gte: start, lt: end },   // half-open [start, end)
}
```

> "`gte/lt` = `>=/<` Half-open interval. Standard for time ranges"

**2. topProducts (Prisma groupBy)** (Task 6.1 — 4 min)

```ts
const grouped = await this.prisma.orderItem.groupBy({
  by: ['productId', 'productName'],   // multi-key group
  where: { order: { status: 'COMPLETED', completedAt: { gte: since } } },
  _sum: { qty: true, lineTotal: true },
  orderBy: { _sum: { qty: 'desc' } },
  take: limit,
});
```

📢 **เน้น nested where**: `where: { order: { status: ... } }` — Prisma queries via relation. SQL = JOIN

**3. revenueLastDays ($queryRaw)** (Task 6.1 — 4 min)

```ts
const rows = await this.prisma.$queryRaw<{ date, revenue, cogs }[]>`
  SELECT
    TO_CHAR(date_trunc('day', completed_at), 'YYYY-MM-DD') as date,
    SUM(total)::float as revenue,
    ...
  FROM orders
  WHERE status = 'COMPLETED' AND completed_at >= ${since}
  GROUP BY date_trunc('day', completed_at)
  ORDER BY date ASC;
`;
```

📢 **Security note**:
> "Template literal + `${since}` = parameterized. Prisma escape อัตโนมัติ. **ห้าม** string concat (`'+date+'`) — SQL injection"

**4. Reports Controller** (Task 6.2 — 2 min)

(พิมพ์ตาม Plan — ทุก endpoint admin only)

Commit:
```bash
git commit -m "feat(api): Reports backend with aggregations and raw SQL"
```

### ❓ Common Questions (Block D)

| Q | A |
|---|---|
| `groupBy` กับ `aggregate` ต่างไง? | groupBy = multi-row results (per group). aggregate = single result (overall) |
| ต้อง index `completed_at` ไหม? | ใช่ — Week 4 มี `@@index([createdAt])` แต่ completedAt ไม่มี. Stretch: add index |
| `$queryRaw` returns string instead of number? | Postgres SUM ของ Decimal returns string. ใช้ `::float` cast หรือ Number() ใน TS |

---

## 🎨 Block E: Inventory + Recipe UI (30-65 min, 35 min)

### 🎯 Block Goals
- Admin Inventory list + form + stock movement entry
- Recipe Editor (per product, dialog from menu page)
- Apply pattern เดียวกับ Week 3 Categories

### 🖥️ Live Build (~35 min — instructor demo Inventory, students build Recipe in parallel)

**1. /admin/inventory page + IngredientList** (Task 7.1-7.2 — 12 min)

(พิมพ์ตาม Plan)

📢 **Highlight pattern**:
- `useQuery(['ingredients'])` → list
- `useMutation` for delete + invalidate
- 3 dialogs: create, edit, stock movement
- Row visual: low stock = red bg

**2. IngredientForm** (Task 7.3 — 5 min)

(พิมพ์ตาม Plan — RHF + Zod + select for unit)

📢 **เน้น unit select**:
```tsx
<select {...register('unit')}>
  {INGREDIENT_UNITS.map((u) => (
    <option key={u} value={u}>{INGREDIENT_UNIT_LABELS[u]}</option>
  ))}
</select>
```

> "Reuse INGREDIENT_UNITS const from shared package — single source"

**3. StockMovementForm** (Task 7.4 — 5 min)

(พิมพ์ตาม Plan)

📢 **UX detail**:
- Reason → auto-sign quantity
- Hint label changes per reason ("จะลด stock" / "จะเพิ่ม stock")

**4. Update sidebar + ทดสอบ** (Task 7.5-7.6 — 3 min)

```tsx
<Link href="/admin/inventory">วัตถุดิบ</Link>
<Link href="/admin/reports">รายงาน</Link>
```

Test:
1. Create ingredient
2. PURCHASE 1000 ml
3. WASTE 50 ml → verify -50 stored, currentStock = 950

Commit:
```bash
git commit -m "feat(web): admin Inventory UI"
```

**5. RecipeEditor — students build with instructor support** (Task 8 — 10 min)

📢 **บอก class**:
> "Recipe editor = pattern คล้ายๆ Categories แต่มี Map ของ ingredients. ผมพิมพ์ scaffold, คุณเติม submit logic"

Walk around ดูใครติด. Common issues:
- `useEffect` ไม่ sync state with fetched recipe
- Quantity input value/onChange ผิด
- Missing ingredient list useQuery

ปลายๆ — instructor พิมพ์ finish + commit

```bash
git commit -m "feat(web): RecipeEditor"
```

---

## 📈 Block F: Reports Dashboard + Recharts (65-110 min, 45 min)

### 🎯 Block Goals
- KPI cards (5 metrics)
- Revenue line chart with Recharts
- Top products table
- Low stock alerts banner

### 💬 Lecture (~7 min)

**Recharts pattern** (5 min)

```tsx
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="date" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="revenue" stroke="#2563eb" />
    <Line type="monotone" dataKey="cogs" stroke="#ea580c" />
    <Line type="monotone" dataKey="grossProfit" stroke="#16a34a" />
  </LineChart>
</ResponsiveContainer>
```

📢 **Key concepts**:
- Wrap with `ResponsiveContainer` — adapt to parent
- `dataKey` = field name in data array
- `stroke` = line color (Tailwind hex)
- Multiple Lines = overlay metrics

**Polling refresh strategy** (2 min)

```ts
useQuery({
  queryKey: ['reports', 'daily'],
  refetchInterval: 30_000,   // KPI cards
});

useQuery({
  queryKey: ['reports', 'low-stock'],
  refetchInterval: 60_000,   // alerts (less frequent)
});
```

> "KPI = high frequency (30s). Low stock = OK every minute. Different freshness needs"

### 🖥️ Live Build (~38 min)

**1. Install Recharts** (Task 9.1 — 1 min)

```bash
cd apps/web
pnpm add recharts
```

**2. KpiCards** (Task 9.2 — 8 min)

(พิมพ์ตาม Plan)

📢 **เน้น dynamic color**:
```tsx
{
  label: 'อัตรากำไร',
  color: data.grossMarginPct >= 50 ? 'text-green-700 bg-green-50' : 'text-yellow-700 bg-yellow-50',
}
```

> "Margin >= 50% = healthy = green. Below = warning = yellow"

**3. RevenueChart** (Task 9.3 — 12 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough**:
- Fetch revenue-last-days endpoint
- Pass data to LineChart
- 3 lines (revenue, cogs, grossProfit)
- Empty state + loading

**4. TopProductsTable** (Task 9.4 — 8 min)

(พิมพ์ตาม Plan — straightforward useQuery + table)

**5. LowStockAlerts** (Task 9.4 — 5 min)

(พิมพ์ตาม Plan — conditional banner)

📢 **เน้น empty state**:
> "ถ้าไม่มี low stock → green banner ('Stock ทุกตัวอยู่ในเกณฑ์'). ถ้ามี → red banner with list. UI เห็นชัดทันที"

**6. Reports page (compose)** (Task 9.5 — 2 min)

(พิมพ์ Plan — compose 4 components)

**7. ทดสอบ end-to-end** (Task 9.6 — 2 min)

1. /admin/reports
2. ตรวจ KPI numbers ตรงกับที่คำนวณเอง
3. Revenue chart แสดง 7 วัน
4. Top products แสดง orderBy qty desc
5. Low stock alerts (อาจจะว่าง ถ้าไม่ตั้ง minStock สูง)

Commit:
```bash
git commit -m "feat(web): Reports dashboard"
```

### ❓ Common Questions (Block F)

| Q | A |
|---|---|
| ResponsiveContainer ไม่ resize? | Parent ต้อง specify width + height. Or set explicit width on chart |
| Recharts data shape? | `[{ x: 'a', value: 1 }, { x: 'b', value: 2 }]` — array of objects |
| Tooltip Thai chars ผิด? | Add `font-family: 'Sarabun'` ใน CSS or chart props |
| Chart export to image? | Stretch — use `html2canvas` or Recharts `<Surface>` API |

---

## 🌱 Block G: Seed Script (110-115 min, 5 min)

### 🎯 Block Goals
- Seed initial data for fresh dev environment
- Repeatable testing

### 🖥️ Quick Demo (~5 min)

(พิมพ์ตาม Plan Task 10.1-10.3)

📢 **Highlights**:
- `upsert` for idempotency (run twice = same state)
- Hash passwords with bcrypt
- Initial PURCHASE stock movements
- Wired up `pnpm prisma db seed`

```bash
pnpm prisma db seed
```

📢 **Use cases**:
- Reset DB during development
- CI/CD test environment
- Quick demo setup
- Onboarding new developer

Commit:
```bash
git commit -m "feat(api): seed script"
```

---

## 🏁 Wrap-up + Week 6 Preview (115-120 min, 5 min)

### Recap (2 min)
- "groupBy + _sum — what for?"
- "Recharts wrap with what?"
- "seed.ts ใช้ตอนไหน?"

### Week 6 Preview (3 min)

Goal: **DEPLOY!** สิ่งที่เราสร้างมา 5 สัปดาห์ → live บน VPS ของคุณเอง

จะมี:
- 🆕 VPS provisioning (Hetzner CX22)
- 🆕 SSH hardening + ufw + fail2ban
- 🆕 Multi-stage Dockerfiles for web + api
- 🆕 Caddy auto-HTTPS reverse proxy
- 🆕 GitHub Actions CI + deploy
- 🆕 pg_dump backup cron
- 🆕 Healthcheck + monitoring basic

ใช้:
- ทุก feature ที่เขียนมา 5 สัปดาห์
- Seed script (Wk 5) สำหรับ prod fresh start
- Healthcheck (Wk 2) สำหรับ deployment verification

> "Week 5 = ของจริงทำงาน. Week 6 = ของจริงให้คนอื่นใช้ได้"

### Final Q&A
รับคำถาม

---

## 📝 Post-Session Self-Review (instructor)

| Item | Note |
|---|---|
| KPI dashboard ทุกคนเห็น real numbers? | ___ |
| Recharts setup ติดที่ใคร? | ___ |
| Recipe editor — UI complete? | ___ |
| Block ไหน over-run มากสุด? | ___ |
| Pre-Week 6: Docker Desktop installed everyone? | ___ |
