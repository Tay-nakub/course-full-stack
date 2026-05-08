# Week 2 Session 2 — Auth Implementation

**Week:** 2
**Session:** 2 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 2 Session 1 complete (Postgres + Prisma + NestJS scaffold) + reading homework
**Covers:** Tasks 6-10 of [Week 2 Plan](../../superpowers/plans/2026-05-08-week-2-nestjs-postgres-auth.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:
- ✅ มี `/api/auth/register` ทำงาน — bcrypt hash + JWT issue
- ✅ มี `/api/auth/login` ทำงาน — verify password + return token
- ✅ มี `/api/auth/me` ที่ require Bearer token (JwtAuthGuard)
- ✅ มี `/api/auth/admin-only` ที่ require ADMIN role (RolesGuard)
- ✅ มี `/api/healthz` + env validation
- ✅ AuthService unit tests pass

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify ทุก student Session 1 จบครบ (post screenshot ใน Slack หรือ commit hash)
- [ ] Reading homework — ถาม "ใครยังไม่อ่าน NestJS Modules docs?" (2 min start)
- [ ] เปิด Postman/HTTPie + Auth header configured
- [ ] เปิด jwt.io ไว้ — สำหรับ decode JWT live
- [ ] Backup: ถ้า student Session 1 ไม่จบ → ให้ checkout `week2-session1-reference` branch

---

## 🗓️ Time-Blocked Agenda

| Time | Block | Activity |
|---|---|---|
| 0-10 | **Recap + Homework Review** | Verify Session 1 + reading recap |
| **10-40** | **Block E** | **Auth schemas + register endpoint** (lecture 10 + demo 20) |
| **40-70** | **Block F** | **JWT + login endpoint** (lecture 12 + demo 18) |
| **70-100** | **Block G** | **Guards + custom decorators** (lecture 12 + demo 18) |
| **100-115** | **Block H** | **Healthcheck + env + tests** (live build) |
| 115-120 | Wrap-up | Week 3 preview + Q&A |

---

## 🟢 Recap + Homework Review (0-10 min)

### Recap Quiz (3 min)
- "Prisma `migrate dev` ทำกี่ขั้นตอน?" (3: gen SQL → apply → gen client)
- "PrismaService extends อะไร?" (PrismaClient)
- "`@Global()` ใช้เมื่อไหร่?" (singleton infrastructure)

### Homework Reading Check (5 min)

> "ใครอ่าน NestJS Modules docs จบบ้าง?" (raise hand)

ถ้า ≥ 50% อ่าน → discuss:
- "อะไรที่ surprise คุณใน Modules docs?"
- "Provider pattern ที่อ่าน — เห็น pattern ที่จะใช้ใน auth ไหม?"

ถ้า < 50% → quick crash course (3 min):
- Module = grouping
- Provider = injectable (typically Service)
- Controller = HTTP layer
- Module imports → ดึง Modules อื่นมาใช้
- Module providers → register อะไรที่ inject ได้

### Quick start verify (2 min)
ทุกคนรัน:
```bash
pnpm db:up
pnpm --filter @coffee/api dev
curl http://localhost:4000/api    # Hello World
```

---

## 🔐 Block E: Auth Schemas + Register Endpoint (10-40 min, 30 min)

### 🎯 Block Goals
- "เพิ่ม Zod schemas ใน `packages/shared` → reuse FE"
- "Implement register: bcrypt hash + create user + issue JWT"
- "Wire ZodValidationPipe เพื่อ validate request body"

### 💬 Lecture (~10 min)

**1. Why bcrypt?** (3 min)
- ห้าม store plain password — leak ใน DB = ลูกค้าเสียหาย
- MD5/SHA = fast = brute force ง่าย
- bcrypt = slow on purpose (rounds parameter), salt built-in
- 10 rounds = ~100ms / hash = good for user-facing (not bottleneck), expensive for attacker

โชว์:
```ts
const hash = await bcrypt.hash('password123', 10);
// $2b$10$N9qo8uLOickgx2ZMRZoMye...
//  ↑   ↑                          
//  algo rounds + salt + hash
```

**2. Why JWT?** (3 min)
- Stateless auth — server ไม่ต้อง store session
- Self-contained — payload + signature
- HMAC signed กับ secret → server verify ได้

โชว์ใน jwt.io:
```
Header:    { "alg": "HS256", "typ": "JWT" }
Payload:   { "sub": "user-id", "role": "STAFF", "exp": ... }
Signature: HMAC(header.payload, SECRET)
```

📢 **เน้น**: "JWT **NOT encrypted** — anyone can decode payload. Don't put sensitive data. Just identification + role"

**3. Pipe pattern (NestJS)** (4 min)

```
Request body  ──► Pipe(validation)  ──► Controller method
                       ↓
                  reject if invalid
                  → 400 Bad Request
```

`ZodValidationPipe(Schema)` ทำงานยังไง:
1. Take Schema in constructor
2. ใน `transform()`: schema.parse(body)
3. ถ้า throw → NestJS catch → 400

📢 **Key**: "Pipe = transform/validate before controller. Same Zod schema as FE → consistent validation"

### 🖥️ Live Demo (~20 min)

**1. Auth schemas in shared package** (Task 6 — 5 min)

(พิมพ์ตาม Plan)

**2. Install auth deps** (Task 7.1 — 2 min)

```bash
cd apps/api
pnpm add bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt nestjs-zod
pnpm add -D @types/bcrypt @types/passport-jwt
cd ../..
```

**3. Add `@coffee/shared` to api package.json** (1 min)
```json
"dependencies": {
  ...,
  "@coffee/shared": "workspace:*"
}
```
รัน `pnpm install`

**4. AuthService — register method** (Task 7.2 — 6 min)

(พิมพ์ตาม Plan, อธิบายแต่ละ method)

📢 **Highlight**:
- `findUnique` ดู email มีไหม → throw `ConflictException` (409)
- `bcrypt.hash(plain, 10)` → hashed
- `prisma.user.create` → INSERT
- `issueToken()` → JWT sign + return DTO

**5. AuthController** (Task 7.3 — 3 min)

```ts
@Post('register')
@HttpCode(HttpStatus.CREATED)
async register(@Body(new ZodValidationPipe(RegisterSchema)) input: RegisterInput) {
  return this.authService.register(input);
}
```

📢 **เน้น**: `new ZodValidationPipe(Schema)` แทน class validator — type-safe, schema-driven

**6. AuthModule + register** (Task 7.4-7.5 — 2 min)

แสดง `JwtModule.registerAsync` — async config (ใช้ ConfigService) — pattern สำคัญ

**7. Test register** (1 min)

Postman:
- POST http://localhost:4000/api/auth/register
- Body (JSON): `{ "email": "admin@coffee.com", "password": "password123" }`
- Response: 201 + `accessToken` + `user`

ลอง send invalid:
- `{ "email": "not-email", "password": "short" }`
- Response: 400 + Zod errors (ภาษาไทย!)

📢 **โชว์ใน jwt.io**: paste `accessToken` → decode payload, see `sub`, `email`, `role`, `exp`

Commit:
```bash
git add apps/api/src apps/api/package.json packages/shared pnpm-lock.yaml
git commit -m "feat(api): add /api/auth/register with bcrypt+JWT and Zod validation"
```

### ❓ Common Questions (Block E)

| Q | A |
|---|---|
| 10 rounds พอไหม? | ปี 2024+: 10-12 rounds reasonable. มากเกิน → user wait นาน. มาตรฐาน update ตาม Moore's law |
| bcrypt vs argon2? | argon2 = newer, win password hashing competition. แต่ bcrypt = battle-tested, library mature ใน Node ecosystem |
| JWT secret ต้องยาวแค่ไหน? | HS256 → ≥32 chars random. เราจะ enforce ใน Task 10 ผ่าน Zod env validation |
| Why `@HttpCode(201)`? | NestJS default POST = 201 จริงๆ (explicit เพื่อชัดเจนใน code review) |

---

## 🔑 Block F: JWT Login Endpoint (40-70 min, 30 min)

### 🎯 Block Goals
- "Implement login: verify password + issue JWT"
- "เข้าใจ user enumeration attack + ป้องกัน"
- "Wire login endpoint + test"

### 💬 Lecture (~12 min)

**1. Login flow** (3 min)

```
Client → POST /auth/login { email, password }
            ↓
       findUnique(email)
            ↓
   if !user → 401 Unauthorized (DON'T say "user not found")
            ↓
       bcrypt.compare(plain, hashed)
            ↓
   if !match → 401 Unauthorized (same message)
            ↓
       issueToken(user) → 200 OK
```

**2. Why same error message?** (3 min)
- ถ้าตอบ "user not found" vs "wrong password" → attacker enumerate emails
- ใส่ message เดียวกัน → leak น้อยลง
- Trade-off: UX แย่ลง (user งง)

📢 **Real-world note**: "Big systems use rate limiting + CAPTCHA หลังหลายครั้ง — เก็บไว้ Tier 2 self-study"

**3. JWT validation flow (server-side)** (4 min)

```
Client → GET /auth/me (Authorization: Bearer eyJ...)
            ↓
       JwtAuthGuard
            ↓
       Extract Bearer token
            ↓
       jwt.verify(token, SECRET)    ← ถ้า expire/tampered → 401
            ↓
       Decode payload → req.user = {...}
            ↓
       Controller method runs
            ↓
       @CurrentUser() user → from req.user
```

**4. Why httpOnly cookie vs Authorization header?** (2 min)
- Header: client (JS) ต้องเก็บ token + ส่ง manually → vulnerable to XSS theft
- httpOnly cookie: browser ส่งอัตโนมัติ + JS อ่านไม่ได้ → XSS-safe, CSRF risk increase
- Course นี้ใช้ **Authorization header** (simple, common) — Week 3+ FE เก็บใน httpOnly cookie

### 🖥️ Live Demo (~18 min)

**1. Login method ใน AuthService** (Task 8.1 — 5 min)

(พิมพ์ตาม Plan)

📢 **Highlight**:
- `bcrypt.compare(plain, hashed)` → boolean
- ทั้ง 2 fail case → same `UnauthorizedException` message

**2. Login endpoint ใน Controller** (Task 8.2 — 3 min)

(พิมพ์ตาม Plan)

**3. Test login** (5 min)

Postman:
- Login: POST `/api/auth/login` ด้วย email + password ที่ register แล้ว → 200 + accessToken
- Try wrong password → 401 + "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- Try non-existent email → 401 + same message

📢 **Demo subtle attack**:
> "ถ้า server ตอบ 'อีเมลไม่พบ' vs 'รหัสผ่านผิด' — attacker iterate emails จนเจอ valid → enumerate. เราป้องกันด้วย same message"

**4. Time check** (5 min) — ถ้าทันให้ student ลอง postman ของตัวเอง

Commit:
```bash
git add apps/api/src/auth
git commit -m "feat(api): add /api/auth/login endpoint"
```

### ❓ Common Questions (Block F)

| Q | A |
|---|---|
| ลืม password reset ทำยังไง? | Tier 1 self-study — flow: email reset link with short-lived token, click → reset form |
| Refresh token? | คอร์สนี้ไม่ทำ. JWT 7-day expiry, force re-login. Refresh token = Tier 1 |
| Logout server-side? | JWT stateless = no logout. ใช้ short expiry + rotate. ถ้าต้อง revoke → blacklist (Redis) |
| Multiple device login? | OK by default — JWT ไม่ผูก device. Restrict ต้องเก็บ session table |

---

## 🛡️ Block G: Guards + Custom Decorators (70-100 min, 30 min)

### 🎯 Block Goals
- "Implement JwtAuthGuard ที่ verify Bearer token"
- "Implement RolesGuard ที่ check role"
- "สร้าง `@Roles()` + `@CurrentUser()` decorators"

### 💬 Lecture (~12 min)

**1. Guard concept (NestJS)** (4 min)

```
Request ──► Middleware ──► Guard ──► Pipe ──► Controller
                              ↓
                           canActivate()
                              ↓
                       true → proceed
                       false → 403/401
```

📢 **Key**: "Guard = decision: allow or deny. **ก่อน** Controller. **หลัง** Middleware"

**2. JWT Strategy + Passport** (3 min)

```
JwtStrategy (passport-jwt)
  ↓
extractJwt: from Bearer header
  ↓
jwt.verify with SECRET
  ↓
validate(payload) → return { id, email, role }
  ↓
attached to req.user
```

`JwtAuthGuard extends AuthGuard('jwt')` = ใช้ JwtStrategy

**3. Reflector pattern** (5 min)

`@Roles('ADMIN')` = metadata on method
```
@Roles('ADMIN')        ← decorator → SetMetadata('roles', ['ADMIN'])
adminOnly() {}         
```

`RolesGuard.canActivate()`:
```ts
const roles = reflector.get('roles', context.getHandler());
// → ['ADMIN'] หรือ undefined
```

📢 **Key**: "Reflector = อ่าน metadata ที่ decorator ใส่ไว้. Pattern แบบนี้ทำให้ guard reusable + declarative"

### 🖥️ Live Demo (~18 min)

**1. JwtStrategy** (Task 9.1 — 4 min)

(พิมพ์ตาม Plan, อธิบาย `validate()` method)

**2. JwtAuthGuard + Roles decorator** (Task 9.2-9.3 — 3 min)

(พิมพ์ตาม Plan — สั้น, ตรงไปตรงมา)

**3. RolesGuard** (Task 9.4 — 5 min)

(พิมพ์ตาม Plan)

📢 **อธิบาย**:
- `getAllAndOverride` = method-level decorator override class-level
- ถ้าไม่มี `@Roles()` → guard pass (open)
- ถ้ามี → check `user.role` ใน list

**4. CurrentUser decorator** (Task 9.5 — 2 min)

(พิมพ์ตาม Plan)

📢 **เน้น**: "Custom param decorator — extract data จาก request object. Pattern reusable"

**5. Wire + test** (Task 9.6-9.8 — 4 min)

เพิ่ม `JwtStrategy` ใน AuthModule providers

เพิ่ม endpoints:
```ts
@Get('me')
@UseGuards(JwtAuthGuard)
async me(@CurrentUser() user: AuthUser) {
  return user;
}

@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async adminOnly() {
  return { message: 'welcome admin' };
}
```

Test ใน Postman:
1. Login → copy accessToken
2. Set Authorization: `Bearer <token>` ใน collection variable
3. GET `/api/auth/me` → 200 + user
4. GET `/api/auth/admin-only` → 403 (เพราะ STAFF)

📢 **Promote user เป็น ADMIN** (5 sec) — ผ่าน DBeaver/Studio:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@coffee.com';
```
Login ใหม่ → token ใหม่ → admin-only → 200

Commit:
```bash
git add apps/api/src/auth
git commit -m "feat(api): add JWT strategy, JwtAuthGuard, RolesGuard, decorators"
```

### ❓ Common Questions (Block G)

| Q | A |
|---|---|
| `@UseGuards(GuardA, GuardB)` order matter? | ใช่ — รันตามลำดับ. JwtAuthGuard ต้องมาก่อน RolesGuard (RolesGuard อ่าน req.user) |
| Customize 401 response message? | สร้าง custom AuthGuard, override `handleRequest()` |
| ทำไมไม่ใช่ `@Public()` decorator + global JwtAuthGuard? | ก็ดี — flip default. Course เลือก opt-in ที่ controller method |
| `Reflector.getAllAndOverride` vs `get`? | `getAllAndOverride` = method overrides class. `get` = แค่ method-level |

---

## 🩺 Block H: Healthcheck + Env + Tests (100-115 min, 15 min)

### 🎯 Block Goals
- "Validate env vars ตอน app start (fail-fast)"
- "Add `/api/healthz` endpoint"
- "Write unit tests for AuthService"

### 🖥️ Live Build (15 min — combined)

**1. Env validation** (Task 10.1-10.2 — 4 min)

(พิมพ์ตาม Plan)

📢 **เน้น**: "JWT_SECRET ต้อง ≥32 chars — Zod enforce ตอน app start. ถ้า env ไม่ถูก → app crash with clear message (fail-fast)"

ทดสอบ: ลบ JWT_SECRET ออกจาก `.env` → restart app → app crash with error message

**2. Healthcheck** (Task 10.3 — 3 min)

(พิมพ์ตาม Plan)

ทดสอบ:
```bash
curl http://localhost:4000/api/healthz
# {"status":"ok","database":"connected","timestamp":"..."}
```

**3. Vitest setup + AuthService tests** (Task 10.4-10.7 — 6 min)

ลบ Jest config + install Vitest + create config

ใส่ tests file (จาก Plan):
- 2 tests for register (email exists / new user)
- 3 tests for login (no user / wrong pw / valid)

รัน:
```bash
pnpm --filter @coffee/api test
# 5 passing
```

**4. Final commit** (2 min)

```bash
git add apps/api
git commit -m "feat(api): add env validation, healthcheck, AuthService tests"
```

> **🎓 Teaching point**: ใน live class โอกาสไม่ทันเขียน test ครบ → ทำให้ดู 1-2 tests แล้วบอก: "homework — เพิ่มเอง 3 ตัวที่เหลือ ตาม plan"

### ❓ Common Questions (Block H)

| Q | A |
|---|---|
| ทำไม Vitest ใน api ต้อง alias `@coffee/shared`? | NestJS ใช้ tsc compile, Vitest ใช้ Vite — ต้องช่วย Vite ให้รู้ workspace path |
| `Test.createTestingModule` ทำอะไร? | สร้าง NestJS DI container test — mock providers + get instance |
| Mock Prisma vs in-memory DB? | Mock = fast, simple. In-memory (e.g., pg-mem) = real SQL. Course เลือก mock — sufficient |

---

## 🏁 Wrap-up + Week 3 Preview (115-120 min, 5 min)

### Recap (2 min)
ถาม:
- "JWT contains อะไรบ้าง?"
- "RolesGuard อ่าน metadata จากไหน?"
- "ทำไม env validation ที่ app start?"

### Week 3 Preview (3 min)

**Goal**: เชื่อม FE + BE — first end-to-end CRUD slice (Menu)

จะใช้:
- ✅ NestJS + Prisma + Auth (Week 2)
- 🆕 NestJS Menu module (Category + Product CRUD)
- 🆕 TanStack Query (FE data fetching)
- 🆕 Login form ใน FE → store token in httpOnly cookie
- 🆕 Admin Menu CRUD UI

**Pre-Week 3 homework** (light):
- เพิ่ม unit tests AuthService ให้ครบ 5 tests (ตาม Plan)
- Practice: register 3 users via Postman, login each, test `/auth/me`
- ถ้ามีเวลา — read [Prisma queries](https://www.prisma.io/docs/orm/prisma-client/queries/crud)

### Final Q&A (1 min)
รับคำถามเปิด

---

## 📝 Post-Session Self-Review (instructor)

| Item | Note |
|---|---|
| Auth flow ติดที่ใคร? (register / login / guards) | ___ |
| JWT mental model ใครยัง confused? | ___ |
| RolesGuard + Reflector ใครยังไม่เข้าใจ? | ___ |
| Tests ใครยังไม่ได้ทำ? | ___ |
| Block ไหน over-run? | ___ |
| Pre-Week 3 readiness — มี student คนไหน need 1-on-1? | ___ |

---

## 🔗 Connection to Week 3

Week 3 จะใช้:
- ✅ AuthService + JwtAuthGuard (Week 2) — protect Menu CRUD endpoints
- ✅ PrismaService (Week 2) — query Product/Category
- ✅ `@coffee/shared` (Week 2) — เพิ่ม Product/Category schemas
- 🆕 TanStack Query — FE data fetching pattern
- 🆕 Cookie-based token storage — security upgrade
- 🆕 Form UI ที่ใช้ shared schema (Week 1 + Week 2 patterns combined)

> **Mental model**: Week 1 = "FE tools". Week 2 = "BE tools". **Week 3 = make them talk** — first vertical slice ที่ flow data ผ่านทั้ง stack
