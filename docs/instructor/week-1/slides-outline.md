# Week 1 — Slides Outline

**Audience:** instructor — สำหรับ build slides ใน Keynote/PowerPoint/Google Slides/Slidev

**Total slides target:** ~25 slides สำหรับ 2 sessions

> **Tip**: ถ้าใช้ Slidev (markdown-based) — copy ตรงนี้ไปได้เลย, เพิ่ม transition syntax

---

## 📐 Visual Conventions

- **ใช้ font monospace สำหรับ code/path** (JetBrains Mono / Fira Code)
- **Color scheme**: dark mode (background `#1e1e2e`, text `#cdd6f4`, accent `#f5a623` coffee)
- **1 idea per slide** — ห้าม wall of text
- **Transition**: fade only — ไม่ทำ fancy
- **Code highlighting**: ใช้ Shiki หรือ Prism — readable เป็นหลัก

---

## 🎬 Session 1 Slides (12 slides)

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│                                      │
│       ☕ COFFEE SHOP COURSE          │
│                                      │
│       Week 1 · Session 1             │
│       Monorepo + Next.js Foundation  │
│                                      │
│       [Date]    [Instructor name]    │
└──────────────────────────────────────┘
```

### Slide 1.02 — Course Preview (Image)

- Screenshot ของ final coffee shop UI (storefront + admin + reports)
- Caption: "**ปลายทาง 6 สัปดาห์**: ของจริง deploy บน VPS ของตัวคุณ"
- Optional: 30-sec video clip auto-play (storefront → cart → checkout → admin)

### Slide 1.03 — 6-Week Arc

```
Week 1: FE Foundation       ── Next.js + monorepo
Week 2: BE Foundation       ── NestJS + Postgres
Week 3: FE ↔ BE             ── First end-to-end slice
Week 4: Order Flow          ── Cart, checkout, kitchen
Week 5: Stock + Reports     ── Business logic core
Week 6: Deploy + GitOps     ── Live ขึ้น VPS
```

> Speaker note: "วันนี้ Week 1. Foundation. วาง groundwork."

### Slide 1.04 — Today's Goal

```
จบ session นี้ คุณจะ:

✓ มี monorepo + Turborepo working
✓ มี Next.js app run บน localhost:3000
✓ เข้าใจ App Router, layouts, route groups
○ RSC vs Client — เกริ่นเฉยๆ (Session 2 deep dive)
```

### Slide 1.05 — The Split-Repo Problem

```
┌─────────────────┐         ┌─────────────────┐
│  repo-frontend  │  ───?── │  repo-backend   │
└─────────────────┘         └─────────────────┘
       │                              │
       │ types ที่ต้อง sync          │
       │ deploy order matters         │
       │ 2 PRs to merge together      │
       │ integration tests ลำบาก     │
       └──────── pain ───────────────┘
```

> Speaker note: ถามคนฟัง — "เคยเจอเคสนี้ไหม?"

### Slide 1.06 — Monorepo Mental Model

```
┌────────── 1 repo: course-full-stack ──────────┐
│                                                │
│    apps/web ──┐                                │
│               ├──► uses ◄── packages/shared    │
│    apps/api ──┘                                │
│                                                │
│    1 PR · 1 history · 1 type system           │
└────────────────────────────────────────────────┘
```

### Slide 1.07 — pnpm + Turborepo Stack

```
              ┌─────────────────┐
              │   Turborepo     │  ← orchestrate tasks
              │  (cache, pipe)  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  pnpm workspace │  ← link packages
              │  (no copy)      │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   apps + pkgs   │
              └─────────────────┘
```

> Speaker note: "pnpm = workspace. Turbo = task runner. คนละชั้น"

### Slide 1.08 — App Router File Convention

```
app/
├── layout.tsx       ← wraps everything (mandatory)
├── page.tsx         ← URL: /
├── about/
│   └── page.tsx     ← URL: /about
└── shop/
    ├── layout.tsx   ← wraps shop and below
    └── page.tsx     ← URL: /shop
