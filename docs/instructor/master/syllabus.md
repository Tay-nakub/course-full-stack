# ☕ Full-Stack Coffee Shop — Course Syllabus

**Audience:** **student-facing** — แชร์ก่อนเริ่ม Week 1 (Slack/LMS/email) เพื่อให้ student เข้าใจสิ่งที่จะเจอ

> **Note instructor**: ก่อนแชร์ — ปรับ "Instructor name", "Cohort dates", "Cost", "Communication channel" ให้ตรงกับ batch จริง

---

## 🎯 What You'll Build

ในเวลา 6 สัปดาห์ คุณจะสร้าง **Coffee Shop Web Application** ที่ใช้งานได้จริง — deploy บน Cloud VPS ของคุณเอง:

- 🛍️ **Storefront** — ลูกค้า browse menu, สั่งของ, ติดตาม order status
- 👨‍🍳 **Kitchen UI** — staff รับ order, เปลี่ยน status (preparing → ready → completed)
- 🛠️ **Admin Back Office** — CRUD เมนู, สูตร (recipe), จัดการ stock, ดู P&L dashboard
- ⚡ **Auto Stock Deduct** — order completed → วัตถุดิบลด, ต้นทุนคำนวณ, กำไรรายงาน
- 🚀 **GitOps Deploy** — `git push` → 2 นาทีต่อมา site อัปเดต, มี HTTPS อัตโนมัติ

จบคอร์สนี้ — คุณมี **portfolio app** ที่ recruiter clone แล้ว run ต่อได้ทันที

---

## 🛠️ Tech Stack คุณจะได้เรียน

### Frontend
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (component library)
- **TanStack Query** (data fetching), **Zustand** (cart state)
- **React Hook Form** + **Zod** (forms + validation)

### Backend
- **NestJS** (modules, controllers, providers, guards) + **TypeScript**
- **Prisma ORM** + **PostgreSQL 16**
- **JWT auth** + **bcrypt** + **Zod validation**

### DevOps / Infrastructure
- **pnpm workspaces** + **Turborepo** (monorepo)
- **Docker** + **Docker Compose**
- **Caddy** (auto-HTTPS reverse proxy)
- **GitHub Actions** (CI/CD)
- **Hetzner / DigitalOcean VPS**

### Testing
- **Vitest** + **Testing Library** (unit + component tests)
- **TDD** workflow (Red → Green → Refactor)

---

## 📚 Prerequisites

คุณควรมี **ก่อน** เริ่มคอร์ส:

✅ **Required**
- เขียน HTML / CSS / JavaScript ได้ (อ่าน + ดัดแปลง code ได้)
- ใช้ Git (commit, branch, push, pull) ได้
- เข้าใจ database concepts (table, primary/foreign key, JOIN)
- เข้าใจ system design พื้นฐาน (request/response, REST, JSON)
- ใช้ Terminal / command line สบาย

🆗 **Helpful (แต่ไม่จำเป็น)**
- เคยใช้ Node.js / npm
- เคย deploy app บน server / cloud
- เคยเขียน TypeScript

❌ **ไม่ต้องเคย**
- React / Next.js
- NestJS / Prisma
- Docker
- Tailwind CSS

> หลักสูตร assume ว่าคุณเริ่ม React จาก zero. ถ้าเคยใช้ — ดียิ่งขึ้น

---

## ⏱️ Time Commitment

| | Hours/week | Total (6 weeks) |
|---|---|---|
| Live class | 2 ชม./สัปดาห์ × 1 session | 12 ชม. |
| Self-paced homework | 3-5 ชม./สัปดาห์ | 18-30 ชม. |
| **Total** | **5-7 ชม./สัปดาห์** | **30-42 ชม.** |

> **Realistic expectation**: ถ้าทำงานประจำ — เก็บเวลาเสาร์/อาทิตย์เช้า 2-3 ชม. + 30-60 นาทีหลังเลิกงานวันธรรมดา

---

## 🗓️ 6-Week Schedule

### Week 1 — Foundation (FE)
**Goal**: Static coffee shop UI ทำงานบน localhost
- Monorepo + pnpm + Turborepo
- Next.js 15 App Router (layouts, route groups)
- React Server Components vs Client Components
- Tailwind + shadcn/ui
- React Hook Form + Zod (TDD)

