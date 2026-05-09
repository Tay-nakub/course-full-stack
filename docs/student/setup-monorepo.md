# 🏗️ Monorepo Setup — Step by Step

> **Audience:** student-facing
> **Time:** ~20-30 นาที (ครั้งแรกหลังจาก [tools setup](setup-windows.md) เสร็จ)
> **Goal:** จาก `git clone` → `pnpm dev` รันทั้ง web + api ได้

ทำตาม steps นี้ครั้งเดียว — ครั้งหน้าเปิด project แค่ `pnpm dev` พอ.

---

## 📋 Pre-flight

ตรวจให้ผ่านก่อนเริ่ม (จาก [setup-windows.md](setup-windows.md) §9):

```bash
node --version    # v20+
pnpm --version    # 9+
git --version
docker --version
docker run hello-world    # daemon ทำงาน
```

---

## 1️⃣ Clone Repo

> 👉 **WSL/Linux/macOS users** — clone ใน Linux home, ไม่ใช่ `/mnt/c/...`

```bash
mkdir -p ~/projects
cd ~/projects
git clone git@github.com:<your-org>/course-full-stack.git
cd course-full-stack
```

ตรวจว่า branch หลักคือ `main`:

```bash
git branch
# * main
```

> 💡 **Instructor branches:** ถ้าติดที่ Week N ใช้ `git checkout week-N-reference` เพื่อดู reference implementation.

---

## 2️⃣ Install Dependencies

```bash
pnpm install
```

ครั้งแรก ~3-5 นาที. pnpm จะ:

- สร้าง `node_modules/` แบบ symlink (เร็ว, ประหยัด disk)
- Install ทุก workspace package พร้อมกัน (`apps/web`, `apps/api`, `packages/shared`)
- Generate `pnpm-lock.yaml` (เก็บ lock — commit ด้วย)

### Verify

```bash
ls node_modules           # ต้องมี directory
ls apps/web/node_modules  # symlink → root node_modules
pnpm list -r --depth=0    # show packages by workspace
```

---

## 3️⃣ Environment Variables

API ต้องการ env vars 2 ตัว: `DATABASE_URL` + `JWT_SECRET`.

```bash
cd apps/api
cp .env.example .env
```

เปิด `.env` ใน VS Code แล้วเช็คว่ามี:

```env
DATABASE_URL="postgresql://coffee:coffee_dev_password@localhost:5433/coffee?schema=public"
JWT_SECRET="dev-secret-change-me-in-prod"
JWT_EXPIRES_IN="7d"
```

