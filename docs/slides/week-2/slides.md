---
theme: seriph
title: 'Coffee Shop Course — Week 2'
info: |
  ## Week 2 — Backend Setup, Database, Auth
  Coffee Shop Full-Stack Course (6 weeks)
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: fade
mdc: true
fonts:
  sans: 'Inter, ui-sans-serif, system-ui'
  mono: 'JetBrains Mono, Fira Code, ui-monospace, monospace'
defaults:
  layout: default
---

# ☕ Coffee Shop Course

## Week 2 · Session 1
### Backend Setup & Database

<div class="muted mt-8 text-sm">
NestJS · Postgres · Prisma · Docker
</div>

<!--
ทักทาย — ถามว่า homework Week 1 (PR week1-homework) เสร็จไหม.
วันนี้เปลี่ยน gear: FE → BE. เครื่องมือใหม่ 3 ชิ้น.
-->

---

# Today's Goal

<div class="mt-8 text-xl">

จบ session นี้ คุณจะมี:

<v-clicks>

- ✅ <code>packages/shared</code> (Zod schemas + types)
- ✅ <code>apps/api</code> (NestJS) รัน port <span class="coffee">4000</span>
- ✅ Postgres ใน Docker Compose
- ✅ Prisma schema + first migration
- ✅ <code>PrismaService</code> inject ได้
- 🟡 Auth implementation <span class="muted">→ Session 2</span>

</v-clicks>

</div>

---
layout: center
---

# ⚠️ Cognitive Load Warning

<div class="text-lg muted mb-4">Week 2 = 3 things ใหม่ในหัวพร้อมกัน</div>

```text
   📦 Docker
   🏗️  NestJS
   🛢️  Prisma
```

<div class="mt-8">

### Strategy

<v-clicks>

- Session 1 — get things <span class="coffee">running</span>
- Session 2 — domain logic (auth)
- Deep concepts — practice 2-3 times before they stick

</v-clicks>

</div>

<!--
อย่ารีบเข้าใจทุกอย่าง 100% — focus ที่ flow ก่อน. ละเอียดเดี๋ยวมาเอง.
-->

---

# Monorepo Expansion

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Week 1

```text
apps/
└── web/
```

</div>

<div>

### Week 2 <span class="coffee">←</span>

```text
apps/
├── web/
└── api/         ← new
packages/
└── shared/      ← new
```

</div>

</div>

```text
       packages/shared = neutral ground
                  ↓ depended by ↓
            apps/web    apps/api
```

<div class="mt-4 muted">Schema เดียว. Type เดียว. Sync ทั้ง stack.</div>

---
layout: center
---

# NestJS Mental Model

```text
┌──── App Module ─────────────────────┐
│                                     │
│  ┌── Auth Module ──┐                │
│  │ Controller      │ ← HTTP layer   │
│  │ Service         │ ← business     │
│  │ Repository      │ ← data         │
│  └─────────────────┘                │
│                                     │
│  ┌── Menu Module ──┐                │
│  │ ...             │                │
│  └─────────────────┘                │
│                                     │
│  Dependency Injection Container     │
│  (NestJS wires it for you)          │
└─────────────────────────────────────┘
```

<div class="mt-4 muted">Module = unit of organization. DI = how parts find each other.</div>

---

# NestJS vs Express

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Express

```ts
app.get('/x', fn)
```

- Manual middleware chains
- Assemble structure yourself
- Minimal — DIY

</div>

<div>

### NestJS <span class="coffee">←</span>

```ts
@Controller('x')
@Get() method() {}
```

- `@UseGuards()` / `@UsePipes()` decorators
- Built-in module structure
- TypeScript-first + DI

</div>

</div>

<div class="mt-8 text-center text-xl">
🎯 Course choice: <span class="coffee">NestJS</span> — matches our system design background
</div>

---

# Why Docker for DB

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Without Docker

- Install Postgres locally
- Version conflicts
- Port collisions
- Hard to uninstall

</div>

<div>

### With Docker <span class="coffee">←</span>

- `docker compose up`
- Isolated container
- Same on every machine
- `docker compose down` = gone

</div>

</div>

<div class="mt-10 text-center text-xl coffee">
Reproducibility wins
</div>

<!--
ถามคนฟัง: "เคย install Postgres แล้ว uninstall ไม่ออกไหม?" — ทุกคนยกมือ.
-->

