# Week 2 Session 1 — Backend Setup & Database

**Week:** 2
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 1 complete + Docker Desktop installed
**Covers:** Tasks 1-5 of [Week 2 Plan](../../superpowers/plans/2026-05-08-week-2-nestjs-postgres-auth.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ มี `packages/shared` setup + Role type สำเร็จ
- ✅ มี `apps/api` (NestJS) รันที่ port 4000
- ✅ มี Postgres รันใน Docker Compose
- ✅ มี Prisma schema + migration applied (table `users` ใน DB)
- ✅ มี PrismaService inject ได้ — NestJS connect Postgres สำเร็จ
- 🔵 Auth implementation → Session 2

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify ทุก student post pre-class confirmation (Docker installed + verified)
- [ ] Test laptop: `docker run hello-world` + `pnpm db:up` (จาก demo repo) สมบูรณ์
- [ ] เปิด Postman/HTTPie + DBeaver/TablePlus ไว้พร้อมใช้
- [ ] เปิดแท็บ: docs.nestjs.com, prisma.io/docs
- [ ] เตรียม slide ของ Block A-D
- [ ] Backup: ถ้า student คนใด Docker ยังไม่พร้อม → จัดเป็น 1-on-1 หลังคลาส (ไม่หยุดทั้ง class)

---

## 🗓️ Time-Blocked Agenda

| Time       | Block                      | Activity                                                                |
| ---------- | -------------------------- | ----------------------------------------------------------------------- |
| 0-10       | **Recap + Week 2 Preview** | Quick verbal Q from Week 1 + show today's API                           |
| **10-40**  | **Block A**                | **Monorepo expansion: shared + NestJS scaffold** (lecture 12 + demo 18) |
| **40-65**  | **Block B**                | **Postgres in Docker Compose** (lecture 8 + demo 17)                    |
| **65-95**  | **Block C**                | **Prisma + first migration** (lecture 12 + demo 18)                     |
| **95-110** | **Block D**                | **PrismaModule integration** (lecture 5 + demo 10)                      |
| 110-120    | Wrap-up                    | Homework + Q&A                                                          |

---

## 🟢 Recap + Preview (0-10 min)

### Recap Quiz (3 min)

- "Server vs Client Component — บอก 1 อย่างที่ Server Component ทำไม่ได้"
- "TDD cycle 3 step?"
- "ทำไมเราเลือก monorepo?"

### Week 2 Preview (7 min)

**Show what we'll build today**:

1. เปิด demo repo (ที่ Week 2 จบสมบูรณ์)
2. รัน `pnpm db:up` → Postgres up
3. รัน `pnpm dev` → NestJS + Next.js ทั้งคู่
4. ใน Postman → POST `/api/auth/register` → 201 + token
5. POST `/api/auth/login` → 200 + token
6. GET `/api/auth/me` ด้วย Bearer token → user info

📢 **พูด**: "นี่คือสิ่งที่เราจะมีตอนจบ Session 2. วันนี้เราตั้ง infrastructure ก่อน — Docker + Postgres + NestJS + Prisma. Session 2 ค่อยเขียน auth logic"

> 🎓 **Cognitive load warning** (พูดให้ student ระวัง):
> "Week นี้มี **3 อย่างใหม่** ในหัวพร้อมกัน — Docker + NestJS + Prisma. ถ้ารู้สึก overwhelm — normal! Focus get-things-running ก่อน, concept ลึกๆ จะ click หลังเขียน 2-3 รอบ"

---

## 📦 Block A: Monorepo Expansion (10-40 min, 30 min)

### 🎯 Block Goals

- "เพิ่ม `apps/api` (NestJS) เข้า monorepo เดิม — ไม่ต้องเริ่มใหม่"
- "สร้าง `packages/shared` — ที่ FE+BE จะแชร์ schemas"
- "เข้าใจ NestJS modules/controllers/providers — mental model"

### 💬 Lecture (~12 min)

**1. Why `packages/shared` ก่อน apps/api?** (3 min)

> "มันคือ **decision** — schemas (Zod) แชร์ระหว่าง 2 apps. ใส่ใน apps/api แล้ว apps/web import ก็ได้ — แต่ทำไมใส่ใน package?"

วาดบนกระดาน:

```
ไม่ดี:
  apps/web ──► import ──► apps/api/src/schemas/...
  ❌ web depend on api → circular boundary

ดี:
  apps/web ──► import ──► packages/shared/schemas
  apps/api ──► import ──► packages/shared/schemas
  ✅ shared = neutral, ทั้ง 2 depend ลง
```

**2. NestJS mental model** (5 min)

วาดบนกระดาน:

```
┌──── App Module ────────────────────────┐
│                                          │
│  ┌── Auth Module ──┐  ┌── Menu Module ──┐
│  │                 │  │                 │
│  │  Controller ────┼──┤  Service        │
│  │  (HTTP layer)   │  │  (business)     │
│  │                 │  │                 │
│  │  Service ────── │──┤  Repository     │
│  │  (business)     │  │  (Prisma)       │
│  └─────────────────┘  └─────────────────┘
│                                          │
│  Providers (DI Container)               │
└──────────────────────────────────────────┘
```

📢 **Key concepts**:

- **Module** = grouping of related stuff (auth, menu, etc.)
- **Controller** = HTTP routing (`@Get`, `@Post`)
- **Service** = business logic
- **Provider** = anything that can be injected (services, repositories, factories)
- **DI Container** = NestJS handles wiring → คุณบอก "ผมต้องการ X" → NestJS หาให้

**3. NestJS vs Express comparison** (3 min)

```
Express:                  NestJS:
─────────────────         ──────────────────────────
app.get('/x', fn)         @Controller('x') class
                          @Get() method() {}

manual middleware         @UseGuards() @UsePipes()
                          decorators

assemble structure        Built-in module structure
yourself                   (opinionated, scalable)
```

📢 **เน้น**: "NestJS = ตอบโจทย์เรา (system design background) เพราะมี structure built-in"

**4. NestJS file conventions** (1 min)

```
src/
├── main.ts                    ← bootstrap
├── app.module.ts              ← root module
└── auth/
    ├── auth.module.ts         ← module definition
    ├── auth.controller.ts     ← HTTP routes
    ├── auth.service.ts        ← business logic
    └── auth.service.spec.ts   ← tests
```

### 🖥️ Live Demo (~18 min)

**1. สร้าง packages/shared** (Task 1 — 5 min)

```bash
mkdir -p packages/shared/src/types
```

สร้าง `packages/shared/package.json`:

```json
{
  "name": "@coffee/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": { "zod": "^3.23.8" }
}
```

📢 **พูด**: "`workspace:*` protocol — apps/api จะ link มาตัวนี้โดยตรง, ไม่ต้อง publish"

สร้าง `tsconfig.json` + `src/types/user.ts`:

```ts
export const ROLES = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];
```

📢 **พูด** (เน้น): "`as const` + indexed access type = enum แบบ TypeScript-friendly. JSON-serializable, treeshakable. ดีกว่า `enum` keyword ของ TS"

สร้าง `src/index.ts`:

```ts
export * from './types/user';
```

รัน:

```bash
pnpm install
pnpm --filter @coffee/shared typecheck
```

Commit:

```bash
git add packages/shared
git commit -m "feat(shared): add @coffee/shared package with Role type"
```

**2. Scaffold NestJS** (Task 2 — 13 min)

📢 **บอก class**: "NestJS มี CLI ของตัวเอง — เริ่มแบบ `create-next-app` of NestJS"

```bash
cd apps
pnpm dlx @nestjs/cli new api --package-manager pnpm --skip-git
cd ..
```

(รอ install เสร็จ — ใช้เวลา ~1-2 นาที. ขณะรอ: อธิบายไฟล์ที่ NestJS scaffold สร้าง)

ทัวร์ folder structure:

- `src/main.ts` — bootstrap (เหมือน `index.ts`)
- `src/app.module.ts` — root module
- `src/app.controller.ts` — example controller
- `src/app.service.ts` — example service
- `nest-cli.json` — NestJS CLI config

แก้ `apps/api/tsconfig.json` ให้ extend base — โชว์ที่สำคัญ:

- `experimentalDecorators: true` — สำหรับ `@Controller()`, `@Injectable()`
- `emitDecoratorMetadata: true` — สำหรับ DI runtime resolution

📢 **พูด**: "Decorators (`@Controller`) คือ syntactic sugar — emitDecoratorMetadata เก็บ type info ตอน compile เพื่อ runtime DI"

แก้ `apps/api/src/main.ts`:

```ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  await app.listen(4000);
  console.log(`🚀 API ready on http://localhost:4000/api`);
}
```

รัน:

```bash
pnpm install
pnpm --filter @coffee/api dev
```

ทดสอบ:

```bash
curl http://localhost:4000/api
# → "Hello World!"
```

📢 **พูด**: "เห็นได้ว่า `/api` prefix มา + GET / endpoint จาก NestJS scaffold ทำงาน. ตอนนี้เราพร้อมเพิ่ม module ของเราเอง"

Commit:

```bash
git add apps/api
git commit -m "feat(api): scaffold NestJS app with /api prefix on port 4000"
```

### ❓ Common Questions (Block A)

| Q                                                 | A                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `workspace:*` ต่างจาก version number ยังไง?       | `workspace:*` = ใช้ local version ของ pnpm workspace, ไม่ pull จาก npm. ตอน publish จริง pnpm จะ replace ด้วย version number |
| ทำไมต้อง `setGlobalPrefix('api')`?                | เพื่อให้ Caddy reverse proxy ใน Week 6 forward `/api/*` → NestJS, `/` → Next.js. ใน 1 domain                                 |
| NestJS เลือก Express หรือ Fastify under the hood? | Default = Express. ใช้ `NestFactory.create<NestFastifyApplication>(...)` switch ได้                                          |
| Module ต้องลงรายละเอียดได้กี่ class?              | ไม่จำกัด แต่ best practice: 1 module / 1 domain (auth, menu, orders)                                                         |

---

## 🐳 Block B: Postgres in Docker Compose (40-65 min, 25 min)

### 🎯 Block Goals

- "Run Postgres in Docker — no local install needed"
- "เข้าใจ docker-compose service definition"
- "Connect ผ่าน DBeaver/TablePlus"

### 💬 Lecture (~8 min)

**1. ทำไม Docker** (3 min)

ถามคนฟัง: "ใครเคย install Postgres บน laptop ตัวเอง?"

- Pain points: version conflict, port collision, uninstall ยาก
- Docker = isolated, reproducible, "ของในกล่อง"

**2. docker-compose anatomy** (3 min)

แสดงไฟล์ snippet:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment: ...
    volumes: ...
    ports: ...
    healthcheck: ...
```

📢 **คำอธิบาย**:

- `services` = containers ที่จะรัน
- `image` = base image (postgres:16-alpine)
- `volumes` = persistent storage (data ไม่หายเมื่อ container ลบ)
- `ports` = `host:container` mapping
- `healthcheck` = ใช้ใน Week 6 ตอน depend_on

**3. ทำไม alpine** (2 min)

- `postgres:16` = Debian-based, ~280 MB
- `postgres:16-alpine` = Alpine Linux, ~80 MB
- Function เหมือนกัน — alpine ขนาดเล็กกว่า

### 🖥️ Live Demo (~17 min)

**1. สร้าง infra/docker-compose.dev.yml** (Task 3.1 — 5 min)

(พิมพ์ตาม Plan, อธิบายแต่ละบรรทัด)

📢 **เน้น**: "password ใน dev compose — OK ที่ commit (dev only). Prod ใช้ env injection"

**2. เพิ่ม root scripts** (Task 3.2 — 2 min)

แก้ root `package.json`:

```json
"db:up": "docker compose -f infra/docker-compose.dev.yml up -d",
"db:down": "docker compose -f infra/docker-compose.dev.yml down",
"db:logs": "docker compose -f infra/docker-compose.dev.yml logs -f postgres"
```

**3. Start Postgres** (3 min)

```bash
pnpm db:up
```

แสดง output ของ `docker ps`:

```
CONTAINER ID   IMAGE                STATUS
abc123         postgres:16-alpine   Up (healthy)
```

ทดสอบ healthcheck:

```bash
docker exec coffee-postgres-dev pg_isready -U coffee
# accepting connections
```

**4. Connect ผ่าน DBeaver/TablePlus** (5 min)

เปิด DBeaver → New connection:

- Host: `localhost`
- Port: `5432`
- Database: `coffee`
- User: `coffee`
- Password: `coffee_dev_password`

→ Test connection → ✓ → Save

📢 **พูด**: "DBeaver = browser ของ database. ใช้ดูข้อมูลตอน debug ดีกว่าทำผ่าน CLI"

**5. สร้าง .env files** (Task 3.4-3.5 — 2 min)

`apps/api/.env.example` (commit-able):

```
DATABASE_URL="postgresql://coffee:coffee_dev_password@localhost:5432/coffee?schema=public"
JWT_SECRET="change-me-in-production-min-32-chars-recommended"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=4000
```

```bash
cp apps/api/.env.example apps/api/.env
```

📢 **เน้น**: "**ห้าม** commit `.env` (จริง). `.gitignore` จาก Week 1 ครอบไว้แล้ว"

Commit:

```bash
git add infra/docker-compose.dev.yml apps/api/.env.example package.json
git commit -m "feat(infra): add Postgres dev docker-compose"
```

### ❓ Common Questions (Block B)

| Q                                         | A                                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Volumes ลบได้ไหมถ้าอยาก reset DB?         | `pnpm db:down` แล้ว `docker volume rm course-full-stack_postgres_dev_data`. Volume name = `<projectname>_<volumename>` |
| Port 5432 ติดถ้ามี Postgres ลง local?     | เปลี่ยน mapping ใน compose: `ports: ['5433:5432']` แล้ว update DATABASE_URL                                            |
| Postgres data หายหลังคอมพิวเตอร์ restart? | ไม่ — volume persist บน disk ของ host (ลบเฉพาะที่ container, ไม่ใช่ volume)                                            |
| ทำไมไม่ใช้ Postgres native?               | OK ทำได้, แต่ Docker = standardize ระหว่าง laptop ทุกคน + zero config                                                  |

---

## 🛢️ Block C: Prisma + First Migration (65-95 min, 30 min)

### 🎯 Block Goals

- "เข้าใจ Prisma schema syntax"
- "รัน migration → ตาราง real ใน Postgres"
- "Generate type-safe client"

### 💬 Lecture (~12 min)

**1. ทำไม Prisma** (3 min)

- Schema-first (define schema, get migration + client)
- Type-safe — ทุก query ตรวจ TS compile time
- Migration auto-generate จาก schema diff

> "Compare กับ raw SQL: Prisma เก่งเรื่อง CRUD ทั่วไป, raw SQL เก่งเรื่อง complex queries. Course ใช้ Prisma เพราะ scope ของเราเป็น CRUD-heavy"

**2. Schema syntax** (5 min)

วาดบนกระดาน หรือ slide:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())

  @@map("users")
}

enum Role {
  ADMIN
  STAFF
}
```

อธิบายแต่ละ:

- `@id` = primary key
- `@default(cuid())` = generate cuid (collision-resistant)
- `@unique` = unique constraint
- `@@map("users")` = table name (lowercase) — Postgres convention

**3. Migration workflow** (4 min)

```
schema.prisma     ──► prisma migrate dev ──► migrations/
                                              ↓
                                              SQL applied to DB
                                              ↓
                                              prisma generate
                                              ↓
                                              @prisma/client (typed)
```

📢 **Key**: "schema เปลี่ยน → migrate dev → SQL + Client update อัตโนมัติ"

### 🖥️ Live Demo (~18 min)

**1. Install Prisma** (2 min)

```bash
cd apps/api
pnpm add -D prisma
pnpm add @prisma/client
cd ../..
```

**2. Initialize** (2 min)

```bash
cd apps/api
pnpm prisma init --datasource-provider postgresql
cd ../..
```

→ สร้าง `prisma/schema.prisma` + อาจมี `.env` (ลบ DATABASE_URL ที่ duplicate ออก)

**3. เขียน schema** (5 min)

(พิมพ์ตาม Plan Task 4.3 — แสดงเป็น live + อธิบายแต่ละ field)

**4. รัน migration** (5 min)

```bash
cd apps/api
pnpm prisma migrate dev --name init
cd ../..
```

ตอบ name = `init` → enter

📢 **พูด**: "Prisma:

1. Compare schema กับ DB
2. Generate SQL migration
3. Apply migration
4. Generate client"

ตรวจผล:

```bash
docker exec -it coffee-postgres-dev psql -U coffee -d coffee -c "\dt"
# → users + _prisma_migrations
```

ใน DBeaver → refresh → เห็นตาราง `users` พร้อม columns

**5. Open Prisma Studio** (4 min)

```bash
cd apps/api
pnpm prisma studio
```

→ เปิด browser ที่ http://localhost:5555 → GUI สำหรับ inspect/edit data

📢 **พูด**: "Prisma Studio = built-in DB GUI. ดี gym debug, manual data entry. ใน prod ห้ามรัน — แค่ dev"

Commit:

```bash
git add apps/api/prisma apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add Prisma with User schema and initial migration"
```

### ❓ Common Questions (Block C)

| Q                                              | A                                                                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `cuid()` vs `uuid()` ต่างกันไง?                | cuid = shorter, URL-safe, sortable-ish. uuid = wider compatibility (RFC 4122). ทั้งคู่ collision-resistant    |
| ทำไมไม่ใช้ auto-increment?                     | URL ชัดเจนกว่า (`/order/c123abc` vs `/order/42`), ป้องกัน enumeration attack                                  |
| `migrate dev` vs `migrate deploy`?             | `dev` = สำหรับ dev (re-create ถ้า schema diff with DB). `deploy` = สำหรับ prod (apply pending only, no reset) |
| Schema เปลี่ยนทีหลัง — migration เดิมจะแก้ไหม? | ไม่ — สร้างใหม่. Migration history = audit trail                                                              |

---

## 🔌 Block D: PrismaModule Integration (95-110 min, 15 min)

### 🎯 Block Goals

- "Wire Prisma เข้า NestJS DI"
- "เข้าใจ NestJS lifecycle hooks"
- "Verify connection works"

### 💬 Lecture (~5 min)

**1. NestJS lifecycle hooks** (3 min)

```
Module Init  ──► onModuleInit()    ← connect DB
                       ↓
                  app running
                       ↓
Module Destroy ──► onModuleDestroy() ← disconnect DB
```

**2. Why `@Global()`?** (2 min)

- ปกติ module export → ต้อง explicit import ในที่ใช้
- `@Global()` = singleton, ทุก module ใช้ได้โดยไม่ต้อง import
- Use case: Prisma, Logger, Config — infrastructure ที่ใช้ทุกที่

📢 **เตือน**: "อย่า `@Global()` ทุกอย่าง — ทำให้ dependency tree ไม่ชัด. ใช้สำหรับ true infrastructure เท่านั้น"

### 🖥️ Live Demo (~10 min)

**1. PrismaService** (Task 5.1 — 3 min)

(พิมพ์ตาม Plan)

📢 **เน้น**: "`extends PrismaClient` = service เป็น Prisma client โดยตรง — wrap ลึกไม่ต้อง"

**2. PrismaModule** (Task 5.2 — 2 min)

(พิมพ์ตาม Plan)

**3. Register ใน AppModule** (Task 5.3 — 2 min)

```ts
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  ...
})
```

Install:

```bash
cd apps/api
pnpm add @nestjs/config
cd ../..
```

**4. Verify connection** (3 min)

รัน api:

```bash
pnpm --filter @coffee/api dev
```

ควร log:

- `🚀 API ready on http://localhost:4000/api`
- ไม่มี Prisma error

ลอง stop Postgres + restart api → ดู error message:

```bash
pnpm db:down
pnpm --filter @coffee/api dev
# Expected: error connect Postgres
pnpm db:up
# restart api → connect ผ่าน
```

📢 **พูด**: "Lifecycle hooks ทำงาน — ถ้า DB unavailable → onModuleInit ล้ม → app crash early. นี่ดี (fail-fast)"

Commit:

```bash
git add apps/api/src apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add global PrismaModule with lifecycle-managed service"
```

### ❓ Common Questions (Block D)

| Q                                                | A                                                                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| ทำไมต้อง wrap PrismaClient ใน Service?           | เพื่อให้ NestJS DI inject + lifecycle hooks ทำงาน. ถ้าใช้ `new PrismaClient()` ตรงๆ ใน controller — ทำได้แต่ไม่มี lifecycle |
| `onModuleInit` ทำงานก่อน `app.listen()` ไหม?     | ใช่ — NestJS รอทุก module init เสร็จก่อนเปิด HTTP server                                                                    |
| `@Inject()` กับ constructor injection ต่างกันไง? | constructor injection ใช้ type-based (NestJS หาเอง). `@Inject('TOKEN')` = string-based (สำหรับ factory providers)           |

---

## 🏁 Wrap-up + Homework (110-120 min, 10 min)

### Recap (3 min)

ถามทีละคน:

1. "ทำไมต้องสร้าง `packages/shared` แยกจาก `apps/api`?"
2. "Docker volume ทำหน้าที่อะไร?"
3. "Prisma migration `dev` vs `deploy` ต่างยังไง?"
4. "`@Global()` module ใช้เมื่อไหร่?"

### Homework Assignment (5 min)

**ไม่มี code homework สัปดาห์นี้** (Session 2 จะทำ auth ทั้งหมดใน class)

แต่มี **reading + practice**:

📚 **Required reading** (~1 hr)

- [NestJS Fundamentals — Modules](https://docs.nestjs.com/modules)
- [NestJS Fundamentals — Providers](https://docs.nestjs.com/providers)
- [Prisma Concepts — Data model](https://www.prisma.io/docs/orm/prisma-schema/data-model/models)

🛠️ **Practice** (~1 hr) — แลก Prisma feel

- เปิด Prisma Studio
- เพิ่ม user 2-3 คนผ่าน UI (จำ password เก็บไว้)
- รัน Prisma query manually:
  ```bash
  cd apps/api
  pnpm prisma migrate reset    # ⚠️ ลบ data ทั้งหมด — OK สำหรับ dev
  pnpm prisma migrate dev
  ```
- เห็น migration ทำงานยังไง

📖 **Background reading** (optional, ~30 min)

- bcrypt: https://en.wikipedia.org/wiki/Bcrypt
- JWT: https://jwt.io/introduction

> 📢 **เตือน**: "Session 2 cognitive load สูง — มาเตรียมตัวด้วย reading จะช่วยมาก"

### Q&A (2 min)

---

## 📝 Post-Session Self-Review (instructor)

| Item                                    | Note                |
| --------------------------------------- | ------------------- |
| Docker setup ติดที่ใคร?                 | \_\_\_              |
| `pnpm db:up` ใช้งานทุกคนไหม?            | \_\_\_              |
| Prisma migration ใครยังไม่ผ่าน?         | \_\_\_              |
| NestJS DI mental model ใครยัง confused? | \_\_\_              |
| Block ไหน over-run?                     | \_\_\_              |
| Energy ห้องโดยรวม                       | low / medium / high |