### Week 2 — Foundation (BE)
**Goal**: API + Database พร้อมใช้
- Postgres ใน Docker
- NestJS (modules, controllers, providers, guards)
- Prisma (schema, migrations, client)
- JWT auth + bcrypt password hashing

### Week 3 — First End-to-End Slice
**Goal**: CRUD เมนูครบทั้ง stack
- Shared Zod schemas (`packages/shared`)
- Menu module (NestJS)
- TanStack Query (FE data fetching)
- Admin Menu CRUD UI

### Week 4 — Order Flow
**Goal**: ลูกค้าสั่งของได้, staff ดู Kitchen UI ได้
- Cart state (Zustand)
- Order placement (atomic transaction)
- Order tracking page
- Kitchen UI (role-based access)

### Week 5 — Inventory + Reports ⭐
**Goal**: Auto stock deduct + P&L dashboard
- Recipe (product ↔ ingredient)
- Stock movements (event-sourced)
- Order completed → stock − COGS snapshot (atomic)
- Reports: revenue, COGS, gross profit, top 5 menu, low stock alerts

### Week 6 — Deploy + GitOps 🚀
**Goal**: Live บน cloud VPS, push to deploy
- Provision VPS (Hetzner / DigitalOcean) + hardening
- Multi-stage Docker builds
- Caddy auto-HTTPS reverse proxy
- GitHub Actions CI/CD
- Database backup automation

---

## 📦 Deliverables

จบคอร์ส คุณจะมี:

1. **🌐 Live Coffee Shop App** — `https://your-coffee-shop.com` (หรือ subdomain)
2. **📁 GitHub Repo** — clean code, atomic commits, README ครบ
3. **🧪 Test Suite** — Vitest tests pass, ครอบคลุม business logic
4. **📊 Final Project Submission** — assessed ตาม [Final Project Rubric](final-project-rubric.md)
5. **🎓 Portfolio Skills** — react/Next.js, NestJS, Prisma, Docker, GitOps

---

## 🎓 Class Format

### Live Class (Group Workshop, 2-6 students)
- 1 session / สัปดาห์ × 120 นาที
- Mix: lecture (30%) + live demo (35%) + hands-on build (25%) + Q&A (10%)
- ทุก session มี checkpoint Q ทุก 25-30 นาที (กัน autopilot)
- Recording ของแต่ละ session แชร์ใน Slack หลังคลาส

### 1-on-1 Mentorship (optional)
- ถ้าตกที่ติดมาก — schedule 30-60 min 1-on-1 ระหว่างสัปดาห์
- ใช้ session plan เดียวกัน แต่ pace ตามคุณ

### Communication
- **Live class**: [Zoom / Google Meet / TBA]
- **Async chat**: [Slack / Discord / LINE TBA]
- **Code reviews**: GitHub PRs
- **Office hours**: [TBA]

---

## ✅ Completion Criteria

**ผ่าน ("Complete") ถ้า:**
- ✅ ทำ homework PR ครบ Week 1-5 (Week 6 deploy เป็น stretch)
- ✅ Final project deploy ได้ (อย่างน้อย local stack ทำงาน)
- ✅ Live class attendance ≥ 70% (≥ 5 จาก 7 sessions)
- ✅ Final project ผ่าน rubric "Functional Baseline" (ดู [rubric](final-project-rubric.md))

**Honor ("Complete with Distinction") ถ้า:**
- ทำเกณฑ์ "ผ่าน" ครบ
- Final project hit "Production Quality" tier ใน rubric
- Stretch feature อย่างน้อย 1 อย่าง (real payment, OAuth, real-time, etc.)

---

## 📋 Pre-Course Setup

ก่อนเริ่ม Week 1 — ทำ [Pre-Course Checklist](pre-course-checklist.md) **อย่างน้อย 3 วันล่วงหน้า**

> ถ้าตอน Session 1 ยังไม่ install เครื่อง — เสียเวลา 30 นาที. ทำล่วงหน้าให้พร้อม

---

## 🤝 House Rules

