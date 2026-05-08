# Week 1 — Monorepo + Next.js Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เริ่มต้น monorepo (pnpm + Turborepo) และสร้าง Next.js 15 app ที่มีหน้าเมนูร้านกาแฟแบบ static + 1 form interactive ที่ validate ด้วย Zod

**Architecture:** pnpm workspace ที่มี `apps/web` (Next.js App Router) เป็น app เดียวในสัปดาห์นี้ — week ถัดไปค่อยเพิ่ม `apps/api` และ `packages/shared`. ใช้ Tailwind + shadcn/ui สำหรับ UI, React Hook Form + Zod สำหรับ form

**Tech Stack:** pnpm 9, Turborepo 2, Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui, React Hook Form, Zod, Vitest

**Spec Reference:** [2026-05-08-fullstack-coffee-shop-course-design.md](../specs/2026-05-08-fullstack-coffee-shop-course-design.md) §5 Week 1

---

## Prerequisites

- Node.js 20+ ติดตั้งแล้ว (แนะนำใช้ `fnm` หรือ `nvm` จัดการ version)
- pnpm 9+ — install ด้วย `npm install -g pnpm@9` หรือ `corepack enable && corepack prepare pnpm@latest --activate`
- VS Code (แนะนำ) + extension: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma
- Git พร้อมใช้, มี GitHub account
- Terminal ที่ comfort: zsh / bash

**Verify**:
```bash
node --version    # ควรเป็น v20.x หรือสูงกว่า
pnpm --version    # ควรเป็น 9.x
git --version
```

---

## File Structure (เป้าหมายเมื่อจบ Week 1)

```
course-full-stack/
├── .gitignore
├── .editorconfig
├── .nvmrc
├── .prettierrc.json
├── package.json                       # root, with workspace scripts
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json                 # shared TS config
├── README.md
└── apps/
    └── web/
        ├── .gitignore
        ├── next.config.ts
        ├── postcss.config.mjs
        ├── tailwind.config.ts
        ├── tsconfig.json              # extends ../../tsconfig.base.json
        ├── package.json
        ├── components.json            # shadcn/ui config
        ├── vitest.config.ts
        ├── app/
        │   ├── layout.tsx             # root layout
        │   ├── globals.css            # Tailwind directives
        │   ├── page.tsx               # landing → redirect /menu
        │   └── (storefront)/
        │       ├── layout.tsx         # storefront layout (header + cart icon)
        │       └── menu/
        │           └── page.tsx       # static menu list
        ├── components/
        │   ├── ui/                    # shadcn-generated
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   └── form.tsx
        │   ├── menu-card.tsx          # Server Component
        │   ├── cart-icon.tsx          # Client Component
        │   └── feedback-form.tsx      # RHF + Zod practice
        ├── lib/
        │   ├── utils.ts               # cn() helper from shadcn
        │   └── data/
        │       └── menu.ts            # mock menu data
        └── tests/
            └── feedback-form.test.tsx # Vitest test
```

**Decomposition rationale**:
- `apps/web/` self-contained — week ถัดไปเพิ่ม `apps/api` และ `packages/shared` ข้างๆ
- `components/ui/` แยกจาก `components/` ให้ชัดเจนว่าตัวไหน shadcn-generated (อย่าแก้) vs custom
- `lib/data/` คือ mock data → week 3 จะถูกแทนด้วย API calls

---

## Tasks

### Task 1: Initialize Monorepo Skeleton

**Files:**
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.nvmrc`
- Create: `.prettierrc.json`
- Create: `package.json` (root)
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `README.md`

- [ ] **Step 1.1: ตรวจสอบ git repo**

```bash
cd /Users/teerapatcheung/Desktop/0-Project/course-full-stack
git status
```
Expected: บอกว่าอยู่บน branch `main`, มี `docs/` (จาก spec) อยู่แล้ว

- [ ] **Step 1.2: สร้าง `.gitignore`**

Create file `/Users/teerapatcheung/Desktop/0-Project/course-full-stack/.gitignore`:
```
# dependencies
node_modules/
.pnpm-store/

