# Week 1 — Assessment Checklist

**Audience:** instructor — ใช้ตรวจว่า student "พร้อม" เข้า Week 2 ไหม

> **Philosophy**: ไม่ใช่ exam — เป็น **diagnostic tool**. Student ที่ตอบไม่ได้ ≠ fail; ใช้เป็น signal ว่าต้อง 1-on-1 ก่อน Week 2

---

## 🎯 Pass Criteria

Student "พร้อม" เข้า Week 2 ถ้า:
- ✅ ตอบ verbal Q ได้ ≥ 7/10
- ✅ Homework PR pass ทุก acceptance criteria
- ✅ Session 2 in-class TDD build เสร็จ (3 tests pass)

ถ้า ≤ 6/10 หรือ homework ไม่เสร็จ → **schedule 1-on-1 catch-up ก่อน Week 2**

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Concept Tier — ถามตอน Recap

#### Q1 — Monorepo decision
> "เราเลือก monorepo เพราะอะไร? ตอบ 2 เหตุผลหลัก"

**Acceptable answers** (อย่างน้อย 2):
- Share types/schemas ระหว่าง FE และ BE
- 1 PR ครอบทั้ง stack → review impact ได้พร้อมกัน
- ไม่ต้อง publish package เพื่อ share code
- Less duplication

**Red flag**: ตอบ "เพราะมันง่าย" — ไม่เข้าใจ trade-off

#### Q2 — pnpm workspace
> "`pnpm-workspace.yaml` ทำอะไร?"

**Acceptable**: บอก pnpm ว่าโฟลเดอร์ไหนเป็น workspace package, ใช้ glob pattern (`apps/*`, `packages/*`)

#### Q3 — Turborepo role
> "Turbo ต่างจาก Webpack/Vite ยังไง?"

**Acceptable**: Turbo = task orchestrator + cache (รัน task ใน workspace ตามลำดับ). Webpack/Vite = bundler. คนละ layer

#### Q4 — App Router file convention
> "ในโฟลเดอร์ `app/`, `page.tsx` กับ `layout.tsx` ต่างกันยังไง?"

**Acceptable**: `page.tsx` = route (URL endpoint), `layout.tsx` = wrapper ที่ persist ตอน inner navigation

#### Q5 — Route Groups
> "Route group `(name)` ใช้ทำอะไร? ยกตัวอย่าง"

**Acceptable**: Group routes โดยไม่ปรากฏใน URL. เช่น `(storefront)/menu/page.tsx` → URL `/menu` แต่ share layout ของ `(storefront)`

#### Q6 — Server vs Client (decision)
> "ผมจะเขียน component ที่นับ counter — Server หรือ Client? ทำไม?"

**Acceptable**: Client. ต้อง `useState` + `onClick` — Server Component ทำไม่ได้

#### Q7 — Server vs Client (limitations)
> "บอก 2 สิ่งที่ Server Component ทำไม่ได้"

**Acceptable** (อย่างน้อย 2): useState, useEffect, event handlers, browser APIs (window, localStorage), refs

#### Q8 — Composition rule
> "Server Component import Client Component ได้ไหม? Client import Server ได้ไหม?"

**Acceptable**: Server → Client (✅ ได้). Client → Server โดย import ตรงๆ (❌ ไม่ได้). แต่ผ่าน children prop ได้

#### Q9 — Zod + RHF
> "`z.infer<typeof Schema>` ทำอะไร?"

**Acceptable**: derive TypeScript type จาก Zod schema. Single source of truth — schema เปลี่ยน → type เปลี่ยนตามอัตโนมัติ

#### Q10 — TDD cycle
> "TDD 3 step คืออะไร?"

**Acceptable**: Red (test fail) → Green (code pass) → Refactor (ปรับ code ให้สวย, test ยัง pass)

---

## 📋 Homework PR Code Review Checklist

