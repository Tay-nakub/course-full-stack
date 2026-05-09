# Week 1 Session 2 — RSC Deep Dive + TDD Form

**Week:** 1
**Session:** 2 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Session 1 complete + homework (Tasks 5-8) submitted as PR
**Covers:** Tasks 9-10 of [Week 1 Plan](../../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) + RSC/Client deep dive

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ อธิบาย Server vs Client Component **ได้ลึก** — เลือกถูกตัวในสถานการณ์จริง
- ✅ Setup Vitest + Testing Library ใน Next.js ได้
- ✅ เขียน feedback form ด้วย React Hook Form + Zod resolver แบบ TDD (test ก่อน → implement)
- ✅ ทุก test pass + typecheck pass + commit ครบ
- ✅ พร้อมเข้า Week 2 (NestJS + Postgres)

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Review homework PR ของ student ทุกคนล่วงหน้า — note common issues + standout work
- [ ] เตรียม "homework showcase" — เลือก 1-2 PR ที่จะ project share พร้อมเหตุผลที่ดี
- [ ] Verify environment: ทุกคนมี `pnpm dev` รันได้ (ถาม Slack ก่อนเริ่ม)
- [ ] เปิด Vitest docs tab + Testing Library docs tab
- [ ] Backup: ถ้าใครยังทำ homework ไม่เสร็จ — เตรียม branch สำเร็จรูป (`week1-homework-reference`) ให้ checkout

---

## 🗓️ Time-Blocked Agenda

| Time       | Block                       | Activity                                                        |
| ---------- | --------------------------- | --------------------------------------------------------------- |
| 0-20       | **Recap + Homework Review** | Quiz from Session 1 + showcase 2 student PRs                    |
| **20-45**  | **Block D**                 | **Server vs Client Component deep dive** (lecture 12 + demo 13) |
| **45-65**  | **Block E**                 | **Vitest + TDD intro** (lecture 8 + demo 12)                    |
| **65-105** | **Block F**                 | **RHF + Zod feedback form (TDD live)** (full live build)        |
| 105-115    | Wrap-up                     | Week 2 preview + final Q&A                                      |
| 115-120    | Buffer                      | Stragglers / individual help                                    |

---

## 🟢 Recap + Homework Review (0-20 min)

### Recap Quiz (5 min)

- "ขอ volunteer 1 คน อธิบาย App Router file convention"
- "ใครอธิบายได้ว่า route group `()` ใช้ทำอะไร?"
- "Tailwind utility class ที่ใช้บ่อยที่สุดของคุณคือ?"

> **Tip**: ใช้คำถาม spaced — บางคำถามทับ Session 1 (ทดสอบ retention), บางคำถามเชื่อม homework

### Homework Review (15 min)

**Format**: 2 student PR showcase (5 min/คน) + 5 min open discussion

**สำหรับแต่ละ PR**:

1. screen share PR — ดู diff structure
2. ถาม student: "ตรงไหนติด, ตรงไหน aha?"
3. Instructor highlight: 1 thing done well + 1 thing to improve (constructive)
4. ทุกคนใน class learn จากเคสจริง

**ถ้า student ทำ homework ไม่เสร็จ**:

- ไม่ shame ในห้อง — DM ส่วนตัว
- ให้ทำตาม `week1-homework-reference` branch (instructor backup) ระหว่าง buffer time

📢 **เน้นกับ class**: "Code review เป็น skill — ดู PR คนอื่นบ่อยๆ จะดีขึ้นเอง"

---

## ⚡ Block D: Server vs Client Component Deep Dive (20-45 min, 25 min)

### 🎯 Block Goals

Student เข้าใจลึก:

- "Default = Server Component" — เพราะอะไร, ส่งอะไรมา
- "Client Component" — ใช้เมื่อไหร่, cost คืออะไร
- "Component composition" — Server ครอบ Client ได้, Client ครอบ Server **ไม่ได้** (ผ่าน import)

### 💬 Lecture (~12 min)

**1. ใช้ Cart icon homework เป็นจุดตั้งต้น** (3 min)

> "Homework Task 8 — ทุกคนต้องใส่ `'use client'` ใน `cart-icon.tsx`. ทำไม?"

รอคำตอบ. Validate:

- ใช้ `useState` (state) ✓
- ใช้ `onClick` (event handler) ✓
- → ทั้งสองคือ "client-only feature" — ทำที่ server ไม่ได้

