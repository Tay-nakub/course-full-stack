# Week 4 — Pitfalls & FAQ

**Audience:** instructor — เปิดตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls

### Pitfall #1: ใช้ `prisma` แทน `tx` ใน $transaction callback

**Symptom**: Transaction ดูทำงาน แต่ partial state เกิดถ้า error ตอนกลาง

**Cause**:
```ts
return this.prisma.$transaction(async (tx) => {
  const products = await tx.product.findMany(...);
  
  const order = await this.prisma.order.create(...);  // ❌ ใช้ this.prisma
  // ↑ query นี้ไม่อยู่ใน transaction
});
```

**Fix**: ใช้ `tx` consistently ภายใน callback:
```ts
const order = await tx.order.create(...);  // ✅
```

**Teaching point**: "Inside `$transaction` callback, only use `tx`. ใช้ `this.prisma` = leak ออกจาก transaction"

---

### Pitfall #2: orderNumber ซ้ำ (race condition)

**Symptom**: 2 user create order พร้อมกัน → 1 success, 1 fail (orderNumber unique violation)

**Cause**: Random generation + check ไม่ atomic, หรือ sequential count + insert ไม่ atomic

**Fix options**:
1. **Random + retry** (simple):
   ```ts
   for (let attempt = 0; attempt < 5; attempt++) {
     try {
       const orderNumber = randomOrderNumber();
       return await tx.order.create({ data: { orderNumber, ... } });
     } catch (e) {
       if (e.code === 'P2002') continue;  // unique violation, retry
       throw e;
     }
   }
   ```