> 🚨 **Port 5433** ไม่ใช่ 5432 — เลขนี้ตรงกับ Postgres docker container. ดู [REFERENCE_NOTES.md → Postgres host port 5433](../REFERENCE_NOTES.md#postgres-host-port-5433-not-5432) สำหรับเหตุผล.

```bash
cd ../..    # กลับ project root
```

---

## 4️⃣ Start Postgres (Docker)

```bash
pnpm db:up
```

จะ pull `postgres:16` image (ครั้งแรกเท่านั้น) และ start container.

### Verify

```bash
docker compose -f infra/docker-compose.dev.yml ps
# coffee-postgres   ...   Up   0.0.0.0:5433->5432/tcp
```

ถ้า container `Up (healthy)` → ผ่าน. ถ้าเป็น `Exited` ดูที่ §[Common Issues](#-common-issues) ด้านล่าง.

### Optional: connect to DB

```bash
docker compose -f infra/docker-compose.dev.yml exec postgres \
  psql -U coffee -d coffee -c '\dt'
# (no relations — ยังไม่ได้ migrate)
```

---

## 5️⃣ Run Prisma Migrations + Generate Client

```bash
cd apps/api
pnpm prisma migrate deploy   # apply migrations
pnpm prisma generate         # generate TS client
cd ../..
```

### Verify

```bash
docker compose -f infra/docker-compose.dev.yml exec postgres \
  psql -U coffee -d coffee -c '\dt'
```

ควรเห็น tables: `users`, `categories`, `products`, `orders`, `order_items`, `ingredients`, `recipe_items`, `stock_movements`.

---

## 6️⃣ Seed Initial Data (Week 5+)

ถ้าทำถึง Week 5 หรือ checkout `week-5-reference`+:

```bash
pnpm --filter @coffee/api run db:seed
```

จะสร้าง:

- 1 admin user (`admin@coffee.test` / `password123`)
- 2 categories + 4 products
- 5 ingredients + recipes
- 1 sample order

### Verify

```bash
docker compose -f infra/docker-compose.dev.yml exec postgres \
  psql -U coffee -d coffee -c 'SELECT email, role FROM users;'
```

---

## 7️⃣ Start Dev Servers

ใน project root:

```bash
pnpm dev
```

Turborepo จะ start ทั้ง 2 apps พร้อมกัน:

```
@coffee/api: ► API listening on http://localhost:4000/api
web:         ► Next.js dev server on http://localhost:3000
```

### Verify (เปิด browser)

| URL                                     | Expected                   |
| --------------------------------------- | -------------------------- |
| http://localhost:3000                   | redirect → /menu           |
| http://localhost:3000/menu              | menu page (loaded จาก API) |
| http://localhost:3000/feedback          | feedback form              |
| http://localhost:3000/login             | login form                 |
| http://localhost:4000/api/menu/products | JSON array                 |
| http://localhost:4000/api/auth/me       | 401 (no token)             |

> ⏱ ครั้งแรก dev server compile ~10-30 sec. หน้าแรก slow OK; refresh ครั้งสองจะเร็ว.

### Quick API smoke test

```bash
# Login
curl -i -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@coffee.test","password":"password123"}'
# → 200 + JWT token
```

---

## 8️⃣ Run Tests + Typecheck

```bash
# All workspaces, in parallel via Turbo
pnpm typecheck
pnpm test
```

Expected ที่ `week-6-reference`:

```
@coffee/api:test   ✓ 25 tests pass
web:test           ✓ 3 tests pass
─────────────────────────────────
Total              28 tests pass
```

---

## 9️⃣ Stop Everything (เลิกงาน)

```bash
# Stop dev servers
Ctrl+C    # ใน terminal ที่รัน pnpm dev

# Stop Postgres
pnpm db:down
```

> 💡 ปกติเปิด-ปิด Postgres ทุกครั้ง = clean. ถ้าต้องการเก็บข้อมูล cross-session — Docker volume `postgres_data` เก็บอัตโนมัติ.

---

## 🔁 Daily Workflow (หลังจาก setup เสร็จ)

```bash
cd ~/projects/course-full-stack
git pull
pnpm install      # ถ้ามี deps ใหม่
pnpm db:up
pnpm dev
# ... code, test, commit ...
pnpm db:down
```

---

## 🛠️ Common Workspace Commands

```bash
# Run command in 1 workspace
pnpm --filter web add lodash
pnpm --filter @coffee/api run prisma:migrate
pnpm --filter @coffee/shared build

# Run script across all workspaces (Turbo orchestrates)
pnpm dev          # turbo run dev
pnpm build        # turbo run build
pnpm test         # turbo run test
pnpm typecheck    # turbo run typecheck

# Format
pnpm format       # prettier --write
pnpm format:check # prettier --check
```

### Database shortcuts

```bash
pnpm db:up        # start Postgres
pnpm db:down      # stop + remove container
pnpm db:logs      # tail Postgres logs
```

### Workspace topology

```
course-full-stack/
├── apps/
│   ├── web/        ← Next.js 16 (Tailwind v4 + shadcn)
│   └── api/        ← NestJS 11 + Prisma 7
├── packages/
│   └── shared/     ← Zod schemas + types (used by both)
├── infra/          ← docker-compose, Caddy, Dockerfiles
└── docs/           ← spec + plans + this guide
```

---

## 🆘 Common Issues

### `pnpm: command not found`

- เช็คว่า corepack เปิดแล้ว: `corepack enable`
- เปิด terminal ใหม่

### `Cannot connect to the Docker daemon`

- เปิด Docker Desktop จาก Windows Start menu
- รอ icon เป็นสีเขียว (~30 sec)

### `pnpm db:up` — port 5433 already in use

```bash
lsof -i :5433
# kill process หรือเปลี่ยน port ใน infra/docker-compose.dev.yml
```

### `P1010: User was denied access`

- DATABASE_URL ใน `.env` ผิด — copy จาก `.env.example` ใหม่
- หรือ Postgres container ยังไม่ healthy: `docker compose -f infra/docker-compose.dev.yml logs postgres`

### `pnpm install` ช้ามาก

- เปลี่ยน registry: `pnpm config set registry https://registry.npmmirror.com`
- ลบ `node_modules` + `pnpm-lock.yaml` แล้ว install ใหม่ (last resort)

### TypeScript error `Cannot find module '@coffee/shared'`

- Build shared package ก่อน: `pnpm --filter @coffee/shared build`
- Turbo `dev` `dependsOn: ["^build"]` ทำให้นี่เป็น auto — ถ้ายัง error ลอง restart dev server

### Prisma `Property 'category' does not exist on type 'PrismaService'`

- หลังแก้ `schema.prisma` ต้อง regenerate:
  ```bash
  cd apps/api && pnpm prisma generate
  ```

### `pnpm dev` รัน api แต่ web ไม่ขึ้น

- เช็ค port 3000 ว่ามีอะไรค้าง: `lsof -i :3000`
- เช็ค `apps/web/.next` — ถ้า corrupt ลบทิ้ง: `rm -rf apps/web/.next`

### Atomic stock deduct ไม่ทำงาน (Week 5)

- ตรวจว่า migrate แล้ว: tables `ingredients`, `recipe_items`, `stock_movements` ต้องมี
- ตรวจว่า seed แล้ว — recipe items ต้องโยง product → ingredient
- ดู REFERENCE_NOTES.md §Week 5 สำหรับ verification queries

---

## ✅ Setup Complete Checklist

- [ ] `pnpm install` clean
- [ ] `pnpm db:up` → container healthy
- [ ] Prisma migrations applied
- [ ] (Week 5+) Seed data loaded
- [ ] `pnpm dev` → web @ 3000 + api @ 4000 ทั้งคู่ green
- [ ] `pnpm typecheck` PASS
- [ ] `pnpm test` PASS
- [ ] http://localhost:3000/menu โหลด menu items ได้

ผ่านทุกข้อ → 🎉 **พร้อม code Week 1!**

---

## 🔗 Next Steps

- 📖 อ่าน [Week 1 Plan](../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) — what we'll build
- 🎬 ดู [Week 1 Slides](../slides/week-1/) — `cd docs/slides/week-1 && npm install && npm run dev`
- 📚 [Course Spec](../superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md) — ทำไมเลือก stack นี้