# build output
.next/
dist/
build/
out/

# turbo cache
.turbo/

# env
.env
.env.local
.env.*.local

# logs
*.log
npm-debug.log*
pnpm-debug.log*

# OS
.DS_Store
Thumbs.db

# editor
.vscode/*
!.vscode/extensions.json
.idea/

# tests
coverage/
*.lcov
```

- [ ] **Step 1.3: สร้าง `.editorconfig`**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 1.4: สร้าง `.nvmrc`**

```
20
```

- [ ] **Step 1.5: สร้าง `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

- [ ] **Step 1.6: สร้าง `package.json` (root)**

```json
{
  "name": "course-full-stack",
  "version": "0.0.0",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "prettier": "^3.3.3",
    "prettier-plugin-tailwindcss": "^0.6.8",
    "turbo": "^2.3.0",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 1.7: สร้าง `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

> 🎓 **Concept**: pnpm workspace ใช้ `pnpm-workspace.yaml` ระบุว่า directory ไหนเป็น "workspace package" — ทุก folder ที่มี `package.json` ภายใน `apps/` หรือ `packages/` จะเชื่อมกันได้ผ่าน `workspace:*` protocol

- [ ] **Step 1.8: สร้าง `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true
  }
}
```

> 🎓 **Concept**: `tsconfig.base.json` คือ TypeScript settings ร่วม. แต่ละ app/package extend ตัวนี้แล้ว override ตามต้องการ. `noUncheckedIndexedAccess: true` บังคับให้ index access ของ array/object ต้องเช็ค undefined ก่อน → ป้องกัน runtime errors เยอะมาก

- [ ] **Step 1.9: สร้าง `README.md` ขั้นต้น**

```markdown
# Course Full-Stack — Coffee Shop

A learning project building a coffee shop web app with Next.js + NestJS in a pnpm monorepo.

See [docs/superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md](docs/superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md) for the full course design.

## Setup

\`\`\`bash
nvm use            # or fnm use
pnpm install
pnpm dev           # starts all apps
\`\`\`

## Structure

- `apps/web/` — Next.js 15 frontend (storefront, admin, kitchen)
- `apps/api/` — NestJS backend (Week 2+)
- `packages/shared/` — Zod schemas + types (Week 3+)
- `infra/` — Docker, Caddy, deployment (Week 6)
```

- [ ] **Step 1.10: Install root dev deps + verify**

Run:
```bash
pnpm install
```
Expected: สร้าง `pnpm-lock.yaml` + `node_modules/` ที่ root, ไม่มี error

- [ ] **Step 1.11: Commit**

```bash
git add .gitignore .editorconfig .nvmrc .prettierrc.json package.json pnpm-workspace.yaml tsconfig.base.json README.md pnpm-lock.yaml
git commit -m "chore: init monorepo skeleton with pnpm workspace

- Configure pnpm 9 workspace structure (apps/*, packages/*)
- Add shared TypeScript base config with strict mode
- Add Prettier with Tailwind plugin
- Add EditorConfig and Node version pinning"
```

---

### Task 2: Add Turborepo

**Files:**
- Create: `turbo.json`

- [ ] **Step 2.1: สร้าง `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

> 🎓 **Concept**:
> - `^build` = "build dependencies ก่อน" — ถ้า `apps/web` depend `packages/shared`, build shared ก่อน web
> - `cache: false` สำหรับ `dev` — dev mode รัน watch ตลอด ไม่มี output ให้ cache
> - `persistent: true` — Turbo รู้ว่า task นี้ไม่จบเอง (long-running)
> - `outputs` — บอก Turbo ว่าจะ cache file/folder ไหน

- [ ] **Step 2.2: ตรวจสอบ Turbo รัน**

Run:
```bash
pnpm turbo --version
```
Expected: เช่น `2.3.0` (หรือสูงกว่า)

ลอง:
```bash
pnpm dev
```
Expected: Turbo บอก "no tasks to run" เพราะยังไม่มี app — OK กดติดถูกต้อง, Ctrl+C

- [ ] **Step 2.3: Commit**

```bash
git add turbo.json
git commit -m "chore: configure Turborepo task pipeline

- Define build/dev/lint/typecheck/test tasks
- Build tasks depend on upstream package builds (^build)
- Dev tasks marked persistent and skip cache"
```

---

### Task 3: Scaffold Next.js 15 App

**Files:**
- Create: `apps/web/` (entire Next.js scaffold via `create-next-app`)

- [ ] **Step 3.1: สร้าง Next.js app**

Run จาก root:
```bash
cd apps
pnpm create next-app@latest web --typescript --tailwind --app --turbopack --import-alias "@/*" --no-src-dir --no-eslint --use-pnpm
cd ..
```

> 📝 **Note**: Flag breakdown
> - `--typescript` = TS by default
> - `--tailwind` = Tailwind CSS preconfigured
> - `--app` = App Router (ไม่ใช่ Pages Router)
> - `--turbopack` = ใช้ Turbopack dev server (เร็วกว่า Webpack)
> - `--no-src-dir` = ไฟล์อยู่ที่ root ของ apps/web (`app/` ไม่ใช่ `src/app/`)
> - `--no-eslint` = ไม่ install ESLint ตอนนี้ (จะเพิ่มทีหลังตามต้องการ)
> - `--use-pnpm` = ใช้ pnpm install

- [ ] **Step 3.2: ปรับ `apps/web/tsconfig.json` ให้ extend base**

แทนที่เนื้อหา `apps/web/tsconfig.json` ทั้งไฟล์ด้วย:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3.3: ปรับ `apps/web/package.json` เพิ่ม scripts ให้ Turbo รู้จัก**

แก้ section `"scripts"` ใน `apps/web/package.json`:

```json
"scripts": {
  "dev": "next dev --turbopack -p 3000",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

> 📝 **Note**: ถ้า `next lint` error เพราะไม่มี ESLint, ลบบรรทัด `lint` หรือเพิ่ม ESLint config ทีหลัง

- [ ] **Step 3.4: Install + รัน dev**

```bash
pnpm install
pnpm dev
```
Expected: Turbo รัน `apps/web` dev server ที่ port 3000. เปิด http://localhost:3000 เจอหน้า Next.js default. กด Ctrl+C เพื่อหยุด

- [ ] **Step 3.5: Commit**

```bash
git add apps/web pnpm-lock.yaml package.json
git commit -m "feat(web): scaffold Next.js 15 app with App Router

- Use create-next-app with TypeScript, Tailwind, App Router, Turbopack
- Extend root tsconfig.base.json
- Configure Turbo-compatible scripts (dev/build/typecheck/test)"
```

---

### Task 4: Explore App Router — Layouts + Route Groups

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/app/(storefront)/layout.tsx`
- Create: `apps/web/app/(storefront)/menu/page.tsx`

- [ ] **Step 4.1: แก้ root layout**

แทนที่ `apps/web/app/layout.tsx` ทั้งไฟล์:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Coffee Shop',
  description: 'A learning project — coffee shop web app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
```

> 🎓 **Concept — Root Layout**:
> - `app/layout.tsx` ห่อทุก page ใน app
> - ต้องมี `<html>` กับ `<body>` (Next.js บังคับ)
> - `metadata` export = SEO meta tags อัตโนมัติ
> - Layout เป็น **Server Component** by default (สังเกต: ไม่มี `'use client'`)

- [ ] **Step 4.2: ทำ landing page redirect ไป `/menu`**

แทนที่ `apps/web/app/page.tsx` ทั้งไฟล์:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/menu');
}
```

- [ ] **Step 4.3: สร้าง storefront layout (route group)**

Create file `apps/web/app/(storefront)/layout.tsx`:

```tsx
import Link from 'next/link';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/menu" className="text-xl font-semibold">
            ☕ Coffee Shop
          </Link>
          <div className="text-sm text-gray-600">Cart (0)</div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-500">
        © 2026 Coffee Shop · Learning Project
      </footer>
    </div>
  );
}
```

> 🎓 **Concept — Route Groups**:
> - โฟลเดอร์ที่ห่อด้วย `()` เช่น `(storefront)` = **route group** — ไม่ปรากฏใน URL path
> - ใช้แชร์ layout ระหว่าง pages โดยไม่กระทบ URL
> - Week 4 จะเพิ่ม `(admin)` และ `(kitchen)` layouts ที่มี header ต่างกัน

- [ ] **Step 4.4: สร้าง menu page (placeholder)**

Create file `apps/web/app/(storefront)/menu/page.tsx`:

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

- [ ] **Step 4.5: ตรวจสอบ**

```bash
pnpm dev
```
Expected: เปิด http://localhost:3000 → redirect ไป `/menu` → เห็น header "☕ Coffee Shop" + h1 "เมนู" + footer

- [ ] **Step 4.6: Commit**

```bash
git add apps/web/app
git commit -m "feat(web): add storefront route group with layout

- Root layout sets metadata + base body styles
- Landing page redirects to /menu
- Storefront layout provides header + footer
- Menu page is a placeholder for now"
```

---

### Task 5: Verify Tailwind CSS

> 📝 **Note**: `create-next-app --tailwind` ตั้งค่าให้แล้ว task นี้แค่ verify + customize เล็กน้อย

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/tailwind.config.ts` (อาจมีอยู่แล้ว — ถ้ามาเป็น `.js` ให้ rename)

- [ ] **Step 5.1: ตรวจสอบ `apps/web/app/globals.css`**

ควรมี (จาก scaffold):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

> 📝 **Note**: ถ้า Next.js 15 ใช้ Tailwind v4 syntax `@import "tailwindcss";` แทน — ใช้ตาม scaffold เลย ไม่ต้องเปลี่ยน

- [ ] **Step 5.2: เพิ่ม CSS variables สำหรับ shadcn (ใส่ที่ท้ายไฟล์ globals.css)**

Append ต่อท้าย `apps/web/app/globals.css`:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 24 70% 30%;          /* coffee brown */
    --primary-foreground: 60 9% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 24 70% 30%;
    --radius: 0.5rem;
  }
}
```

- [ ] **Step 5.3: ทดสอบว่า Tailwind ทำงาน**

ในไฟล์ `apps/web/app/(storefront)/menu/page.tsx` ลองเปลี่ยน `<h1>` เป็น:
```tsx
<h1 className="mb-6 text-3xl font-bold text-amber-800">เมนู</h1>
```

```bash
pnpm dev
```
Expected: หัวข้อ "เมนู" เป็นสีน้ำตาลเข้ม

- [ ] **Step 5.4: Commit**

```bash
git add apps/web/app/globals.css
git commit -m "style(web): add shadcn-compatible CSS variables

