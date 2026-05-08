# Week 4 — Session Plan

**Week Goal:** Order flow end-to-end — ลูกค้า cart → checkout → place order → tracking. Staff Kitchen UI → status transitions

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework

---

## 📅 Cadence

| Session | When | Duration | Covers (Plan tasks) |
|---|---|---|---|
| **1** | Day 1 | 120 min | Tasks 1-5: Order schemas + Prisma + atomic create + tests + Zustand cart |
| _Homework_ | Day 2-6 | 3-5 hrs | Polish cart UI + read TanStack Query polling docs + (preview) build CheckoutForm |
| **2** | Day 7 | 120 min | Tasks 6-10: Checkout + tracking + Kitchen UI + admin orders |

> **Pre-Session 1**: ทุก student มี admin + staff users ใน DB (ทั้งสอง role) + menu data ≥3 categories และ ≥4 products

---

## 🎯 Week 4 Learning Outcomes

| Skill | ทดสอบโดย |
|---|---|
| Prisma `$transaction` (interactive) | Session 1 atomic order create |
| State machine pattern (status transitions) | Session 1 Service tests + Session 2 Kitchen UI |
| Server-side total calculation (security) | Code review of OrdersService |
| Snapshot pattern (productName, unitPrice in OrderItem) | Database inspection |
| Zustand + persist middleware | Cart UI + localStorage persistence |
| Smart polling (`refetchInterval` function form) | Tracking page + Kitchen polling |
| Cross-domain end-to-end flow | Demo: customer place → staff kitchen → customer tracking |

---

## 📊 Time Budget Summary

```
Session 1 (120 min) — Backend + Cart Store
├── Recap Week 3 + preview .............. 10 min
├── Block A: Order schemas + Prisma +
│           atomic transaction ........... 45 min  ← Tasks 1-2
├── Block B: OrdersService tests +
│           state transitions ............ 20 min  ← Task 3
├── Block C: Zustand cart + add to cart UI 35 min  ← Tasks 4-5
└── Wrap-up + homework + Q&A ............. 10 min

Homework (3-5 hrs)
├── Polish cart (empty state, animations)
├── Read TanStack Query refetchInterval
└── Pre-build CheckoutForm skeleton

Session 2 (120 min) — Checkout, Tracking, Kitchen
├── Recap + homework review .............. 10 min
├── Block D: Checkout flow ............... 35 min  ← Task 6
├── Block E: Order tracking (polling) .... 20 min  ← Task 7
├── Block F: Kitchen UI .................. 40 min  ← Tasks 8-9
├── Block G: Admin orders view ........... 10 min  ← Task 10
└── Wrap-up + Week 5 preview ............. 5 min
```

---

## 🪜 Cognitive Load Considerations

Week 4 = "use patterns from Week 3 across new domain" → less new concept, more **practice**:

**New things only**:
- Prisma `$transaction` (atomic)
- Zustand (vs Redux/Context — much simpler)
- Polling patterns

**Reused from Week 1-3**:
- Schema sharing
- NestJS CRUD pattern
- TanStack Query `useQuery` + `useMutation` + invalidation
- httpOnly cookie auth + middleware
- Form pattern (RHF + Zod)

**Strategy**: ตั้งความคาดหวังถูก — "pattern เหมือน Week 3, แค่เปลี่ยน domain"

---

## 🎨 Material Checklist

- [ ] Slides Week 4
- [ ] Demo project — branch `week4-instructor-start` (Week 3 จบ + admin/staff promoted)
- [ ] 2 browser windows: customer + staff (incognito or different profiles)
- [ ] DBeaver พร้อม inspect orders + order_items
- [ ] Postman collection ที่มี orders endpoints

---

## 📄 Related Artifacts

- [Session 1 Lesson Script](session-1-lesson-script.md)
- [Session 2 Lesson Script](session-2-lesson-script.md)
- [Slides Outline](slides-outline.md)
- [Exercises](exercises.md)
- [Pitfalls & FAQ](pitfalls-faq.md)
- [Assessment Checklist](assessment-checklist.md)

---

## 🔗 Connection Backwards/Forwards

**ใช้จาก Week 1-3:**
- Schema pattern (1 schema, 2 sides)
- NestJS service/controller layering
- Prisma + relations
- Auth + middleware
- TanStack Query patterns

**ส่งต่อ Week 5 (Inventory + Reports):**
- Order model + status — Week 5 จะ deduct stock เมื่อ COMPLETED
- OrderItem snapshot — Week 5 เพิ่ม `cogsSnapshot` field
- Transaction pattern — Week 5 จะใช้ใน complex stock deduction
- Polling pattern — Week 5 reports dashboard ใช้

> **Mental model**: Week 3 = "first end-to-end slice". **Week 4 = "second slice" (orders)** with same patterns. Week 5 = "business logic depth"