2. **Sequential + transaction** (HW-4-Post solution):
   ```ts
   await prisma.$transaction(async (tx) => {
     const count = await tx.order.count({ where: { ... today } });
     const orderNumber = `#${dateStr}-${count+1}`;
     return tx.order.create({ ... });
   }, { isolationLevel: 'Serializable' });
   ```

**Teaching point**: Course default uses random — collision rate low. Production: sequential with serializable isolation

---

### Pitfall #3: Cart ไม่ persist หลัง refresh

**Symptom**: Add to cart → refresh → cart empty

**Common causes**:
1. ลืม `persist` middleware
2. SSR mismatch — cart hydrated เปล่าก่อนล่ะ load จาก localStorage
3. localStorage disabled (incognito strict mode)

**Fix**:
```ts
import { persist } from 'zustand/middleware';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({ ... }),
    { name: 'coffee-cart' },
  ),
);
```

**Debug**:
- DevTools → Application → Local Storage → check key `coffee-cart`
- ถ้าไม่มี → persist ไม่ทำงาน
- ถ้ามี แต่ refresh เป็น empty → hydration issue

**SSR mismatch fix** (rare):
```tsx
const [hydrated, setHydrated] = useState(false);
useEffect(() => setHydrated(true), []);
if (!hydrated) return null;
```

---

### Pitfall #4: Polling ไม่ stop ตอน status terminal

**Symptom**: Tracking page polls forever, even after COMPLETED

**Cause**: ใช้ static `refetchInterval: 5000` แทน function form

**Fix**:
```ts
refetchInterval: (query) => {
  const status = query.state.data?.status;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;
  return 5000;
},
```

---

### Pitfall #5: Server total ≠ FE display total

**Symptom**: User กรอกจำนวน + display total ฿180. กดสั่ง — server return total ฿200

**Cause**:
- Admin เปลี่ยน price ตอน user กำลัง shop (cart store has stale price)
- FE display ใช้ stale price; server recalculates

**Course behavior**: Server total = source of truth. UX issue — user might be surprised

**Better UX (stretch)**:
1. After cart load: re-fetch products → update cart prices if changed
2. Show toast "ราคามีการเปลี่ยนแปลง — โปรดตรวจสอบ"
3. Ask user to confirm new price

---

### Pitfall #6: Cart cleared but redirect fail

**Symptom**: After place order, cart empty + spinning forever (no redirect)

**Cause**:
1. `router.push` ไม่ทำงาน เพราะ Server Component
2. mutation.onSuccess ก่อนส่ง response complete
3. Order ID undefined ใน response

**Debug**:
```ts
onSuccess: (order) => {
  console.log('order:', order);  // verify shape
  if (!order?.id) {
    console.error('no order id');
    return;
  }
  clear();
  router.push(`/order/${order.id}`);
},
```

---

### Pitfall #7: Kitchen UI ไม่ refresh เมื่อ status เปลี่ยน

**Symptom**: Click "รับออเดอร์" → 200 response แต่ card ไม่ย้ายคอลัมน์

**Causes**:
1. ลืม `qc.invalidateQueries({ queryKey: ['orders'] })` ใน onSuccess
2. queryKey mismatch (query uses `['orders', { activeOnly: true }]` แต่ invalidate `['orders']`)

**Fix**: Invalidate root key:
```ts
qc.invalidateQueries({ queryKey: ['orders'] });
// ↑ matches all variants: ['orders'], ['orders', filter], etc.
```

> "TanStack Query invalidate matches by prefix. `['orders']` invalidates `['orders', X]` too"

---

### Pitfall #8: Multiple staff change status simultaneously → race

**Symptom**: 2 staff click "ทำเสร็จ" → both 200 (race condition? Or guaranteed?)

**Actual behavior**: NestJS state machine catches second one:
- Staff A: PENDING → PREPARING (success)
- Staff B (clicks 1ms later): tries PENDING → PREPARING but order is already PREPARING → throws ConflictException

**UX**: Staff B sees error alert. Acceptable for course.

**Better (stretch)**: Optimistic lock with version field:
```prisma
model Order {
  version Int @default(0)
  // ...
}
```
Update only if version matches; increment on each update.

---

### Pitfall #9: Decimal price = string in JSON

**Symptom**: Cart subtotal shows `"75" + "65"` = `"7565"` (concatenation)

**Cause**: Prisma `Decimal` serializes to JSON as string. `Number(p.price)` not done

**Fix** ทุกที่ที่ใช้ price:
```tsx
{`฿${Number(item.unitPrice) * item.qty}`}
```

หรือ convert ตอน fetch:
```ts
const products = await this.prisma.product.findMany();
return products.map((p) => ({ ...p, price: Number(p.price) }));
```

---

### Pitfall #10: Middleware redirect loop ตอน /kitchen → /login

**Symptom**: Visit `/kitchen` → /login → /kitchen → loop

**Cause**: middleware matcher กว้างเกิน (จับ /login ด้วย)

**Fix**: Verify matcher:
```ts
matcher: ['/admin/:path*', '/kitchen/:path*'],
```

Login + storefront ไม่ควรอยู่ใน list.

---

## ❓ Extended FAQ

### Atomic Transactions

**Q: `$transaction` กับ `$transaction(async (tx) => ...)` ต่างกันไง?**
A:
- Array form: `prisma.$transaction([query1, query2])` — sequential, all-or-nothing
- Interactive form: `prisma.$transaction(async (tx) => ...)` — full control, conditional logic OK

**Q: nested write `items: { create: [...] }` กับ explicit loop ต่างไง?**
A:
- Nested write: 1 SQL (compiled by Prisma) — faster, atomic implicit
- Explicit loop: N+1 SQL — needs explicit transaction

**Q: Transaction timeout?**
A: Default 5 sec. Long transactions (e.g., bulk import) → increase: `{ timeout: 30000 }`

**Q: Read-only transaction?**
A: Course skip — Postgres SET TRANSACTION READ ONLY. Performance hint only

---

### State Machines

**Q: Why declarative VALID_TRANSITIONS map vs nested if?**
A:
- Map = visual, easy to extend
- Add new state = add new entry
- Document business rules in 1 place

**Q: State machine in DB or in code?**
A: Course = code (simple). Production: state machine library (XState) or DB triggers (heavy)

**Q: Can transitions have side effects?**
A: Yes — `paidAt` set on PENDING→PREPARING. `completedAt` on READY→COMPLETED. Add carefully

---

### Zustand

**Q: Zustand vs `useState` for global state?**
A:
- `useState` = local component state. Pass via props/context for sharing
- Zustand = global, accessible from any component, no prop drilling

**Q: Multiple Zustand stores?**
A: ใช้ได้. Course = 1 store (cart). Big apps: separate stores per domain

**Q: Selector ทำให้ component ไม่ re-render?**
A: ใช่ — re-renders only when **selected value** changes. ใช้ `useCart((s) => s.items)` re-renders เมื่อ items เปลี่ยน

**Q: Store ใน SSR?**
A: Zustand SSR-safe. Initial state same on server + client. Persist hydrates after mount

---

### Polling

**Q: Polling vs WebSocket — เลือกไง?**
A:
- Scale: 1-shop, 100s req/min = polling OK
- Real-time critical: WebSocket
- Simple debug: polling
- Mobile battery: WebSocket better

**Q: Polling rate trade-off?**
A:
- 5 sec = good UX, moderate load
- 1 sec = aggressive, high load
- 30 sec = light load, sluggish UX
- Course default 5 sec — balance

**Q: Server-Sent Events alternative?**
A: SSE = one-way push from server. Simpler than WebSocket, fits "broadcast updates" pattern. Stretch alternative

---

### Order Domain

**Q: Soft delete vs hard delete order?**
A: Course = hard delete (CASCADE). Real-world: soft delete (`deletedAt: DateTime?`) + filter queries

**Q: Order modification after place?**
A: Course = no edit. Real apps: separate `OrderEdit` model with audit trail

**Q: Tax calculation?**
A: Course skip (`subtotal === total`). Real apps: tax calc per item × tax rate, store breakdown

**Q: Discount/promo?**
A: Stretch — `discount` field on Order. Promo code validation = separate service

---

## 🆘 Emergency Recovery

### Reset Order Data

```bash
docker exec coffee-postgres-dev psql -U coffee -d coffee -c "TRUNCATE order_items, orders CASCADE;"
```

### Cart Stuck (localStorage corrupt)

```js
// Browser console
localStorage.removeItem('coffee-cart');
location.reload();
```

### Tracking Page 404 After Place Order

- Check Network tab → POST /orders response
- Verify response has `id` field
- Check redirect URL: `/order/<id>` exists in app router

---

## 📊 Common Mistakes Heatmap (อัปเดตหลังสอน)

| Mistake | Frequency | Notes |
|---|---|---|
| Use `this.prisma` inside `$transaction` | TBD | — |
| Static refetchInterval | TBD | — |
| Missing invalidateQueries | TBD | — |
| Decimal as string in JSON | TBD | — |
| Middleware matcher too broad | TBD | — |