> ใช้ตรวจ PR `week1-homework` ของ student. Comment inline บน PR.

### Structure & Setup
- [ ] Branch `week1-homework` created จาก `main`
- [ ] Commits **atomic** (1 commit / 1 task), ไม่รวมหลาย concerns
- [ ] Commit messages descriptive (ไม่ใช่ "fix", "wip")
- [ ] No file ที่ไม่ควร commit: `.env`, `node_modules/`, `.next/`, `*.log`

### Task 5 — Tailwind
- [ ] `globals.css` มี `@tailwind` directives (or v4 `@import`)
- [ ] CSS variables สำหรับ shadcn theme อยู่ใน `:root`
- [ ] Test class (เช่น `text-amber-800`) render ได้

### Task 6 — shadcn/ui
- [ ] `components.json` exists ที่ `apps/web/`
- [ ] `lib/utils.ts` มี `cn()` function
- [ ] `components/ui/` มี: button, card, input, label, form
- [ ] **ไม่ได้แก้ generated files** (อ่านเข้าใจก่อน)

### Task 7 — Static Menu Page
- [ ] `lib/data/menu.ts` มี `MenuItem` type + `MOCK_MENU` array (≥6 items)
- [ ] `components/menu-card.tsx` คือ Server Component (ไม่มี `'use client'`)
- [ ] `MenuCard` รับ prop `item: MenuItem` (ไม่ใช่ inline type)
- [ ] `app/(storefront)/menu/page.tsx` group menu ตาม category
- [ ] Grid responsive (1 col mobile / 2 col tablet / 3 col desktop)

### Task 8 — Cart Icon (Client)
- [ ] `components/cart-icon.tsx` มี `'use client'` บรรทัดแรก
- [ ] ใช้ `useState` count
- [ ] `onClick` ทำงาน → count increment
- [ ] Imported ใน `(storefront)/layout.tsx` แทน text "Cart (0)"

### Quality
- [ ] `pnpm typecheck` pass — ไม่มี TS error
- [ ] `pnpm dev` รันได้ ไม่มี warning ใน terminal
- [ ] No `any` type (ถ้ามีให้ comment requesting fix)
- [ ] No commented-out code

### Stretch (optional bonus)
- [ ] Image alt text สำหรับ accessibility
- [ ] Loading skeleton ระหว่าง render (advanced)

---

## 🧪 Session 2 In-Class Build Checklist

> ใช้ตรวจระหว่าง Block F (TDD live build). Walk around ดู student's screen.

### Step Verification (live)

| Step | What to verify on student screen |
|---|---|
| 1. Install RHF + Zod | `package.json` มี `react-hook-form`, `zod`, `@hookform/resolvers` |
| 2. Failing test written | `feedback-form.test.tsx` exists with 1 test, test FAILS |
| 3. Component implemented | `feedback-form.tsx` exists, test PASSES |
| 4. 2 more tests | 3 tests total, all PASS |
| 5. Real page works | `/feedback` URL renders form |
| 6. Final state | `pnpm test` PASS, `pnpm typecheck` PASS, commit pushed |

### Common Issues to Catch

- [ ] Student ใส่ `'use client'` ไหม? (form ต้อง Client)
- [ ] Schema error message ภาษาไทยถูกต้องไหม?
- [ ] `register('name')` spread ใส่ `<Input>` ไหม?
- [ ] `errors.name?.message` (optional chaining) ไม่ใช่ `errors.name.message`
- [ ] `handleSubmit(onSubmit)` (callback wrap) ไม่ใช่ `handleSubmit({onSubmit})`

---

## 📊 Student Self-Assessment Form

> Distribute หลัง Session 2. Student กรอกตัวเอง — ไม่ส่งให้ instructor (private reflection)

