# Week 5 — Session Plan ⭐

**Week Goal:** หัวใจ business logic — order COMPLETED → atomic transaction (stock deduct + COGS snapshot) → admin เห็น P&L dashboard. Real business value of the course.

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework

---

## 📅 Cadence

| Session    | When    | Duration | Covers (Plan tasks)                                                  |
| ---------- | ------- | -------- | -------------------------------------------------------------------- |
| **1**      | Day 1   | 120 min  | Tasks 1-5: schemas + ingredients + recipes + **stock deduct atomic** |
| _Homework_ | Day 2-6 | 3-5 hrs  | Practice creating ingredients + recipes + verify stock deducts work  |
| **2**      | Day 7   | 120 min  | Tasks 6-10: Reports backend + UI + dashboard + seed script           |

> **⚠️ Why Week 5 is hardest**:
>
> - Atomic transaction across 4 tables (OrderItem + StockMovement + Ingredient + Order)
> - Decimal arithmetic + cost calculation
> - Multiple async data flows (recipe → cogs → snapshot)
> - Lots of UI to build (inventory, recipe editor, reports dashboard)

---

## 🎯 Week 5 Learning Outcomes

| Skill                              | ทดสอบโดย                                          |
| ---------------------------------- | ------------------------------------------------- |
| Event-sourced inventory pattern    | Database state inspection                         |
| Atomic transaction across 4 tables | Test order COMPLETED → verify all 4 tables update |
| Recipe whole-replace strategy      | Edit recipe → verify old items gone, new in       |
| Prisma `groupBy` aggregation       | Reports endpoints                                 |
| `$queryRaw` for date truncation    | Revenue chart endpoint                            |
| Recharts integration               | Dashboard chart                                   |
| Seed script for repeatable dev env | Run seed → verify state                           |

---

## 📊 Time Budget Summary

```
Session 1 (120 min) — Backend + Atomic Stock Deduct ⭐
├── Recap Week 4 + Week 5 preview ......... 10 min
├── Block A: Schemas + Ingredients +
│           Stock movements CRUD .......... 40 min  ← Tasks 1-3
├── Block B: Recipe module ................ 20 min  ← Task 4
├── Block C: ⭐ Order COMPLETED →
│           atomic stock deduct + COGS ..... 40 min  ← Task 5
└── Wrap-up + homework + Q&A .............. 10 min

Homework (3-5 hrs)
├── Create 5-6 ingredients via Postman
├── Set recipes for all products
├── Place + complete orders, verify stock decreases
└── Pre-build inventory list page (preview Session 2)

Session 2 (120 min) — Reports + Admin UI
├── Recap + homework verification .......... 10 min
├── Block D: Reports backend ............... 20 min  ← Task 6
├── Block E: Inventory + Recipe UI ......... 35 min  ← Tasks 7-8
├── Block F: Reports dashboard + Recharts .. 45 min  ← Task 9
├── Block G: Seed script ................... 5 min   ← Task 10
└── Wrap-up + Week 6 preview ............... 5 min
```

---

## 🪜 Cognitive Load Considerations

Week 5 = "complex domain logic + multi-table transactions". Strategies:

1. **Database state inspection critical** — DBeaver open ทุกตอน, confirm changes after operations
2. **Network tab + server logs** — atomic transaction = invisible. Use logs/inspect to verify
3. **Walk through transaction flow on whiteboard** — 4 tables, 4 steps, sequential
4. **Concrete example throughout**: 2 lattes (18g coffee × 2 = 36g, 200ml milk × 2 = 400ml). Repeat numbers
5. **Demo COMPLETED transition live** — watch DB tables update simultaneously

---

## 🎨 Material Checklist

- [ ] Slides Week 5
- [ ] Demo project — branch `week5-instructor-start` (Week 4 + ingredients pre-seeded)
- [ ] DBeaver with 4 tabs open: orders, order_items, ingredients, stock_movements
- [ ] Postman collection with all CRUD endpoints
- [ ] Whiteboard — pre-draw atomic transaction flow

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

**ใช้จาก Week 1-4:**

- All previous patterns (schema sharing, NestJS, Prisma, TanStack Query)
- ⭐ `prisma.$transaction` (Wk 4) — เป็น center of Week 5
- Snapshot pattern (Wk 4) — extend to cogsSnapshot

**ส่งต่อ Week 6 (Deploy):**

- Seed script → useful for prod fresh deploy + tests
- Charts → SSR considerations
- Reports = important — make sure visible after deploy

> **Mental model**: Week 5 = "the point" — make the coffee shop measurable. Real business owners ask: revenue/cost/profit. We answer.