```

**Key**: file path = URL path

### Slide 1.09 — Pages Router vs App Router

```
┌─── Pages Router (เก่า) ───┐  ┌─── App Router (ใหม่) ────┐
│                            │  │                           │
│  pages/                    │  │  app/                     │
│  ├── index.tsx             │  │  ├── page.tsx             │
│  ├── _app.tsx              │  │  ├── layout.tsx           │
│  └── about.tsx             │  │  └── about/page.tsx       │
│                            │  │                           │
│  - Client-only             │  │  - Server Components      │
│  - getServerSideProps      │  │  - async components       │
│  - getStaticProps          │  │  - streaming              │
└────────────────────────────┘  └───────────────────────────┘

         🎯 We use App Router
```

### Slide 1.10 — Route Groups

```
app/
├── (storefront)/             ← group, NOT in URL
│   ├── layout.tsx
│   ├── menu/page.tsx         → /menu
│   └── cart/page.tsx         → /cart
├── (admin)/                  ← another group
│   ├── layout.tsx
│   └── admin/menu/page.tsx   → /admin/menu

      ()  =  group  (URL invisible)
      []  =  dynamic segment
```

### Slide 1.11 — Layouts Persist

```
Navigate: /menu → /cart

┌─── /menu ────┐         ┌─── /cart ────┐
│ Header       │         │ Header       │  ← same instance
│ (CartIcon)   │         │ (CartIcon)   │  ← state persists
├──────────────┤         ├──────────────┤
│ Menu list    │         │ Cart items   │  ← only this re-renders
│              │         │              │
└──────────────┘         └──────────────┘
```

### Slide 1.12 — Homework + Recap

```
📝 HOMEWORK (~3-5 hrs)

Tasks 5-8 ของ Week 1 plan:
□ Task 5: Tailwind verify
□ Task 6: shadcn/ui install + components
□ Task 7: Static menu page (Server Component)
□ Task 8: Cart icon (Client Component)  ← aha moment

Deliverable: PR `week1-homework` → main
Deadline:    next session

─── 🎯 RECAP ───────────────────
1. Monorepo คืออะไร?
2. App Router file convention?
3. Route group `()` ใช้ทำอะไร?
```

---

## 🎬 Session 2 Slides (13 slides)

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│                                      │
│       ☕ COFFEE SHOP COURSE          │
│                                      │
│       Week 1 · Session 2             │
│       RSC + TDD Form                 │
│                                      │
└──────────────────────────────────────┘
```

### Slide 2.02 — Today's Goal

```
จบ session นี้ คุณจะ:

✓ อธิบาย Server vs Client Component ได้ลึก
✓ Setup Vitest ใน Next.js
✓ Build form + 3 tests แบบ TDD
✓ พร้อมเข้า Week 2 (NestJS + Postgres)
```

### Slide 2.03 — Server vs Client Mental Model

```
┌──── SERVER ────┐    ┌──── CLIENT (browser) ────┐
│                │    │                            │
│ Query DB       │    │ useState / useEffect      │
│ Read fs        │    │ onClick / onChange         │
│ Use secrets    │    │ window / localStorage      │
│ Render HTML    │    │ Animations / Hydration     │
│                │    │                            │
│ Server Comp.   │    │ Client Comp.              │
│ (default)      │    │ ('use client')            │
│                │    │                            │
│ ❌ no useState │    │ ❌ no DB direct          │
│ ❌ no onClick  │    │ ❌ no fs                  │
└────────────────┘    └────────────────────────────┘
         │                       │
         └─── HTML + props ──────┘
              hydrate → interact
```

### Slide 2.04 — Decision Rule

```
┌────────────────────────────────────────────┐
│                                             │
│  Default: Server                            │
│                                             │
│  Switch to Client เมื่อต้องการ:           │
│                                             │
│  1️⃣  State (useState, useReducer)          │
│  2️⃣  Effects (useEffect)                   │
│  3️⃣  Browser APIs                          │
│  4️⃣  Event handlers ที่ interactive       │
│  5️⃣  Hooks ที่ build บน 1-4              │
│      (TanStack Query, Zustand)              │
│                                             │
└─────────────────────────────────────────────┘
```

### Slide 2.05 — Composition Rule

```
✅ Server Component ── render ──► Client Component  (OK)

❌ Client Component ── import ──► Server Component  (ERROR)

✅ Client Component ── children ──► Server Component (OK pattern)
```