```
Week 1 Self-Assessment

ฉันเข้าใจ concepts เหล่านี้ระดับไหน (1-5):
□ Monorepo + pnpm workspace                    [1] [2] [3] [4] [5]
□ Turborepo task pipeline                       [1] [2] [3] [4] [5]
□ Next.js App Router file convention            [1] [2] [3] [4] [5]
□ Route groups vs dynamic segments              [1] [2] [3] [4] [5]
□ Server Component vs Client Component         [1] [2] [3] [4] [5]
□ Tailwind CSS utility classes                  [1] [2] [3] [4] [5]
□ shadcn/ui workflow                            [1] [2] [3] [4] [5]
□ React Hook Form + Zod                         [1] [2] [3] [4] [5]
□ Vitest + Testing Library basics               [1] [2] [3] [4] [5]
□ TDD cycle (Red-Green-Refactor)                [1] [2] [3] [4] [5]

ระดับความมั่นใจรวม Week 1:                    [1] [2] [3] [4] [5]

อะไรที่ยังคลุมเครือ?
_________________________________________________
_________________________________________________

อะไรที่อยากให้ instructor อธิบายซ้ำใน Session แรกของ Week 2?
_________________________________________________
_________________________________________________
```

---

## 📈 Instructor Tracking Sheet

> ใช้ track student progress ตลอดคอร์ส. Update หลัง Week 1

| Student | Q1-10 Score | Homework | In-Class Build | Confidence | 1-on-1 Needed? |
|---|---|---|---|---|---|
| Student A | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |
| Student B | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |
| Student C | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |
| Student D | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |
| Student E | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |
| Student F | __/10 | ✅/❌ | ✅/❌ | __/5 | Yes / No |

---

## 🔁 If Student Doesn't Pass — Catch-up Plan

### If Score 5-6/10
- DM student → ส่ง specific concept ที่ต้อง review
- Recommend re-watch session recording (ถ้ามี) + read pitfalls-faq.md
- Quick 30-min 1-on-1 ก่อน Week 2 Session 1

### If Score ≤ 4/10
- 1-on-1 60-90 min ก่อน Week 2 Session 1
- Focus: monorepo decision + RSC mental model (most leverage)
- Re-do Tasks 7-8 together (live)

### If Homework PR ไม่เสร็จ
- Identify blocker: setup issue / concept / time
- ถ้า setup → screen-share debug
- ถ้า concept → ส่ง mini-explainer (ใช้ slide หน้าที่เกี่ยว)
- ถ้า time → adjust expectation, focus essentials (Task 7 + 8 critical)

---

## 🎯 Long-Term Tracking — Concepts ที่ Week 2+ Build On

| Concept (Week 1) | Used Again In | Re-test Opportunity |
|---|---|---|
| Monorepo / Turbo | Every week | Week 2 (add `apps/api`) |
| App Router conventions | Every week | Week 4 (add `(admin)`, `(kitchen)` groups) |
| Server Component fetch | Week 3 | Week 3 first end-to-end slice |
| Client Component | Week 4 | Cart with Zustand store |
| Zod schema | Week 3+ | Move to `packages/shared`, use in NestJS |
| TDD pattern | Every week | Each new feature should have test |
| shadcn workflow | Every week | New components Week 3, 4, 5 |

---

## 📝 Post-Week-1 Instructor Reflection

> กรอกหลังจบ Week 1 ทั้งสอง sessions

```
Week 1 reflection (instructor)

What worked well:
___________________________________________________

What didn't:
___________________________________________________

Concepts that were harder than expected to teach:
___________________________________________________

Concepts that were easier than expected:
___________________________________________________

Adjustments for next batch:
___________________________________________________

Time-block over/under by:
- Session 1 Block A: ____ min over/under
- Session 1 Block B: ____ min over/under
- Session 1 Block C: ____ min over/under
- Session 2 Block D: ____ min over/under
- Session 2 Block E: ____ min over/under
- Session 2 Block F: ____ min over/under

Common pitfalls to add to pitfalls-faq.md:
___________________________________________________
___________________________________________________
```
