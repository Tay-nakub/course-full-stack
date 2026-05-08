# Week 2 — Pitfalls & FAQ

**Audience:** instructor — เปิดทิ้งไว้ตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls (เกือบทุก class จะเจอ)

### Pitfall #1: Docker Desktop ไม่รัน → `pnpm db:up` ล้ม

**Symptom**: `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`

**Why happens**: Student ลืมเปิด Docker Desktop หลัง boot

**Quick fix**:
- macOS/Windows: เปิด Docker Desktop → wait until status "Docker Desktop is running"
- Linux: `sudo systemctl start docker`

**Prevention**: pre-class verification — ขอให้รัน `docker run hello-world` 1 วันก่อน Session 1

---

### Pitfall #2: Port 5432 ติดเพราะมี Postgres local

**Symptom**:
```
Error response from daemon: driver failed programming external connectivity
... Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Quick fix**:
1. Stop local Postgres: `brew services stop postgresql` (macOS) / `sudo systemctl stop postgresql` (Linux)
2. หรือเปลี่ยน port mapping ใน compose:
   ```yaml
   ports: ['5433:5432']   # host 5433 → container 5432
   ```
   อัปเดต `DATABASE_URL`: `postgresql://...@localhost:5433/coffee?...`

**Teaching opportunity**: "Container port (5432) ≠ host port. Mapping flexible"

---

### Pitfall #3: Prisma `migrate dev` พังเพราะ DB ยังไม่ขึ้น

**Symptom**: `Can't reach database server at localhost:5432`

**Quick fix**:
```bash
pnpm db:up                    # start Postgres
docker ps | grep coffee       # verify container "Up (healthy)"
cd apps/api
pnpm prisma migrate dev --name init
```

**Common variant**: Postgres up แต่ healthcheck ยังไม่ ready → wait 5-10 sec

---

### Pitfall #4: Prisma generated types ไม่ refresh ใน VS Code

**Symptom**: เห็น schema เปลี่ยนแล้วแต่ TypeScript ยัง error เก่า ("type 'X' does not exist on type 'PrismaClient'")

**Quick fix**:
```bash
cd apps/api
pnpm prisma generate
```
แล้ว VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

**Prevention**: หลัง schema change → ทำ generate ทุกครั้ง

---

### Pitfall #5: `@coffee/shared` import ไม่ทำงานใน NestJS

**Symptom**: `Cannot find module '@coffee/shared' or its corresponding type declarations`

**Causes** (เรียงตามความถี่):
1. ลืมใส่ใน `apps/api/package.json`:
   ```json
   "dependencies": {
     "@coffee/shared": "workspace:*"
   }
   ```
2. ลืม `pnpm install` หลังเพิ่ม
3. NestJS build cache เก่า — restart `pnpm dev`
4. tsconfig path alias ไม่ตั้ง — เช็ค `extends` ของ apps/api มี `tsconfig.base.json`

**Quick verify**:
```bash
ls node_modules/@coffee/shared
# ควรเป็น symlink → ../../packages/shared
```

---

### Pitfall #6: bcrypt build error บน macOS ARM (M-series)

**Symptom**: `node-gyp` build error ระหว่าง `pnpm install`

**Quick fix**:
```bash
# ลบ bcrypt + ติดตั้งใหม่ in apps/api
cd apps/api
pnpm remove bcrypt
pnpm add bcrypt
```

ถ้ายังไม่หาย → ใช้ `bcryptjs` (pure JS):
```bash
pnpm remove bcrypt
pnpm add bcryptjs
pnpm add -D @types/bcryptjs
```

**Trade-off**: bcryptjs ช้ากว่า ~30% (still acceptable สำหรับ dev/learning), no native build

**Update import** ใน `auth.service.ts`:
```ts
import * as bcrypt from 'bcryptjs';   // เปลี่ยนจาก 'bcrypt'
```

---

### Pitfall #7: JWT_SECRET < 32 chars

**Symptom**: ตอน app start (Task 10 onwards) crash:
```
Invalid environment variables:
  - JWT_SECRET: JWT_SECRET must be at least 32 characters
```

**Why intentional**: Zod env validation. Short secret = brute force easy

**Quick fix**: generate 32+ char secret:
```bash
openssl rand -base64 32
# Output: aBcDe...32+ chars
```

แล้ว update `.env`:
```
JWT_SECRET="<paste-here>"
```

**Teaching point**: "ถ้า code crash ที่ env validation → ดี. Better than silent security hole"

---

