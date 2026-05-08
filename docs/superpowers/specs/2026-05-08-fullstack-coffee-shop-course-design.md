# Full-Stack Course Design — Coffee Shop Portfolio Project

**Date**: 2026-05-08
**Status**: Approved (brainstorming complete, awaiting implementation plan)
**Author**: Teerapat Cheung (with Claude)

---

## 1. Context & Goals

### 1.1 Learner Profile
- พื้นฐาน HTML/CSS/JS แน่น
- เข้าใจ database และ system design
- **ไม่เคยใช้ React** หรือ frontend framework ใดๆ
- มี backend mindset

### 1.2 Course Goal
ผู้เรียนสร้าง **Coffee Shop Web App ใช้งานได้จริง** (learning + portfolio quality, ไม่ใช่ production สำหรับร้านจริง) deploy บน VPS ของตัวเอง โดยเรียนรู้ full-stack engineering แบบ end-to-end

### 1.3 Constraints
- **เวลา**: 1-2 ชม./วัน × 4-6 สัปดาห์ (~28-84 ชม. ทั้งหมด)
- **Format**: Project-driven (สร้างไปเรียนไป) — ไม่ใช่หลักสูตรทฤษฎีล้วน
- **Outcome**: ของจริง deployable, ไม่ใช่แค่ tutorial
- **Scope discipline**: เน้นสอนเฉพาะ "Main" ส่วนเสริมไปต่อยอดเอง

### 1.4 Non-Goals
- ไม่ใช่หลักสูตรครอบคลุมทุก concept ของ React/NestJS/DevOps
- ไม่ครอบคลุม payment integration จริง, multi-tenant, OAuth, k8s
- ไม่ใช่ production-grade application สำหรับ user จริง

---

## 2. Tech Stack (Decisions + Rationale)

| Layer | Choice | ทำไมเลือก |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) + React 19 + TypeScript | App Router คือ mainstream ปัจจุบัน; RSC ช่วยเข้าใจ rendering หลายแบบ |
| **Styling** | Tailwind CSS + shadcn/ui | Copy-paste components → ไม่เสียเวลาเขียน UI from scratch แต่ยังเห็น Tailwind ทุกบรรทัด |
| **Forms** | React Hook Form + Zod resolver | Zod schema reuse กับ BE ได้ |
| **Data fetching** | TanStack Query | Standard caching/mutation/refetch ของ React app |
| **Cart state** | Zustand | คลาส client state เล็กๆ ไม่ต้องใช้ Redux |
| **Backend** | NestJS + TypeScript | Modules/Controllers/Providers/Guards/Pipes เข้ากับ system design mindset (Spring-like) |
| **Database** | PostgreSQL 16 | มาตรฐาน, free, transaction ดี |
| **ORM** | Prisma | Schema-first, migration auto, type-safe สูงสุด |
| **API style** | REST + JWT | Transferable ไป stack อื่นได้ (ไม่ผูกกับ TS) |
| **Validation** | Zod ทั้ง FE/BE (NestJS ใช้ผ่าน `nestjs-zod`) | One schema, two sides |
| **Monorepo** | pnpm workspaces + Turborepo | Industry standard; share types ระหว่าง apps |
| **Container** | Docker + Docker Compose | Mental model ตรงไปตรงมา; 1 VPS ก็พอ |
| **Reverse Proxy** | Caddy | Auto-HTTPS via Let's Encrypt, config 8 บรรทัดได้ |
| **CI/CD** | GitHub Actions → SSH deploy | Free tier เพียงพอ, GitOps แท้ |
| **VPS** | Hetzner CX22 (~€4.5/mo) หรือ DigitalOcean $6 droplet | คุ้มค่าสุดในงบ portfolio |

### 2.1 ทางเลือกที่พิจารณาแล้ว — และไม่เลือก

