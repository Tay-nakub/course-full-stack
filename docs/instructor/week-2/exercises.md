# Week 2 — Exercises (In-Class + Homework + Solutions)

**Audience:** instructor (with solutions). Strip solutions before sharing student-facing copy.

---

## 📋 Exercise Map

| # | Type | When | Difficulty | Time |
|---|---|---|---|---|
| **EX-2.1** | In-class | Session 1, Block A end | ⭐ | 5 min |
| **EX-2.2** | In-class | Session 1, Block C end | ⭐⭐ | 8 min |
| **HW-2-pre** | Reading + practice | Between Session 1 and 2 | ⭐ | 2-3 hrs |
| **EX-2.3** | In-class | Session 2, Block E end | ⭐⭐ | 5 min |
| **EX-2.4** | In-class | Session 2, Block G | ⭐⭐⭐ | 10 min |
| **HW-2-post** | Homework | After Session 2 | ⭐⭐ | 2-3 hrs |
| **HW-2-stretch** | Optional | Anytime | ⭐⭐⭐⭐ | 2-4 hrs |

---

## EX-2.1 — Identify the Layer

**When**: Session 1, Block A end (after NestJS scaffold)
**Type**: Quick verbal exercise
**Difficulty**: ⭐
**Time**: 5 min

### Task
> ดู NestJS code snippet ต่อไปนี้ — แต่ละบรรทัดอยู่ใน layer ไหน (Controller / Service / Module / Provider)?

```ts
1.  @Controller('users')
2.  export class UsersController {
3.    constructor(private readonly users: UsersService) {}
4.    
5.    @Get()
6.    async list() {
7.      return this.users.findAll();
8.    }
9.  }
10.
11. @Injectable()
12. export class UsersService {
13.   constructor(private readonly prisma: PrismaService) {}
14.   
15.   async findAll() {
16.     return this.prisma.user.findMany();
17.   }
18. }
19.
20. @Module({
21.   controllers: [UsersController],
22.   providers: [UsersService],
23. })
24. export class UsersModule {}
```

ตอบ:
- บรรทัด 1-9: layer ?
- บรรทัด 11-18: layer ?
- บรรทัด 20-24: layer ?
- บรรทัด 13: pattern อะไร ที่เห็น?

### 🟢 Solution

- **1-9: Controller layer** — HTTP routing (`@Get()`), thin
- **11-18: Service layer (Provider)** — business/data logic, marked `@Injectable()`
- **20-24: Module** — registration of controllers + providers
- **13: Constructor Injection** — NestJS DI container injects `PrismaService` automatically

> **Teaching point**: layer separation — controller ไม่ควรเรียก Prisma ตรงๆ. ใส่ผ่าน service เพื่อ testability + reusability

---

## EX-2.2 — Trace the Migration

**When**: Session 1, Block C end (after first Prisma migration)
**Type**: Discovery exercise
**Difficulty**: ⭐⭐
**Time**: 8 min

### Task
> เปิด `apps/api/prisma/migrations/<timestamp>_init/migration.sql` ที่ Prisma สร้างให้

ตอบคำถาม:
1. Prisma สร้าง SQL อะไรบ้างจาก schema?
2. ทำไมมี `_prisma_migrations` table ใน DB?
3. ถ้าผมแก้ schema (เช่น เพิ่ม field `name`) แล้วรัน `migrate dev` อีกครั้ง — เกิดอะไรขึ้น?
4. ลองทำ: เพิ่ม field `name String?` ใน User model → `migrate dev --name add_name`

### 🟢 Solution

1. SQL ที่สร้าง:
   ```sql
   CREATE TABLE "users" (
     "id" TEXT NOT NULL,
     "email" TEXT NOT NULL,
     ...
   );
   CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
   ```
2. `_prisma_migrations` = audit trail ที่ Prisma จด migration ไหน apply แล้ว, prevent re-apply
3. Prisma generate **new** migration file (ไม่แก้เก่า) — เก่าเป็น immutable history
4. ผลคือ: migration ใหม่ `<timestamp>_add_name/migration.sql` ที่มี `ALTER TABLE "users" ADD COLUMN "name" TEXT;`

> **Teaching point**: migration history = "git for database schema". Never edit applied migrations. Reset only in dev (`migrate reset`)

---

## HW-2-Pre — Reading + Practice (Between Sessions)

**When**: Between Session 1 and Session 2
**Type**: Self-paced reading + Prisma practice
**Difficulty**: ⭐
**Time**: ~2-3 hours

### Required Reading

Read + ตอบคำถาม "1 takeaway" ใน chat ก่อน Session 2:

| Topic | Doc | What to grasp |
|---|---|---|
| NestJS Modules | [docs.nestjs.com/modules](https://docs.nestjs.com/modules) | When to create new module vs nest in existing |
| NestJS Providers | [docs.nestjs.com/providers](https://docs.nestjs.com/providers) | DI scopes (singleton vs request) |
| Prisma Data Model | [prisma.io/docs/orm/prisma-schema/data-model](https://www.prisma.io/docs/orm/prisma-schema/data-model/models) | Relations (1:1, 1:N, M:N) basics |
| bcrypt primer | [Wikipedia: bcrypt](https://en.wikipedia.org/wiki/Bcrypt) | What "rounds" parameter does |
| JWT primer | [jwt.io/introduction](https://jwt.io/introduction) | header.payload.signature structure |

### Practice Tasks

1. **Prisma Studio explore**:
   - `cd apps/api && pnpm prisma:studio`
   - เพิ่ม users 3 คน (admin/staff/staff) ผ่าน UI
   - Note: เก็บ password เป็น plaintext ตอนนี้ — Session 2 จะ migrate ผ่าน register

2. **Add nullable field**:
   - แก้ schema เพิ่ม `displayName String?` ใน User
   - รัน `pnpm prisma migrate dev --name add_displayName`
   - ดู migration SQL ที่สร้าง
   - Update users ใน Studio ให้มี displayName

3. **Reset experiment**:
   - รัน `pnpm prisma migrate reset` (ระวัง: ลบ data หมด — OK สำหรับ dev)
   - สังเกต: data หาย, migrations ทั้งหมด re-apply
   - Re-create users (เร็วๆ) เพื่อ Session 2 ใช้

### 🟢 No solution required — exploratory practice

> **Why this matters**: Session 2 cognitive load สูง — coming with Prisma "feel" จะช่วยเยอะ

---

## EX-2.3 — Decode the JWT

**When**: Session 2, Block E end (after register endpoint works)
**Type**: In-class exploration
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

หลัง register สำเร็จ + ได้ accessToken มา:

1. Copy accessToken
2. เปิด https://jwt.io
3. Paste ใน "Encoded" box
4. ดู payload ที่ decode ออกมา

ตอบคำถาม:
1. ใน payload มี field อะไรบ้าง?
2. `exp` คืออะไร? (hint: convert timestamp)
3. ถ้าผม **เปลี่ยน role ใน payload** ที่ jwt.io แล้ว copy token ใหม่ → server จะรับไหม?
4. ทำไม?

### 🟢 Solution

1. Fields: `sub` (user ID), `email`, `role`, `iat` (issued at), `exp` (expiry)
2. `exp` = Unix timestamp ของเวลา expire. เช่น 1234567890 → date converter จะแปลง
3. **ไม่รับ** — server reject
4. Reasons:
   - JWT signature = HMAC(header.payload, SECRET)
   - เปลี่ยน payload → signature เก่าไม่ valid
   - server verify ด้วย secret ของตัวเอง → mismatch → reject

> **Teaching point**: นี่คือเหตุผลที่ JWT secret **ต้อง secret**. ถ้า leak → attacker สร้าง token ปลอมที่ valid signature ได้

---

## EX-2.4 — Build Your Own Endpoint with Guards

**When**: Session 2, Block G (during guards demo)
**Type**: In-class hands-on
**Difficulty**: ⭐⭐⭐
**Time**: 10 min

### Task

หลังจาก instructor demo `/auth/me` + `/auth/admin-only` แล้ว ทุกคนเพิ่ม endpoint ใหม่ของตัวเอง:

**Requirement:**
- Endpoint: `GET /api/auth/profile`
- Require **authenticated** user (any role)
- Return:
  ```json
  {
    "user": { ... },
    "permissions": {
      "canManageMenu": true | false,    // true ถ้า ADMIN
      "canCompleteOrders": true | false, // true ถ้า STAFF or ADMIN
    }
  }
  ```

### 🟢 Solution

```ts
// auth.controller.ts
@Get('profile')
@UseGuards(JwtAuthGuard)
async profile(@CurrentUser() user: AuthUser) {
  return {
    user,
    permissions: {
      canManageMenu: user.role === 'ADMIN',
      canCompleteOrders: user.role === 'ADMIN' || user.role === 'STAFF',
    },
  };
}
```

### Acceptance criteria
- [ ] Endpoint requires Bearer token (test: ไม่มี token → 401)
- [ ] Returns user + permissions object
- [ ] STAFF token → canManageMenu = false
- [ ] ADMIN token → canManageMenu = true

### Common Mistakes (anticipate)
- ลืม `@UseGuards(JwtAuthGuard)` → endpoint open
- ไม่ใช้ `@CurrentUser()` → ใช้ `@Req()` ตรงๆ → type ไม่ tight
- Logic ใส่ใน controller ลึก — ถ้ายาวกว่า 5 บรรทัด → move ไป service

---

## HW-2-Post — Complete Auth Test Suite + Refresh Bonus

**When**: After Session 2
**Type**: Homework
**Difficulty**: ⭐⭐
**Time**: ~2-3 hours
**Deliverable**: PR `week2-homework` to `main`

### Required

1. **Complete AuthService unit tests** — เพิ่มจาก 5 ใน Plan ให้เป็น 7 tests:
   - register: 2 (existing — keep)
   - login: 3 (existing — keep)
   - **NEW**: `register hashes password before storing` (verify ไม่ store plain)
   - **NEW**: `login throws if password is empty string` (edge case)

2. **Add e2e-like integration test** — `auth.controller.spec.ts`:
   - Register → expect 201 + token
   - Login with same creds → expect 200 + token
   - Use NestJS Test module + override Prisma to mock

### 🟢 Solution sketch

```ts
// auth.service.spec.ts — additional test
it('register hashes password before storing', async () => {
  prisma.user.findUnique.mockResolvedValue(null);
  prisma.user.create.mockImplementation(({ data }) => ({
    id: '1', ...data,
  }));

  await authService.register({ email: 'new@example.com', password: 'plain123' });

  const calledWith = prisma.user.create.mock.calls[0][0].data;
  expect(calledWith.password).not.toBe('plain123');
  expect(calledWith.password).toMatch(/^\$2[aby]\$/);   // bcrypt format
});

it('login throws if password is empty string', async () => {
  prisma.user.findUnique.mockResolvedValue({
    id: '1', email: 'e@e.com', password: 'hashed', role: 'STAFF',
  });

  await expect(authService.login({ email: 'e@e.com', password: '' }))
    .rejects.toThrow();
});
```

### Acceptance Criteria
- [ ] `pnpm --filter @coffee/api test` shows 7+ AuthService tests passing
- [ ] PR opened, ยังไม่ merge

### Common Mistakes
| Mistake | Fix |
|---|---|
| Test mock leaks ระหว่าง tests | ใส่ `vi.clearAllMocks()` ใน `beforeEach` |
| Test fails เพราะ JWT module config ไม่ครบ | Make sure `JwtModule.register({ secret: 'test', ... })` ใน TestingModule |
| `bcrypt format check` ใช้ regex ผิด | bcrypt prefix = `$2a$`, `$2b$`, `$2y$` |

---

## HW-2-Stretch — Optional Challenges

**When**: After Week 2 (optional, สำหรับ student ที่ทำเร็ว)
**Type**: Stretch
**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Refresh Token Flow (3 hrs)
- เพิ่ม `RefreshToken` model ใน Prisma
- POST `/api/auth/refresh` รับ refresh token → ออก new accessToken
- Store refresh token hash ใน DB (rotation pattern)
- เพิ่ม unit tests

**Why valuable**: pattern จริงของ production auth

### Stretch 2: Rate Limiting on Login (1 hr)
- ติดตั้ง `@nestjs/throttler`
- จำกัด `/api/auth/login` ที่ 5 requests / minute / IP
- Test: 6th request → 429 Too Many Requests

**Why valuable**: ป้องกัน brute force attack

### Stretch 3: Admin Promote Script (1 hr)
- สร้าง `apps/api/scripts/promote-admin.ts`
- Usage: `pnpm tsx scripts/promote-admin.ts admin@coffee.com`
- ใช้ Prisma update role = ADMIN
- Useful สำหรับ Week 4 ตอนต้องการ admin ทดสอบ

### Stretch 4: Seed Script (1 hr)
- สร้าง `apps/api/prisma/seed.ts`
- Configure ใน `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`
- Seed: 1 admin + 2 staff + delete + re-create idempotent
- Run via `pnpm prisma db seed`

**Why valuable**: รีเซ็ต DB กลับ state ที่ดีง่าย

---

## 📤 Student-Facing Format

**ก่อนแชร์ exercises ให้ student**:
1. คัดลอกไฟล์นี้ → ลบ section "🟢 Solution" ทั้งหมด
2. ลบ "Common Mistakes" จาก HW-2-Post (ให้ student ติดเอง)
3. เก็บ HW-2-Stretch solutions ไว้ — student ใช้เป็น reference ตอนติด
4. Save เป็น `docs/student/week-2/exercises.md` (หรือ post ใน LMS)