**2. The mental model** (5 min)

วาดบนกระดาน:

```
┌─────────────── SERVER ───────────────┐    ┌───── CLIENT (browser) ─────┐
│                                        │    │                            │
│  - Query DB                            │    │  - useState / useEffect   │
│  - Read filesystem                     │    │  - onClick / onChange     │
│  - Call API with secret keys           │    │  - window / localStorage  │
│  - Render to HTML                      │    │  - Animations / Hydration │
│                                        │    │                            │
│  Server Component (default)            │    │  Client Component         │
│  ❌ no useState                        │    │  ('use client')           │
│  ❌ no onClick                         │    │  ❌ no DB direct access   │
│  ❌ no useEffect                       │    │  ❌ no fs access          │
└────────────────────────────────────────┘    └───────────────────────────┘
                  │                                       │
                  └────── ส่ง HTML + JSON props ──────────┘
                         hydrate แล้วก็ interact ได้
```

**3. Decision flowchart** (3 min)

> **🎓 Decision Rule**: "Default Server. Switch to Client เมื่อ — และเมื่อ — ต้องการ:"
>
> 1. State (`useState`, `useReducer`)
> 2. Effects (`useEffect`)
> 3. Browser APIs (window, localStorage, IntersectionObserver)
> 4. Event handlers ที่ต้อง interactivity (`onClick`, `onChange`)
> 5. Hooks ที่ build บน 1-4 (TanStack Query, Zustand, etc.)

**4. The composition rule** (1 min)

📢 **กฎสำคัญ — เน้น**:

- Server Component import Client Component ได้ (ปกติ)
- Client Component import Server Component **ไม่ได้** ตรงๆ
- แต่ Server Component "pass เป็น children" ให้ Client Component ได้
- Why: บนๆ ของ tree เป็น Server, "เกาะ" Client ลงไปเป็นเกาะๆ

### 🖥️ Live Demo (~13 min)

**1. Inspect homework: `cart-icon.tsx`** (3 min)

- เปิดไฟล์, ชี้ `'use client'` บรรทัดแรก
- เปิด `(storefront)/layout.tsx` — ชี้ว่ามี `<CartIcon />` import เข้ามา
- 📢 **พูด**: "Layout เป็น Server Component (ไม่มี `'use client'`). มัน render `<CartIcon />` ที่เป็น Client. นี่คือ 'island' pattern — server-rendered ครอบ client-rendered"

**2. Build mistake demo** (5 min)
จงใจสร้าง bug:

- เพิ่ม `useState` ใน `menu-card.tsx` (Server Component) — โดย**ไม่**ใส่ `'use client'`
- รัน `pnpm dev` → error ใน terminal: "useState only works in Client Components"
- 📢 **พูด**: "Error message ตรงๆ — บอกแก้ยังไง. Next.js error message ดีมากใน App Router"
- แก้: เพิ่ม `'use client'` หรือลบ `useState` ออก

**3. Show server-only data** (3 min)

- เพิ่มใน `menu-card.tsx`:
  ```tsx
  console.log('Rendering on server', process.env.SECRET_KEY);
  ```
- เปิด page → log ขึ้น **terminal** (ไม่ใช่ browser console)
- 📢 **พูด**: "Server Component log ขึ้น server terminal. Client Component log ขึ้น browser console. ทดสอบโดย switch `'use client'` ดู"
- Cleanup: ลบ console.log ออก

**4. Bundle size demo** (2 min)

- รัน `pnpm build` → output แสดง "First Load JS"
- 📢 **พูด**: "ทุกครั้งที่ใส่ `'use client'`, code นั้นไป client bundle. Server Components ไม่ใช่ JS ที่ลูกค้าโหลด → bundle เล็กลง → site เร็วขึ้น"

### ❓ Common Questions

| Q                                                            | A                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| ใส่ `'use client'` ที่ root layout ได้ไหม?                   | ได้ แต่ทุกอย่างจะกลายเป็น client → bundle ใหญ่. **ห้าม** — ใส่ใกล้ leaf ที่สุด                               |
| Server Component fetch data ยังไง?                           | `async function Page() { const data = await fetch(...) }` — ใช่ async component ตรงๆ (Week 3 จะลงรายละเอียด) |
| ถ้า Client Component ต้อง fetch จาก DB?                      | ผ่าน API route หรือ TanStack Query → เรียก endpoint (Week 3)                                                 |
| Component library (เช่น shadcn) ส่วนใหญ่ Server หรือ Client? | shadcn UI primitives ที่มี state (Dialog, Dropdown) = Client. ที่ pure UI (Card) = Server                    |
| ทำไมไม่ทำให้ทุกอย่าง Client เพื่อความง่าย?                   | Bundle ใหญ่ขึ้น, SEO แย่ลง, server work ทำใน client ไม่ได้ (DB, secrets)                                     |

