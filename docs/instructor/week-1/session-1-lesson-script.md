# Week 1 Session 1 — Monorepo + Next.js Foundation

**Week:** 1
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** [Pre-course checklist](../master/pre-course-checklist.md) completed (Node 20+, pnpm 9+, Git, VS Code, GitHub)
**Covers:** Tasks 1-4 of [Week 1 Plan](../../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ มี monorepo skeleton (pnpm workspace + Turborepo) commit แล้ว 2-3 commits
- ✅ มี Next.js app รันได้บน `localhost:3000`
- ✅ มีหน้า `/menu` ที่แสดง header + footer + heading "เมนู"
- ✅ **อธิบายได้** ว่า monorepo เลือกเพราะอะไร, App Router file convention เป็นยังไง, route group ใช้ทำอะไร
- 🔵 RSC vs Client เกริ่นเฉยๆ — Session 2 ค่อย deep dive

> **Note สำหรับ instructor**: ถ้า session over-run ตัด Block C ส่วน "RSC primer" ก่อน (เก็บไป Session 2 ทั้งหมด) — Block C ทำแค่ layouts + route groups ก็ achieve goals หลักได้

---

## 📋 Pre-Session Checklist (instructor — เช็คก่อน 10 นาที)

- [ ] Test laptop projector / screen share, terminal font ≥ 16pt
- [ ] เปิดแท็บ browser พร้อม: nextjs.org, turbo.build, react.dev
- [ ] ตรวจ npm registry / Internet — Hetzner DNS ชอบช้าตอนเปิดประชุม
- [ ] เช็ค OS ของ student แต่ละคน (macOS / Windows / Linux) — terminal command เปลี่ยน
- [ ] เปิด clean folder ที่จะ live demo (ไม่ใช่ folder ของตัวเอง — กัน leak)
- [ ] เปิด [Week 1 Plan](../../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) ไว้ในแท็บแยก (ใช้เป็น demo source-of-truth)

---

## 🗓️ Time-Blocked Agenda

| Time       | Block          | Activity                                                       |
| ---------- | -------------- | -------------------------------------------------------------- |
| 0-5        | Pre-roll       | Welcome, attendance, env check                                 |
| 5-10       | Course Preview | Demo final coffee shop (recorded), explain 6-week arc          |
| **10-35**  | **Block A**    | **Why monorepo + pnpm + Turbo** (lecture 15 + demo 10)         |
| **35-70**  | **Block B**    | **Next.js App Router intro** (lecture 15 + demo 20)            |
| **70-100** | **Block C**    | **Layouts + Route Groups + RSC primer** (lecture 12 + demo 18) |
| 100-115    | Wrap-up        | Recap + homework + Q&A                                         |
| 115-120    | Buffer         | Stragglers / individual help                                   |

---

## 🟢 Pre-roll & Course Preview (10 min)

### Pre-roll (0-5 min)

- กล่าวต้อนรับ, attendance, ตรวจว่าทุกคนทำ pre-course checklist แล้ว
- Quick env verify: ขอให้ทุกคนรัน `node --version && pnpm --version && git --version` พร้อมกัน — ถ้าใครพัง แก้ก่อน
- ตั้งกฎ: "ติดตรงไหนพิมพ์ใน chat ทันที, ไม่ต้องรอจบ block"

### Course Preview (5-10 min)

- โชว์ screenshot/video สั้น ของ coffee shop ตอนจบคอร์ส (storefront + admin + reports dashboard)
- อธิบาย arc 6 สัปดาห์:
  > Week 1: ตั้ง foundation. Week 2: backend + DB. Week 3: เชื่อม FE↔BE. Week 4: order flow. Week 5: stock + reports. Week 6: deploy live ขึ้น VPS
- สำคัญ: **"คอร์สนี้ project-driven — เราเรียน concept โดยสร้างของจริงไปด้วย ไม่ใช่ tutorial ทีละบรรทัด"**

---

## 📦 Block A: Why Monorepo + pnpm + Turbo (10-35 min, 25 min)

### 🎯 Block Goals

Student เข้าใจ:

- "Monorepo = หลาย packages ใน 1 repo, **ไม่ใช่ microservices**"
- "pnpm workspace = link packages ในเครื่อง โดยไม่ต้อง publish"
- "Turbo = task orchestrator + cache, **ไม่ใช่ build tool เอง**"

### 💬 Lecture (~15 min)

**1. เปิดด้วยคำถาม** (1 min)

> "ใครเคยเจอเคสที่ต้องแก้ทั้ง frontend และ backend พร้อมกันบ้าง?"

รอคำตอบ. Validate:

- "ใช่ครับ — version skew, type drift, 2 PR ต้อง merge พร้อมกัน"
- บอก story สั้น: "ผมเคยเจอ API คืน field ใหม่ แต่ FE ไม่ได้อัปเดต type → bug ขึ้น staging เพราะ type drift"

**2. The "split repo" problem** (4 min)

- 2 repos = 2 versions of types (manual sync via npm publish หรือ copy-paste)
- Deploy order matter (BE ก่อน หรือ FE ก่อน?)
- Integration tests ลำบาก — ต้อง spin up 2 repos
- Onboarding คนใหม่: clone กี่ repo? อ่าน docs กี่ที่?

**3. Monorepo = 1 PR, 1 history, 1 type system** (5 min)

วาดบนกระดาน:

```
┌──────────────────── repo: course-full-stack ────────────────────┐
│                                                                  │
│   apps/web ──────► uses ──────► packages/shared                 │
│   apps/api ──────► uses ──────► packages/shared                 │
│                                                                  │
│   เปลี่ยน schema ใน packages/shared = FE+BE update พร้อมกัน      │
│   1 PR review = เห็น impact ทั้งระบบ                            │
└──────────────────────────────────────────────────────────────────┘
```

> **🎓 Key insight**: "Monorepo ไม่ใช่ ‘all your code in one place’ — มันคือ ‘code ที่เปลี่ยนพร้อมกัน อยู่ด้วยกัน’"

**4. pnpm vs npm vs yarn** (2 min)

- ทั้ง 3 ทำ workspaces ได้
- pnpm: faster, strict (no phantom deps), disk-efficient (symlink)
- "1 GB เหลือ 200 MB ในเครื่อง — เพราะ pnpm symlink, ไม่ copy files"
- เลือก pnpm เพราะ industry trend + DX

**5. Turborepo's job** (3 min)

- Turbo รู้ topology: "build apps/web ต้องรอ packages/shared build ก่อน"
- Cache: ถ้า packages/shared ไม่เปลี่ยน → ไม่ build ใหม่
- "Think of it as Make for monorepos"
- ใช้คำว่า "task pipeline" — ไม่ใช่ "build tool"

### 🖥️ Live Demo (~10 min)

**สิ่งที่ทำตามลำดับ** (ดู Task 1-2 ของ plan):

1. เปิด VS Code ใน folder ว่าง: `course-full-stack/`
2. สร้าง `pnpm-workspace.yaml`:

   ```yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

   📢 **พูดขณะพิมพ์**: "บอก pnpm ว่า packages อยู่ใน folders ไหน — pattern แบบ glob"

3. สร้าง root `package.json`:

   ```json
   {
     "name": "course-full-stack",
     "private": true,
     "packageManager": "pnpm@9.15.0",
     "engines": { "node": ">=20" }
   }
   ```

   📢 **พูด**: "`private: true` กัน publish โดยบังเอิญ. `packageManager` field ทำให้ corepack ใช้ version ที่ถูกต้องอัตโนมัติ"

4. รัน `pnpm install` — โชว์ว่า empty (ไม่มี deps)

5. สร้าง `tsconfig.base.json`:

   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       ...
     }
   }
   ```

   📢 **พูด** (เน้น): "`noUncheckedIndexedAccess: true` คือ flag ที่ช่วยมาก — `arr[0]` จะคืน `T | undefined` แทน `T`. กัน null pointer bug ตั้งแต่ compile time"

6. สร้าง `turbo.json` — แสดง task pipeline (อย่าเข้ารายละเอียดเยอะ — แค่บอก "นี่ Turbo"):

   ```json
   {
     "tasks": {
       "build": { "dependsOn": ["^build"] },
       "dev": { "cache": false, "persistent": true }
     }
   }
   ```

   📢 **พูด**: "`^build` = build dependencies ก่อน. `persistent: true` = task ไม่จบเอง (long-running)"

7. **First commit** — โชว์ git workflow:
   ```bash
   git add .
   git commit -m "chore: init monorepo skeleton"
   ```

### ❓ Common Questions (เตรียมตอบ)

| Q                                | A                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ใช้ npm workspace ได้ไหม?        | ได้ครับ ทำงานเหมือนกันโดยรวม. แต่ pnpm strict กว่า — phantom dependency ถูกบล็อก. Industry trend ก็ไป pnpm |
| Turbo จำเป็นไหม ถ้ามีแค่ 2 apps? | ไม่จำเป็น manual run ก็ได้. แต่พอเริ่มมี dependencies จะคุ้มมาก. ใส่ตอนนี้เพราะ habit ดี                   |
| ใช้ Nx ได้ไหม?                   | ได้ครับ Nx feature เยอะกว่า แต่ซับซ้อนกว่า. Turbo เหมาะ "JavaScript-only, simple"                          |
| Pnpm install ช้ามาก ทำไง?        | เช็ค `~/.npmrc` ว่ามี registry mirror ไหม, ลองใช้ `--registry=https://registry.npmmirror.com`              |
| ทำไมต้อง `private: true`?        | กัน accident `pnpm publish` ทั้ง repo ไป npm — workspace root ไม่ใช่ package ที่จะ publish                 |

### ✅ Student Checkpoint (1 min)

> "ใครยังไม่ commit `chore: init monorepo skeleton`? ยกมือ"

ถ้ามี → wait + help. **อย่าไป Block B ก่อน** — ทุกคนต้อง alignment

---

## ⚛️ Block B: Next.js App Router Intro (35-70 min, 35 min)

### 🎯 Block Goals

Student เข้าใจ:

- "App Router = file-system-based routing"
- "page.tsx = route, layout.tsx = wrapper"
- ทำไม Next.js (vs Vite + React)

### 💬 Lecture (~15 min)

**1. Why a framework?** (3 min)

> "เคยเขียน Express server-side render HTML เองไหม? routing manual?"

อธิบาย pain points:

- routing logic เขียนเอง
- code-splitting ต้อง config webpack
- SSR setup ยุ่ง
- SEO meta tags manual
- image optimization manual

→ **Next.js แก้ทุกตัวให้แล้ว**

**2. Pages Router vs App Router** (3 min)

- **Pages Router** (เก่า, `pages/` folder) — มาตรฐาน v1-v12
- **App Router** (ใหม่, `app/` folder) — default ตั้งแต่ v13.4
- มี React Server Components (RSC) — เกริ่นเฉยๆ ตอนนี้, deep dive Block C
- **เราใช้ App Router** — เป็นทิศทางใหม่ของ Next.js

**3. File conventions** (5 min)

วาดบนกระดาน:

```
app/
├── layout.tsx       ← wraps ทุก page (mandatory)
├── page.tsx         ← URL: /
├── about/
│   └── page.tsx     ← URL: /about
└── shop/
    ├── layout.tsx   ← wraps /shop และลึกกว่า
    └── page.tsx     ← URL: /shop
```

> **🎓 Key insight**: "File path = URL path. ไม่มี route register file"

ไฟล์พิเศษอื่นๆ (mention เฉยๆ — ไม่ deep dive):

- `loading.tsx` = loading UI
- `error.tsx` = error boundary
- `not-found.tsx` = 404 page

**4. ทำไมแบบนี้ดี?** (4 min)

- "Dev คนใหม่อ่าน `app/` folder = รู้ URL structure ทันที"
- ไม่ต้องมี `routes.tsx` register file
- Nested layouts ฟรี (แต่จะลงรายละเอียดใน Block C)

### 🖥️ Live Demo (~20 min)

**สิ่งที่ทำตามลำดับ** (Task 3 ของ plan):

1. รัน:

   ```bash
   cd apps
   pnpm create next-app@latest web \
     --typescript --tailwind --app --turbopack \
     --import-alias "@/*" --no-src-dir --no-eslint --use-pnpm
   cd ..
   ```

   📢 **อธิบายแต่ละ flag** (สำคัญ — เด็กจะถามทีหลัง):
   - `--typescript` = TS by default
   - `--tailwind` = preconfig Tailwind
   - `--app` = App Router (key flag)
   - `--turbopack` = ใช้ Turbopack dev server (เร็ว ~10x)
   - `--no-src-dir` = ไฟล์อยู่ที่ root ของ apps/web (เก็บโครง flat)
   - `--no-eslint` = ไม่ install ESLint ตอนนี้ (จะเพิ่มทีหลัง)

2. **เปิด apps/web ใน VS Code** — ทัวร์ folder structure:
   - `app/layout.tsx` ← root layout
   - `app/page.tsx` ← landing page
   - `app/globals.css` ← Tailwind directives
   - `next.config.ts` ← config
   - `tsconfig.json` ← override base

3. **แก้ tsconfig.json ให้ extend base** (Task 3.2):
   - เปลี่ยนเป็น `"extends": "../../tsconfig.base.json"`
   - 📢 **พูด**: "ทุก app ใน monorepo extend tsconfig เดียวกัน → setting เปลี่ยนทีเดียวมีผลทั้งหมด"

4. **เพิ่ม scripts ที่ Turbo รู้จัก** (Task 3.3):

   ```json
   "scripts": {
     "dev": "next dev --turbopack -p 3000",
     "build": "next build",
     "typecheck": "tsc --noEmit"
   }
   ```

5. **รัน `pnpm install` (root) จากนั้น `pnpm dev`** — โชว์ Turbo output:
   - ตรง terminal: "Turbo running 1 task: dev"
   - เปิด `http://localhost:3000` → เห็น Next.js default

6. **Hot reload demo** — แก้ `app/page.tsx` heading → save → เห็น browser update ทันที
   - 📢 **พูด**: "Turbopack hot module replacement — เร็วมาก, ไม่ต้อง refresh"

7. **Commit** —
   ```bash
   git add apps/web pnpm-lock.yaml
   git commit -m "feat(web): scaffold Next.js 15 app"
   ```

### ❓ Common Questions

| Q                                                | A                                                                                                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ทำไม Next.js ไม่ใช่ Vite + React?                | Vite + React = แค่ build tool + library. Next.js = framework: routing, SSR, image, font optimization built-in. Vite + React Router ทำได้ แต่ต้อง assemble เอง |
| Pages Router ตายแล้วเหรอ?                        | ยังใช้ได้ แต่ไม่มี new feature. Project ใหม่ใช้ App Router                                                                                                    |
| Turbopack กับ Webpack ต่างยังไง?                 | Turbopack = next-gen, Rust-based, เร็วกว่า dev server มาก. ตอน prod build ยังใช้ Webpack อยู่ (แต่จะย้ายไป Turbopack เร็วๆ นี้)                               |
| `'use client'` คืออะไร? (เด็กถามก่อนถึง Block C) | "เกริ่นใน Block C ครับ — ตอนนี้รู้แค่ว่า component default render บน server. ใส่ `'use client'` เมื่อต้องการ interactivity (state, event handlers)"           |

### ✅ Student Checkpoint (1 min)

> "ทุกคนเปิด `app/page.tsx` แก้ข้อความ default → ดู browser update — ใครยังไม่ทำ?"

---

## 🎨 Block C: Layouts + Route Groups + RSC Primer (70-100 min, 30 min)

### 🎯 Block Goals

Student เข้าใจ:

- "Layout = persistent shell, ไม่ re-render ตอน inner route เปลี่ยน"
- "Route group `(name)` = group โดยไม่ปรากฏใน URL"
- 🔵 RSC = "default, render บน server" — เกริ่น 5 นาที, deep dive Session 2

### 💬 Lecture (~12 min)

**1. Layout มีไว้ทำไม** (3 min)

- Header / footer / sidebar ที่ shared ทุกหน้า — เขียนครั้งเดียว
- `app/layout.tsx` = root, mandatory
- ถ้า `app/admin/layout.tsx` → admin section มี layout ของตัวเอง (nested ทับซ้อน root)
- 📢 **Key**: "Layout ไม่ re-render ตอน inner route เปลี่ยน → state ใน layout (เช่น sidebar collapse) คงอยู่"

**2. Route Groups `(folderName)`** (3 min)

วาดบนกระดาน:

```
app/
├── layout.tsx                    ← root
├── (storefront)/                 ← group, ไม่อยู่ใน URL
│   ├── layout.tsx                ← header + cart icon (สำหรับลูกค้า)
│   ├── menu/page.tsx             ← URL: /menu
│   ├── cart/page.tsx             ← URL: /cart
│   └── order/[id]/page.tsx       ← URL: /order/abc123
├── (admin)/                      ← อีก group (Week 4)
│   ├── layout.tsx                ← header + admin nav
│   └── admin/
│       └── menu/page.tsx         ← URL: /admin/menu
```

📢 **เน้น**:

- "`()` = parens, ไม่ใช่ `[]` (ที่เป็น dynamic segment)"
- "Use case: shared layout ของหลาย routes โดยไม่อยากให้ URL ซ้อน prefix"

**3. RSC primer** (5 min — เกริ่นเฉยๆ)

> **⚠️ Time check**: ถ้าใกล้ 95 นาทีแล้ว → skip ส่วนนี้, ย้ายไป Session 2 ทั้งหมด

- "Server Component = default ใน App Router. Render บน server, ส่ง HTML"
- "Client Component = ใส่ `'use client'` บนสุด file. ทำ interaction ได้ (state, event handlers)"
- Why server: ใช้ DB/secret ได้, bundle ลูกค้าเล็กลง
- Why client: คน interact ได้
- **Saved for Session 2** — ลงรายละเอียด, ตัวอย่าง, common mistakes

### 🖥️ Live Demo (~15 min)

**สิ่งที่ทำตามลำดับ** (Task 4 ของ plan):

1. **แก้ root layout** (`app/layout.tsx`):
   - ตั้ง `lang="th"`
   - ใส่ metadata
   - ใช้ `min-h-screen` + base styles
   - 📢 **พูด**: "Root layout เป็น Server Component (สังเกต ไม่มี `'use client'`)"

2. **ทำ landing page redirect** (`app/page.tsx`):

   ```tsx
   import { redirect } from 'next/navigation';
   export default function Home() {
     redirect('/menu');
   }
   ```

   📢 **พูด**: "`redirect()` ใน Server Component = HTTP redirect ที่ server. ไม่ต้องใช้ JS client-side"

3. **สร้าง storefront route group** (`app/(storefront)/layout.tsx`):
   - Header: `☕ Coffee Shop`
   - Cart placeholder: `Cart (0)` (text เฉยๆ ตอนนี้ — Block 8 ค่อยทำ Client Component)
   - Footer
   - 📢 **พูด**: "นี่ Server Component. Re-render เมื่อ navigation ระหว่าง routes ภายใน group แต่ไม่ re-render zooming เข้า nested routes"

4. **สร้าง menu page** (`app/(storefront)/menu/page.tsx`):

   ```tsx
   export default function MenuPage() {
     return (
       <div>
         <h1 className="mb-6 text-3xl font-bold">เมนู</h1>
         <p className="text-gray-600">รายการเมนูจะแสดงที่นี่</p>
       </div>
     );
   }
   ```

5. **เปิด browser** — ตรวจ:
   - `http://localhost:3000` → redirect ไป `/menu` ✓
   - URL = `/menu` (ไม่ใช่ `/storefront/menu`) — **เน้น point นี้**
   - เห็น header "☕ Coffee Shop" + heading "เมนู" + footer

6. **Inspect Element** — โชว์ HTML ของหน้า:
   - 📢 **พูด** (สำคัญ — set up RSC concept): "ดู HTML ที่ server ส่งมา — มันมาแล้วครบ. ไม่ใช่ JS render ทีหลัง. นี่คือ Server Component ทำงาน — Session หน้าจะลงรายละเอียด"

7. **Commit**:
   ```bash
   git add apps/web/app
   git commit -m "feat(web): add storefront route group with layout"
   ```

### ❓ Common Questions

| Q                                                               | A                                                                                                                                        |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| ทำไมต้องมี route group? ใส่ layout ใน `/menu/layout.tsx` ก็ได้? | ได้ ถ้า layout ใช้แค่ `/menu`. แต่ถ้า want share `/menu`, `/cart`, `/checkout` — ต้องมี parent. Route group = parent ที่ไม่กิน URL       |
| `()` ใน route group ต่างจาก `[]` ยังไง?                         | `()` = group (ไม่ปรากฏใน URL). `[]` = dynamic segment (เช่น `[id]/page.tsx` matches `/abc123`)                                           |
| Layout จะ re-render ไหมถ้าเปลี่ยน route ภายใน?                  | ไม่. Layout persist — re-render แค่ children. ดี: state ใน layout (sidebar) คงอยู่                                                       |
| `'use client'` ใส่ที่ไหน? (ถ้าถาม)                              | บรรทัดแรกของ file. ทุก component ใน file นั้น = Client. **Caveat**: ห้าม import server-only library (เช่น `next/headers`) ใน client file |

### ✅ Student Checkpoint (3 min)

ถามทีละคน — quiz format:

1. "ทำไม route group `(storefront)` ดีกว่าโฟลเดอร์ `storefront/` ตรงๆ?"
2. "Root layout ต่างจาก storefront layout ยังไง — ตรงไหนเปลี่ยน, ตรงไหนคงที่?"
3. "ถ้าผมอยากให้ admin มี header สีดำ, customer มี header สีน้ำตาล — ต้องทำยังไง?" (expected: 2 route groups, 2 layouts)

---

## 🏁 Wrap-up + Homework + Q&A (100-115 min, 15 min)

### Recap (5 min)

ถามแบบสลับคน:

1. "Monorepo เลือกเพราะอะไร 1-2 ข้อ?" — expected: shared types / 1 PR / less duplication
2. "App Router file convention — `page.tsx` กับ `layout.tsx` ต่างยังไง?" — expected: route vs wrapper
3. "Route group `()` ใช้ทำอะไร?" — expected: shared layout, ไม่ปรากฏใน URL

> **Tip**: ถ้าใครตอบไม่ได้ ไม่ต้องอาย — บอกว่า "ลอง list ใน Notion ส่วนตัวคืนนี้ ผมจะถามอีก Session 2" (forced spaced repetition)

### Homework Assignment (5 min)

**Tasks 5-10 ของ Week 1 plan**:

- Task 5-6: Tailwind verify + shadcn/ui install + 5 components
- Task 7: Static menu page (Server Component)
- Task 8: Cart icon (Client Component) — **นี่เป็นจุด aha ของ RSC vs Client**
- Task 9-10: Vitest setup + RHF + Zod feedback form (TDD style)

**Time budget**: ~3-5 ชั่วโมง

**Deliverable**:

- Branch: `week1-homework`
- PR เปิดถึง `main` (ยังไม่ merge)
- มี: static menu, Cart icon ที่กดได้, feedback form ที่ validate ภาษาไทย, tests pass
- แชร์ link PR ใน Slack/LINE channel

**Deadline**: ก่อน Session 2 (default: 1 สัปดาห์ถัดไป)

📢 **เน้น**: "ทำให้ครบ — Session 2 จะ assume ว่าทุกคนทำ Tasks 5-10 แล้ว. ถ้าไม่ทำ จะตามไม่ทัน"

### Q&A (5 min)

รับคำถามเปิด. ถ้าไม่มีคำถาม ถาม leading: "อะไรที่ยังคลุมเครือบ้าง?"

---

## 🪜 Buffer & Stragglers (115-120 min, 5 min)

- ใครยังไม่ commit Block C → stay 5 นาที, instructor ช่วย
- ไม่ extend session — กัน student burnout

---

## 📝 Post-Session Self-Review (instructor — กรอกหลังคลาส)

| Item                                  | Note                       |
| ------------------------------------- | -------------------------- |
| Student ทุกคนทำ Tasks 1-4 จบไหม?      | \_\_\_                     |
| Block ไหน over-run?                   | \_\_\_                     |
| Concept ไหนติด — Session 2 ต้องทบทวน? | \_\_\_                     |
| Common mistake ที่เจอ                 | \_\_\_                     |
| Student ที่ดูเหนื่อย / ตามไม่ทัน      | \_\_\_ (DM ก่อน Session 2) |
| Energy ของห้องโดยรวม                  | low / medium / high        |

---

## 🔗 Related Artifacts (จะมีในรอบถัดไป)

- [ ] `session-2-lesson-script.md` — Tailwind/shadcn + Static UI + Client Component + RHF/Zod (Tasks 5-10)
- [ ] `slides-outline.md` — diagrams + visuals to project
- [ ] `exercises.md` — homework + solutions + variants
- [ ] `pitfalls-faq.md` — extended FAQ + debug tips
- [ ] `assessment-checklist.md` — 10 checkpoint Qs ตอนจบ Week 1
