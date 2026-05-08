# Week 4 — Assessment Checklist

**Audience:** instructor — diagnostic, not exam

---

## 🎯 Pass Criteria

Student "พร้อม" เข้า Week 5 ถ้า:
- ✅ Verbal Q ≥ 7/10
- ✅ End-to-end demo: customer place → kitchen advance → tracking auto-update
- ✅ HW-4-Post PR pass acceptance criteria

ถ้า ≤ 6/10 → 1-on-1 ก่อน Week 5 (Week 5 build บน atomic transaction pattern)

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Q1 — Atomic transaction
> "ใน order create, ทำไมต้อง `$transaction`?"

**Acceptable**: Multi-step (validate + create order + create items). ถ้า step ใดล้ม → rollback. กัน partial state corrupt

### Q2 — Server-side total
> "ทำไม FE ห้ามส่ง total/subtotal มาเพื่อ insert?"

**Acceptable**: Security — FE ส่ง `{ total: 1 }` ก็ได้ → server ต้องคำนวณเอง จาก price ใน DB

### Q3 — Snapshot pattern
> "OrderItem มี productName + unitPrice ทำไมต้อง snapshot ทั้งที่ join product ก็ได้?"

**Acceptable**: Historical accuracy — admin เปลี่ยน price/name หลังจากนั้น order เก่ายังควรแสดงข้อมูลเดิม

### Q4 — State machine
> "ทำไมต้องมี VALID_TRANSITIONS map ใน updateStatus?"

**Acceptable**: ป้องกัน invalid transitions (PENDING→READY skip step, COMPLETED→PREPARING undo). Business rule ที่ DB ไม่จับ

### Q5 — `tx` vs `prisma`
> "ใน `$transaction(async (tx) => ...)`, ใช้ `this.prisma` ภายในได้ไหม?"

**Acceptable**: ห้าม — leak ออกจาก transaction. Query นั้นจะ commit แม้ transaction rollback

### Q6 — Zustand persist
> "Cart store จะ persist ที่ไหน? โดย mechanism อะไร?"

**Acceptable**: localStorage. `persist` middleware save state ทุกครั้ง update + hydrate ตอน app start

### Q7 — Smart polling
> "Tracking page polling ตลอดได้ไหม? ทำไมไม่ดี?"

**Acceptable**: Server load + waste. Use function form ของ refetchInterval → return false on terminal state

### Q8 — Cookie scope (recap from Wk 3)
> "Cart store ใน Zustand เก็บ user-specific? ทำไม / ไม่ทำไม?"

**Acceptable**: Course MVP = anonymous (1 cart per browser). Real apps: associate with user, clear on logout

### Q9 — Don't trust client
> "FE cart มี `unitPrice`. ตอน checkout ส่ง field นี้ไปด้วยไหม?"

**Acceptable**: ไม่ — server fetch product, calculate. Client `unitPrice` could be stale/tampered

### Q10 — Multi-actor
> "Customer + Staff ดูข้อมูลเดียวกันยังไง — without WebSocket?"

**Acceptable**: Polling — each side `useQuery` กับ `refetchInterval`. DB = source of truth, both read same

---

## 📋 Homework PR Code Review Checklist

### Backend (Tasks 1-3)
- [ ] Order/OrderItem schemas ใน `packages/shared`
- [ ] Prisma migration applied (orders + order_items tables)
- [ ] OrdersService uses `prisma.$transaction`
- [ ] Server-side total calculation (no trust on client total)
- [ ] productName + unitPrice snapshot in OrderItem
- [ ] State machine validates transitions
- [ ] OrdersController permissions:
  - [ ] POST `/orders` public
  - [ ] GET `/orders/:id` public
  - [ ] GET `/orders` STAFF/ADMIN
  - [ ] PATCH `/orders/:id/status` STAFF/ADMIN
- [ ] OrdersService tests (5+)
- [ ] Total ≥17 tests pass

### Frontend Cart + Checkout (Tasks 4-6)
- [ ] Zustand store with persist middleware
- [ ] CartIcon shows real count from store
- [ ] MenuCard adds to cart correctly
- [ ] Cart page handles empty + qty controls + clear
- [ ] Subtotal calculated client-side (display only)
- [ ] Checkout form validates with Zod
- [ ] Place order mutation:
  - [ ] Sends only `productId + qty` (no client price)
  - [ ] onSuccess clears cart + redirects

### Tracking + Kitchen (Tasks 7-9)
- [ ] Tracking page polls 5 sec
- [ ] Polling stops on terminal state (function form refetchInterval)
- [ ] Kitchen UI kanban (3 columns)
- [ ] OrderCard advance/cancel mutations
- [ ] Cache invalidation works
- [ ] Active-only filter on kitchen list

### Admin Orders (Task 10)
- [ ] Read-only list with filter
- [ ] Polling 10 sec
- [ ] Time formatted Thai locale

