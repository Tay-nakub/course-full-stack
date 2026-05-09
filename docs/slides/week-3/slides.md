---
theme: seriph
title: 'Coffee Shop Course — Week 3'
info: |
  ## Week 3 — Backend Menu CRUD + Storefront Wire-up
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

## Week 3 · Session 1
### Backend Menu CRUD + Plumbing

<div class="muted mt-8 text-sm">
First end-to-end slice begins here
</div>

<!--
Welcome back. Week 1 = FE, Week 2 = BE. วันนี้คือวันที่ 2 ฝั่งคุยกันครั้งแรก.
-->

---
layout: center
---

# Where We Are

```text
Week 1: FE foundation         ✅
Week 2: BE foundation         ✅
Week 3: Connect them          ⬅ HERE

           ┌── Storefront (FE) ──┐
           │                     │
           ▼                     │
  ┌── Real data from DB ──┐     │
  │  via NestJS API        │  ◄──┘
  └────────────────────────┘
```

<div class="mt-6 muted">วันนี้คือ "first slice" — งานเล็กแต่ครบทุก layer</div>

---

# Today's Goal

<div class="mt-6 text-lg">

จบ Session นี้ คุณจะมี:

<v-clicks>

- ✅ Menu schemas ใน <code>packages/shared</code>
- ✅ Prisma `Category` + `Product` models migrated
- ✅ NestJS Menu module (Category + Product CRUD)
- ✅ <span class="coffee">9+ unit tests</span> passing
- ✅ Next.js dev rewrites + `apiFetch` wrapper
- ✅ TanStack Query setup + DevTools
- 🟡 UI build <span class="muted">→ Session 2</span>

</v-clicks>

</div>

---
layout: center
---

# One Schema, Two Sides

```text
        packages/shared/schemas/menu.ts
        ┌────────────────────────┐
        │ CreateProductSchema    │
        │ z.object({             │
        │   name: z.string()...  │
        │   price: z.number()... │
        │ })                     │
        └──────┬─────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
   apps/web      apps/api
   ───────────   ───────────────────
   RHF +         ZodValidationPipe
   zodResolver    in @Post() body

   FE validate   BE validate
   Same errors   Same errors
   Same types    Same types
```

<div class="mt-4 text-center coffee">Schema เปลี่ยน 1 ที่ → ทุกชั้น sync</div>

---

# NestJS CRUD Service Pattern

```ts
@Injectable()
class XService {
  findAll()         // list
  findOne(id)       // detail (throw 404 if not found)
  create(input)     // INSERT
  update(id, input) // UPDATE (validate exists first)
  remove(id)        // DELETE (validate constraints first)
}
```

<div class="mt-6 muted">

Same shape ทุก module: Auth / Menu / Order / Inventory / Reports.<br>
Master pattern นี้ → <span class="coffee">5x speed</span> ใน Weeks 4-6.

</div>

---

# Service vs Controller

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Controller

- HTTP routing
- `@Get`, `@Post`, `@Patch`
- No business logic
- Delegates to Service

</div>

<div>

### Service <span class="coffee">←</span>

- Business rules
- Validation
- Permission checks
- Transaction handling

</div>

</div>

<div class="mt-6 text-center text-lg">
Controller calls Service · Service calls Prisma
</div>

<div class="mt-6 muted text-center text-sm">
Why split? — Test service alone (mock Prisma). Reuse service ข้าม HTTP / CLI / queue.
</div>

---

# Public Read, Admin Write

```ts
@Get()
list()  // public

@Get(':id')
get()   // public

@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
create() // admin only

@Patch(':id') / @Delete(':id')
@UseGuards(...) @Roles('ADMIN')
// ditto
```

<div class="mt-4 muted text-center">Pattern ปกติของ <span class="coffee">catalog-style</span> data</div>

---
layout: center
---

# The Cross-Origin Problem

```text
Dev:
  Browser   localhost:3000  ─?─►  localhost:4000

  Different origin = ❌ CORS preflight
                     ❌ Cookies don't share
```

<div class="mt-4 mb-2 text-lg coffee text-center">Solution: Next.js rewrites</div>

```text
  Browser  localhost:3000  ─►  /api/menu/products
                                       │
                              Next.js proxies
                                       │
                                       ▼
                              NestJS:4000

  Same origin = ✅ no CORS, ✅ cookies work
```

---

# TanStack Query Mental Model

```text
Component A                     Component B
   │                                │
   │ useQuery({                     │ useQuery({
   │   queryKey: ['users']          │   queryKey: ['users']
   │   queryFn: fetchUsers          │   queryFn: fetchUsers
   │ })                             │ })
   │                                │
   └──────────┐         ┌───────────┘
              ▼         ▼
        ┌─────────────────┐
        │   Cache         │
        │ key: ['users']  │
        │ data, isLoading │  ← shared
        │ refetch logic   │
        └─────────────────┘
              │
       Single fetch
       Both components updated
```

<div class="mt-4 muted">
<code>useMutation</code> → write → <code>onSuccess: invalidateQueries</code> → auto refetch
</div>

---

# 📝 Homework + Recap

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Homework <span class="muted">(~3 hrs)</span>

**Postman practice:**

- [ ] 3 categories + 6 products
- [ ] Edge cases (delete with products → 409)

**Pre-build admin** <span class="muted">(preview S2):</span>

- [ ] Skeleton `CategoryList` with `useQuery` (display only)

**Reading:**

- [ ] TanStack — Mutations + Invalidation