- Define HSL color tokens for theming (light mode)
- Coffee brown primary color for brand fit"
```

---

### Task 6: Install shadcn/ui + Add Core Components

**Files:**
- Create: `apps/web/components.json`
- Create: `apps/web/lib/utils.ts`
- Create: `apps/web/components/ui/button.tsx`
- Create: `apps/web/components/ui/card.tsx`
- Create: `apps/web/components/ui/input.tsx`
- Create: `apps/web/components/ui/label.tsx`
- Create: `apps/web/components/ui/form.tsx`

- [ ] **Step 6.1: รัน shadcn init**

```bash
cd apps/web
pnpm dlx shadcn@latest init
cd ../..
```

ตอบคำถาม:
- Style: **Default**
- Base color: **Neutral** (หรืออะไรก็ได้ — เราจะ override ด้วย CSS vars แล้ว)
- CSS variables: **yes**

> 📝 **Note**: shadcn จะสร้าง `components.json`, ปรับ `tailwind.config.ts`, และเพิ่ม `lib/utils.ts` ให้

- [ ] **Step 6.2: Add components ที่ใช้ใน Week 1**

```bash
cd apps/web
pnpm dlx shadcn@latest add button card input label form
cd ../..
```

Expected: สร้างไฟล์ใน `apps/web/components/ui/`: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `form.tsx`

> 🎓 **Concept — shadcn/ui ปรัชญา**:
> - shadcn ไม่ใช่ component library ที่ install เป็น dependency
> - **มัน copy code เข้าโปรเจกต์โดยตรง** → คุณเป็นเจ้าของ code, แก้ได้ตามต้องการ
> - สร้างบน Radix UI (a11y) + Tailwind (styling) + Class Variance Authority (variants)
> - `cn()` ใน `lib/utils.ts` = merge className ฉลาด (resolve Tailwind conflicts)

- [ ] **Step 6.3: ทดสอบใน menu page**

แก้ `apps/web/app/(storefront)/menu/page.tsx`:

```tsx
import { Button } from '@/components/ui/button';