- **Express แทน NestJS** — ต้อง bootstrap ทุกอย่างเอง ช้ากว่าและไม่ได้สอน pattern เป็นรูปเป็นร่าง
- **Next.js full-stack (API routes)** — เร็วกว่า แต่ผู้เรียนต้องการเรียน "ฝั่ง backend" แยกชัดเจน
- **Drizzle แทน Prisma** — DX ของ Prisma ยังเหนือกว่าสำหรับผู้เริ่มต้น
- **tRPC** — ผูกกับ TypeScript เกินไป, REST transferable มากกว่า
- **Coolify/Dokploy แทน raw Docker Compose** — ง่ายกว่าแต่ซ่อน DevOps fundamentals ที่ผู้เรียนต้องการเรียน
- **k8s** — over-engineered สำหรับ 1 VPS

---

## 3. Repository Structure (Monorepo)

```
course-full-stack/
├── apps/
│   ├── web/                    # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── (storefront)/   # หน้าลูกค้า: เมนู, ตะกร้า, สั่งซื้อ
│   │   │   ├── (admin)/        # หน้าหลังบ้าน: stock, P&L, orders
│   │   │   └── api/            # อาจไม่ใช้ — ใช้ NestJS แทน
│   │   ├── components/ui/      # shadcn/ui generated
│   │   ├── lib/
│   │   │   ├── api-client.ts   # fetch wrapper → NestJS
│   │   │   └── auth.ts
│   │   └── package.json
│   │
│   └── api/                    # NestJS
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/       # JWT login/register
│       │   │   ├── menu/       # products, categories
│       │   │   ├── orders/     # checkout, status
│       │   │   ├── inventory/  # stock, recipes
│       │   │   └── reports/    # cost, profit, P&L
│       │   ├── common/         # guards, pipes, filters
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       └── package.json
│
├── packages/
│   └── shared/                 # @coffee/shared
│       ├── src/
│       │   ├── schemas/        # Zod schemas (order, product, user…)
│       │   └── types/          # types ที่ derive จาก Zod
│       └── package.json
│
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   └── Dockerfile.api
│   ├── caddy/
│   │   └── Caddyfile
│   ├── docker-compose.yml      # dev
│   └── docker-compose.prod.yml # prod
│
├── .github/workflows/
│   ├── ci.yml                  # PR: lint + typecheck + test
│   └── deploy.yml              # main: build → push → SSH deploy
│
├── docs/                       # course notes, ADRs, specs
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

### 3.1 Decisions
- **ไม่มี `packages/ui`** — shadcn/ui copy เข้า `apps/web/components/ui/` (YAGNI)
- **Prisma อยู่ใน `apps/api`** เท่านั้น — web ไม่ access DB ตรง, ใช้ผ่าน REST
- **`packages/shared` คือหัวใจ** — Zod schemas reuse ทั้ง FE/BE

---

## 4. Coffee Shop MVP — Data Model & Features

### 4.1 Data Model (Prisma — ย่อ)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // bcrypt hash
  role      Role     // ADMIN | STAFF
}

model Category { id, name, sortOrder, products[] }

model Product {
  id, name, price, imageUrl, isActive
  category, recipe: RecipeItem[]
}

model Ingredient {
  id, name, unit (g|ml|pcs), costPerUnit
  currentStock Decimal     // cached, source of truth = StockMovement sum
  minStock                 // alert threshold
}

model RecipeItem {
  product, ingredient, quantity
  @@unique([productId, ingredientId])
}

model Order {
  id, orderNumber (#A001), status, customerName, customerPhone
  subtotal, total, paidAt
  items: OrderItem[]
}

model OrderItem {
  order, product, qty, unitPrice (snapshot), lineTotal, cogsSnapshot
}

model StockMovement {
  ingredient, quantity (signed), reason (SALE|PURCHASE|WASTE|ADJUSTMENT)
  refOrderId?, costAtTime, createdAt, createdBy
}

enum Role        { ADMIN STAFF }
enum OrderStatus { PENDING PREPARING READY COMPLETED CANCELLED }
```

### 4.2 Features (Locked Scope)

**Storefront** (`/menu`, `/cart`, `/order/[id]`)
- Browse menu by category
- Add to cart (Zustand state, persist localStorage)
- Guest checkout (name + phone) — **ไม่มี customer signup**
- Fake payment ปุ่มเดียว → status PENDING
- Track order status (polling ทุก 5 วินาที)