</div>

<div>

### 🎯 Recap quiz

<v-clicks>

1. Schema เดียวสองฝั่ง — implement ยังไง?
2. Public read vs admin write — guards?
3. ทำไม `useState(() => new QueryClient())`?

</v-clicks>

</div>

</div>

---
layout: cover
---

# ☕ Session 2

## Week 3 · Session 2
### Login + Admin CRUD + Wire UP

<div class="muted mt-8 text-sm">First slice goes LIVE today</div>

---
layout: center
---

# Today's Outcome

```text
End state:

  Login เป็น admin
        ↓
  /admin/menu → CRUD เมนูผ่าน UI
        ↓
  Logout
        ↓
  /menu (storefront) → เห็น data จริงจาก DB
```

<div class="mt-6 text-center coffee text-xl">→ First end-to-end slice complete</div>

---

# Why Proxy Pattern (Not Direct)

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ FE → NestJS direct

```text
Token in localStorage
   ↓
XSS = steal token
```

</div>

<div>

### ✅ FE → Next.js → NestJS

```text
Set httpOnly cookie
   ↓
JS can't read = XSS-safe
```

</div>

</div>

```text
FE ─────► Next.js Route Handler
             │  proxy
             ▼
          NestJS
             │
             ▼
   Set httpOnly cookie (response)
```

<div class="mt-4 text-center coffee">JS-invisible token = security upgrade</div>

---

# Cookie Attributes

```ts
response.cookies.set({
  name: 'coffee_token',
  value: data.accessToken,
  httpOnly: true,        // JS read = ❌
  sameSite: 'lax',       // CSRF mitigation
  path: '/',             // available everywhere
  maxAge: 7 * 86400,     // 7 days
  secure: prod,          // HTTPS only
});
```

<div class="mt-6 text-center text-xl coffee">
Each attribute = security choice
</div>

<!--
อธิบายแต่ละ attribute สั้นๆ. sameSite=lax คือ default safe choice.
-->

---

# Cookie vs Header Tradeoffs

<div class="text-sm mt-4">

| | Header + localStorage | httpOnly Cookie |
|---|---|---|
| **XSS** | ❌ vulnerable | ✅ safe |
| **CSRF** | ✅ safe | ⚠️ mitigate via SameSite |
| **Mobile / native** | ✅ easy | ⚠️ cookie jar |
| **Cross-origin** | ✅ trivial | ❌ same domain |

</div>

<div class="mt-8 text-center text-lg">
Course web app: <span class="coffee">cookie wins</span> <span class="muted">(XSS > CSRF in real-world)</span>
</div>

---
layout: center
---

# Next.js Middleware

```text
Request
   │
   ▼
middleware.ts        ← runs at edge, BEFORE route
   │                   - read cookies
   ├── allow ──► route handler
   ├── redirect
   └── rewrite
```

<div class="grid grid-cols-2 gap-6 mt-6 text-sm">

<div>

### Edge runtime

- ✅ Fast (V8 isolates)
- ❌ No Node APIs (`fs`, `crypto.createHash`)

</div>

<div>

### Strategy: short-circuit

- Token exists? Allow.
- No token? Redirect to `/login`.
- Verify JWT? At NestJS, not edge.

</div>

</div>

---

# Admin UI Architecture

```text
Page (Server Component)
  │
  └─► CategoryList (Client Component)
        │
        ├── useQuery → fetch list
        ├── useMutation → DELETE
        │
        └─► Dialog wrapper
              │
              └─► CategoryForm (Client)
                    ├── RHF + Zod
                    └── useMutation → POST/PATCH
                          │
                          onSuccess:
                            qc.invalidateQueries()
                            close dialog
```

---
layout: center
---

# Mutation Lifecycle

```text
1. user.click("ลบ")
        ↓
2. mutation.mutate(id)
        ↓
3. fetcher → DELETE /api/menu/categories/:id
        ↓
4. NestJS responds (200 / 409 / 500)
        ↓
5a. onSuccess:                  5b. onError:
    qc.invalidateQueries()           alert(error.message)
        ↓
6. useQuery sees cache stale
        ↓
7. Auto refetch list
        ↓
8. Component re-renders with new list
```

---

# Server Component Fetch (Storefront)

```tsx
// Server Component — runs on server
async function MenuPage() {
  const token = await getServerToken();

  const products = await fetch(
    'http://localhost:4000/api/menu/products?active=true',
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    }
  ).then(r => r.json());

  return <Grid products={products} />;
}
```

<div class="mt-4 muted">

No `useEffect`, no `useQuery`. Server fetches at request time.<br>
HTML streams to client with data <span class="coffee">baked in</span>.

</div>

---

# 🎉 Week 4 Preview

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Week 4 — Order Flow

<v-clicks>

- 🆕 Zustand (cart state)
- 🆕 Order placement (atomic Prisma transaction)
- 🆕 Order tracking (polling)
- 🆕 Kitchen UI (STAFF role)

</v-clicks>

</div>

<div>

### Reuse from Week 3

- ✅ Schema pattern (1 schema, 2 sides)
- ✅ NestJS CRUD pattern
- ✅ Auth middleware
- ✅ TanStack Query patterns
- ✅ Admin layout

</div>

</div>

<div class="mt-8 text-center text-xl coffee">
Week 3 = learn pattern. Week 4-5 = apply across domains.
</div>

<style>
.coffee { color: #f5a623; font-weight: 600; }
.muted { color: #a6adc8; }
</style>