### Pitfall #8: `pnpm install` หลังเพิ่ม dep ไม่ register ใน Turbo

**Symptom**: Add new dep, restart `pnpm dev` — Turbo บอก "no tasks" หรือ build ไม่ refresh

**Quick fix**:
```bash
# Force re-link workspaces
rm -rf node_modules
pnpm install
```

**Cleaner alternative**:
```bash
pnpm --filter @coffee/api add <package>   # add ใน specific app
```

---

### Pitfall #9: NestJS bootstrap log ไม่ขึ้น "ready" — ค้างที่ "starting"

**Symptom**: Terminal ค้างหลัง `pnpm dev`, ไม่มี "🚀 API ready"

**Common causes**:
1. **Prisma onModuleInit ค้าง** — DB ไม่ตอบ. ตรวจ `pnpm db:up`
2. **Module circular dependency** — Module A import B, B import A. NestJS log error ใน chunk ก่อน
3. **Port 4000 ติด** — `lsof -i :4000` หา process กิน port

**Quick fix**:
```bash
lsof -i :4000
kill -9 <PID>
pnpm dev
```

---

### Pitfall #10: `@UseGuards()` order ผิด — RolesGuard อ่าน `req.user` undefined

**Symptom**: ใช้ `@UseGuards(RolesGuard, JwtAuthGuard)` (สลับ order) → 403 Forbidden ทุกครั้ง

**Why**: `RolesGuard` รันก่อน `JwtAuthGuard` → `req.user` ยังไม่ถูกเซ็ต → check role fail

**Quick fix**: Order matters:
```ts
@UseGuards(JwtAuthGuard, RolesGuard)   // ✅ JWT first → set req.user → Roles read
```

**Teaching point**: "Guard order = sequential. Same as middleware"

---

## ❓ Extended FAQ

### Docker

**Q: `docker compose` vs `docker-compose` ต่างกันไง?**
A: Hyphen version (v1) deprecated. Use `docker compose` (v2, plugin). Same syntax, ทำงานเหมือนกัน

**Q: ทำไม alpine image?**
A: เล็กกว่า standard ~3-4x. Function เหมือนกัน. Production preferred

**Q: ลบ container แต่ data หาย?**
A: ไม่ — data ใน named volume persist. ลบ volume ด้วย `docker volume rm <name>` ถ้าต้อง wipe

**Q: ทำยังไงให้ Postgres start auto ตอน boot?**
A: `restart: unless-stopped` ใน compose (มีแล้ว). Docker Desktop ตั้ง "Start at boot" ใน settings

---

### NestJS

**Q: ใช้ Express หรือ Fastify under the hood?**
A: Default = Express. Fastify เร็วกว่า ~2x แต่ ecosystem เล็กกว่า. Switch ผ่าน `NestFactory.create<NestFastifyApplication>(...)`

**Q: Module file ใหญ่มาก — ควรแยกไหม?**
A: ถ้า > 200 lines = consider split. Pattern: 1 module per domain (auth, menu, orders), 1 file per layer (controller, service)

**Q: Singleton scope vs request scope?**
A: Default = singleton (1 instance / app). Request scope = new instance / request (slow, only ใช้เมื่อจำเป็น)

**Q: `@Injectable()` ต้องใส่ทุก provider?**
A: ใช่ — บอก NestJS ว่า class นี้ DI-aware. Forget = error: "Nest can't resolve dependencies"

**Q: NestJS ดี deploy บน serverless ไหม?**
A: ได้แต่ไม่เหมาะ — startup ช้า (DI container init). Better with long-running container (เรา deploy แบบนี้ Week 6)

---

### Prisma

**Q: `migrate dev` vs `db push` ต่างไง?**
A: `migrate dev` = create migration file + apply. `db push` = ไม่สร้าง migration, แค่ apply schema → DB. ใช้ `db push` ตอน prototype, `migrate dev` ตอน real

**Q: Schema diff ไม่ตรง — manual reset ได้ไหม?**
A: ได้: `pnpm prisma migrate reset` (⚠️ ลบ data หมด — dev only)

**Q: ใช้ Prisma client query ผ่าน NestJS — ต้อง wrap เพิ่มไหม?**
A: ไม่ — `PrismaService extends PrismaClient` → ใช้ตรงๆ: `this.prisma.user.findMany()`

**Q: ทำ raw SQL ได้ไหม?**
A: ได้: `prisma.$queryRaw\`SELECT * FROM ...\`` (template literal — auto-escape). Prefer Prisma query API ก่อน

