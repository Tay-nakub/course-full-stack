# Week 3 — Assessment Checklist

**Audience:** instructor — diagnostic, not exam

---

## 🎯 Pass Criteria

Student "พร้อม" เข้า Week 4 ถ้า:

- ✅ Verbal Q ≥ 7/10
- ✅ Live build (Session 2 Block F + G) ทำงาน
- ✅ End-to-end demo: login → admin CRUD → storefront เห็น data

ถ้า ≤ 6/10 หรือ live build ไม่จบ → **1-on-1 catch-up ก่อน Week 4 จำเป็น** (Week 4 build บน Week 3 patterns ทุกอย่าง)

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Q1 — Schema sharing

> "ทำไมเราใส่ Zod schemas ใน `packages/shared` ไม่ใส่ใน `apps/api`?"

**Acceptable**: ให้ FE+BE ใช้ schema เดียวกัน → validation messages ตรงกัน, types ตรงกัน, ไม่ต้องเขียน 2 ที่

### Q2 — Service vs Controller

> "Controller ควร call Prisma ตรงๆ ได้ไหม? ทำไม?"

**Acceptable**: ไม่ควร — break separation of concerns. Service = business logic + testable. Controller = HTTP only

### Q3 — Public vs admin endpoints

> "Implement `GET /menu/products` public + `POST /menu/products` admin only ใน NestJS — เขียน decorators ยังไง?"

**Acceptable**:

```ts
@Get() list() {}                         // public
@Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN') create() {}
```

### Q4 — Cross-origin in dev

> "ทำไมต้องใช้ Next.js rewrites? แก้ปัญหาอะไร?"

**Acceptable**: Dev = browser:3000 vs nest:4000 = cross-origin = cookie ไม่แชร์ + CORS preflight. Rewrites ทำให้ same-origin (proxy)

### Q5 — TanStack Query mental model

> "useQuery 2 ตัว queryKey เดียวกัน — fetch กี่ครั้ง? ทำไม?"

**Acceptable**: 1 ครั้ง — share cache. queryKey = identity. Both components subscribe ตัวเดียวกัน

### Q6 — Mutation lifecycle

> "ลบ category สำเร็จ — list ไม่อัปเดตทำไง?"

**Acceptable**: `onSuccess: () => qc.invalidateQueries({ queryKey: ... })` — mark cache stale → useQuery refetch

### Q7 — httpOnly cookie security

> "ทำไม httpOnly cookie ปลอดภัยจาก XSS?"

**Acceptable**: JS access cookie ไม่ได้ → script malicious ไม่สามารถอ่าน token. Browser ส่ง cookie อัตโนมัติ — ไม่ผ่าน JS

### Q8 — Cookie tradeoffs

> "Cookie vs Bearer header in localStorage — เลือกตัวไหนสำหรับ web app, ทำไม?"

**Acceptable**: Cookie (course choice) — XSS more common than CSRF. Bearer = better for mobile/API clients

### Q9 — Middleware purpose

> "Next.js middleware ใน Edge runtime — verify JWT ตรงนี้ได้ไหม? ทำไมไม่ทำ?"

**Acceptable**: Edge runtime ไม่มี Node crypto. ใช้ `jose` library ได้แต่ overhead. Course ใช้ short-circuit (token exists?) — NestJS verify จริง

### Q10 — Server Component fetch

> "ทำไม Server Component ต้องใช้ absolute URL (ไม่ใช่ `/api/...`)?"

**Acceptable**: Server Component runs on server (Node.js) — relative paths ไม่มี origin context. Use `process.env.NESTJS_INTERNAL_URL`

---

## 📋 Homework PR Code Review Checklist

### Backend (Tasks 1-4)

- [ ] `packages/shared/src/schemas/menu.ts` มี Category + Product schemas
- [ ] `prisma/schema.prisma` มี Category + Product models with `Decimal(10, 2)` for price
- [ ] Migration applied (`prisma/migrations/...`)
- [ ] CategoryService + ProductService — ใช้ pattern: findAll/findOne/create/update/remove
- [ ] CategoryController + ProductController — public reads, admin writes
- [ ] Service tests pass (CategoryService 4+, ProductService 3+)
- [ ] `pnpm --filter @coffee/api test` shows 12+ tests pass

### Frontend Plumbing (Tasks 5-6)

- [ ] `next.config.ts` มี rewrites for `/api/*` → NestJS URL
- [ ] `lib/api-client.ts` มี `apiFetch` + `ApiError`
- [ ] `lib/query-keys.ts` มี centralized keys
- [ ] `components/providers/query-provider.tsx` ใช้ `useState(() => new QueryClient())`
- [ ] React Query Devtools ทำงาน in dev

### Frontend UI (Tasks 7-9)

- [ ] `app/api/auth/login/route.ts` proxies + sets httpOnly cookie
- [ ] `app/api/auth/logout/route.ts` deletes cookie
- [ ] `app/login/page.tsx` + LoginForm with Zod validation
- [ ] `middleware.ts` protects `/admin/*` with cookie check
- [ ] `app/(admin)/layout.tsx` มี sidebar + logout button
- [ ] CategoryList + CategoryForm + ProductList + ProductForm
- [ ] Form validation (Zod errors visible)
- [ ] Mutation `isPending` state → button disabled
- [ ] Cache invalidation works (list updates after CRUD)

### Storefront (Task 10)

- [ ] `/menu` is Server Component fetch from real API
- [ ] No mock data remaining (`lib/data/menu.ts` deleted)
- [ ] Empty state if no products

### Quality

- [ ] `pnpm typecheck` pass
- [ ] No `any` types (except mock prisma in tests)
- [ ] `credentials: 'include'` in apiFetch
- [ ] `cookies()` calls awaited (Next.js 15)