export default function MenuPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">เมนู</h1>
      <Button>ทดสอบ shadcn Button</Button>
    </div>
  );
}
```

- [ ] **Step 6.4: รัน dev + ตรวจ**

```bash
pnpm dev
```
Expected: เห็นปุ่มสไตล์ shadcn บน `/menu`

- [ ] **Step 6.5: Commit**

```bash
git add apps/web/components.json apps/web/components/ui apps/web/lib/utils.ts apps/web/tailwind.config.ts apps/web/app/globals.css apps/web/app/(storefront)/menu/page.tsx pnpm-lock.yaml apps/web/package.json
git commit -m "feat(web): add shadcn/ui with core components

- Initialize shadcn (CSS variables, Radix UI, CVA)
- Add button, card, input, label, form components
- Verify integration on menu page"
```

---

### Task 7: Build Static Menu Page (Server Component)

**Files:**
- Create: `apps/web/lib/data/menu.ts` — mock data
- Create: `apps/web/components/menu-card.tsx` — Server Component
- Modify: `apps/web/app/(storefront)/menu/page.tsx`

- [ ] **Step 7.1: สร้าง mock data**

Create file `apps/web/lib/data/menu.ts`:

```ts
export type MenuCategory = 'drink' | 'food' | 'dessert';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageEmoji: string;
}

