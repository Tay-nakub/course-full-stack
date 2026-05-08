# Week 2 — Slides Outline

**Audience:** instructor — สำหรับ build slides

**Total slides target:** ~22 slides สำหรับ 2 sessions

---

## 🎬 Session 1 Slides (11 slides) — Backend Setup & Database

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│                                      │
│       Week 2 · Session 1             │
│       Backend Setup & Database       │
│                                      │
│   NestJS · Postgres · Prisma · Docker│
└──────────────────────────────────────┘
```

### Slide 1.02 — Today's Goal

```
จบ session นี้ คุณจะมี:

✓ packages/shared (Zod schemas + types)
✓ apps/api (NestJS) รัน port 4000
✓ Postgres ใน Docker Compose
✓ Prisma schema + first migration
✓ PrismaService inject ได้

🟡 Auth implementation → Session 2
```

### Slide 1.03 — Cognitive Load Warning

```
⚠️  Week 2 = 3 things new in your head:

   📦 Docker
   🏗️  NestJS
   🛢️  Prisma

Strategy:
  → Session 1: get things running
  → Session 2: domain logic (auth)
  → Session deep concepts: practice 2-3 times
```

### Slide 1.04 — Monorepo Expansion

```
Week 1:                    Week 2:
─────────                  ─────────
apps/                      apps/
└── web/                   ├── web/
                           └── api/         ← new
                           packages/
                           └── shared/      ← new

  packages/shared = neutral ground
  ↓ depended by ↓
  apps/web    apps/api
```

### Slide 1.05 — NestJS Mental Model

```
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
│  (NestJS wires it for you)         │
└─────────────────────────────────────┘
```

### Slide 1.06 — NestJS vs Express

```
Express                  NestJS
──────────────────       ─────────────────────
app.get('/x', fn)        @Controller('x')
                         @Get() method() {}

manual middleware        @UseGuards()
chains                   @UsePipes()
                         decorators

assemble structure       Built-in module
yourself                 structure (opinionated)

minimal                  TypeScript-first
                         + DI

  → ✓ Course choice: NestJS
  → matches our system design background
```

### Slide 1.07 — Why Docker for DB

```
Without Docker:                With Docker:
──────────────                 ──────────────
Install Postgres locally       docker compose up
  ↓                              ↓
Version conflicts              Isolated container
Port collisions                Same on every machine
Hard to uninstall              `docker compose down`

  → Reproducibility wins
```

### Slide 1.08 — docker-compose Anatomy

```
services:
  postgres:                          ← service name
    image: postgres:16-alpine        ← what to run
    environment: { ... }             ← env vars
    volumes: ['data:/var/lib/...']   ← persistent
    ports: ['5432:5432']             ← host:container
    healthcheck: { ... }             ← liveness probe

volumes:
  data:                              ← named volume
```

### Slide 1.09 — Prisma Schema

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

> Speaker note: "Schema-first. Migration + Client = side effect"

### Slide 1.10 — Migration Workflow

```
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

> Speaker note: "1 command = 3 things. dev only — prod ใช้ migrate deploy"

### Slide 1.11 — Wrap-up + Homework

```
📝 HOMEWORK (~2 hrs)

Required reading:
□ NestJS Modules docs
□ NestJS Providers docs
□ Prisma Data Model docs

Practice:
□ Add 2-3 users via Prisma Studio
□ Run prisma migrate reset (see what happens)
□ Read bcrypt + JWT primer

─── 🎯 RECAP ───────────────────
1. ทำไม packages/shared แยก?
2. Docker volume ทำหน้าที่อะไร?
3. migrate dev vs deploy?
4. @Global() module ใช้เมื่อไหร่?
```

---

## 🎬 Session 2 Slides (11 slides) — Auth Implementation

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│                                      │
│       Week 2 · Session 2             │
│       Auth Implementation            │
│                                      │
│  bcrypt · JWT · Guards · Decorators │
└──────────────────────────────────────┘
```

### Slide 2.02 — Today's Goal

```
จบ session นี้ คุณจะมี:

✓ POST /api/auth/register (bcrypt + JWT)
✓ POST /api/auth/login
✓ GET  /api/auth/me (JwtAuthGuard)
✓ GET  /api/auth/admin-only (RolesGuard)
✓ GET  /api/healthz
✓ AuthService 5 unit tests pass