**Q: Prisma generate ทำที่ไหน?**
A: `node_modules/.prisma/client/`. ห้าม edit. ทุกครั้ง schema change → regenerate

**Q: `cuid()` กับ `uuid()` ใช้ตัวไหน?**
A: Course ใช้ `cuid()` — shorter, URL-safe, sortable-ish. uuid v4 OK ก็ได้ (มาตรฐานกว่า) — choice ระดับทีม

---

### Auth (bcrypt + JWT)

**Q: 10 rounds พอไหม?**
A: ปี 2024+: 10-12 reasonable. มากเกินไป → user wait. Standard อัปเดตตาม Moore's law

**Q: bcrypt vs argon2?**
A: argon2 = newer (2015 winner), better. bcrypt = battle-tested, libraries mature. Course ใช้ bcrypt — pragmatic

**Q: JWT secret rotate ยังไง?**
A: Rotate = invalid ทุก existing token = ทุก user logout. Better: short-lived JWT + refresh token (Tier 1 self-study)

**Q: Token expire — user ถูก kick ทันที?**
A: ใช่ — next request → 401. UX issue: user งง. Real apps: refresh token + auto re-issue

**Q: Multiple devices login simultaneously ได้ไหม?**
A: ได้ — JWT ไม่ผูก device. Each login = new token. ทำ device tracking ต้อง store session table

---

### Guards & Decorators

**Q: Custom guard ต้อง implement อะไร?**
A: Implement `CanActivate` interface, return `boolean | Promise<boolean> | Observable<boolean>`. Throw exception ถ้า fail

**Q: `@UseGuards()` global vs method-level?**
A:
- Method: `@UseGuards()` บน method
- Class: `@UseGuards()` บน controller class
- Global: `app.useGlobalGuards(...)` ใน main.ts

**Q: Pipe vs Guard vs Interceptor?**
A:
- **Guard**: allow/deny (auth/authz)
- **Pipe**: transform/validate input
- **Interceptor**: wrap before/after handler (logging, caching)

**Q: `@CurrentUser()` กับ `@Req() req` ต่างไง?**
A: `@Req()` = full request object (verbose, untyped). `@CurrentUser()` = ดึง user เฉพาะ + typed. แค่ syntactic sugar

---

### Testing

**Q: Mock Prisma ดีกว่าใช้ real DB ใน test?**
A: Unit test → mock (fast, isolated). Integration → real DB (slow, accurate). Course Week 2 = unit tests; integration ใน stretch

**Q: `Test.createTestingModule` มีอะไร?**
A: NestJS test utility — สร้าง mini DI container. Override providers (mock), get instance, call methods

**Q: ทำไมไม่ใช้ Jest?**
A: Vitest = same API, faster, ESM-native. Course เลือก consistency กับ Week 1

---

### Misc

**Q: NestJS log แบบ structured ยังไง?**
A: Use Pino + nestjs-pino. Default `Logger` ของ NestJS = console — OK for dev

**Q: API versioning?**
A: NestJS มี `enableVersioning()` API. Course ไม่ใช้ — single version (v1 implicit)

**Q: GraphQL ทำใน NestJS ได้ไหม?**
A: ได้ — `@nestjs/graphql` package. Course เลือก REST — transferable, simpler

**Q: ใส่ Swagger/OpenAPI?**
A: `@nestjs/swagger` package + decorators. Stretch goal Week 2

---

## 🆘 Emergency Recovery

### Postgres data corrupt — full reset

```bash
pnpm db:down
docker volume rm course-full-stack_postgres_dev_data
pnpm db:up
cd apps/api
pnpm prisma migrate dev    # re-apply migrations
```

### NestJS won't start — clean install

```bash
rm -rf apps/api/node_modules apps/api/dist
rm -rf node_modules
pnpm install
pnpm --filter @coffee/api dev
```

### Prisma client out of sync

```bash
cd apps/api
pnpm prisma generate
```

VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Tests fail randomly

```bash
# Clear vitest cache
rm -rf apps/api/node_modules/.vitest
pnpm --filter @coffee/api test
```

---

## 📊 Common Mistakes Heatmap (อัปเดตหลังสอน)

| Mistake | Frequency | Last Updated |
|---|---|---|
| Docker Desktop ไม่รัน | TBD | — |
| Port 5432 collision | TBD | — |
| Prisma generate ลืมรัน | TBD | — |
| `@coffee/shared` import broken | TBD | — |
| bcrypt native build (ARM) | TBD | — |
| Guard order swap | TBD | — |
| ... | | |