export const MOCK_MENU: MenuItem[] = [
  {
    id: 'm1',
    name: 'Espresso',
    description: 'กาแฟเอสเปรสโซ่ shot คู่ เข้มข้น',
    price: 60,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm2',
    name: 'Latte',
    description: 'นมสตรีมหอม ผสม espresso shot',
    price: 75,
    category: 'drink',
    imageEmoji: '🥛',
  },
  {
    id: 'm3',
    name: 'Cappuccino',
    description: 'เนื้อโฟมหนา รสเข้ม',
    price: 75,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm4',
    name: 'Americano',
    description: 'Espresso + น้ำร้อน',
    price: 55,
    category: 'drink',
    imageEmoji: '☕',
  },
  {
    id: 'm5',
    name: 'Croissant',
    description: 'ครัวซองต์เนยอบสด',
    price: 65,
    category: 'food',
    imageEmoji: '🥐',
  },
  {
    id: 'm6',
    name: 'Brownie',
    description: 'บราวนี่ช็อกโกแลตเข้ม',
    price: 70,
    category: 'dessert',
    imageEmoji: '🍫',
  },
];

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  drink: 'เครื่องดื่ม',
  food: 'อาหาร',
  dessert: 'ของหวาน',
};
```

- [ ] **Step 7.2: สร้าง MenuCard component (Server Component)**

Create file `apps/web/components/menu-card.tsx`:

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MenuItem } from '@/lib/data/menu';

export function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="text-4xl">{item.imageEmoji}</div>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-semibold">฿{item.price}</div>
      </CardContent>
    </Card>
  );
}
```