→ Ready for Week 3 (FE+BE first slice)
```

### Slide 2.03 — Why bcrypt (not MD5/SHA)

```
Plaintext password:    "password123"

❌ MD5/SHA1:                          
  fast = brute force easy             
  no salt = same input → same hash    
                                      
✅ bcrypt:                            
  slow on purpose (rounds parameter)   
  built-in salt                        
  auto-incremental cost                

  $2b$10$N9qo8uLOickgx2ZMRZoMye...
   ↑   ↑                          
   alg rounds + salt + hash
```

### Slide 2.04 — JWT Structure

```
header.payload.signature

┌────── HEADER ──────┐
│ { "alg": "HS256",  │
│   "typ": "JWT" }   │
└────────────────────┘

┌────── PAYLOAD ─────┐
│ { "sub": "user-id",│  ← user identification
│   "role": "STAFF", │  ← authorization claim
│   "exp": 1234... } │  ← expiry
└────────────────────┘

┌──── SIGNATURE ─────┐
│ HMAC(header.payload│
│      , SECRET)     │  ← server verifies
└────────────────────┘

⚠️ Payload NOT encrypted — anyone can decode!
   Don't put sensitive data in there.
```

### Slide 2.05 — Login Flow

```
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

> Speaker note: "Same message ทั้ง 2 cases → ป้องกัน enumeration"

### Slide 2.06 — Auth Header vs Cookie

```
┌──── Authorization: Bearer ─────┐
│  + simple, REST-friendly        │
│  + works with API clients       │
│  - JS can read = XSS steal risk │
└─────────────────────────────────┘

┌──── httpOnly Cookie ───────────┐
│  + browser auto-sends            │
│  + JS can't read (XSS-safe)      │
│  - CSRF risk (need countermeasure│
└─────────────────────────────────┘

  Course Week 2: Authorization header (simple)
  Course Week 3+: switch FE → httpOnly cookie
```

### Slide 2.07 — NestJS Request Pipeline

```
Request
   │
   ▼
Middleware    ← global, runtime concerns
   │
   ▼
Guard         ← decision: allow/deny
   │
   ▼
Pipe          ← validation + transformation
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

> Speaker note: "Guards เป็น first-class — auth/authz ที่ structured"

### Slide 2.08 — Reflector Pattern

```
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

> Speaker note: "Decorator → metadata → Guard reads → declarative auth"

### Slide 2.09 — Custom Decorators

```
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

### Slide 2.10 — Env Validation (fail-fast)

```
Without validation:
─────────────────────
app starts → JWT_SECRET undefined
          → JWT signs with undefined
          → tokens accepted by anyone
          → 💥 silent security hole

With Zod validation:
─────────────────────
app starts → validateEnv()
          → JWT_SECRET missing → THROW
          → app crashes with clear message
          → ✓ caught early
```

### Slide 2.11 — Wrap-up + Week 3 Preview

```
✅ Week 2 Complete

Week 3 — First End-to-End Slice
──────────────────────────────────
🆕 NestJS Menu module (CRUD)
🆕 TanStack Query (FE fetching)
🆕 Login form (FE) → cookie storage
🆕 Admin Menu CRUD UI

Pre-Week 3 (light homework):
□ Finish AuthService 5 unit tests
□ Practice register/login via Postman
□ Read Prisma queries docs

  Mental model:
  Week 1 = FE tools
  Week 2 = BE tools
  Week 3 = make them TALK
```

---

## 🛠️ Build Notes (instructor)

### Reuse from Week 1
- ✅ Same template / theme
- ✅ Same color scheme (dark + coffee accent)
- ✅ Same monospace font for code

### New visual challenges in Week 2
- **Docker layered architecture** — diagram of containers + volumes
- **JWT decode visual** — use jwt.io screenshot in slide
- **Request pipeline** — Middleware → Guard → Pipe → Controller flow

### Live JWT Decode Demo
- ระหว่าง Block E (after issuing token) → paste real token to https://jwt.io
- Show payload decoded — student เห็นจริงๆ ว่า "claim" คืออะไร
- ⚠️ ใช้ token จาก demo user, **ไม่ใช่** account จริง (กัน leak)