> Speaker note: "Important rule. Diagram ที่จะมาในใจตอนเขียน code"

### Slide 2.06 — Bundle Impact

```
                          First Load JS
                          ─────────────
  100% Server Component        ~50 KB
  Mixed (some Client)         ~120 KB
  100% Client (anti-pattern)  ~250 KB+

   "Every 'use client' = code goes to user's browser"
```

### Slide 2.07 — Test Pyramid

```
                     🔺
                     E2E
                  Playwright
                    slow
                ──────────────
                Integration
                medium speed
              ──────────────────
                  Unit
            Vitest · fast · focused
        ────────────────────────────

           ← We focus here
```

### Slide 2.08 — TDD Cycle

```
┌──────────────────────────────────────┐
│                                      │
│         🔴  RED                       │
│         เขียน test → fail            │
│              │                       │
│              ▼                       │
│         🟢  GREEN                     │
│         เขียน code น้อยที่สุด → pass │
│              │                       │
│              ▼                       │
│         🔵  REFACTOR                  │
│         ปรับ code ให้สวย → ยัง pass  │
│              │                       │
│              └──── repeat ──────┐    │
│                                 │    │
└─────────────────────────────────┴────┘
```

### Slide 2.09 — Vitest vs Jest

```
┌──────────────────┐     ┌──────────────────┐
│      Jest        │     │     Vitest       │
├──────────────────┤     ├──────────────────┤
│ Same API         │ ─── │ Same API         │
│ describe/it      │     │ describe/it      │
│ expect()         │     │ expect()         │
├──────────────────┤     ├──────────────────┤
│ Slower (Babel)   │     │ Faster (esbuild) │
│ CommonJS-first   │     │ Native ESM       │
│ Older ecosystem  │     │ Vite ecosystem   │
└──────────────────┘     └──────────────────┘

       Modern Next.js → Vitest
```

### Slide 2.10 — Zod + RHF Pairing

```
   Zod schema           ───►  validation
       │
       ▼
   z.infer<typeof>      ───►  TypeScript type
       │
       ▼
   zodResolver(...)     ───►  React Hook Form
       │
       ▼
   register('field')    ───►  <Input> props

   Single source of truth: schema
```

### Slide 2.11 — TDD Live Build Plan

```
1️⃣  Install RHF + Zod                  (3 min)
2️⃣  Write failing test (1 case)         (10 min) ← RED
3️⃣  Implement minimal component         (15 min) ← GREEN
4️⃣  Add 2 more tests                    (8 min)
5️⃣  Use in real page                    (3 min)
6️⃣  Test + typecheck + commit          (1 min)
```

### Slide 2.12 — Week 2 Preview

```
Week 2 — BE Foundation

🆕 NestJS (modules, controllers, providers)
🆕 Postgres ใน Docker
🆕 Prisma (schema, migrate, client)
🆕 JWT auth + bcrypt + Guards

Pre-class:
□ Install Docker Desktop
□ Verify: docker run hello-world

(ผมจะส่ง pre-class checklist ใน Slack)
```

### Slide 2.13 — Final Q&A

```
┌──────────────────────────────────────┐
│                                      │
│      ❓  คำถาม ❓                    │
│                                      │
│  - Recap quiz (verbal)               │
│  - Anything still unclear?           │
│  - What surprised you this week?     │
│                                      │
└──────────────────────────────────────┘
```

---

## 🛠️ Build Notes (instructor)

### Recommended Tools

| Tool | Why |
|---|---|
| **Slidev** | Markdown-based, code-friendly, version-control friendly |
| **Keynote** | Apple polish, presenter notes, animations |
| **PowerPoint** | Universal, chart features |
| **Google Slides** | Realtime collaboration, web-shareable |

### If Using Slidev

1. `pnpm create slidev`
2. Copy each slide markdown ตามนี้
3. Add `transition: fade` ที่ frontmatter
4. Code blocks render auto-highlight

### Live Coding Tip

ขณะ slide → live code, **อย่าใช้ slide เป็น "follow-along"**. Slide = mental model, code = where the work happens. Switch ระหว่าง 2 windows
