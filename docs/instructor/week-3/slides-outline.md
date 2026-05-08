# Week 3 — Slides Outline

**Audience:** instructor — สำหรับ build slides

**Total slides target:** ~20 slides สำหรับ 2 sessions

---

## 🎬 Session 1 Slides (10 slides) — Backend + Client Plumbing

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 3 · Session 1             │
│       Backend Menu CRUD + Plumbing   │
│                                      │
│   First end-to-end slice begins here │
└──────────────────────────────────────┘
```

### Slide 1.02 — Where We Are

```
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

### Slide 1.03 — Today's Goal

```
จบ Session นี้ คุณจะมี:

✓ Menu schemas ใน packages/shared
✓ Prisma Category + Product models migrated
✓ NestJS Menu module (Category + Product CRUD)
✓ 9+ unit tests passing (auth + category + product)
✓ Next.js dev rewrites + apiFetch wrapper
✓ TanStack Query setup + DevTools
🟡 UI build → Session 2
```

### Slide 1.04 — One Schema, Two Sides

```
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
   ───────────   ───────────
   RHF +         ZodValidationPipe
   zodResolver    in @Post() body
   
   FE validate   BE validate
   Same errors   Same errors
   Same types    Same types

  Schema เปลี่ยน 1 ที่ → ทุกชั้น sync
```

### Slide 1.05 — NestJS CRUD Service Pattern

```
@Injectable()
class XService {
  findAll()         ← list
  findOne(id)       ← detail (throw 404 if not found)
  create(input)     ← INSERT
  update(id, input) ← UPDATE (validate exists first)
  remove(id)        ← DELETE (validate constraints first)
}

  Same shape ทุก module:
  - Auth/Menu/Order/Inventory/Reports
  Master this pattern → 5x speed for Weeks 4-6
```

### Slide 1.06 — Service vs Controller

```
Controller                Service
─────────────────────     ─────────────────────
HTTP routing              Business rules
@Get, @Post, @Patch       validation
no business logic         permission checks
delegates to Service      transaction handling

   Controller calls       Service calls
   Service                Prisma

  Why? — Test service alone (mock Prisma)
        Reuse service across HTTP / CLI / queue
```

### Slide 1.07 — Public Read, Admin Write

```
┌──────────────────────────────────────┐
│ @Get()                                │
│   list()  → public                    │
│                                        │
│ @Get(':id')                           │
│   get()   → public                    │
│                                        │
│ @Post()                               │
│ @UseGuards(JwtAuthGuard, RolesGuard)  │
│ @Roles('ADMIN')                       │
│   create() → admin only               │
│                                        │
│ @Patch(':id') / @Delete(':id')        │
│ @UseGuards(...) @Roles('ADMIN')       │
│   ditto                                │
└──────────────────────────────────────┘

  Pattern ปกติของ catalog-style data
```

### Slide 1.08 — The Cross-Origin Problem

```
Dev:                                                    
  Browser   localhost:3000  ─?─►  localhost:4000        
                                                         
  Different origin = ❌ CORS preflight                   
                     ❌ Cookies don't share              
                                                         
                                                         
Solution: Next.js rewrites                              
  next.config.ts:                                        
  rewrites: [{ source: '/api/:path*',                   
               destination: 'http://localhost:4000/...'}]
                                                         
  Browser  localhost:3000  ─►  /api/menu/products       
                                       │                 
                              Next.js proxies            
                                       │                 
                                       ▼                 
                              NestJS:4000                
                                                         
  Same origin = ✅ no CORS, ✅ cookies work             
```

### Slide 1.09 — TanStack Query Mental Model

```
Component A                     Component B
   │                                │
   │ useQuery({                     │ useQuery({
   │   queryKey: ['users']           │   queryKey: ['users']
   │   queryFn: fetchUsers          │   queryFn: fetchUsers
   │ })                              │ })
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
       
useMutation → write → onSuccess: invalidateQueries → auto refetch
```

### Slide 1.10 — Wrap-up + Homework