**Kitchen UI** (`/kitchen`, role: STAFF)
- List incoming orders (auto-refresh)
- Mark: PREPARING → READY → COMPLETED

**Admin Back Office** (`/admin/*`, role: ADMIN)
- Menu CRUD + assign recipe (เมนู ↔ วัตถุดิบ + ปริมาณ)
- Ingredients CRUD + current stock view
- Stock movements UI: บันทึกซื้อวัตถุดิบ / waste / adjustment
- Reports dashboard: revenue, COGS, gross profit %, top 5 menu, low-stock alerts

### 4.3 Cost/Profit Logic

```
เมื่อ order เปลี่ยนเป็น COMPLETED (ภายใน Prisma $transaction):
  สำหรับแต่ละ orderItem:
    - หา recipe ของ product
    - cogsSnapshot = Σ (ingredient.costPerUnit × recipe.quantity × orderItem.qty)
    - สร้าง StockMovement (SALE) ลบ stock ตามสูตร × qty
    - update Ingredient.currentStock (cached)

Daily Report:
  revenue       = Σ orderItem.lineTotal   (paidAt = today)
  cogs          = Σ orderItem.cogsSnapshot
  grossProfit   = revenue − cogs
  grossMargin%  = grossProfit / revenue × 100
```

**Snapshot Pattern**: ทั้ง `unitPrice` และ `cogsSnapshot` เก็บ ณ เวลาขาย — ราคาขายและต้นทุนเปลี่ยนภายหลังไม่กระทบรายงานเก่า

### 4.4 Auth Strategy
- **Staff/Admin**: email + password → JWT (issue โดย NestJS, FE เก็บใน httpOnly cookie)
- **Customer**: ไม่มี account, guest checkout — เก็บแค่ name + phone ใน Order
- **NestJS Guards**: `@Roles('ADMIN')` decorator ใน Controllers

### 4.5 Out of Scope (Tight MVP)
- Customer signup/account
- Discount/promo code
- Multiple shops/branches (multi-tenant)
- Tax / VAT calculation
- Real payment gateway
- Double-entry accounting, journal entries

---

## 5. 6-Week Curriculum

### Week 1 — React/Next.js + Monorepo Foundation
**Goal**: หน้าเมนูร้านกาแฟ static บน localhost, monorepo พร้อมใช้

- Day 1-2: pnpm workspaces + Turborepo init
- Day 3-4: Next.js App Router (layout, page, route groups, RSC vs Client)
- Day 5-6: Tailwind + shadcn/ui, build static `/menu` page
- Day 7: React Hook Form + Zod (practice form)

**Concepts**: TypeScript essentials, Server vs Client Components, file-system routing, monorepo workspace

---

### Week 2 — NestJS + Database
**Goal**: API server + Postgres รันใน Docker, มี `/auth/register` และ `/auth/login` ใช้งานได้

- Day 1: Postgres ใน Docker Compose
- Day 2-3: NestJS modules, controllers, providers, DI
- Day 4-5: Prisma schema, migration, client
- Day 6-7: Auth module: bcrypt + JWT + Guards + `@Roles()`

**Concepts**: Dependency injection, module boundaries, ORM patterns, password hashing, JWT, NestJS pipes/guards

---

### Week 3 — First End-to-End Slice (Menu CRUD)
**Goal**: Admin login → CRUD เมนูผ่าน UI → save ลง DB → ดูบน storefront ได้

- Day 1: `packages/shared` + ProductSchema (Zod)
- Day 2-3: NestJS Menu module (Category + Product CRUD)
- Day 4-5: TanStack Query setup, API client wrapper
- Day 6-7: Admin Menu CRUD UI (table + form + dialog)

**Heart of week**: เห็นภาพ "1 schema → 2 ฝั่ง" ทำงานยังไง

---

### Week 4 — Storefront + Order Flow
**Goal**: ลูกค้าสั่งของได้ → staff เห็นใน Kitchen UI → เปลี่ยน status ได้

- Day 1-2: Cart (Zustand) + add/remove/qty
- Day 3-4: Order module (NestJS) + atomic create
- Day 5: Order tracking page (polling)
- Day 6-7: Kitchen UI + role guard

