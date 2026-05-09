# Week 3 Session 2 — Login + Admin CRUD UI + Wire Storefront

**Week:** 3
**Session:** 2 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 3 Session 1 complete + homework (test Postman + skeleton CategoryList)
**Covers:** Tasks 7-10 of [Week 3 Plan](../../superpowers/plans/2026-05-08-week-3-end-to-end-menu-crud.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ Login flow ทำงาน — fill form → cookie set → redirect
- ✅ Auth middleware ป้องกัน `/admin/*`
- ✅ Admin layout + sidebar
- ✅ Admin Menu CRUD UI (Categories + Products) ใช้ TanStack Query
- ✅ Storefront `/menu` แสดง data จริงจาก DB

> **End state**: ระบบที่ admin login ได้, manage menu ผ่าน UI, ลูกค้าเห็นเมนูจริง — first end-to-end slice complete!

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify Session 1 deliverables (NestJS Menu CRUD + TanStack Query setup)
- [ ] DevTools Network tab + Application → Cookies open ในเบราว์เซอร์ demo
- [ ] React Query Devtools open
- [ ] เปิดใน 2 windows: browser + DBeaver (ดู DB updates)

---

## 🗓️ Time-Blocked Agenda

| Time        | Block                       | Activity                            |
| ----------- | --------------------------- | ----------------------------------- |
| 0-10        | **Recap + Homework Review** | Show student PRs of CategoryList    |
| **10-45**   | **Block D**                 | **Login flow with httpOnly cookie** |
| **45-60**   | **Block E**                 | **Auth middleware + Admin layout**  |
| **60-105**  | **Block F**                 | **Admin Menu CRUD UI (live build)** |
| **105-115** | **Block G**                 | **Wire storefront**                 |
| 115-120     | Wrap-up                     | Week 4 preview                      |

---

## 🟢 Recap + Homework Review (0-10 min)

### Recap Quiz (3 min)

- "TanStack Query `useQuery` คืน fields อะไร?"
- "`useMutation` ตอน success ต้องทำอะไร เพื่อ refresh list?"
- "Why `credentials: 'include'`?"

### Homework Showcase (7 min)

**Format**: 1-2 student PR — focus หาก problem จริง:

- ที่ติด: typo ใน queryKey → cache miss
- ที่ดี: แยก ApiError handling สวย
- Common: ใช้ `await fetch()` ตรงๆ แทน apiFetch — discuss tradeoff

📢 **Common student question**: "ถ้าทำ `useQuery` กับ `useState` ต่างกันยังไง?"

- `useState` = client state local
- `useQuery` = server state (fetch + cache + refetch + invalidate)
- Different concerns

---

## 🔐 Block D: Login Flow with httpOnly Cookie (10-45 min, 35 min)

### 🎯 Block Goals

- เข้าใจ proxy pattern ของ Next.js Route Handler
- Implement login: form → Route Handler → NestJS → cookie
- เข้าใจ httpOnly cookie security tradeoffs

### 💬 Lecture (~12 min)

**1. Why proxy pattern (not direct call to NestJS)?** (4 min)

วาดบนกระดาน:

```
❌ Bad approach:
  Browser ─POST─► NestJS
       ↑
  accessToken stored in localStorage
  (XSS = steal token)


✅ Course approach:
  Browser ─POST /api/auth/login─►  Next.js Route Handler
                                          │
                                          │ proxy
                                          ▼
                                       NestJS
                                          │
                                          ▼
                          accessToken in response
                                          │
                          ┌───────────────┘
                          ▼
              Set httpOnly cookie ─────► Browser
              (JS can't read = XSS-safe)
```

📢 **Key insight**: "JWT token never seen by FE JavaScript. Browser carries it via cookie. XSS can't steal what JS can't read"

**2. Cookie attributes** (4 min)

```ts
response.cookies.set({
  name: 'coffee_token',
  value: data.accessToken,
  httpOnly: true, // JS read = ❌ → XSS-safe
  sameSite: 'lax', // CSRF protection
  path: '/', // available everywhere
  maxAge: 7 * 24 * 60 * 60, // 7 days
  secure: true in prod, // HTTPS only
});
```

📢 **อธิบายแต่ละตัว**:

- `httpOnly: true` — JS access ไม่ได้ → XSS ขโมยไม่ได้
- `sameSite: 'lax'` — แค่ส่ง cookie ใน same-site requests + safe top-level navigations
- `secure: true` ใน prod — HTTPS only (กัน sniffer ใน Wi-Fi)

**3. Trade-off vs Authorization header** (4 min)

|                        | localStorage + Bearer | httpOnly Cookie                       |
| ---------------------- | --------------------- | ------------------------------------- |
| XSS                    | ❌ vulnerable         | ✅ safe                               |
| CSRF                   | ✅ safe               | ❌ vulnerable (mitigate via sameSite) |
| Mobile / native client | ✅ easy               | ⚠️ ต้องจัดการ cookie jar              |
| Fan-out APIs           | ✅ trivial            | ❌ same domain only                   |

📢 **เลือก cookie สำหรับ web app นี้** — XSS เกิดบ่อยกว่า CSRF, course เน้น web

### 🖥️ Live Demo (~23 min)

**1. Auth utilities** (Task 7.1 — 3 min)

(พิมพ์ตาม Plan)

📢 **เน้น Next.js 15 change**:

> "`cookies()` คืน Promise — เปลี่ยนจาก v14. ต้อง `await`"

**2. Login Route Handler** (Task 7.2 — 8 min)

(พิมพ์ตาม Plan — focus Critical pieces)

📢 **อธิบายแต่ละ step**:

1. Validate input ด้วย `LoginSchema.safeParse` (server-side defense)
2. Forward ไป NestJS internal URL (env var)
3. ถ้า fail → return upstream error ตรงๆ
4. ถ้า success → **strip accessToken** ออกจาก response → set as cookie
5. Cookie: httpOnly, sameSite, secure in prod

> "Notice — response JSON ไม่มี `accessToken`. FE ไม่รู้ token. Cookie ทำงานเงียบๆ"

**3. Logout Route Handler** (Task 7.3 — 1 min)

(พิมพ์ตาม Plan — สั้น, แค่ delete cookie)

**4. LoginForm component** (Task 7.4 — 6 min)

(พิมพ์ตาม Plan)

📢 **เน้น**:

- ใช้ `useForm({ resolver: zodResolver(LoginSchema) })` — same schema as BE
- `serverError` state สำหรับ 401 จาก server (ต่างกับ Zod field errors)
- `router.push('/admin/menu')` + `router.refresh()` หลัง success — refresh server-side state

**5. Login page** (Task 7.5 — 1 min)

(สั้นๆ — แค่ render LoginForm)

**6. ทดสอบ end-to-end** (Task 7.6 — 4 min)

1. เปิด DevTools → Network + Application
2. ไป http://localhost:3000/login
3. กรอก wrong password → 401 + Thai error
4. กรอก ถูก → cookie set ปรากฏใน Application tab
5. หลัง redirect → cookie ส่งไปทุก request automatically
6. ตรวจ cookie attributes: httpOnly ✓, secure (depends on prod), sameSite=Lax

Commit:

```bash
git commit -m "feat(web): add login flow with httpOnly cookie"
```

### ❓ Common Questions (Block D)

| Q                                       | A                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------- |
| ถ้าใช้ Server Action แทน Route Handler? | ใช่ — ทำได้ใน Next.js 15. Route Handler = pattern ที่ portable มากกว่า, transparent flow      |
| Token expire — user งง redirect แปลกๆ?  | ใส่ middleware logic verify token + redirect to login on expire (Tier 1 self-study)           |
| Refresh token?                          | Tier 1 self-study — เพิ่ม `/api/auth/refresh` route + refresh cookie                          |
| ทำไมต้อง `router.refresh()` หลัง login? | Server Component ที่ depend `getServerToken()` (เช่น storefront) จะ re-render ด้วย state ใหม่ |

---

## 🛡️ Block E: Auth Middleware + Admin Layout (45-60 min, 15 min)

### 🎯 Block Goals

- ใช้ Next.js middleware ป้องกัน routes
- เข้าใจ Edge runtime constraints
- Build admin layout

### 💬 Lecture (~5 min)

**1. Next.js Middleware** (3 min)

```
Request ──► middleware.ts ──► Route handler / page
              │
              ├── allow / redirect / rewrite
              │
              └── Edge Runtime (Vercel-style, lightweight)
```

📢 **Constraints**:

- Edge runtime = NO Node APIs (`fs`, `crypto.createHash`, etc)
- Cookie reading OK
- เร็วมาก (compiled to V8 isolates)

**2. Strategy: short-circuit, no JWT verify** (2 min)

โค้ด middleware:

```ts
const token = cookies.get(TOKEN_NAME);
if (!token) redirect('/login');
return NextResponse.next();
```

> "ไม่ verify JWT ที่ middleware (Edge ไม่มี crypto). Just check token exists. NestJS verify จริงเมื่อ request ถึง"

### 🖥️ Live Demo (~10 min)

**1. middleware.ts** (Task 8.1 — 3 min)

(พิมพ์ตาม Plan)

📢 **เน้น matcher**:

```ts
export const config = { matcher: ['/admin/:path*'] };
```

> "เฉพาะ `/admin/*` รัน middleware. ป้องกัน API routes / public pages เข้าใจไม่จำเป็น"

**2. Admin layout + redirect** (Task 8.2-8.3 — 5 min)

(พิมพ์ตาม Plan — Sidebar + main panel)

📢 **เน้น logout button**:

```html
<form action="/api/auth/logout" method="POST">
  <button>ออกจากระบบ</button>
</form>
```

> "Plain HTML form → POST → Route Handler → cookie clear → redirect handled by client. ไม่ต้อง JS"

**3. ทดสอบ** (2 min)

1. Logout → ไป `/admin` → redirect to `/login?redirectTo=/admin` ✓
2. Login → redirect to `/admin/menu` (ยังไม่มี — 404 OK ตอนนี้)
3. Sidebar visible

Commit:

```bash
git commit -m "feat(web): add auth middleware and admin route group"
```

---

## 🎨 Block F: Admin Menu CRUD UI (60-105 min, 45 min)

### 🎯 Block Goals

- Build CategoryList ด้วย `useQuery` + `useMutation`
- Build CategoryForm ด้วย RHF + Zod + mutation
- Apply pattern เดียวกันสำหรับ ProductList + ProductForm
- เห็น cache invalidation flow ทำงาน

### Format: Live build together

ทุก student พิมพ์ตามใน VS Code ของตัวเอง. ผมพิมพ์ Categories — Products = exercise

### 💬 Lecture (~7 min)

**1. CRUD UI architecture** (4 min)

```
Page (Server Component)
  ↓ render
List (Client Component)
  ↓ useQuery → fetch list
  ↓ useMutation → DELETE

  + Dialog wrapper for Create/Edit
       ↓ render
       Form (Client Component)
         ↓ RHF + Zod + useMutation → POST/PATCH
         ↓ onSuccess → invalidate cache + close dialog
```

**2. TanStack Query patterns we'll use** (3 min)

- `useQuery({ queryKey, queryFn })` — fetch + cache
- `useMutation({ mutationFn, onSuccess, onError })` — write + side effect
- `qc.invalidateQueries({ queryKey })` — mark cache stale → refetch
- `mutation.mutate(input)` — trigger
- `mutation.isPending` — loading state

### 🖥️ Live Build (~38 min)

**1. Add shadcn dialog + table** (Task 9.1 — 2 min)

```bash
cd apps/web
pnpm dlx shadcn@latest add dialog table
```

**2. Menu page (entry point)** (Task 9.2 — 2 min)

```tsx
// app/(admin)/admin/menu/page.tsx
import { CategoryList } from './components/category-list';
import { ProductList } from './components/product-list';

export default function AdminMenuPage() {
  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold">จัดการเมนู</h1>
      <CategoryList />
      <ProductList />
    </div>
  );
}
```

**3. CategoryList — instructor demos in full** (Task 9.3 — 12 min)

(พิมพ์ตาม Plan, อธิบายระหว่างพิมพ์)

📢 **Walking through**:

```ts
const { data: categories = [], isLoading } = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => apiFetch<Category[]>('/menu/categories'),
});
```

> "queryKey = identity of cache. queryFn = fetcher. data, isLoading, error คือ output"

```ts
const removeMutation = useMutation({
  mutationFn: (id: string) => apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }),
  onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  onError: (error) => alert(`ลบไม่ได้: ${error.message}`),
});
```

> "Mutation = write. onSuccess: invalidate → list refetch อัตโนมัติ"

```tsx
{
  categories.map((c) => (
    <TableRow key={c.id}>
      ...
      <Button onClick={() => removeMutation.mutate(c.id)}>ลบ</Button>
    </TableRow>
  ));
}
```

> "Click → mutation.mutate(id) → fetch DELETE → onSuccess → cache invalidate → useQuery refetch → list update"

โชว์ใน DevTools:

- Network tab → DELETE request
- React Query Devtools → cache update

**4. CategoryForm** (Task 9.4 — 10 min)

(พิมพ์ตาม Plan)

📢 **Walking through**:

```ts
const isEdit = !!category;
const mutation = useMutation({
  mutationFn: (input) =>
    apiFetch(isEdit ? `/menu/categories/${category!.id}` : '/menu/categories', {
      method: isEdit ? 'PATCH' : 'POST',
      body: input,
    }),
  onSuccess: () => {
    qc.invalidateQueries({ queryKey: queryKeys.categories });
    onSuccess();
  },
});
```

> "Same form for create + edit. Pass `category` prop ถ้า edit. POST vs PATCH ตาม mode"

```ts
defaultValues: category ? {
  name: category.name, sortOrder: category.sortOrder,
} : undefined,
```

> "RHF defaultValues — pre-fill ถ้า edit"

**5. ทดสอบ Categories CRUD** (3 min)

- Create "เครื่องดื่ม" → list refresh
- Edit → list refresh
- Delete → list refresh
- Try delete with products (ทำหลัง products) → 409 alert

**6. ProductList + ProductForm — students build (in-class exercise)** (Task 9.5 — 11 min)

📢 **บอก class**:

> "Pattern เหมือน Category — copy + ปรับ fields. **คุณพิมพ์ผมดู** — 11 นาที. ติดอะไรยกมือ"

ระหว่างที่ student พิมพ์:

- Walk around ดูใครติด
- Common issues:
  - Field type ผิด (price: string vs number) → use `valueAsNumber: true`
  - categoryId select dropdown ขาด — ต้องดึง categories ผ่าน useQuery แล้ว map options
  - imageUrl optional เลย — Zod `.nullable().optional()`

ทุก ~3 นาที check in: "ใครยังไม่จบ Step X?"

**ถ้าหมดเวลา** → instructor พิมพ์ฟinish + commit ให้ดู, ทุกคน copy reference

Commit:

```bash
git commit -m "feat(web): add admin Menu CRUD UI"
```

### ❓ Common Questions (Block F)

| Q                                                       | A                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `qc.invalidateQueries` กับ `qc.refetchQueries` ต่างกัน? | invalidate = mark stale → refetch ตาม trigger ปกติ. refetch = force refetch now |
| Optimistic updates ทำยังไง?                             | `onMutate: () => set cache directly` + rollback ใน `onError`. Stretch — ดู docs |
| Multiple mutations parallel — race condition?           | TanStack จัดการให้: invalidate after success → next refetch รวมทุก writes       |
| `mutation.isPending` UX                                 | disable button + show spinner — ตัวอย่าง: `disabled={mutation.isPending}`       |

---

## 🌐 Block G: Wire Storefront to Live API (105-115 min, 10 min)

### 🎯 Block Goals

- Server Component fetch จริง (ไม่ใช่ mock)
- เห็นผล: เพิ่ม product ใน admin → storefront เห็นทันที

### 🖥️ Live Demo (~10 min)

**1. ปรับ menu page** (Task 10.1-10.2 — 6 min)

(พิมพ์ตาม Plan)

📢 **เน้นจุดสำคัญ**:

- `async function MenuPage()` — Server Component fetch ตรง
- `getServerToken()` → ใส่ Bearer ถ้ามี (admin browse menu ก็ดี)
- `cache: 'no-store'` — Course ไม่ cache (Week 5 ค่อย optimize ด้วย ISR)
- ใช้ Promise.all → fetch 2 endpoints parallel

```tsx
const [products, categories] = await Promise.all([fetchProducts(), fetchCategories()]);
```

**2. ปรับ MenuCard** (Task 10.2 — 2 min)

แก้ component ให้รับ `Product` (จาก shared) แทน `MenuItem` (mock)

**3. ลบ mock data + verify** (Task 10.3-10.4 — 2 min)

```bash
rm apps/web/lib/data/menu.ts
```

ทดสอบ:

1. Logout (storefront ไม่ต้อง auth)
2. ไป `/menu` → เห็น products จริงจาก DB ✓
3. Login admin → เพิ่ม product ใหม่
4. กลับ `/menu` → refresh → เห็น product ใหม่

Commit:

```bash
git commit -m "feat(web): wire storefront /menu to live NestJS API"
```

📢 **Big moment**:

> "🎉 First end-to-end slice complete. Schema เปลี่ยนใน `packages/shared` ตัวเดียว → BE validate + FE form + storefront ทุกที่ใช้ตามอัตโนมัติ"

---

## 🏁 Wrap-up + Week 4 Preview (115-120 min, 5 min)

### Recap (2 min)

- "httpOnly cookie ปลอดภัยจาก XSS เพราะอะไร?"
- "useMutation + invalidateQueries ทำงานยังไง?"
- "Server Component fetch ใช้ pattern อะไรพิเศษ?"

### Week 4 Preview (3 min)

Goal: Order flow — ลูกค้าสั่งของ + Kitchen UI

จะใช้:

- ✅ Zod schemas (Wk1) — เพิ่ม OrderSchema
- ✅ Prisma transactions (Wk2)
- ✅ NestJS modules + Guards (Wk2-3)
- ✅ TanStack Query (Wk3) — Order list + status updates
- ✅ Auth + middleware (Wk3) — protect /kitchen

🆕

- Zustand (cart state)
- Order tracking page (polling)
- Kitchen UI (STAFF role)
- Atomic order creation transaction

Pre-Week 4: light — make sure Week 3 commit pushed + DB has menu data

### Final Q&A

รับคำถามเปิด

---

## 📝 Post-Session Self-Review (instructor)

| Item                                               | Note   |
| -------------------------------------------------- | ------ |
| ทุกคน Login + admin CRUD ทำงานครบ?                 | \_\_\_ |
| ProductList exercise — ใครยังไม่จบ?                | \_\_\_ |
| Storefront wire — ทุกคนเห็น real data?             | \_\_\_ |
| Concept ที่ติด: cookies / mutations / invalidation | \_\_\_ |
| Block ไหน over-run มากสุด?                         | \_\_\_ |
| Week 4 readiness — มีคนไหนต้อง 1-on-1?             | \_\_\_ |

---

## 🔗 Connection to Week 4

Week 4 = "Order Flow" — build บน Week 3 ทุกอย่าง:

- Same monorepo + schemas pattern
- Same NestJS module pattern
- Same admin layout (เพิ่ม Orders tab)
- Same TanStack Query patterns
- Same login/middleware (เพิ่ม STAFF role check สำหรับ /kitchen)

> "Week 3 = เรียน pattern. Week 4-5 = ใช้ pattern ซ้ำในอีก domain"
