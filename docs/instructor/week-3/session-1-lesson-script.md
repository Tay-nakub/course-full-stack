# Week 3 Session 1 — Backend Menu CRUD + Client Plumbing

**Week:** 3
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 2 complete + admin user promoted to ADMIN role
**Covers:** Tasks 1-6 of [Week 3 Plan](../../superpowers/plans/2026-05-08-week-3-end-to-end-menu-crud.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ Menu schemas (Category + Product) ใน `packages/shared`
- ✅ Prisma schema เพิ่ม Category + Product models, migrate applied
- ✅ NestJS Menu module (CRUD endpoints) — public reads, admin writes
- ✅ 4+ unit tests pass (CategoryService + ProductService)
- ✅ Next.js dev rewrites + apiFetch wrapper
- ✅ TanStack Query setup + DevTools ใช้ได้
- 🔵 Login UI + Admin pages → Session 2

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify ทุก student มี admin user (ขอ screenshot SQL หรือ test login ใน Postman)
- [ ] Demo repo on `week3-instructor-start` branch (Week 2 จบ + admin promoted)
- [ ] Postman collection ที่มี collection variable `accessToken` auto-extract จาก login
- [ ] เปิด NestJS docs: Modules, Controllers, Guards
- [ ] เปิด TanStack Query docs: Queries, Mutations, Invalidation

---

## 🗓️ Time-Blocked Agenda

| Time       | Block               | Activity                                           |
| ---------- | ------------------- | -------------------------------------------------- |
| 0-10       | **Recap + Preview** | Quiz Week 2 + show today's outcome                 |
| **10-50**  | **Block A**         | **Shared schemas + Category module + tests**       |
| **50-75**  | **Block B**         | **Product module**                                 |
| **75-110** | **Block C**         | **Next.js rewrites + API client + TanStack Query** |
| 110-120    | Wrap-up             | Homework + Q&A                                     |

---

## 🟢 Recap + Preview (0-10 min)

### Recap Quiz (3 min)

- "JwtAuthGuard ตรวจอะไร?"
- "RolesGuard อ่าน metadata จากไหน?"
- "Prisma migration `dev` vs `deploy`?"

### Today's Preview (7 min)

**Show end-of-Session-2 state**:

1. Login as admin → /admin/menu
2. Add category "เครื่องดื่ม"
3. Add product "Latte" 75 บาท
4. Open `/menu` (storefront, no auth) → เห็น Latte จริง
5. DB inspect → categories + products tables มี data

📢 **Big idea**:

> "วันนี้เราสร้าง backbone ของ data flow:
>
> 1. **Schema** ใน `packages/shared` (1 schema)
> 2. **Backend** validate กับ schema เดียวกัน
> 3. **Frontend form** validate กับ schema เดียวกัน
>
> Schema เปลี่ยนตัวเดียว → ทุกชั้น sync ตามอัตโนมัติ"

---

## 📦 Block A: Shared Schemas + Category Module (10-50 min, 40 min)

### 🎯 Block Goals

- Define Category schemas ที่ใช้ทั้ง FE + BE
- Build NestJS CRUD service + controller pattern (template สำหรับ module ทุกตัว)
- Unit test the service

### 💬 Lecture (~12 min)

**1. The "1 schema, 2 sides" pattern** (5 min)

วาดบนกระดาน:

```
                packages/shared/schemas/menu.ts
                ┌────────────────────────┐
                │ CreateCategorySchema   │
                │ z.object({             │
                │   name: z.string()...  │
                │   sortOrder: z.number()│
                │ })                     │
                └──────┬─────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
  apps/web                        apps/api
  ┌────────────────────┐         ┌────────────────────┐
  │ React Hook Form    │         │ ZodValidationPipe  │
  │ resolver:          │         │ in controller @Post│
  │   zodResolver(...)  │         │                    │
  │                    │         │ Same Schema        │
  └────────────────────┘         └────────────────────┘
   FE validation                  BE validation
   ภาษาไทย errors                 ภาษาไทย errors
   (same messages!)               (same messages!)
```

📢 **Key**: "1 schema = single source of truth. Validation logic + types + error messages — DRY ทั้งหมด"

**2. NestJS CRUD service template** (4 min)

```ts
@Injectable()
class XService {
  findAll() { ... }
  findOne(id) { ... }
  create(input) { ... }
  update(id, input) { ... }
  remove(id) { ... }
}
```

📢 **Pattern**: ทุก service จะมีโครงคล้ายกัน. ครั้งแรกเขียนทุกบรรทัด — ครั้งที่ 2-3 จะ copy + ปรับ

**3. Service vs Controller layer** (3 min)

```
Controller            Service              Prisma
   ↓                     ↓                    ↓
HTTP routing       business rules       data access
@Get, @Post        validation           query
no business        permission           transaction
```

📢 **เน้น**: "Controller thin. Logic ทั้งหมดใน Service. ทำให้ test ง่าย (mock Prisma + call service)"

### 🖥️ Live Demo (~28 min)

**1. Menu schemas ใน shared** (Task 1 — 5 min)

(พิมพ์ตาม Plan)

📢 **เน้นจุดสำคัญ**:

- `CreateCategorySchema` (input) แยกจาก `CategorySchema` (output)
- Why? — input = user submission (no `id`, no timestamps). Output = DB record (มี id)
- `UpdateCategorySchema = CreateCategorySchema.partial()` — Zod helper, all fields optional

**2. Prisma schema เพิ่ม models + migrate** (Task 2 — 6 min)

(พิมพ์ตาม Plan)

📢 **อธิบาย**:

- `Decimal(10, 2)` — แทน `Float` เพราะ exact precision (ไม่มี rounding error)
- `onDelete: Restrict` — ห้ามลบ category ถ้ามี products → ดี for safety
- `@@index([categoryId])` — explicit index → JOIN เร็ว

```bash
cd apps/api
pnpm prisma migrate dev --name add_menu
cd ../..
```

ดูใน DBeaver → categories + products tables มี

**3. CategoryService** (Task 3.1 — 8 min)

(พิมพ์ทุกบรรทัด — student ตามใน VS Code ของตัวเอง)

📢 **ต้องเน้น**:

- `findOne` → `NotFoundException` (NestJS auto-mapped to 404)
- `remove` → check `productCount` ก่อน → ถ้ามี product ต้อง `ConflictException` (409)
- Why throw exception? → NestJS exception filter → HTTP status ที่ถูกต้องอัตโนมัติ

**4. CategoryController** (Task 3.2 — 5 min)

(พิมพ์ตาม Plan)

📢 **โครงสร้าง guards**:

```ts
@Get()  // public — ใครก็เข้าได้
list() { ... }

@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
create() { ... }
```

> "Public reads + admin writes = pattern ปกติของ menu-style data"

**5. Service unit tests** (Task 3.3 — 4 min)

(พิมพ์ tests ตาม Plan — focus tests สำคัญ:

- findOne throws NotFound
- remove throws Conflict ถ้ามี products
- remove สำเร็จถ้าไม่มี products)

📢 **Pattern**: mock Prisma → test service ในมุมมอง business logic เท่านั้น

```bash
cd apps/api && pnpm test
# 5 (auth) + 4 (category) = 9 pass
```

**6. ทดสอบ Postman** (Task 3.5 — 4 min)

- Login → token (Postman auto-extract)
- POST `/api/menu/categories` with Bearer + body → 201 ✓
- GET `/api/menu/categories` (no auth) → 200 ✓
- POST again **without token** → 401 ✓ (Guard work)
- Login เป็น STAFF user → POST again → 403 ✓ (RolesGuard work)

Commit:

```bash
git commit -m "feat(api): add Category CRUD with admin guards and tests"
```

### ❓ Common Questions (Block A)

| Q                                          | A                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| ทำไมแยก Create vs Update schema?           | Update fields ทุก optional. ถ้าใช้ schema เดียว → user ต้องส่งทุก field ทุกครั้ง = bad UX |
| `Decimal` vs `Float` ทำไมต่าง?             | `0.1 + 0.2 ≠ 0.3` ใน Float. Money calculations ห้าม Float — ใช้ Decimal precision         |
| Service inject อะไรอื่นได้บ้าง?            | ทุก provider ที่ register ใน module. ตัวอย่าง: ConfigService, JwtService, อื่นๆ           |
| ทำไม return `{ success: true }` ใน remove? | NestJS default = 200 + JSON. ถ้า return `void` → ส่ง empty body. แค่เลือก convention      |

---

## 📦 Block B: Product Module (50-75 min, 25 min)

### 🎯 Block Goals

- Apply pattern จาก Block A กับ Product
- เพิ่ม relation handling (Category FK validation)
- Filter via query params (`?active=true`)

### 💬 Lecture (~5 min)

**Pattern repetition** (5 min)

📢 **Self-aware comment**:

> "Product module = pattern เหมือน Category. Block นี้สั้น เพราะคุณเริ่มเห็น pattern แล้ว. ถ้าจำได้ — Week 4+ ทุก module จะตามนี้"

วาด pattern:

```
service.ts:
  findAll() / findOne(id)
  create(input) → assertReferences + db.create
  update(id, input) → findOne + assert + db.update
  remove(id) → findOne + db.delete

controller.ts:
  GET / GET :id (public)
  POST / PATCH :id / DELETE :id (admin)
```

### 🖥️ Live Demo (~20 min)

**1. ProductService** (Task 4.1 — 7 min)

(พิมพ์ตาม Plan)

📢 **ต้องเน้น**:

- `assertCategoryExists()` private method — pattern: validate FK ก่อน insert/update
- `include: { category: true }` → JOIN, return product พร้อม category info
- `orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }]` → multi-key ordering

**2. ProductController** (Task 4.2 — 5 min)

(พิมพ์ตาม Plan)

📢 **เน้น query parameter**:

```ts
@Get()
list(@Query('active') active?: string) {
  return this.service.findAll({ onlyActive: active === 'true' });
}
```

> "URL `?active=true` → string 'true'. Convert to boolean — Zod ทำได้ด้วย `z.coerce.boolean()` แต่ง่ายๆ ตรงนี้"

**3. ProductService tests** (Task 4.3 — 4 min)

(พิมพ์ key tests — student เห็น pattern same as Category)

**4. Register + ทดสอบ** (Task 4.4-4.5 — 4 min)

- เพิ่ม ProductController + ProductService ใน MenuModule
- Postman: POST product (need categoryId จาก step ก่อน), GET, GET with `?active=true`

Commit:

```bash
git commit -m "feat(api): add Product CRUD with category guard and tests"
```

### ❓ Common Questions (Block B)

| Q                                 | A                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| ทำไมต้อง `assertCategoryExists`?  | กัน insert orphan product (categoryId ที่ไม่มี). Prisma จะ fail ที่ DB level อยู่แล้ว แต่ error message งง |
| `include` vs `select` ใน Prisma?  | `include` = relation เพิ่ม. `select` = pick specific fields. ใช้ `select` ถ้าต้อง optimize bandwidth       |
| `Decimal` ส่งกลับ FE เป็น string? | ใช่ — Prisma Decimal serialize เป็น string (กัน precision loss). FE ต้อง `Number(price)` ก่อน calculate    |

---

## 🔌 Block C: Next.js Rewrites + API Client + TanStack Query (75-110 min, 35 min)

### 🎯 Block Goals

- Setup proxy เพื่อให้ FE เรียก `/api/*` แล้วถึง NestJS (same-origin)
- Build apiFetch wrapper ที่ส่ง cookie + handle errors
- Setup TanStack Query Provider + DevTools

### 💬 Lecture (~12 min)

**1. Cross-origin problem in dev** (4 min)

วาดบนกระดาน:

```
Dev (separate origins):
  Browser at localhost:3000  ─?─►  NestJS at localhost:4000
                              ↓
                           CORS preflight
                           Cookie ไม่แชร์ (different origin)

Solution: Next.js proxy
  Browser at localhost:3000  ───►  /api/* (Next.js handler)
                                     │
                                     └─► proxies to localhost:4000

  Same origin → cookie ส่งได้, ไม่มี CORS
```

> "Prod (Week 6) ใช้ Caddy ทำงานเดียวกัน — `/api/*` route ไป NestJS, อื่นๆ ไป Next.js. **Same domain in prod, proxy in dev** — strategy เดียวกัน"

**2. apiFetch design decisions** (4 min)

โชว์ Plan code:

```ts
fetch(`/api${path}`, {
  credentials: 'include',     // ส่ง cookie
  body: body ? JSON.stringify(body) : undefined,
  ...
})
```

📢 **Why each**:

- `credentials: 'include'` → browser auto-sends httpOnly cookie
- `'/api'` prefix → trigger Next.js proxy
- `JSON.stringify` ไม่ default → empty body ก็ได้

**3. TanStack Query mental model** (4 min)

วาด:

```
Component  ─useQuery('users', fetcher)─►  Cache
                                           ↓
                             ┌─────────────┴─────────────┐
                             │   Cache key = 'users'      │
                             │   data, isLoading, error   │
                             │   refetch on focus/mount   │
                             └────────────────────────────┘

Component2 ─useQuery('users', fetcher)─►  Cache (same key)
                                           ↓
                                    Same data — no refetch
                                    (ภายใน staleTime)
```

📢 **Key**: "Cache key = string (or array). 2 components ใช้ key เดียวกัน → share data, single fetch"

```
useMutation ─►  call fetcher  ─►  Server  ─►  Response
                                              ↓
                            qc.invalidateQueries(key) → refetch
```

### 🖥️ Live Demo (~23 min)

**1. Next.js rewrites** (Task 5.1 — 4 min)

(พิมพ์ตาม Plan)

ทดสอบ:

```bash
pnpm dev    # restart
curl http://localhost:3000/api/healthz
# → ผ่าน Next.js → forward ไป NestJS → response
```

**2. apiFetch wrapper** (Task 5.2 — 5 min)

(พิมพ์ตาม Plan)

ทดสอบใน browser console:

```js
await fetch('/api/menu/categories').then((r) => r.json());
// → array (or empty)
```

**3. TanStack Query install + Provider** (Task 6.1-6.2 — 6 min)

```bash
cd apps/web
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

(พิมพ์ Provider ตาม Plan)

📢 **เน้น `useState`**:

```ts
const [client] = useState(() => new QueryClient({ ... }));
```

> "ห้าม `new QueryClient()` นอก useState — ทุก render สร้างใหม่ → cache loss. `useState` กับ initializer = create ครั้งเดียว"

**4. Wrap root layout + verify DevTools** (Task 6.3-6.5 — 8 min)

แก้ root layout ใส่ `<QueryProvider>`

รัน → เปิด `/menu` → เห็น React Query Devtools floating button (มุมซ้ายล่าง)

📢 **โชว์ DevTools**:

- คลิก expand → เห็น cache panel (empty)
- ตอนนี้ยังไม่ใช้ `useQuery` ใน app
- Session 2 จะใช้ — กลับมาดู cache fill

Commit:

```bash
git commit -m "feat(web): add Next.js API rewrites, apiFetch, TanStack Query setup"
```

### ❓ Common Questions (Block C)

| Q                                               | A                                                                                                               |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ทำไม Next.js rewrites แทน fetch ตรง?            | Cross-origin = no cookie + CORS preflight. Same origin (proxy) = simpler                                        |
| `staleTime` กับ `cacheTime` ต่างกัน?            | `staleTime` = data ถือว่าใหม่นานเท่าไร (ไม่ refetch). `cacheTime` (now `gcTime`) = ลบ cache หลังไม่ใช้นานเท่าไร |
| QueryClient ทำไม singleton ต่อ tab ไม่ต่อ user? | Cache อยู่ใน memory ของ browser tab. ปิด tab → cache หาย. ต้อง persist → use persister plugin                   |
| DevTools production จะมีไหม?                    | No — `process.env.NODE_ENV === 'development'` ใน Provider                                                       |

---

## 🏁 Wrap-up + Homework (110-120 min, 10 min)

### Recap (3 min)

- "Schema เดียวสองฝั่ง — ตัวอย่างจริงที่ทำวันนี้?"
- "Public read vs admin write — implement ยังไงใน NestJS?"
- "ทำไมต้อง `useState(() => new QueryClient())` ห้ามใส่ตรงๆ?"

### Homework (5 min)

📦 **Required** (~3 hrs)

1. **Postman practice**:
   - Create 3 categories (เครื่องดื่ม, อาหาร, ของหวาน)
   - Create 6 products (2 per category)
   - Test edge cases: delete category with products → 409, invalid categoryId → 400

2. **Pre-build Categories admin UI** (preview Session 2):
   - สร้าง `app/(admin)/admin/menu/page.tsx` (basic skeleton)
   - สร้าง `CategoryList` component ที่ใช้ `useQuery` ดึง categories
   - แสดง list (ยังไม่ต้อง CRUD form — แค่ display)

📚 **Reading** (~30 min)

- [TanStack Query — Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations)
- [TanStack Query — Query Invalidation](https://tanstack.com/query/latest/docs/react/guides/query-invalidation)

### Q&A (2 min)

---

## 📝 Post-Session Self-Review (instructor)

| Item                                         | Note                |
| -------------------------------------------- | ------------------- |
| ทุกคนทำ Tasks 1-4 (BE) จบไหม?                | \_\_\_              |
| ทุกคน TanStack Query setup สำเร็จ?           | \_\_\_              |
| Block ไหน over-run?                          | \_\_\_              |
| Concept ที่ติด — ต้อง follow up Session 2?   | \_\_\_              |
| Pre-Session 2: ใครยังไม่ promote admin user? | \_\_\_              |
| Energy ห้องโดยรวม                            | low / medium / high |