**Concepts**: Client state vs server state, Prisma transactions, role-based routing. **เลือก polling 5 วินาที** (SSE/WebSocket = deferred ดู §7.1)

---

### Week 5 — Inventory + Recipe + Reports ⭐
**Goal**: order COMPLETED → stock ลดอัตโนมัติ → dashboard บอกกำไรวันนี้

- Day 1: Ingredient + StockMovement schema (event-sourced)
- Day 2: Recipe CRUD (Product ↔ Ingredient)
- Day 3-4: Transaction: COMPLETED → COGS snapshot + StockMovements + update stock
- Day 5: Reports endpoint: revenue, COGS, gross profit, margin%
- Day 6-7: Reports dashboard UI + low stock alerts + top 5 menu

**Heart of week**: Prisma `$transaction`, snapshot pattern, event-sourced inventory

---

### Week 6 — Deploy to VPS + GitOps 🚀
**Goal**: `git push origin main` → 2 นาทีต่อมา yourcoffeeshop.com อัปเดต, มี HTTPS

- Day 1: Provision Hetzner CX22, SSH, ufw, non-root user, fail2ban
- Day 2: Dockerfile.web + Dockerfile.api (multi-stage)
- Day 3: docker-compose.prod.yml + Caddyfile
- Day 4: Domain DNS + Caddy auto-HTTPS
- Day 5-6: GitHub Actions: CI + Deploy
- Day 7: pg_dump cron backup, env secrets, basic monitoring

**Concepts**: Multi-stage Docker builds, reverse proxy + auto-TLS, secrets in GH Actions, container orchestration on single host

**Stretch goal fallback**: ถ้าตามไม่ทัน ตัดเหลือแค่ manual deploy ก่อน (skip GitHub Actions) — ปลอดภัยที่สุด

### 5.1 Time Budget

| | Hours/week | Total |
|---|---|---|
| Coding (1-2 ชม./วัน × 7 วัน) | 7-14 | 42-84 |
| Buffer (debug + concept ที่ติด) | included | — |

---

## 6. Deployment Architecture + GitOps

### 6.1 Production Architecture (1 VPS, 4 containers)

```
                    Internet (Cloudflare DNS optional)
                           │
                    :80, :443
                           ▼
              ┌─────────────────────────┐
              │   Caddy (auto-HTTPS)     │
              │   Reverse Proxy          │
              └────────────┬─────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │ /                          /api/*   │
        ▼                                     ▼
  ┌──────────┐                          ┌──────────┐
  │   web    │                          │   api    │
  │ Next.js  │                          │ NestJS   │
  │  :3000   │                          │  :4000   │
  └──────────┘                          └─────┬────┘
                                              │
                                              ▼
                                       ┌──────────────┐
                                       │  postgres    │
                                       │  + volume    │
                                       └──────────────┘
```

**Single domain (`/api/*`) over subdomains**: ไม่ต้อง config CORS, cookie ไม่ต้อง cross-origin, 1 cert

### 6.2 docker-compose.prod.yml (essence)

```yaml
services:
  caddy:
    image: caddy:2-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
    depends_on: [web, api]

  web:
    image: ghcr.io/${GH_USER}/coffeeshop-web:${TAG}
    environment:
      NEXT_PUBLIC_API_URL: /api
    restart: unless-stopped

  api:
    image: ghcr.io/${GH_USER}/coffeeshop-api:${TAG}
    environment:
      DATABASE_URL: postgresql://coffee:${DB_PASS}@postgres:5432/coffee
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      postgres: { condition: service_healthy }
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: coffee
      POSTGRES_USER: coffee
      POSTGRES_PASSWORD: ${DB_PASS}
    volumes: [pg_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "coffee"]
    restart: unless-stopped

volumes: { caddy_data, pg_data }
```

### 6.3 Caddyfile

```
yourcoffeeshop.com {
  handle /api/* {
    uri strip_prefix /api
    reverse_proxy api:4000
  }
  handle { reverse_proxy web:3000 }
}
```

### 6.4 GitOps Flow