---

# docker-compose Anatomy

```yaml
services:
  postgres:                          # service name
    image: postgres:16-alpine        # what to run
    environment: { ... }             # env vars
    volumes: ['data:/var/lib/...']   # persistent
    ports: ['5432:5432']             # host:container
    healthcheck: { ... }             # liveness probe

volumes:
  data:                              # named volume
```

<div class="mt-6 muted">Volume = data ไม่หายตอน <code>down</code>. Healthcheck = บอกว่าพร้อมรับ connection.</div>

---

# Prisma Schema

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

<div class="mt-6 text-center text-xl coffee">
Schema-first. Migration + Client = side effect
</div>

<!--
@@map = Prisma model name (PascalCase) → SQL table name (snake_case).
-->

---
layout: center
---

# Migration Workflow

```text
schema.prisma
      │
      ▼
prisma migrate dev
      │
      ├──► gen SQL      → migrations/timestamp_init/
      │
      ├──► apply         → DB updated
      │
      └──► gen client    → @prisma/client (typed)
```

<div class="mt-8 muted">1 command = 3 things. <span class="coffee">dev only</span> — prod ใช้ <code>migrate deploy</code></div>

---

# 📝 Homework + Recap

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Homework <span class="muted">(~2 hrs)</span>

Required reading:

- [ ] NestJS Modules docs
- [ ] NestJS Providers docs
- [ ] Prisma Data Model docs

Practice:

- [ ] Add 2-3 users via Prisma Studio
- [ ] Run `prisma migrate reset`
- [ ] Read bcrypt + JWT primer

</div>

<div>

### 🎯 Recap quiz

<v-clicks>

1. ทำไม `packages/shared` แยก?
2. Docker volume ทำหน้าที่อะไร?
3. `migrate dev` vs `migrate deploy`?
4. `@Global()` module ใช้เมื่อไหร่?

</v-clicks>

</div>

</div>

---
layout: cover
---

# ☕ Session 2

## Week 2 · Session 2
### Auth Implementation

<div class="muted mt-8 text-sm">bcrypt · JWT · Guards · Decorators</div>

---

# Today's Goal

<div class="mt-8 text-xl">

จบ session นี้ คุณจะมี:

<v-clicks>

- ✅ `POST /api/auth/register` <span class="muted">(bcrypt + JWT)</span>
- ✅ `POST /api/auth/login`
- ✅ `GET  /api/auth/me` <span class="muted">(JwtAuthGuard)</span>
- ✅ `GET  /api/auth/admin-only` <span class="muted">(RolesGuard)</span>
- ✅ `GET  /api/healthz`
- ✅ `AuthService` <span class="coffee">5 unit tests pass</span>

</v-clicks>

</div>

<div class="mt-6 muted text-sm">→ Ready for Week 3 (FE+BE first slice)</div>

---

# Why bcrypt (not MD5/SHA)

<div class="text-lg muted mb-4">Plaintext: <code>"password123"</code></div>

<div class="grid grid-cols-2 gap-6">

<div>

### ❌ MD5 / SHA1

- **Fast** = brute force easy
- No salt = same input → same hash
- Designed for speed (wrong tool)

</div>

<div>

### ✅ bcrypt <span class="coffee">←</span>

- **Slow on purpose** (rounds parameter)
- Built-in salt
- Auto-incremental cost

</div>

</div>

```text
$2b$10$N9qo8uLOickgx2ZMRZoMye...
 ↑   ↑
 alg rounds + salt + hash
```

---

# JWT Structure

```text
header.payload.signature
```

<div class="grid grid-cols-3 gap-3 mt-4 text-sm">

<div>

```text
┌── HEADER ──┐
│ {          │
│ "alg":     │
│  "HS256",  │
│ "typ":"JWT"│
│ }          │
└────────────┘
```

</div>

<div>

```text
┌── PAYLOAD ─┐
│ {          │
│ "sub": id, │
│ "role":    │
│  "STAFF",  │
│ "exp": ... │
│ }          │
└────────────┘
```

</div>

<div>

```text
┌─ SIGNATURE ─┐
│ HMAC(       │
│  header.    │
│  payload,   │
│  SECRET     │
│ )           │
└─────────────┘
```

</div>

</div>

<div class="mt-6 coffee text-center">
⚠️ Payload <span class="font-bold">NOT</span> encrypted — anyone can decode!
</div>

