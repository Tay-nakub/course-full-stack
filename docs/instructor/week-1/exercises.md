# Week 1 — Exercises (In-Class + Homework + Solutions)

**Audience:** instructor (with solutions). Strip solutions before sharing student-facing copy.

---

## 📋 Exercise Map

| # | Type | When | Difficulty | Time |
|---|---|---|---|---|
| **EX-1.1** | In-class | Session 1, after Block A | ⭐ | 5 min |
| **EX-1.2** | In-class | Session 1, after Block C | ⭐⭐ | 5 min |
| **HW-1** | Homework | Between Session 1 and 2 | ⭐⭐⭐ | 3-5 hrs |
| **EX-1.3** | In-class | Session 2, Block D | ⭐⭐ | 7 min |
| **EX-1.4** | In-class (live build) | Session 2, Block F | ⭐⭐⭐ | 40 min |
| **HW-1-stretch** | Optional homework | Anytime | ⭐⭐⭐⭐ | 1-2 hrs |

---

## EX-1.1 — Identify the Workspace

**When**: Session 1, after Block A (monorepo + pnpm + Turbo)
**Type**: In-class quick exercise
**Difficulty**: ⭐
**Time**: 5 min

### Task
> ดู `pnpm-workspace.yaml` ที่ instructor สร้างใน live demo. ตอบคำถาม:

1. ถ้าผมสร้างโฟลเดอร์ใหม่ `apps/mobile/` แล้วใส่ `package.json` ภายใน — pnpm จะรู้จักไหม? (yes/no, why)
2. ถ้าผมสร้าง `services/billing/` แล้วใส่ `package.json` — pnpm จะรู้จักไหม?
3. ถ้าผมเปลี่ยน `pnpm-workspace.yaml` เป็น:
   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
     - 'services/*'
   ```
   เกิดอะไรขึ้น?

### 🟢 Solution (instructor only)

1. **Yes** — `apps/*` glob match `apps/mobile/`. pnpm จะ register เป็น workspace package
2. **No** — `services/` ไม่อยู่ใน glob patterns ที่ระบุ
3. ตอนนี้ `services/billing/` จะถูก register. ทุก script ของ workspace นั้นจะรันได้ผ่าน Turbo

> **Teaching point**: glob pattern คุม "scope" ของ workspace. เปลี่ยนได้ตอนหลัง — ไม่ต้อง configure อะไรอื่น

---

## EX-1.2 — Predict the URL

**When**: Session 1, after Block C (layouts + route groups)
**Type**: In-class quick exercise
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task
> ดู folder structure ต่อไปนี้. URL ของแต่ละ page เป็นอะไร?

```
app/
├── layout.tsx
├── page.tsx
├── (marketing)/
│   ├── layout.tsx
│   ├── about/page.tsx
│   └── pricing/page.tsx
├── (storefront)/
│   ├── layout.tsx
│   ├── menu/page.tsx
│   └── order/[id]/page.tsx
└── admin/
    └── settings/page.tsx
```

ตอบ URL ของ:
1. `(marketing)/about/page.tsx`
2. `(storefront)/order/[id]/page.tsx`
3. `admin/settings/page.tsx`
4. ทำไม URL ของ `about` กับ `settings` มี/ไม่มี prefix?

### 🟢 Solution

1. `/about` (route group `(marketing)` ไม่อยู่ใน URL)
2. `/order/abc123` (เช่น) — `[id]` คือ dynamic segment
3. `/admin/settings` — `admin/` ไม่ใช่ route group ปกติ folder → URL prefix
4. `()` = route group (URL invisible). `admin/` = ปกติ folder → กิน URL

> **Teaching point**: `()` กับ `[]` ทำหน้าที่ต่างกันชัดเจน — `()` group, `[]` dynamic segment

---

## HW-1 — Complete Static Coffee Shop UI

**When**: Between Session 1 and Session 2 (3-5 hours)
**Type**: Homework
**Difficulty**: ⭐⭐⭐
**Deliverable**: Pull request to `main` from branch `week1-homework`

### Task
ทำ Tasks 5-8 ของ [Week 1 Plan](../../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md):

1. **Task 5**: ตรวจสอบ Tailwind ทำงาน + เพิ่ม CSS variables สำหรับ shadcn
2. **Task 6**: `pnpm dlx shadcn@latest init` + add `button`, `card`, `input`, `label`, `form`
3. **Task 7**: สร้าง mock menu data + `MenuCard` component (Server Component) + render `/menu` page
4. **Task 8**: สร้าง `CartIcon` (Client Component) + แทรกใน storefront layout

### Acceptance Criteria
- [ ] `pnpm dev` รันได้ ไม่มี error/warning
- [ ] `/menu` แสดง 6 รายการเมนู (drink/food/dessert) จัด grid responsive
- [ ] Header มี Cart icon ที่กดเพิ่ม count ได้
- [ ] Commit ทุก task แยก (อย่ารวม), commit message ชัดเจน
- [ ] Open PR `week1-homework` → `main` (ยังไม่ merge — รอ Session 2 review)

### Constraints
- ❌ ห้าม edit ไฟล์ใน `components/ui/` (shadcn-generated) ตอนนี้ — ทำความเข้าใจ generated code ก่อน
- ❌ ห้ามใส่ payment / checkout flow (out of scope — Week 4)
- ✅ ใช้ Tailwind เท่านั้น สำหรับ styling — ห้าม inline styles

### 🟢 Solution Reference

**ดู**: branch `week1-homework-reference` (instructor maintains)
**Code**: ดู Tasks 5-8 ของ [Week 1 Plan](../../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) — ทุกไฟล์มี code ครบ

### Common Mistakes (anticipate)

| Mistake | Why happens | Fix |
|---|---|---|
| ลืมใส่ `'use client'` ใน `cart-icon.tsx` | คิดว่าใส่ที่ layout พอ | Error: "useState only works in Client Components" — เพิ่ม `'use client'` ที่บรรทัดแรก |
| `import { Button } from 'shadcn/ui'` | คิดว่า shadcn เป็น npm package | shadcn copy เข้าโปรเจกต์ — ใช้ `import { Button } from '@/components/ui/button'` |
| Server Component import Client โดยตรง — error | คิดว่า import ปกติ | OK ที่ Server import Client. แต่ถ้า Client import Server → error |
| Tailwind classes ไม่ apply | `tailwind.config` ไม่ครอบไฟล์ | ตรวจ `content` array ใน config — ต้อง include `./app/**/*.tsx`, `./components/**/*.tsx` |
| URL `/storefront/menu` แทน `/menu` | ลืม `()` ใน folder name | rename `storefront/` → `(storefront)/` |

---

## EX-1.3 — Server or Client?

**When**: Session 2, Block D (RSC deep dive)
**Type**: In-class exercise — discussion
**Difficulty**: ⭐⭐
**Time**: 7 min

### Task
> สำหรับแต่ละ component ต่อไปนี้ — Server หรือ Client? **อธิบายเหตุผล**

| # | Component | What it does | Answer |
|---|---|---|---|
| 1 | `<MenuCard>` | แสดงรูป + ชื่อ + ราคาเมนู | ? |
| 2 | `<CartIcon>` | นับจำนวนใน cart, กด toggle dropdown | ? |
| 3 | `<MenuFilter>` | Dropdown กรองตาม category | ? |
| 4 | `<OrderStatusBadge>` | รับ status string → render colored badge | ? |
| 5 | `<NewsletterSignup>` | input email + submit ผ่าน fetch | ? |
| 6 | `<ProductDetailPage>` | fetch product จาก DB ด้วย `await` ใน component | ? |
| 7 | `<ImageGallery>` | thumbnails คลิกได้, มี lightbox | ? |
| 8 | `<Footer>` | static footer แสดงปี ลิงก์ social | ? |

### 🟢 Solution

| # | Answer | Why |
|---|---|---|
| 1 | **Server** | ไม่มี state / event handlers — pure presentation |
| 2 | **Client** | useState (count), onClick (toggle) |
| 3 | **Client** | onChange handler, อาจ useState สำหรับ selected |
| 4 | **Server** | รับ prop, render — ไม่มี interaction |
| 5 | **Client** | onSubmit + fetch + state สำหรับ pending/success |
| 6 | **Server** | `async function ProductDetailPage()` — server fetch ใน Server Component (Week 3 จะลึก) |
| 7 | **Client** | onClick (open lightbox), useState (selected image) |
| 8 | **Server** | static — ไม่มี state. ปี render บน server, OK |

> **Teaching point**: คำถามถามเสมอ — "ต้อง state, effect, browser API, หรือ event handlers ไหม?" ถ้า **ทั้งหมดไม่** → Server. มีอย่างน้อย 1 → Client

### Discussion Prompt
หลังเฉลย → ถาม class:
> "ในโปรเจกต์ coffee shop ของเรา — Cart icon ทำไมถึงจำเป็นต้องเป็น Client?"
**Expected**: state count, onClick, จะใส่ `useState`/persist ทีหลัง

---

## EX-1.4 — Build Feedback Form (TDD Live Build)

**When**: Session 2, Block F
**Type**: Live class build — student พิมพ์ตามใน VS Code ของตัวเอง
**Difficulty**: ⭐⭐⭐
**Time**: 40 min

> นี่ไม่ใช่ "exercise standalone" — ใช้ flow ใน [Session 2 Lesson Script § Block F](session-2-lesson-script.md#-block-f-build-feedback-form-with-tdd-65-105-min-40-min)

### Final Acceptance Criteria

- [ ] `apps/web/components/feedback-form.tsx` exists
- [ ] `apps/web/tests/feedback-form.test.tsx` — 3 tests, all PASS
- [ ] `apps/web/app/(storefront)/feedback/page.tsx` — page renders form, shows submitted state
- [ ] `pnpm test` PASS
- [ ] `pnpm typecheck` PASS

---

## HW-1-Stretch — Optional Challenges

**When**: After Week 1 Session 2 (optional)
**Type**: Stretch goal — สำหรับ student ที่ทำเร็ว / อยากต่อ
**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Dark Mode Toggle (1 hr)
- เพิ่ม dark mode toggle ใน storefront header
- ใช้ `next-themes` package (search docs เอง — practice อ่าน docs)
- Persist ใน localStorage
- Dark mode CSS variables เพิ่มใน globals.css

**Solution sketch**:
```bash
cd apps/web
pnpm add next-themes
```
Wrap root layout ด้วย `<ThemeProvider>`, ใส่ Toggle ใน header.
ปรับ CSS variables: `:root.dark { --background: ... }`.

### Stretch 2: Menu Search (1 hr)
- เพิ่ม search input ที่หน้า `/menu`
- Filter menu real-time ตาม name (case-insensitive, substring match)
- Use `useDeferredValue` (or `useTransition`) สำหรับ smooth UX
- เขียน test ทดสอบ filter behavior

**Solution sketch**:
- `<MenuSearch>` = Client Component (state, onChange)
- Filter logic ใน parent — pass filtered list ลง grid
- Test: render → type "latte" → expect only latte card visible

### Stretch 3: Form Field Components Refactor (2 hrs)
- Refactor `feedback-form.tsx` ให้ใช้ shadcn `<Form>`, `<FormField>`, `<FormControl>`
- ดู docs: https://ui.shadcn.com/docs/components/form
- รัน tests ต้องยัง pass — TDD validates refactor

**Why valuable**: เห็นว่า shadcn มี form abstraction ที่ลด boilerplate. ใน Week 4-5 (orders form, recipe form) จะใช้ pattern นี้

---

## 📤 Student-Facing Format

**ก่อนแชร์ exercises ให้ student**:
1. คัดลอกไฟล์นี้ → ลบ section "🟢 Solution" ทั้งหมด
2. ลบ "Common Mistakes" ของ HW-1 (ให้ student ติดเอง — เรียนรู้จากการแก้)
3. Save เป็น `docs/student/week-1/exercises.md` (หรือ post ใน LMS)