### ✅ Student Checkpoint

ถามทีละคน — quiz format:

1. "บอก 3 สิ่งที่ Server Component ทำไม่ได้"
2. "Cart icon ทำไมต้อง Client?"
3. "ถ้าผม render `<MenuCard>` ใน Cart icon ได้ไหม? — จะเกิดอะไรขึ้น?" (trick — ได้ ผ่าน children prop, แต่ไม่ใช่ผ่าน import ตรงๆ)

---

## 🧪 Block E: Vitest + TDD Intro (45-65 min, 20 min)

### 🎯 Block Goals

Student เข้าใจ:

- "Vitest = test runner. Compatible กับ Jest API"
- "TDD cycle: Red → Green → Refactor"
- Setup Vitest ใน Next.js project

### 💬 Lecture (~8 min)

**1. ทำไมต้อง test?** (2 min)

- Live class poll: "ใครเคยปล่อย bug ขึ้น production?"
- Reframe: "Test ไม่ใช่เพื่อ catch bug — มัน document behavior. อ่าน test → เข้าใจ feature ทันที"

**2. Test pyramid** (2 min)

วาดบนกระดาน:

```
        🔺 E2E (slow, expensive — Playwright)
       🔺🔺 Integration (medium — API calls)
      🔺🔺🔺 Unit (fast, focused — Vitest)
```

- Course นี้ focus: **Unit + Component tests** (Vitest)
- E2E (Playwright) = out of scope (เก็บไว้หลังจบคอร์ส)

**3. TDD cycle** (2 min)

```
1. RED:   เขียน test → fail
2. GREEN: เขียน code น้อยที่สุด → test pass
3. REFACTOR: ปรับ code ให้สวย → test ยัง pass
```

📢 **เน้น**: "ฟังดูช้า แต่ลองทำจริง — เร็วกว่าเขียน code แล้วมา debug ทีหลัง 3 เท่า"

**4. Vitest vs Jest** (2 min)

- Same API (describe/it/expect)
- Vitest = native ESM, faster, build บน Vite
- Modern Next.js project → Vitest เป็น default ที่นิยม

### 🖥️ Live Demo (~12 min)

**1. Install Vitest + Testing Library** (3 min)

```bash
cd apps/web
pnpm add -D vitest @vitejs/plugin-react @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event jsdom
cd ../..
```

📢 **อธิบาย package**:

- `vitest` = runner
- `@vitejs/plugin-react` = parse JSX
- `@testing-library/react` = render component ใน test
- `@testing-library/jest-dom` = matchers (toBeInTheDocument)
- `@testing-library/user-event` = simulate user typing/clicking
- `jsdom` = mock DOM ใน Node

**2. Configure Vitest** (5 min)

สร้าง `vitest.config.ts` (ชี้แต่ละ option):

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // mock browser
    globals: true, // describe/it/expect ไม่ต้อง import
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

📢 **พูด**: "Vitest ใช้ Vite config syntax — ถ้าเคยใช้ Vite จะคุ้นทันที"