```
[git push origin main]
    ↓
[GitHub Actions]
  ├── Build & push images to GHCR (tag = ${{ github.sha }})
  └── SSH to VPS:
        TAG=${{ github.sha }} docker compose pull
        docker compose up -d
[VPS]
  → pulls new images
  → recreates web + api containers (Postgres unchanged)
  → live in ~2 min
```

### 6.5 GitHub Actions Workflows

**`.github/workflows/ci.yml`** (on PR):
- pnpm install --frozen-lockfile
- pnpm lint, typecheck, test
- pnpm build (verify; do not deploy)

**`.github/workflows/deploy.yml`** (on push to main):
- Login to GHCR
- Build & push images (web + api), tag with `${{ github.sha }}`
- SSH to VPS → `docker compose pull && docker compose up -d && docker image prune -f`

### 6.6 Migrations

Entrypoint script ใน `Dockerfile.api`:
```sh
#!/bin/sh
npx prisma migrate deploy        # idempotent, safe to re-run
exec node dist/main.js
```
Prisma มี advisory lock → safe ถ้า container start parallel

### 6.7 Secrets

| Secret | เก็บที่ |
|---|---|
| SSH private key (deploy) | GitHub Secrets: `SSH_PRIVATE_KEY` |
| GHCR token | `GITHUB_TOKEN` ของ workflow |
| `DB_PASS`, `JWT_SECRET` | VPS: `/home/deploy/coffeeshop/.env` (chmod 600) |

ห้าม commit `.env`, ห้าม echo secret ใน workflow log

### 6.8 Backup

`scripts/backup.sh` รันผ่าน cron:
```sh
DATE=$(date +%F)
docker exec coffee-postgres pg_dump -U coffee coffee | \
  gzip > /var/backups/coffee-$DATE.sql.gz
find /var/backups -name 'coffee-*.sql.gz' -mtime +7 -delete
```
Cron: `0 3 * * * /home/deploy/scripts/backup.sh`

**Stretch**: rclone → Backblaze B2

### 6.9 Rollback

```sh
ssh deploy@vps
cd coffeeshop
TAG=<previous-sha> docker compose up -d
```

### 6.10 Health Check (optional Week 6 stretch)

- NestJS: `GET /healthz` → 200 + DB ping
- Next.js: `GET /api/healthz`
- Uptime Kuma container → ping every 1 min, alert ผ่าน LINE/Telegram

### 6.11 Cost

| Item | Cost/month |
|---|---|
| Hetzner CX22 VPS | €4.51 (~165 บาท) |
| Domain `.com` | ~30 บาท/เดือน amortized |
| GHCR (public images) | Free |
| GitHub Actions (2000 min/mo) | Free |
| Backblaze B2 backup (optional) | <$1 |
| **Total** | **~200 บาท/เดือน** |

---

## 7. Out of Scope + Learning Path Forward

### 7.1 ตัดออกตั้งใจ

| ไม่สอน | เหตุผล |
|---|---|
| Real payment (Stripe/Omise) | KYC, security audit, webhook idempotency = course แยก |
| Multi-tenant | RLS, tenant isolation = course แยก |
| OAuth / MFA / refresh tokens | basic JWT ก่อน |
| WebSocket / SSE | polling 5 วินาทีพอ สำหรับ 1 ร้าน |
| k8s / microservices | over-engineered สำหรับ 1 VPS |
| GraphQL / tRPC | REST transferable มากกว่า |
| E2E test (Playwright) | unit test ของ business logic สำคัญกว่าตอนเรียน |
| i18n, SEO, file upload, email | YAGNI สำหรับ portfolio MVP |
| Sentry / OpenTelemetry | log file + Uptime Kuma พอ |

### 7.2 Learning Path ต่อ (เรียงลำดับความคุ้ม)

**Tier 1 — เรียนต่อทันทีหลังจบ**
1. Auth deep dive (NextAuth.js, OAuth, refresh token rotation) — 1-2 wk
2. Real Payment (Stripe/Omise + webhooks) — 1-2 wk
3. Observability (Sentry, Pino, OpenTelemetry) — 1 wk

**Tier 2 — เพิ่มเพดาน engineering**
4. E2E Testing (Playwright + GH Actions) — 1 wk
5. Performance (Redis, indexing, EXPLAIN ANALYZE) — 1-2 wk
6. Background Jobs (BullMQ) — 1 wk