> 🎓 **Concept — Server Component**:
> - Component นี้ไม่มี `'use client'` → **Server Component by default**
> - render บน server, ส่ง HTML ไป client → bundle ลูกค้าเล็กลง
> - ห้ามใช้ `useState`, `useEffect`, event handlers (`onClick`)
> - Week 3 จะแทน mock data ด้วย fetch จาก NestJS — ทำใน Server Component ได้สบาย (ไม่ต้องใช้ useEffect)

- [ ] **Step 7.3: ใช้ใน menu page**

แทนที่ `apps/web/app/(storefront)/menu/page.tsx` ทั้งไฟล์:

```tsx
import { MenuCard } from '@/components/menu-card';
import { CATEGORY_LABELS, MOCK_MENU, type MenuCategory } from '@/lib/data/menu';

export default function MenuPage() {
  const categories: MenuCategory[] = ['drink', 'food', 'dessert'];

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold">เมนู</h1>
      {categories.map((category) => {
        const items = MOCK_MENU.filter((item) => item.category === category);
        if (items.length === 0) return null;
        return (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-xl font-semibold">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7.4: ตรวจสอบ visual**

```bash
pnpm dev
```
Expected: เปิด http://localhost:3000/menu เห็น 3 sections (เครื่องดื่ม / อาหาร / ของหวาน) มี card grid responsive (1 col mobile, 2 col tablet, 3 col desktop)

- [ ] **Step 7.5: Commit**

```bash
git add apps/web/lib apps/web/components/menu-card.tsx apps/web/app/(storefront)/menu/page.tsx
git commit -m "feat(web): build static menu page with grouped categories

- Mock menu data with drink/food/dessert categories
- MenuCard Server Component renders item details
- Responsive grid: 1/2/3 cols by viewport"
```

---

### Task 8: Add Cart Icon (Client Component)

**Files:**
- Create: `apps/web/components/cart-icon.tsx`
- Modify: `apps/web/app/(storefront)/layout.tsx`

> 🎓 **Concept — Client Component เมื่อไหร่?**
> ใช้ `'use client'` เมื่อ component ต้องใช้: state (`useState`), effects (`useEffect`), event handlers (`onClick`), browser APIs (`window`, `localStorage`), หรือ React hooks ที่ใช้สิ่งเหล่านี้

- [ ] **Step 8.1: สร้าง CartIcon (Client Component)**

Create file `apps/web/components/cart-icon.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CartIcon() {
  const [count, setCount] = useState(0);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCount((c) => c + 1)}
      aria-label={`Cart with ${count} items`}
    >
      🛒 Cart ({count})
    </Button>
  );
}
```

> 📝 **Note**: นี่เป็น demo Client Component เท่านั้น — Week 4 จะแทนด้วย Zustand store ที่เก็บ cart จริง

- [ ] **Step 8.2: แทรกใน storefront layout**

แก้ `apps/web/app/(storefront)/layout.tsx`:

```tsx
import Link from 'next/link';
import { CartIcon } from '@/components/cart-icon';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/menu" className="text-xl font-semibold">
            ☕ Coffee Shop
          </Link>
          <CartIcon />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {children}
      </main>
      <footer className="border-t bg-gray-50 py-4 text-center text-sm text-gray-500">
        © 2026 Coffee Shop · Learning Project
      </footer>
    </div>
  );
}
```

- [ ] **Step 8.3: ตรวจสอบ**

```bash
pnpm dev
```
Expected: เปิด http://localhost:3000/menu → คลิกปุ่ม Cart → ตัวเลขเพิ่มขึ้น (state ทำงาน)

> 🎓 **Concept — interleaving server/client**:
> - `(storefront)/layout.tsx` เป็น Server Component
> - มัน render `<CartIcon />` ที่เป็น Client Component → React บอก browser ว่า "hydrate ตรงนี้"
> - Server Component ปกติ ห้าม import ของ Client → แต่ render ได้ (pass children/JSX OK)

- [ ] **Step 8.4: Commit**

```bash
git add apps/web/components/cart-icon.tsx apps/web/app/(storefront)/layout.tsx
git commit -m "feat(web): add interactive cart icon (Client Component)