สร้าง `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

**3. Write tiny first test** (3 min)

สร้าง `tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('1 + 1 = 2', () => {
    expect(1 + 1).toBe(2);
  });
});
```

รัน:

```bash
pnpm test
```

โชว์ output: ✓ 1 passed
📢 **พูด**: "Setup ทำงาน. ลบ test นี้ออกได้ — เป็นแค่ smoke test"

**4. Add `test` script ใน package.json** (1 min)
ตรวจ scripts:

```json
"test": "vitest run",
"test:watch": "vitest"
```

### ❓ Common Questions

| Q                                         | A                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| ทำไม jsdom ไม่ใช่ Node เปล่าๆ?            | jsdom mock DOM (window, document) ที่ Testing Library ต้องใช้                                                         |
| Vitest test file ต้องชื่อ `.test.ts` ไหม? | Default: `*.test.ts(x)` หรือ `*.spec.ts(x)`. Configure ได้                                                            |
| `globals: true` คืออะไร?                  | ทำให้ `describe`/`it`/`expect` ใช้ได้ไม่ต้อง import. ถ้า `false` ต้อง `import { describe, it, expect } from 'vitest'` |
| TDD บังคับเสมอไหม?                        | ไม่ — บางครั้ง prototype/explore ก็ skip ได้. แต่ feature สำคัญ + bug fix ควร TDD                                     |

---

## 🎨 Block F: Build Feedback Form with TDD (65-105 min, 40 min)

### 🎯 Block Goals

**Student build feedback form ด้วยตัวเอง** ใน class — instructor guide ทีละ step:

- Define Zod schema → derive type
- Write 3 failing tests
- Implement form ตาม tests
- Verify green
- Commit

### 🧑‍🏫 Format

**Live build together** — ไม่ใช่ instructor demo. Student พิมพ์ตามใน VS Code ของตัวเอง.

📢 **กฎ**: "ทุกคน open `apps/web/` ของตัวเอง. ผมจะรอจนทุกคน save แต่ละ step ก่อนไป step ถัดไป"

### 🖥️ Step-by-step Live Build (~40 min)

#### Step 1: Install RHF + Zod (3 min)

ทุกคนรัน:

```bash
cd apps/web
pnpm add react-hook-form zod @hookform/resolvers
cd ../..
```

📢 **พูด**: "`@hookform/resolvers` = adapter ที่ผูก Zod schema กับ React Hook Form"

#### Step 2: Write failing test FIRST (10 min)

> **🎓 TDD principle**: "เราจะ define behavior ก่อน implement"

สร้าง `apps/web/tests/feedback-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '@/components/feedback-form';

describe('FeedbackForm', () => {
  it('แสดง error เมื่อ submit ทั้งที่ name ว่าง', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ส่ง/i }));

    expect(await screen.findByText(/ต้องกรอกชื่อ/i)).toBeInTheDocument();
  });
});
```

📢 **อธิบายแต่ละบรรทัด** (สำคัญ):

- `vi.fn()` = mock function (track calls)
- `userEvent.setup()` = simulate keyboard/mouse
- `screen.getByRole('button', { name: /ส่ง/i })` = find by accessibility role + label (case-insensitive regex)
- `findByText` (async) — รอจนกว่า text จะปรากฏ (useful สำหรับ async behavior อย่าง form validation)

รัน:

```bash
cd apps/web
pnpm test
cd ../..
```

📢 **เน้น**: "Test FAIL — เพราะ `FeedbackForm` ยังไม่มี. นี่คือ **RED** state ของ TDD"

#### Step 3: Implement minimal component (15 min)

สร้าง `apps/web/components/feedback-form.tsx`:

```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FeedbackSchema = z.object({
  name: z.string().min(1, 'ต้องกรอกชื่อ'),
  message: z.string().min(10, 'ข้อความต้องอย่างน้อย 10 ตัวอักษร'),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackInput) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(FeedbackSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">ข้อความ</Label>
        <textarea
          id="message"
          rows={4}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
          {...register('message')}
        />
        {errors.message && <p className="text-destructive text-sm">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        ส่ง
      </Button>
    </form>
  );
}
```

📢 **อธิบายแต่ละ block**:

1. `'use client'` — form ต้อง state, ต้อง Client
2. **Zod schema first** — define shape + validation rules + error messages **ภาษาไทย**
3. `z.infer<typeof FeedbackSchema>` — derive TypeScript type จาก schema (single source of truth)
4. `useForm({ resolver: zodResolver(FeedbackSchema) })` — RHF + Zod adapter
5. `register('name')` — return `{ name, ref, onChange, onBlur }` → spread เข้า input
6. `errors.name?.message` — Zod error message ภาษาไทย
7. `handleSubmit(onSubmit)` — RHF จะ validate ก่อน → ถ้า pass จะเรียก onSubmit

รัน:

```bash
pnpm test
```

📢 **พูด**: "Test PASS! นี่คือ **GREEN** state"

#### Step 4: Add 2 more tests (8 min)

เพิ่มใน `feedback-form.test.tsx`:

```tsx
it('แสดง error เมื่อ message สั้นกว่า 10 ตัวอักษร', async () => {
  const user = userEvent.setup();
  render(<FeedbackForm onSubmit={vi.fn()} />);

  await user.type(screen.getByLabelText(/ชื่อ/i), 'สมชาย');
  await user.type(screen.getByLabelText(/ข้อความ/i), 'สั้น');
  await user.click(screen.getByRole('button', { name: /ส่ง/i }));

  expect(await screen.findByText(/อย่างน้อย 10 ตัวอักษร/i)).toBeInTheDocument();
});

it('เรียก onSubmit ด้วยข้อมูลที่ valid', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();
  render(<FeedbackForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/ชื่อ/i), 'สมชาย');
  await user.type(screen.getByLabelText(/ข้อความ/i), 'กาแฟอร่อยมากครับ ขอบคุณครับ');
  await user.click(screen.getByRole('button', { name: /ส่ง/i }));

  await vi.waitFor(() => {
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'สมชาย',
      message: 'กาแฟอร่อยมากครับ ขอบคุณครับ',
    });
  });
});
```

รัน `pnpm test` → 3/3 PASS

#### Step 5: Use FeedbackForm in real page (3 min)

สร้าง `apps/web/app/(storefront)/feedback/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { FeedbackForm, type FeedbackInput } from '@/components/feedback-form';

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState<FeedbackInput | null>(null);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ส่งความคิดเห็น</h1>
      {submitted ? (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <p className="font-semibold">ขอบคุณครับ {submitted.name}!</p>
          <p className="mt-2 text-sm text-gray-600">ข้อความ: {submitted.message}</p>
        </div>
      ) : (
        <FeedbackForm onSubmit={(data) => setSubmitted(data)} />
      )}
    </div>
  );
}
```

ทุกคนเปิด `http://localhost:3000/feedback` → ทดสอบ form manual