<!--
Live demo — paste token ที่ jwt.io. ใช้ token จาก demo user เท่านั้น.
-->

---
layout: center
---

# Login Flow

```text
Client → POST /auth/login {email, pw}
            │
            ▼
       findUnique(email)
            │
            ├── ❌ no user → 401 (same msg)
            │
            ▼
       bcrypt.compare(plain, hash)
            │
            ├── ❌ wrong → 401 (same msg)
            │
            ▼
       issueToken(user)
            │
            ▼
        200 + accessToken
```

<div class="mt-6 muted text-center">Same message ทั้ง 2 cases → ป้องกัน <span class="coffee">enumeration</span></div>

---

# Auth Header vs Cookie

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### `Authorization: Bearer`

- ✅ Simple, REST-friendly
- ✅ Works with API clients
- ❌ JS can read = XSS steal risk

</div>

<div>

### `httpOnly` Cookie

- ✅ Browser auto-sends
- ✅ JS can't read (XSS-safe)
- ⚠️ CSRF risk → need countermeasure

</div>

</div>

<div class="mt-10 text-center">

<div class="text-lg">Course Week 2: <span class="coffee">Authorization header</span> (simple)</div>
<div class="text-lg mt-1">Course Week 3+: switch FE → <span class="coffee">httpOnly cookie</span></div>

</div>

---
layout: center
---

# NestJS Request Pipeline

```text
       Request
          │
          ▼
     Middleware    ← global, runtime concerns
          │
          ▼
       Guard       ← decision: allow / deny
          │
          ▼
        Pipe       ← validation + transformation
          │
          ▼
     Controller method
          │
          ▼
   Interceptor (after)
          │
          ▼
      Response
```

<div class="mt-4 muted">Guards = first-class. Auth/authz เป็น <span class="coffee">structured</span></div>

---

# Reflector Pattern

```text
@Roles('ADMIN')
adminOnly() { ... }
   │
   │  metadata stored on method:
   │  { 'roles': ['ADMIN'] }
   │
   ▼
RolesGuard.canActivate(ctx)
   │
   ▼
reflector.getAllAndOverride(
  'roles',
  [ctx.getHandler(), ctx.getClass()]
)
   │
   ▼
['ADMIN'] → check req.user.role
```

<div class="mt-4 muted">Decorator → metadata → Guard reads → <span class="coffee">declarative auth</span></div>

---

# Custom Decorators

```ts
// 1. Roles decorator
export const Roles = (...roles: Role[]) =>
  SetMetadata('roles', roles);

// 2. CurrentUser decorator
export const CurrentUser = createParamDecorator(
  (_, ctx) => ctx.switchToHttp().getRequest().user
);

// Usage:
@Get('me')
@UseGuards(JwtAuthGuard)
me(@CurrentUser() user: AuthUser) {
  return user;
}
```

<div class="mt-4 muted">Decorator คือ syntactic sugar — เบื้องหลังคือ metadata + reflector</div>

---

# Env Validation (fail-fast)

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ Without validation

```text
app starts
  → JWT_SECRET undefined
  → JWT signs with undefined
  → tokens accepted by anyone
  → 💥 silent security hole
```

</div>

<div>

### ✅ With Zod validation

```text
app starts
  → validateEnv()
  → JWT_SECRET missing → THROW
  → app crashes early
  → ✓ caught with clear msg
```

</div>

</div>

<div class="mt-8 text-center text-xl coffee">
Crash early > silent compromise
</div>

---

# 🎉 Week 2 Complete — Week 3 Preview

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Week 3 — First End-to-End Slice

<v-clicks>

- 🆕 NestJS Menu module (CRUD)
- 🆕 TanStack Query (FE fetching)
- 🆕 Login form (FE) → cookie storage
- 🆕 Admin Menu CRUD UI

</v-clicks>

</div>

<div>

### Pre-Week 3 (light homework)

- [ ] Finish `AuthService` 5 unit tests
- [ ] Practice register/login via Postman
- [ ] Read Prisma queries docs

<div class="mt-6 muted text-sm">

Mental model:
- Week 1 = FE tools
- Week 2 = BE tools
- Week 3 = make them <span class="coffee">TALK</span>

</div>

</div>

</div>

<style>
.coffee { color: #f5a623; font-weight: 600; }
.muted { color: #a6adc8; }
</style>