---

## 🧪 Live Build Checkpoints

### Session 1 — Block A (Category module)

- [ ] Postman: POST `/api/menu/categories` (admin) → 201
- [ ] Postman: GET `/api/menu/categories` (no auth) → 200
- [ ] Postman: POST without token → 401
- [ ] Postman: POST with STAFF token → 403
- [ ] `pnpm --filter @coffee/api test` shows 9+ tests pass

### Session 1 — Block C (Plumbing)

- [ ] Browser: `fetch('/api/healthz')` returns 200 (rewrites work)
- [ ] React Query Devtools button visible
- [ ] Cache panel opens (empty for now)

### Session 2 — Block D (Login)

- [ ] DevTools Application → Cookies shows `coffee_token` (httpOnly: ✓)
- [ ] Wrong password → Thai error message
- [ ] Successful login → redirect to `/admin/menu`

### Session 2 — Block E (Middleware)

- [ ] Logout → visit `/admin` → redirect to `/login?redirectTo=/admin`
- [ ] Login → redirect back to `/admin/menu`

### Session 2 — Block F (Admin CRUD)

- [ ] Create category → list updates without page refresh
- [ ] Edit category → updates inline
- [ ] Delete empty category → removed
- [ ] Delete category with products → 409 alert
- [ ] Same for products
- [ ] React Query Devtools shows cache invalidation events

### Session 2 — Block G (Storefront)

- [ ] `/menu` shows real products
- [ ] Add product in admin → refresh `/menu` → new product appears
- [ ] Set product `isActive: false` → filtered out from `/menu`

---

## 📊 Student Self-Assessment (distribute หลัง Session 2)

```
Week 3 Self-Assessment

ฉันเข้าใจ concepts เหล่านี้ระดับไหน (1-5):
□ Schema sharing (1 schema, 2 sides)             [1] [2] [3] [4] [5]
□ NestJS Service/Controller layering             [1] [2] [3] [4] [5]
□ Prisma relations + onDelete                    [1] [2] [3] [4] [5]
□ Public vs admin endpoints                      [1] [2] [3] [4] [5]
□ Next.js dev rewrites (proxy)                   [1] [2] [3] [4] [5]
□ TanStack Query useQuery + cache                [1] [2] [3] [4] [5]
□ TanStack Query useMutation + invalidation      [1] [2] [3] [4] [5]
□ httpOnly cookie auth flow                      [1] [2] [3] [4] [5]
□ Next.js middleware                             [1] [2] [3] [4] [5]
□ Server Component fetch pattern                 [1] [2] [3] [4] [5]
□ Cross-stack debugging                          [1] [2] [3] [4] [5]

ระดับความมั่นใจรวม Week 3:                      [1] [2] [3] [4] [5]

End-to-end slice — รู้สึกยังไง?
_________________________________________________

อะไรที่ยังคลุมเครือ?
_________________________________________________
```

---

## 📈 Tracking Sheet

| Student   | Q1-10   | Live Build | HW-3-Post | Confidence | 1-on-1 Needed? |
| --------- | ------- | ---------- | --------- | ---------- | -------------- |
| Student A | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student B | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student C | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student D | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student E | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |
| Student F | \_\_/10 | ✅/❌      | ✅/❌     | \_\_/5     | Yes / No       |

---

## 🔁 Catch-up Plans

### Score 5-6/10

- DM specific concepts to review
- 30-min 1-on-1 ก่อน Week 4 — focus on TanStack Query OR cookies (whichever weaker)
- Pair with strong student in Week 4

### Score ≤ 4/10

- 60-90 min 1-on-1 — required ก่อน Week 4
- Re-do Tasks 8-9 (admin CRUD) live with instructor watching
- Week 4 build directly on these patterns — solidify เป็นงานเร่งด่วน

### Live Build ไม่จบ

- Provide `week3-session2-reference` branch checkout
- 60-min walkthrough — focus where stuck
- Verify can do it solo before Week 4 starts

---

## 🎯 Concepts Used in Week 4+

| Concept (Week 3)                             | Used In       | Re-test                                         |
| -------------------------------------------- | ------------- | ----------------------------------------------- |
| 1 schema, 2 sides                            | Every week 4+ | OrderSchema (Wk 4)                              |
| NestJS CRUD pattern                          | Wk 4-5        | Order, Inventory modules                        |
| TanStack Query useMutation                   | Wk 4-5        | Order placement, kitchen status                 |
| Cache invalidation                           | Wk 4-5        | Cross-module invalidation (order → stock)       |
| Cookie auth                                  | Wk 4          | Customer flow no auth, staff/admin same as Wk 3 |
| Middleware                                   | Wk 4          | Add `/kitchen/*` to matcher                     |
| Server Component fetch                       | Wk 4-5        | Order detail page                               |
| Form pattern (RHF + Zod + Dialog + mutation) | Wk 4-5        | Order form, recipe form                         |

---

## 📝 Week 3 Instructor Reflection

```
Week 3 reflection (instructor)

What worked:
___________________________________________________

What didn't:
___________________________________________________

Concept ที่ยากเกินคาดที่จะสอน:
___________________________________________________

Concept ที่ง่ายเกินคาดที่จะสอน:
___________________________________________________

Time-block over/under:
- S1 Block A: ____ min
- S1 Block B: ____ min
- S1 Block C: ____ min
- S2 Block D: ____ min
- S2 Block E: ____ min
- S2 Block F: ____ min
- S2 Block G: ____ min

Pitfalls ใหม่:
___________________________________________________

Pre-Week 4: คนที่ต้อง 1-on-1:
___________________________________________________
```
