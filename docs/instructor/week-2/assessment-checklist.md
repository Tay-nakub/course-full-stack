# Week 2 — Assessment Checklist

**Audience:** instructor — diagnostic tool, not exam

---

## 🎯 Pass Criteria

Student "พร้อม" เข้า Week 3 ถ้า:

- ✅ Verbal Q ≥ 7/10
- ✅ Live build ใน Session 2 (Block G + H) ทำงานครบ
- ✅ Postman test ทุก endpoint ผ่าน

ถ้า ≤ 6/10 หรือ live build ไม่จบ → 1-on-1 catch-up ก่อน Week 3 (Week 3 build บน Auth ของ Week 2 — ต้องแน่น)

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Concept Tier — ถามตอน Recap หรือ between blocks

#### Q1 — Monorepo expansion

> "ทำไมเราใส่ Zod schemas ใน `packages/shared` ไม่ใส่ตรงๆ ใน `apps/api`?"

**Acceptable**: เพื่อให้ทั้ง FE และ BE import schema เดียวกัน, ไม่ให้ web depend on api (circular boundary)

#### Q2 — NestJS layers

> "Controller, Service, Module — แต่ละตัวรับผิดชอบอะไร?"

**Acceptable**: Controller = HTTP layer (routing). Service = business logic. Module = grouping + DI registration

#### Q3 — DI mental model

> "`@Injectable()` ทำอะไร? ทำไมต้องใส่?"

**Acceptable**: บอก NestJS ว่า class นี้ DI-aware → resolve dependencies + inject เข้า constructor ได้

#### Q4 — Docker volumes

> "ถ้าผมรัน `docker compose down` แล้ว `up` ใหม่ — data ใน Postgres หายไหม? ทำไม?"

**Acceptable**: ไม่หาย — ใช้ named volume (`postgres_dev_data`). ลบ volume ด้วย `docker volume rm` ถึงจะหาย

#### Q5 — Prisma migration

> "`migrate dev` กับ `migrate deploy` ใช้ตอนไหน?"

**Acceptable**: `dev` = development (สร้าง migration จาก schema diff + apply, อาจ reset ถ้าจำเป็น). `deploy` = production (apply pending migrations only, never reset)

#### Q6 — bcrypt

> "ทำไมไม่ใช้ MD5 หรือ SHA1 สำหรับ password?"

**Acceptable**: MD5/SHA = fast = brute force ง่าย, ไม่มี salt built-in. bcrypt = slow on purpose (rounds), salt automatic

#### Q7 — JWT structure

> "JWT มี 3 parts — อะไรบ้าง? Payload เข้ารหัสไหม?"

**Acceptable**: header.payload.signature. Payload **ไม่เข้ารหัส** (base64 encoded แค่นั้น) — anyone decode ได้. ห้ามใส่ secret data

#### Q8 — Login flow security

> "ทำไม login fail (no user / wrong password) ตอบ message เดียวกัน?"

**Acceptable**: ป้องกัน user enumeration — attacker iterate emails หา valid ไม่ได้

#### Q9 — Guards order

> "ถ้าใช้ `@UseGuards(RolesGuard, JwtAuthGuard)` (สลับ order) — เกิดอะไรขึ้น? ทำไม?"

**Acceptable**: 403 ทุกครั้ง. RolesGuard รันก่อน → `req.user` ยังไม่มี → role check fail. ต้องใส่ `JwtAuthGuard` ก่อน

#### Q10 — Env validation

> "ทำไม validate env vars ตอน app start แทน inline check ทุกที่?"

**Acceptable**: Fail-fast — ถ้า config ผิด, app ไม่ start, ไม่ให้เกิด silent runtime issues. Plus single source of truth

---

## 📋 Homework PR Code Review Checklist (ถ้ามอบ)

> Week 2 default ไม่มี code homework ระหว่าง Sessions — แต่ post-Session 2 มี HW-2-Post (เพิ่ม tests)

### Setup & Structure

- [ ] Branch `week2-homework` from `main`
- [ ] Atomic commits (1 commit / 1 task ตาม Plan)
- [ ] Commit messages descriptive
- [ ] No `.env` committed

### Task 1-5: Infrastructure

- [ ] `packages/shared` exists with Zod + Role type
- [ ] `apps/api` scaffolded with proper `tsconfig` extending base
- [ ] `infra/docker-compose.dev.yml` runs Postgres
- [ ] Prisma schema has User + Role enum
- [ ] Migration applied successfully
- [ ] PrismaService extends PrismaClient with lifecycle hooks

### Task 6-9: Auth

- [ ] `packages/shared/src/schemas/auth.ts` exists (Register/Login/AuthToken)
- [ ] `/api/auth/register` works (test in Postman)
- [ ] `/api/auth/login` works
- [ ] bcrypt rounds = 10
- [ ] JWT issued with `sub`, `email`, `role`, `exp`
- [ ] Login fails: same message สำหรับ both no-user and wrong-pw
- [ ] `/api/auth/me` requires Bearer token
- [ ] `/api/auth/admin-only` requires ADMIN role
- [ ] Custom `@Roles()` and `@CurrentUser()` decorators

### Task 10: Quality

- [ ] Env validation via Zod
- [ ] `/api/healthz` endpoint with DB ping
- [ ] AuthService unit tests (≥5 passing)
- [ ] Vitest config with `@coffee/shared` alias
- [ ] **HW-2-Post**: 7+ tests including bcrypt format check + edge case

### Cross-Cutting