**Tier 3 — เปลี่ยนขนาดของระบบ**
7. Multi-tenant (RLS, subdomain routing) — 2-3 wk
8. Mobile App (React Native + Expo, reuse API) — 3-4 wk
9. Container Orchestration (Docker Swarm / k3s) — 2-3 wk
10. Real-time (Socket.io for Kitchen UI) — 1 wk

### 7.3 Resources

| หัวข้อ | แหล่ง |
|---|---|
| React (modern) | react.dev — official |
| Next.js | nextjs.org/learn — interactive course |
| NestJS | docs.nestjs.com — intro section ครบ |
| Prisma | prisma.io/docs — concepts |
| Docker | "Docker — Up & Running" (O'Reilly) |
| VPS Hardening | DigitalOcean Community tutorials |

### 7.4 Mindset Takeaways

1. **Schema ขึ้นก่อน UI** — Prisma + Zod schema = contract ของระบบ
2. **Snapshot Pattern** — ราคา/ต้นทุนตอนขาย เก็บไว้ใน OrderItem ไม่ใช่ join จาก Product
3. **Event-sourced Inventory** — `currentStock = SUM(StockMovement.quantity)`
4. **Atomic Transactions** — order + stock + COGS = 1 transaction, rollback all on fail
5. **GitOps** — git เป็น source of truth, server state ไม่แก้ด้วยมือ
6. **Single VPS ก่อน scale** — k8s/microservices = overkill จนกว่าจะมีปัญหาจริง

---

## 8. Risks & Open Questions

### 8.1 Risks
- **Week 6 อาจไม่พอเวลา** — ถ้า debug Docker/Caddy นาน → mitigation: stretch goal pattern (manual deploy → GitOps)
- **Prisma migration บน prod** — entrypoint script รัน migrate ก่อน start: ถ้า migration พังจะ container restart loop → ใช้ blue-green deploy เป็นทางออก (เก็บไว้สอน Tier 2)
- **JWT in httpOnly cookie + cross-route** — `/api/*` กับ `/` ใน domain เดียวกันแก้ปัญหานี้

### 8.2 Open Questions (ถามผู้เรียนตอนเริ่ม Week 1)
- VPS provider: Hetzner หรือ DigitalOcean?
- Domain ที่จะใช้: ซื้อใหม่หรือใช้ subdomain ของที่มีอยู่?
- IDE: VS Code (assumed) หรืออื่น?

---

## 9. Acceptance Criteria

หลังจบคอร์ส ผู้เรียนควรทำได้:
- ✅ Run `pnpm dev` แล้ว FE+BE+DB ขึ้นใน 1 คำสั่ง
- ✅ Login เป็น Admin → CRUD เมนู → ลูกค้าสั่งของได้ → stock ลดอัตโนมัติ → ดูกำไรวันนี้ได้
- ✅ Push to main → 2 นาทีต่อมา https://your-domain.com อัปเดต
- ✅ pg_dump backup รันอัตโนมัติทุกคืน
- ✅ มี portfolio repo ที่ recruiter อ่านแล้ว clone รันต่อได้

---

## 10. Plan Decomposition Strategy

Course นี้แตกเป็น **6 implementation plans แยก** (1 plan / 1 week) ไม่รวมเป็น plan เดียว เพราะ:
- แต่ละ week มี deliverable ที่ ship ได้แยกกัน
- ลด cognitive load (~10-15 tasks/plan ดีกว่า 60+ tasks)
- Review checkpoint ทุก week ปรับทิศทางได้ก่อนสัปดาห์ถัดไป
- ถ้าตามไม่ทัน Week 6 (deploy) ตัดได้โดย Week 1-5 ยังเป็น app ที่ใช้งาน local ได้

**Next step**: Invoke `writing-plans` skill เพื่อเขียน implementation plan ของ **Week 1** ก่อน (Setup + Next.js Foundation). เมื่อจบ Week 1 แล้วค่อย invoke writing-plans อีกครั้งสำหรับ Week 2 ตามลำดับ