```
📝 HOMEWORK (~3 hrs)

Postman practice:
□ 3 categories + 6 products
□ Test edge cases (delete with products → 409)

Pre-build admin (preview Session 2):
□ Skeleton CategoryList with useQuery (display only)

Reading:
□ TanStack Query — Mutations + Invalidation

─── 🎯 RECAP ───────────────────
1. Schema เดียวสองฝั่ง — implement ยังไง?
2. Public read vs admin write — guards?
3. ทำไม useState(() => new QueryClient())?
```

---

## 🎬 Session 2 Slides (10 slides) — Login + Admin UI + Wire Storefront

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 3 · Session 2             │
│       Login + Admin CRUD + Wire UP   │
│                                      │
│       First slice goes LIVE today    │
└──────────────────────────────────────┘
```

### Slide 2.02 — Today's Outcome

```
End state:

  Login เป็น admin
        ↓
  /admin/menu → CRUD เมนูผ่าน UI
        ↓
  Logout
        ↓
  /menu (storefront) → เห็น data จริงจาก DB

  → First end-to-end slice complete
```

### Slide 2.03 — Why Proxy Pattern (Not Direct)

```
❌ FE ─────► NestJS                       
            (token in localStorage)        
            XSS = steal token              

✅ FE ─────► Next.js Route Handler        
                 │                         
                 │ proxy                   
                 ▼                         
              NestJS                       
                 │                         
                 ▼                         
        Set httpOnly cookie               
        (JS can't read = XSS-safe)        

  JS-invisible token = security upgrade
```

### Slide 2.04 — Cookie Attributes

```
response.cookies.set({
  name: 'coffee_token',
  value: data.accessToken,
  httpOnly: true,        ← JS read = ❌
  sameSite: 'lax',       ← CSRF mitigation
  path: '/',             ← available everywhere
  maxAge: 7 * 86400,     ← 7 days
  secure: prod,          ← HTTPS only
});

  Each attribute = security choice
```

### Slide 2.05 — Cookie vs Header Tradeoffs

```
                  Header+localStorage  httpOnly Cookie
                  ───────────────────  ────────────────
XSS                   ❌ vulnerable        ✅ safe
CSRF                  ✅ safe              ⚠️ mitigate via
                                            SameSite
Mobile / native       ✅ easy              ⚠️ cookie jar
Cross-origin          ✅ trivial           ❌ same domain
                                                         
  Course web app: cookie wins (XSS > CSRF in real-world)
```

### Slide 2.06 — Next.js Middleware

```
Request
   │
   ▼
middleware.ts        ← runs at edge, BEFORE route
   │                   - read cookies
   ├── allow ──► route handler
   ├── redirect
   └── rewrite

Edge runtime:
  ✅ Fast (V8 isolates)
  ❌ No Node APIs (fs, crypto.createHash)
  
Strategy: short-circuit
  - Token exists? Allow.
  - No token? Redirect to /login.
  - Verify JWT? At NestJS, not edge.
```

### Slide 2.07 — Admin UI Architecture

```
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

### Slide 2.08 — Mutation Lifecycle

```
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

### Slide 2.09 — Server Component Fetch (Wire Storefront)

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

  No useEffect, no useQuery
  Server fetches at request time
  HTML streams to client with data baked in
```

### Slide 2.10 — Wrap-up + Week 4 Preview

```
🎉 First end-to-end slice complete!

Week 4 — Order Flow
─────────────────────
🆕 Zustand (cart state)
🆕 Order placement (atomic Prisma transaction)
🆕 Order tracking page (polling)
🆕 Kitchen UI (STAFF role)

Reuse from Week 3:
✅ Schema pattern (1 schema, 2 sides)
✅ NestJS CRUD pattern
✅ Auth middleware
✅ TanStack Query patterns
✅ Admin layout

  Week 3 = learn pattern. Week 4-5 = apply across domains.
```

---

## 🛠️ Build Notes (instructor)

### Visual Aids
- **Live network tab** during all live demos — show request/response
- **React Query Devtools** open — show cache lifecycle
- **DBeaver** open — show DB updates after mutations
- **3 windows tile**: code editor / browser+devtools / DBeaver

### Live Coding Tip
- Block F (Admin CRUD) — heaviest. Open all 4 files (CategoryList, CategoryForm, ProductList, ProductForm) ก่อน demo. Switch fast
- ProductList/Form = student exercise — instructor walk around debug live