- [ ] `pnpm typecheck` pass (web + api + shared)
- [ ] `pnpm test` pass (web + api)
- [ ] No `console.log` debug code remaining

---

## 🧪 Session 2 Live Build Checklist

> Verify ระหว่าง Block G + H — walk around ดู student's screen

### Block E (register) checkpoint

- [ ] Postman shows 201 + accessToken
- [ ] Decode JWT in jwt.io → see `sub`, `role`, `exp`
- [ ] Invalid email → 400 + Thai error message

### Block F (login) checkpoint

- [ ] Login with correct creds → 200 + token
- [ ] Login with wrong password → 401 + same message
- [ ] Login with non-existent email → 401 + same message

### Block G (guards) checkpoint

- [ ] `/api/auth/me` no token → 401
- [ ] `/api/auth/me` with token → 200 + user
- [ ] `/api/auth/admin-only` with STAFF token → 403
- [ ] After SQL UPDATE role=ADMIN + new login → admin-only → 200

### Block H (final) checkpoint

- [ ] `/api/healthz` returns ok + database connected
- [ ] Test: remove JWT_SECRET from .env → app crash with clear message
- [ ] Test: shorten JWT_SECRET to 10 chars → app crash with Zod error
- [ ] `pnpm test` shows ≥5 AuthService tests passing

---

## 📊 Student Self-Assessment (distribute หลัง Session 2)

```
Week 2 Self-Assessment

ฉันเข้าใจ concepts เหล่านี้ระดับไหน (1-5):
□ Docker Compose + named volumes              [1] [2] [3] [4] [5]
□ NestJS modules / controllers / providers     [1] [2] [3] [4] [5]
□ Dependency Injection mental model            [1] [2] [3] [4] [5]
□ Prisma schema + migrations                   [1] [2] [3] [4] [5]
□ PrismaService lifecycle hooks                [1] [2] [3] [4] [5]
□ bcrypt password hashing                      [1] [2] [3] [4] [5]
□ JWT structure + verification                 [1] [2] [3] [4] [5]
□ NestJS Guards (JwtAuthGuard, RolesGuard)    [1] [2] [3] [4] [5]
□ Custom decorators (@Roles, @CurrentUser)     [1] [2] [3] [4] [5]
□ Reflector pattern                            [1] [2] [3] [4] [5]
□ Zod env validation                           [1] [2] [3] [4] [5]
□ NestJS unit testing with Vitest              [1] [2] [3] [4] [5]

ระดับความมั่นใจรวม Week 2:                    [1] [2] [3] [4] [5]

Week 1 vs Week 2 — อันไหนยากกว่า ทำไม?
_________________________________________________
_________________________________________________

อะไรที่ยังคลุมเครือ?
_________________________________________________
```

---

## 📈 Instructor Tracking Sheet — Week 2

| Student   | Q1-10   | Live Build | HW-2-Post | Confidence | 1-on-1 Needed? |
| --------- | ------- | ---------- | --------- | ---------- | -------------- |
| Student A | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student B | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student C | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student D | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student E | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student F | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |

---

## 🔁 Catch-up Plans

### If Score 5-6/10

- Send specific concept review (link to NestJS docs section)
- 30-min 1-on-1 ก่อน Week 3 — focus DI + Guards mental model
- Re-do Block G in your IDE while instructor watches

### If Score ≤ 4/10

- 60-90 min 1-on-1 ก่อน Week 3
- Focus: NestJS DI + JWT lifecycle (most leverage)
- Re-do Tasks 5-9 together (live)
- Pair them with strong student in Week 3

### If Live Build ไม่จบ

- Provide `week2-session2-reference` branch checkout
- Schedule 60-min 1-on-1 to walk through Block G + H
- ต้องเข้าใจ Guards before Week 3 (Week 3 protect endpoints ด้วย JwtAuthGuard)

---

## 🎯 Concepts Used in Week 3+

| Concept (Week 2)          | Used In       | Re-test Opportunity                       |
| ------------------------- | ------------- | ----------------------------------------- |
| `packages/shared` schemas | Every week 3+ | Week 3: add ProductSchema, MenuSchema     |
| PrismaService             | Week 3+       | Inject ใน MenuService, OrderService       |
| AuthService.issueToken    | Week 3        | FE login flow uses /api/auth/login        |
| JwtAuthGuard              | Week 3+       | Protect Menu CRUD admin endpoints         |
| RolesGuard                | Week 4+       | Protect kitchen UI endpoints (STAFF only) |
| `@CurrentUser()`          | Week 4+       | Get user info ใน Order creation           |
| Zod validation pipe       | Every week    | Reuse pattern ทุก endpoint                |
| Vitest mocking            | Week 3+       | Test Menu, Order services                 |

---

## 📝 Week 2 Instructor Reflection (กรอกหลัง Session 2)

```
What worked:
___________________________________________________

What didn't:
___________________________________________________

Concept ที่ติดมากสุด — ทำให้ง่ายขึ้นยังไง next time?
___________________________________________________

Time-block over/under by:
- Session 1 Block A: ____ min over/under
- Session 1 Block B: ____ min over/under
- Session 1 Block C: ____ min over/under
- Session 1 Block D: ____ min over/under
- Session 2 Block E: ____ min over/under
- Session 2 Block F: ____ min over/under
- Session 2 Block G: ____ min over/under
- Session 2 Block H: ____ min over/under

Pitfalls ใหม่ที่เจอ — เพิ่มใน pitfalls-faq.md:
___________________________________________________
___________________________________________________

Pre-Week 3 readiness — readiness gap:
___________________________________________________
```