- Demonstrates 'use client' boundary
- useState for local count (placeholder for Week 4 Zustand store)"
```

---

### Task 9: Setup Vitest for Web App

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/tests/setup.ts`

- [ ] **Step 9.1: Install Vitest + Testing Library**

```bash
cd apps/web
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
cd ../..
```

- [ ] **Step 9.2: สร้าง `vitest.config.ts`**

Create file `apps/web/vitest.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 9.3: สร้าง test setup**

Create file `apps/web/tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 9.4: เพิ่ม script ใน `apps/web/package.json`**

ตรวจสอบ `"scripts"` มี:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9.5: รันทดสอบเปล่า**

```bash
cd apps/web
pnpm test
cd ../..
```
Expected: Vitest บอก "No test files found" — OK (ยังไม่มี test)

- [ ] **Step 9.6: Commit**

```bash
git add apps/web/vitest.config.ts apps/web/tests apps/web/package.json pnpm-lock.yaml
git commit -m "test(web): set up Vitest with jsdom and Testing Library

- Configure vitest with React plugin
- Add @testing-library/jest-dom matchers"
```

---

### Task 10: React Hook Form + Zod Practice (with Test)

**Files:**
- Create: `apps/web/components/feedback-form.tsx`
- Create: `apps/web/tests/feedback-form.test.tsx`
- Create: `apps/web/app/(storefront)/feedback/page.tsx`

> 🎓 **Concept — TDD lite**:
> เราจะเขียน test ก่อน — ครั้งแรกอาจรู้สึกแปลก แต่ test ช่วยกำหนด "behavior สเปก" ก่อนเขียน UI

- [ ] **Step 10.1: Install RHF + Zod**

```bash
cd apps/web
pnpm add react-hook-form zod @hookform/resolvers
cd ../..
```

- [ ] **Step 10.2: เขียน failing test ก่อน**

Create file `apps/web/tests/feedback-form.test.tsx`:

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
});
```

- [ ] **Step 10.3: รัน test เพื่อยืนยันว่า fail**

```bash
cd apps/web
pnpm test
cd ../..
```
Expected: FAIL — `Cannot find module '@/components/feedback-form'`

- [ ] **Step 10.4: เขียน FeedbackForm component**

Create file `apps/web/components/feedback-form.tsx`:

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
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">ข้อความ</Label>
        <textarea
          id="message"
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          {...register('message')}
        />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        ส่ง
      </Button>
    </form>
  );
}
```

> 🎓 **Concept — RHF + Zod คู่ที่ลงตัว**:
> - `zodResolver` ผูก Zod schema เข้ากับ RHF → validate ฟรีทั้ง form
> - `register('name')` คืน props (`name`, `onChange`, `onBlur`, `ref`) ใส่ใน `<Input>` ตรงๆ
> - `errors.name?.message` มาจาก Zod schema → message ภาษาไทยได้
> - Type ของ form data **derive จาก schema** ด้วย `z.infer` → ไม่ต้องเขียน type ซ้ำ

- [ ] **Step 10.5: รัน test เพื่อยืนยันว่า pass**

```bash
cd apps/web
pnpm test
cd ../..
```
Expected: 3 tests PASS

- [ ] **Step 10.6: สร้างหน้า `/feedback` ใช้ component จริง**

Create file `apps/web/app/(storefront)/feedback/page.tsx`:

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

- [ ] **Step 10.7: ทดสอบ manual**