1. **Show up prepared** — ทำ pre-class checklist + อ่าน reading หลัง session ก่อนหน้า
2. **Ask early** — ติดเกิน 30 นาที → ถามใน chat ทันที (ไม่ stuck คนเดียว)
3. **Code review = learn** — review เพื่อนใน batch อย่างน้อย 1 PR / สัปดาห์
4. **Bug = opportunity** — ทุก bug ที่เจอใน demo → แชร์วิธีแก้ใน chat (ช่วยเพื่อน)
5. **No copy-paste blindly** — ถ้าใส่ code ที่ไม่เข้าใจ → ถามทันที

---

## 💰 Cost Breakdown (สำหรับ student)

| Item | Cost |
|---|---|
| **Course tuition** | [TBA — instructor configures] |
| **Hetzner CX22 VPS** (Week 6) | ~165 บาท/เดือน |
| **Domain `.com`** | ~30 บาท/เดือน amortized |
| **Total infrastructure during course** | ~200 บาท/เดือน × 1-2 เดือน |

> **Tip**: Hetzner / DigitalOcean refund ถ้ายกเลิกใน 30 วัน — ทดลองได้

> **Free alternatives**: Coolify ใน Hetzner same VPS (deploy ง่ายกว่า), หรือ Railway free tier (จำกัด)

---

## 🔮 What's NOT in This Course (Out of Scope)

> เน้น **Main** ตามขอบเขตคอร์ส — สิ่งเหล่านี้ **ไม่สอน** และตั้งใจ:

❌ Real payment integration (Stripe, Omise) → Tier 1 self-study
❌ Multi-tenant SaaS (หลายร้าน) → Tier 3 self-study
❌ OAuth / Social login → Tier 1 self-study
❌ Real-time (WebSocket, SSE) → Tier 2 self-study
❌ Microservices, Kubernetes → Overkill scope
❌ GraphQL / tRPC → REST transferable มากกว่า
❌ E2E test (Playwright) → Tier 2 self-study
❌ Mobile app → ใช้ React Native course ต่อ (Tier 3)

📚 หลังจบคอร์ส มี **Learning Path Forward** (ในเอกสารคอร์ส) — แนะนำลำดับเรียนต่อ

---

## ❓ Frequently Asked Questions

**Q: ใช้ Windows ได้ไหม?**
A: ได้ผ่าน WSL2 (Ubuntu). ส่วน macOS / Linux native รองรับเต็มตัว

**Q: ถ้าตามไม่ทันจะทำยังไง?**
A: Catch-up plan:
1. ดู recording ของ session
2. ทำ homework ตาม plan (มีครบทุกบรรทัด code)
3. Schedule 1-on-1 ก่อน session ถัดไป

**Q: ใช้ Webstorm / Cursor / Vim ได้ไหม?**
A: ได้. Recording จะใช้ VS Code แต่ concept ใช้ได้กับทุก editor

**Q: หลังจบคอร์ส support เรียกใช้ต่อได้ไหม?**
A: [TBA — instructor configures] (เช่น 30-day Slack support, 1-on-1 follow-up, etc.)

**Q: ภาษาที่ใช้สอน?**
A: ภาษาไทย (technical terms ภาษาอังกฤษ). Code + comment ภาษาอังกฤษ

**Q: ถ้าอยากเรียน NestJS deep dive / React advanced เพิ่ม?**
A: คอร์สนี้ **focused** — สอนพอที่ build ของจริงได้. หลังจบมี Tier 1-3 learning path แนะนำของ deep dive แต่ละ topic

---

## 📞 Contact

**Instructor**: [Your name + contact]
**Course channel**: [Slack/Discord link]
**Office hours**: [Schedule]

---

## 🚀 Ready to Start?

1. ✅ อ่าน syllabus จบ (ไฟล์นี้)
2. ✅ ทำ [Pre-Course Checklist](pre-course-checklist.md) — อย่างน้อย 3 วันก่อน Week 1
3. ✅ Join [course channel] เพื่อ verify pre-class
4. ✅ เจอกัน Week 1 Session 1!

> **เป้าหมาย**: 6 สัปดาห์จากนี้ คุณจะมี portfolio app ที่ live บน cloud — และเข้าใจ pattern ของ full-stack engineering ระดับที่ build ของอื่นต่อยอดได้
