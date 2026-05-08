# 📊 Final Project Rubric

**Audience:** **shared with student + used by instructor for assessment**

> **Philosophy**: Rubric ไม่ใช่ "เกณฑ์เพื่อให้คะแนน" — มันคือ **expectation contract**. Student รู้ตั้งแต่ต้นว่า "ดี" คืออะไร → focus ตรงเป้า

---

## 🎯 Three Tiers

### 🥉 Functional Baseline (ผ่านคอร์ส)
> "App ทำงานได้, business logic ครบ, deploy local stack ได้"

**Required for "Complete"** — student ที่ผ่านครบทุก ✅ ใน tier นี้ → **Complete the course**

### 🥈 Professional Quality (default portfolio expectation)
> "Code สะอาด, tests ครอบคลุม, atomic commits, README ครบ — portfolio ที่ recruiter clone แล้ว run ต่อได้"

**Default goal** — เกือบทุก student ควร hit tier นี้

### 🥇 Production Ready (Complete with Distinction)
> "Deploy live บน VPS + GitOps + backup + monitoring + stretch feature"

**Distinction tier** — Week 6 ทำสำเร็จ + 1 stretch feature

---

## 📋 Assessment Categories

### 1️⃣ Functionality (40%)

#### Functional Baseline ✅
- [ ] **Auth**: Admin/Staff login with JWT, role-based access
- [ ] **Menu CRUD**: Admin สามารถ create/read/update/delete categories + products + recipes
- [ ] **Storefront**: ลูกค้า browse menu by category, add to cart, checkout (guest)
- [ ] **Order tracking**: Order detail page polling status
- [ ] **Kitchen UI**: Staff list pending orders + change status (PENDING → PREPARING → READY → COMPLETED)
- [ ] **Stock auto-deduct**: Order COMPLETED → ingredient stock ลดอัตโนมัติตามสูตร (atomic transaction)
- [ ] **COGS snapshot**: cogsSnapshot ถูกเก็บใน OrderItem ตอน sale (ไม่ใช่ join จาก current cost)
- [ ] **Reports dashboard**: แสดง daily revenue, COGS, gross profit, gross margin %
- [ ] **Top products**: Top 5 best-selling menu วันนี้
- [ ] **Low stock alerts**: ingredient ที่ stock ≤ minStock แสดงใน admin

#### Professional Quality ✅
- [ ] All Functional Baseline items
- [ ] **Edge case handling**: ไม่ crash เมื่อ stock ไม่พอ (clear error message)
- [ ] **Optimistic UI**: Cart updates feel instant (TanStack Query mutations)
- [ ] **Empty states**: "No orders yet", "No menu items" → meaningful UI
- [ ] **Loading states**: Skeleton หรือ spinner ตอน fetch
- [ ] **Form validation**: ทุก form ใช้ Zod, error messages ภาษาไทย
- [ ] **Reasonable UX**: Keyboard navigation, accessible labels