### HW-4-Post Bonus
- [ ] Sequential order numbering with race protection
- [ ] Today's stats card
- [ ] OrderCard component test

### Quality
- [ ] `pnpm typecheck` pass
- [ ] No `any` (except mock in tests)
- [ ] Decimal converted with `Number()` ที่ display
- [ ] Middleware matcher includes `/kitchen/:path*`

---

## 🧪 Live Build Checkpoints

### Session 1 — Block A (atomic create)
- [ ] Postman: POST /orders → 201 + order with items
- [ ] DBeaver: orders + order_items rows match
- [ ] Postman: POST with invalid productId → 400
- [ ] Postman: POST with inactive product → 400

### Session 1 — Block B (tests)
- [ ] `pnpm --filter @coffee/api test` shows 17+ tests pass
- [ ] State transition tests cover invalid cases

### Session 1 — Block C (cart)
- [ ] Add to cart → CartIcon updates
- [ ] Refresh page → cart persists
- [ ] DevTools localStorage shows `coffee-cart`

### Session 2 — Block D (checkout)
- [ ] Form validation works (Thai errors)
- [ ] Submit → POST /api/orders → 201
- [ ] Cart cleared
- [ ] Redirect to /order/<id>

### Session 2 — Block E (tracking)
- [ ] Polling visible in Network tab (every 5 sec)
- [ ] Status update via Postman → page updates within 5 sec
- [ ] PATCH to COMPLETED → polling stops

### Session 2 — Block F (kitchen)
- [ ] Two browser windows: customer + staff
- [ ] Customer places order → staff sees within 5 sec
- [ ] Staff advances status → customer tracking updates within 5 sec
- [ ] Kanban groups correctly

### Session 2 — Block G (admin)
- [ ] All-orders list visible
- [ ] Status filter works
- [ ] Time displays Thai locale

---

## 📊 Student Self-Assessment

```
Week 4 Self-Assessment

Concept depth (1-5):
□ Prisma $transaction (interactive)            [1] [2] [3] [4] [5]
□ Snapshot pattern                              [1] [2] [3] [4] [5]
□ Server-side total (security)                 [1] [2] [3] [4] [5]
□ State machine pattern                         [1] [2] [3] [4] [5]
□ Zustand + persist                            [1] [2] [3] [4] [5]
□ Selector pattern                              [1] [2] [3] [4] [5]
□ Smart polling (refetchInterval function)      [1] [2] [3] [4] [5]
□ Multi-actor cross-stack flow                 [1] [2] [3] [4] [5]
□ Cache invalidation across mutations           [1] [2] [3] [4] [5]
□ Order domain modeling                         [1] [2] [3] [4] [5]

Overall confidence Week 4:                     [1] [2] [3] [4] [5]

Hardest concept:
_________________________________________________

Most surprising "aha!":
_________________________________________________
```

---

## 📈 Tracking Sheet

| Student | Q1-10 | E2E demo | HW-4-Post | Confidence | 1-on-1? |
|---|---|---|---|---|---|
| Student A | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |
| Student B | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |
| Student C | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |
| Student D | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |
| Student E | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |
| Student F | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes/No |

---

## 🎯 Concepts Used in Week 5+

| Concept (Week 4) | Used In | Re-test |
|---|---|---|
| `$transaction` (interactive) | Wk 5 critical | Stock deduct on COMPLETED |
| Snapshot pattern | Wk 5 | cogsSnapshot in OrderItem |
| State machine | Wk 5+ | Stock movement type pattern |
| Zustand + persist | Wk 5 | Could add filters store |
| TanStack Query patterns | Wk 5 | Reports queries |
| Polling | Wk 5 | Reports dashboard refresh |

---

## 🔁 Catch-up Plans

### Score 5-6/10
- DM: review atomic transaction + state machine specifically
- 30-min 1-on-1 — focus on `$transaction` mental model
- Pair with strong student in Week 5 (transaction is critical)

### Score ≤ 4/10
- 60-min 1-on-1 required ก่อน Week 5
- Re-do Tasks 2-3 (NestJS Orders module) live
- Walk through `$transaction` step-by-step

### E2E Demo Failed
- Bisect: Where breaks? (cart? checkout? kitchen polling?)
- Provide `week4-session2-reference` branch
- Verify can solo-execute before Week 5

---

## 📝 Week 4 Instructor Reflection

```
What worked:
___________________________________________________

What didn't:
___________________________________________________

Atomic transaction concept difficulty (vs expected):
___________________________________________________

Multi-actor demo wow factor:
___________________________________________________

Time-block over/under:
- S1 Block A: ____ min (atomic transaction)
- S1 Block B: ____ min (tests)
- S1 Block C: ____ min (Zustand)
- S2 Block D: ____ min (checkout)
- S2 Block E: ____ min (tracking)
- S2 Block F: ____ min (kitchen)
- S2 Block G: ____ min (admin orders)

New pitfalls to add:
___________________________________________________

Pre-Week 5 readiness gap:
___________________________________________________
```