```bash
pnpm dev
```
Expected:
- เปิด http://localhost:3000/feedback
- ลอง submit ทั้ง form ว่าง → เห็น error "ต้องกรอกชื่อ"
- กรอกชื่อ + ข้อความสั้น → error "อย่างน้อย 10 ตัวอักษร"
- กรอกครบ → เห็นข้อความขอบคุณ

- [ ] **Step 10.8: Run typecheck + ทดสอบรวม**

```bash
pnpm typecheck
pnpm test
```
Expected: ทั้งสอง command pass

- [ ] **Step 10.9: Commit**

```bash
git add apps/web/components/feedback-form.tsx apps/web/tests/feedback-form.test.tsx apps/web/app/(storefront)/feedback apps/web/package.json pnpm-lock.yaml
git commit -m "feat(web): add feedback form with React Hook Form + Zod

- Define Zod schema with Thai error messages
- FeedbackForm uses zodResolver for validation
- TDD: 3 tests covering empty/short/valid cases
- Practice page at /feedback shows submitted state"
```

---

## Acceptance Criteria — Week 1 Done When:

- [ ] `pnpm dev` รัน Next.js dev server ที่ port 3000 ผ่าน Turborepo
- [ ] `http://localhost:3000` redirect ไป `/menu`
- [ ] หน้า `/menu` แสดง mock menu 6 รายการ จัดเป็น 3 categories, responsive grid
- [ ] Header มี "☕ Coffee Shop" + Cart icon ที่กดเพิ่ม count ได้ (Client Component)
- [ ] หน้า `/feedback` มี form ที่ validate ด้วย Zod (Thai error messages)
- [ ] `pnpm test` รันใน apps/web pass 3 tests (FeedbackForm)
- [ ] `pnpm typecheck` pass ไม่มี TypeScript error
- [ ] Git history สะอาด: ~10 commits, 1 commit ต่อ task

## Self-Review Notes

**Spec coverage check:**
- ✅ Week 1 Day 1-2 (monorepo + Turborepo): Tasks 1-2
- ✅ Week 1 Day 3-4 (App Router): Tasks 3-4
- ✅ Week 1 Day 5-6 (Tailwind + shadcn): Tasks 5-6 + 7
- ✅ Week 1 Day 7 (RHF + Zod): Tasks 9-10

**Concepts taught**:
- pnpm workspace, Turborepo pipeline, TypeScript strict
- App Router, layouts, route groups, Server vs Client Components
- Tailwind, shadcn/ui philosophy, CSS variables theming
- React Hook Form, Zod schema-derived types, TDD basics

**Out of Week 1 scope** (deferred to later weeks):
- ❌ NestJS / API (Week 2)
- ❌ Database / Prisma (Week 2)
- ❌ Real cart state (Week 4 with Zustand)
- ❌ Real menu data from API (Week 3)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md`. สองตัวเลือก execution:**

**1. Subagent-Driven (recommended)** — ผม dispatch fresh subagent ทำทีละ task, review ระหว่าง task, iterate เร็ว — เหมาะถ้าคุณอยากให้ผม "สอนผ่านการทำ" และคุณ review code

**2. Inline Execution** — ทำทุก task ใน session นี้ตาม executing-plans, batch + checkpoint ระหว่างกลาง — เหมาะถ้าคุณอยากเห็น flow ทั้งหมดต่อเนื่อง

**3. Self-execute** — คุณอ่าน plan แล้วทำเอง — เหมาะที่สุดสำหรับ **learning** เพราะคุณจะ "ติด" ตรงไหนก็ได้เรียนจริง ผมเป็น guide เมื่อ stuck

**คำแนะนำสำหรับ context การเรียน**: เลือกข้อ 3 เพราะคุณเรียน — ถ้าให้ AI ทำให้หมดจะ skip การฝึก. ใช้ผมเป็น "tutor on demand" — ติดตรงไหนถามตรงนั้น