#### Step 6: Run full test + typecheck + commit (1 min)

```bash
pnpm test
pnpm typecheck
git add apps/web
git commit -m "feat(web): add feedback form with TDD"
```

### ❓ Common Questions

| Q                                     | A                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `register('name')` return อะไร?       | `{ name, ref, onChange, onBlur }` — props ของ controlled input                       |
| ทำไม `findByText` ไม่ใช่ `getByText`? | `findBy*` = async (รอ element ปรากฏ). Form validation มา async (Zod resolve promise) |
| `vi.waitFor` คืออะไร?                 | Polling helper — retry assertion จนกว่าจะ pass หรือ timeout                          |
| Zod schema แชร์กับ NestJS ได้จริงไหม? | จริง — Week 3 จะ move schema ไป `packages/shared` แล้ว BE+FE import เดียวกัน         |

---

## 🏁 Wrap-up + Week 2 Preview (105-115 min, 10 min)

### Recap (3 min)

ถามทีละคน:

1. "Server Component ทำอะไรไม่ได้บ้าง?"
2. "TDD 3 step คืออะไร?"
3. "Zod schema กับ TypeScript type — ความสัมพันธ์?"

### Week 2 Preview (5 min)

- Backend setup: NestJS + Postgres + Prisma
- Auth: JWT + bcrypt + Guards
- API endpoints: register, login, ดึง user info
- 📢 **เน้น**: "Pre-Week 2 — ติดตั้ง Docker Desktop ก่อนคลาส. ผมจะส่ง pre-class checklist ใน Slack"

### Final Q&A (2 min)

รับคำถามเปิด

---

## 🪜 Buffer (115-120 min, 5 min)

ใครยังไม่ commit Step 6 → stay 5 นาที

---

## 📝 Post-Session Self-Review (instructor)

| Item                                                         | Note                |
| ------------------------------------------------------------ | ------------------- |
| Student ทุกคน 3 tests pass ไหม?                              | \_\_\_              |
| Block ไหน over-run?                                          | \_\_\_              |
| Concept "RSC vs Client" ติดที่ใคร — ต้อง 1-on-1 ก่อน Week 2? | \_\_\_              |
| Common mistake ใน TDD live build                             | \_\_\_              |
| Energy ห้องโดยรวม                                            | low / medium / high |
| Pre-Week 2 readiness — ใครต้องช่วย Docker setup?             | \_\_\_              |

---

## 🔗 Connection to Week 2

Week 2 จะใช้:

- ✅ Monorepo structure (Week 1)
- ✅ TypeScript strict (Week 1)
- ✅ Vitest (Week 1) — เริ่ม unit test NestJS services
- 🆕 NestJS, Prisma, Postgres, Docker
- 🆕 JWT auth, bcrypt, Guards

Week 1 = "FE foundation" → Week 2 = "BE foundation" → Week 3 = "เชื่อม FE ↔ BE"
