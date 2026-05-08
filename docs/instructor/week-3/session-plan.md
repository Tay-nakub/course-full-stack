# Week 3 — Session Plan

**Week Goal:** เชื่อม FE ↔ BE — admin login + CRUD เมนูผ่าน UI + storefront ใช้ data จริง. Schema เดียวสองฝั่ง

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework ระหว่าง sessions

---

## 📅 Cadence

| Session | When | Duration | Covers (Plan tasks) |
|---|---|---|---|
| **1** | Day 1 | 120 min | Tasks 1-6: shared schemas + NestJS Menu CRUD + TanStack Query setup |
| _Homework_ | Day 2-6 | 3-5 hrs | Polish admin UI styling + complete Product form + practice mutations |
| **2** | Day 7 | 120 min | Tasks 7-10: Login flow + admin middleware + CRUD UI + storefront wiring |

> **Pre-Session 1**: ทุก student มี **admin user** ที่ promote เป็น ADMIN role แล้ว (Week 2 homework หรือ instructor demo SQL update)

---

## 🎯 Week 3 Learning Outcomes

จบ Week 3 student สามารถ:

| Skill | ทดสอบโดย |
|---|---|
| Define Zod schema ที่ใช้ FE+BE ได้ทั้งคู่ | Live build Session 1 + 2 |
| สร้าง NestJS CRUD service + controller + tests | Session 1 |
| Protect endpoints ด้วย JwtAuthGuard + RolesGuard | Session 1 |
| Setup TanStack Query (Provider + DevTools) | Session 1 |
| ใช้ `useQuery` + `useMutation` ที่มี cache invalidation | Session 2 |
| Implement login flow with httpOnly cookie | Session 2 |
| ใช้ Next.js middleware ป้องกัน routes | Session 2 |
| Wire Server Component fetch ตรงไป NestJS | Session 2 |

---

## 📊 Time Budget Summary

```
Session 1 (120 min) — Backend + Client Plumbing
├── Recap Week 2 + Week 3 preview ........ 10 min
├── Block A: Schemas + Category module ... 40 min  ← Tasks 1-3
├── Block B: Product module ............. 25 min  ← Task 4
├── Block C: Rewrites + API client + TQ . 35 min  ← Tasks 5-6
└── Wrap-up + homework + Q&A ............ 10 min

Homework (3-5 hrs)
├── Test all CRUD endpoints in Postman
├── Build admin Categories CRUD UI (preview Session 2)
└── Read TanStack Query docs (mutations + invalidation)

Session 2 (120 min) — Auth Flow + Admin UI + Wire Storefront
├── Recap + homework review ............. 10 min
├── Block D: Login flow + cookie ........ 35 min  ← Task 7
├── Block E: Middleware + admin layout .. 15 min  ← Task 8
├── Block F: Admin Menu CRUD UI ......... 45 min  ← Task 9
├── Block G: Wire storefront to API ..... 10 min  ← Task 10
└── Wrap-up + Week 4 preview ............ 5 min
```

> ⚠️ **Time risk**: Week 3 = ที่หินที่สุด conceptually. Block F ใหญ่ → ให้ student ใส่ Categories ตามผมเสร็จ → Products เป็น in-class exercise (เร็วเพราะ pattern เดียวกัน)

---

## 🪜 Cognitive Load Considerations

Week 3 **เชื่อมทุกอย่างที่เรียนมา** — มี challenge:

1. **Many moving parts**: Zod (Wk1), NestJS (Wk2), Prisma (Wk2), Next.js routing (Wk1), TanStack Query (NEW), Cookies (NEW), Middleware (NEW)
2. **Mental switching cost**: FE ↔ BE หลายครั้งใน 1 task
3. **Debugging cross-stack**: bug อาจอยู่ใน FE หรือ BE — student ต้องรู้ inspect both

**Strategies**:
- **Network tab ตลอด** — open DevTools → Network throughout class. ดู request/response live
- **Server logs visible** — terminal ที่รัน NestJS visible ตลอด
- **Pause for debugging together** — bug = teaching opportunity, ห้าม skip
- **Demo error states** — ใส่ wrong data จงใจ → ดู Zod error → fix

---

## 🎨 Material Checklist (instructor — ก่อนเริ่ม Week 3)

- [ ] Slides Week 3 (build จาก [slides-outline.md](slides-outline.md))
- [ ] Demo project — branch `week3-instructor-start` (Week 2 จบ + admin user promoted)
- [ ] Postman collection ที่มี Bearer token auto จาก `/auth/login` response
- [ ] React Query Devtools เปิดอยู่ใน demo browser (corner button)
- [ ] DBeaver/TablePlus connection พร้อม inspect categories + products

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

**ใช้จาก Week 1+2:**
- Zod schemas pattern (Week 1) → reuse for Menu
- NestJS DI + modules (Week 2) → expand with Menu module
- Prisma (Week 2) → add Category + Product models
- JwtAuthGuard / RolesGuard (Week 2) → protect Menu writes
- Server Component fetch (Week 1) → real API instead of mock

**ส่งต่อ Week 4:**
- TanStack Query patterns → reuse for Orders
- httpOnly cookie auth → already in place for /admin and /kitchen
- Admin layout → add Orders + Reports tabs
- Form pattern (RHF + Zod + dialog) → Order form, recipe form

> **Mental model**: Week 1 = "FE alone". Week 2 = "BE alone". **Week 3 = เชื่อม + first slice complete**. Week 4+ = scale this slice across order/inventory/reports