#### Production Ready ✅
- [ ] All Professional Quality items
- [ ] **Real-time-ish kitchen**: polling 3-5 sec OR Server-Sent Events
- [ ] **Order receipt**: Print-friendly receipt page
- [ ] **Date filtering ใน reports**: ดู revenue/COGS ของวันที่ผ่านมาได้
- [ ] **Stretch feature** อย่างน้อย 1 อย่าง (ดู §[Stretch Features](#stretch-features))

---

### 2️⃣ Code Quality (15%)

#### Functional Baseline ✅
- [ ] **TypeScript**: ไม่มี `any` ในไฟล์ที่เขียนเอง (generated types OK)
- [ ] **No syntax errors**: `pnpm typecheck` pass
- [ ] **No console.log** ที่ทิ้งไว้ใน production code
- [ ] **Imports clean**: ไม่มี unused imports

#### Professional Quality ✅
- [ ] All Baseline items
- [ ] **Naming consistent**: components PascalCase, files kebab-case (or all camelCase — ขอแค่ consistent)
- [ ] **Function focused**: ฟังก์ชัน 1 อย่าง / 1 หน้าที่
- [ ] **No dead code**: commented-out code ลบออก
- [ ] **Magic numbers extracted**: 10 ลิตร = `const ML_PER_LITER = 1000`
- [ ] **Error handling**: try/catch ที่ async functions ที่ระดับ controller
- [ ] **Code formatted**: `pnpm format:check` pass

#### Production Ready ✅
- [ ] All Professional items
- [ ] **No code duplication**: shared logic extracted to utils/hooks
- [ ] **Components decomposed**: ไม่มี component > 200 lines
- [ ] **Strict null checks**: ใช้ optional chaining + nullish coalescing
- [ ] **Type-safe API client**: response types match BE schema

---

### 3️⃣ Architecture (15%)

#### Functional Baseline ✅
- [ ] **Monorepo structure**: `apps/web`, `apps/api`, `packages/shared` ตามที่สอน
- [ ] **No circular dependencies**: web ไม่ import จาก api, api ไม่ import จาก web
- [ ] **Schema shared**: Zod schemas ใน `packages/shared` ใช้ทั้ง FE และ BE

#### Professional Quality ✅
- [ ] All Baseline items
- [ ] **Module boundaries (NestJS)**: แต่ละ module focused (auth, menu, orders, inventory, reports)
- [ ] **Separation of concerns**: Service layer มี business logic, Controller layer มีแค่ HTTP
- [ ] **Repository pattern (Prisma)**: query logic ไม่ leak ไป controllers
- [ ] **DTO derived from schema**: `z.infer<typeof Schema>` แทนการเขียน type ซ้ำ

#### Production Ready ✅
- [ ] All Professional items
- [ ] **Clear error handling**: NestJS exceptions → HTTP status codes ที่ถูกต้อง
- [ ] **Environment validation**: env vars validated ตอน app start (ใช้ Zod)
- [ ] **Logger structured**: ไม่มี `console.log` — ใช้ Pino หรือ NestJS logger

---

### 4️⃣ Testing (10%)

#### Functional Baseline ✅
- [ ] **At least 1 test pass** สำหรับ critical business logic (e.g., stock deduction)
- [ ] `pnpm test` pass (ทั้ง web + api)

#### Professional Quality ✅
- [ ] All Baseline items
- [ ] **Form validation tests**: feedback form, login form, menu form มี tests
- [ ] **Service layer tests**: order service, inventory service มี unit tests
- [ ] **Test names descriptive**: "should deduct stock when order completed" (ไม่ใช่ "test 1")
- [ ] **Mocks where appropriate**: external dependencies mocked

#### Production Ready ✅
- [ ] All Professional items
- [ ] **Edge case tests**: insufficient stock, invalid input, expired JWT
- [ ] **Coverage > 60%** สำหรับ business logic (services + components สำคัญ)
- [ ] **Tests run ใน CI**: GitHub Actions รัน `pnpm test` บน PR

---

### 5️⃣ Deployment (10%)

#### Functional Baseline ✅
- [ ] **Local stack works**: `docker compose up` รัน web + api + postgres ได้
- [ ] **Migrations**: Prisma migrate ทำงาน, schema sync กับ DB
- [ ] **Seed data**: มี seed script (ถ้ามี — optional)

#### Professional Quality ✅
- [ ] All Baseline items
- [ ] **Multi-stage Dockerfile**: image production-ready, ไม่มี dev deps
- [ ] **Image size reasonable**: web < 300MB, api < 250MB
- [ ] **Healthcheck**: API มี `/healthz` endpoint
- [ ] **Env via .env**: ไม่มี secret hardcoded ใน code

#### Production Ready ✅
- [ ] All Professional items
- [ ] **Live on VPS**: https://your-coffee-shop.com (or subdomain) accessible
- [ ] **HTTPS**: Caddy auto-cert ทำงาน, no warning
- [ ] **GitHub Actions**: push to main → auto deploy ภายใน ~2 min
- [ ] **Image registry**: GHCR หรือ Docker Hub, tag ด้วย git SHA
- [ ] **Backup automation**: pg_dump cron daily
- [ ] **Rollback documented**: README มี section "How to rollback"

---

### 6️⃣ Documentation (10%)

#### Functional Baseline ✅
- [ ] **README** มี: project description, setup instructions, scripts list
- [ ] **`.env.example`** มีทุก env var ที่ต้องการ (ไม่มี secret values)

#### Professional Quality ✅
- [ ] All Baseline items
- [ ] **README** มีเพิ่ม: tech stack, architecture diagram, screenshots
- [ ] **Setup tested**: clone → `pnpm install` → `pnpm dev` ทำงานตาม README
- [ ] **API endpoints documented**: README หรือ Postman collection
- [ ] **Database schema documented**: ER diagram หรือ Prisma schema commented

#### Production Ready ✅
- [ ] All Professional items
- [ ] **ADRs** (Architecture Decision Records): อย่างน้อย 3 ตัว ใน `docs/adr/`
  - "Why we chose monorepo over split repo"
  - "Why NestJS over Express"
  - "Why event-sourced inventory"
- [ ] **Deployment runbook**: step-by-step deploy from scratch
- [ ] **Troubleshooting guide**: common errors + fixes

---

## 🎁 Stretch Features (Production Ready Tier)

ทำอย่างน้อย **1** อย่างเพื่อ "Complete with Distinction":

### Easy (~2-4 hrs each)
- 🌙 **Dark mode toggle** (next-themes + CSS variables)
- 🔍 **Menu search** with debouncing
- 🌐 **i18n**: TH/EN language switcher
- 📊 **Recharts dashboard**: revenue trend ย้อนหลัง 30 วัน

### Medium (~4-8 hrs each)
- 🔐 **OAuth login**: Google/LINE login (NextAuth.js)
- 📧 **Email receipt**: ส่ง receipt หลัง checkout (Resend)
- 📷 **File upload**: ภาพเมนู upload to S3/R2/Cloudinary
- 💳 **Stripe sandbox payment**: real payment flow with webhook (test mode)

### Hard (~8-16 hrs each)
- ⚡ **Real-time kitchen**: WebSocket (Socket.io) แทน polling
- 📱 **PWA**: offline support, "Add to Home Screen"
- 🤖 **Discount codes**: percentage / fixed / minimum order amount
- 📈 **Sentry integration**: error tracking + release tracking
- 🏪 **Multi-tenant**: support 2 ร้าน on same instance (RLS)

---

## 🧮 Scoring (instructor reference)

> **Note**: คอร์สนี้ pass/fail format ไม่ใช่ percentage. ใช้ table นี้เป็น reference

| Tier | Score | Outcome |
|---|---|---|
| Hit ทุก ✅ ใน Functional Baseline | 70-80% | **Complete** |
| Hit ทุก ✅ ใน Professional Quality | 80-90% | **Complete (Strong)** |
| Hit ทุก ✅ ใน Production Ready + 1 stretch | 90%+ | **Complete with Distinction** |

---

## 📝 Submission Format

### Final Project Submission Checklist

- [ ] **Public GitHub repo** (or private with instructor invited)
- [ ] **README.md** in root with all required sections
- [ ] **Demo URL** (if Production Ready) — listed in README
- [ ] **Demo video** 3-5 min walkthrough (optional but recommended)
- [ ] **Self-assessment form** filled (below)

### Self-Assessment Form (student fills before submission)

```
Final Project Self-Assessment

GitHub repo: ___________________________
Demo URL (optional): _____________________

Functionality (40%):
  □ Functional Baseline complete
  □ Professional Quality complete
  □ Production Ready complete

Code Quality (15%):
  □ Functional Baseline
  □ Professional Quality
  □ Production Ready

Architecture (15%):
  □ Functional Baseline
  □ Professional Quality
  □ Production Ready

Testing (10%):
  □ Functional Baseline
  □ Professional Quality
  □ Production Ready

Deployment (10%):
  □ Functional Baseline (local docker compose)
  □ Professional Quality (multi-stage build)
  □ Production Ready (live on VPS + GitOps)

Documentation (10%):
  □ Functional Baseline
  □ Professional Quality
  □ Production Ready

Stretch features completed:
  ___________________________________________
  ___________________________________________

What I'm most proud of:
  ___________________________________________
  ___________________________________________

What I'd improve given more time:
  ___________________________________________
  ___________________________________________
```

---

## 🔍 Instructor Review Process

### Step 1: Verify Setup (10 min)
```bash
git clone <student-repo>
cd <repo>
cp .env.example .env
# Fill in test values
pnpm install
docker compose up -d
pnpm dev
```
✅ ถ้ารันได้ → Functional Baseline §Deployment ผ่าน

### Step 2: Functionality Walkthrough (15 min)
Test each user story:
1. Login as admin → CRUD menu
2. Login as staff → see kitchen orders
3. Logout → guest checkout flow
4. Place order → mark completed → verify stock deducted
5. View reports → numbers match expectations

### Step 3: Code Review (20 min)
- Open PR view: `git log --oneline | head -30`
- Check atomic commits
- Spot check: 2-3 files in each module
- Run: `pnpm typecheck`, `pnpm test`, `pnpm lint`

### Step 4: Documentation Audit (5 min)
- README clarity
- ADRs (if Production tier claimed)

### Step 5: Score + Feedback (10 min)
Fill instructor form:

```
Student: ____
Tier achieved: Functional Baseline / Professional / Production
Stretch: <list>

Strengths:
  - ____
  - ____

Improvements suggested:
  - ____
  - ____

Overall: Complete / Complete (Strong) / Distinction / Needs Catch-up

Notes for next batch:
  - ____
```

---

## 🚦 Edge Cases

### "ทำไม Production Ready ต้อง deploy live? ถ้า run local ทำงานครบล่ะ?"
- Functional Baseline ครบ → **Complete** อยู่แล้ว
- Production Ready tier เน้น "shipping to users" — Skill ที่ต่างจาก "build code"
- Local docker compose = "ใช้งานได้บน laptop" ≠ "ใช้งานได้ทุกที่"

### "เลือกทำ stretch แต่ไม่ครบ Production Ready ปกติ ได้ไหม?"
- ได้ — เป็น **Complete (Strong)** ไม่ใช่ Distinction
- Distinction = base ครบ + stretch
- Stretch alone ไม่ทดแทน base

### "Test coverage 50% ผ่าน Professional ไหม?"
- ดู **quality > quantity**: 50% ที่ครอบ business logic ดีกว่า 90% test getter/setter
- Instructor judgment call

### "Documentation lacking แต่ code ดีมาก"
- ❌ ไม่ผ่าน Professional (docs เป็นส่วน 10% — required)
- README โหลดง่ายๆ 1 ชม. ทำได้ — ไม่มีเหตุผลข้าม

---

## 🎯 What "Good" Looks Like (Examples)

### Good README example structure:
```markdown
# Coffee Shop App

[Screenshot]

## Features
- Storefront with menu, cart, checkout
- Kitchen UI for order management
- Admin back office: menu, inventory, reports
- Auto stock deduction with COGS tracking

## Tech Stack
- Frontend: Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui
- Backend: NestJS, Prisma, PostgreSQL
- Infra: Docker, Caddy, GitHub Actions, Hetzner VPS

## Architecture
[Diagram]

## Setup

### Prerequisites
- Node 20+, pnpm 9+, Docker

### Local Development
\```bash
git clone ...
cd coffee-shop
cp .env.example .env
pnpm install
docker compose up -d
pnpm dev
\```

App runs on http://localhost:3000

## Demo
🌐 Live: https://your-coffee-shop.com
🎥 Walkthrough: [link to 3-min video]

## API Documentation
[Postman link / OpenAPI spec]

## Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md)

## License
MIT
```

### Good ADR example:
```markdown
# ADR 002: Use NestJS instead of Express

## Status
Accepted

## Context
Need a Node.js backend for the coffee shop API. Options considered:
- Express (minimal, popular)
- NestJS (opinionated, structured)
- Fastify (fast, Express-like)

## Decision
Use NestJS.

## Reasoning
1. Built-in DI matches our system design background
2. Decorators (Guards, Pipes) reduce boilerplate
3. Module structure scales well as we add features
4. TypeScript-first
5. Active community, mature ecosystem

## Consequences
+ Easier to onboard backend engineers
+ Less custom infrastructure code
- Steeper learning curve for Express devs
- More opinionated (less flexibility for unusual patterns)
```

---

## 📚 Reference Implementation

> **Instructor maintains** a reference implementation:
> - Repo: `<github.com/instructor/coffee-shop-reference>`
> - Achieves Production Ready tier
> - Used as "gold standard" for code review reference

ถ้า student ติด — ดู reference เพื่อ inspiration (ไม่ copy)

---

## 🎓 Closing

> **Reminder**: Rubric นี้คือ "expectation" ไม่ใช่ "constraint". ถ้าคุณทำเกินกว่าที่ list — ดี! แค่อย่าลืม base — base ครบ + ดีในทุกมิติ > base ขาด + stretch สวยงาม
