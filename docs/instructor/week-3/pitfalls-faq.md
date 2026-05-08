# Week 3 — Pitfalls & FAQ

**Audience:** instructor — เปิดตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls

### Pitfall #1: Login สำเร็จ แต่ไม่มี cookie set

**Symptom**: 200 response, but `coffee_token` ไม่อยู่ใน Application → Cookies

**Common causes**:
1. **Same-origin issue** — fetch ไป `localhost:4000` ตรงๆ → cookie set ไม่ได้ (cross-origin)
2. **Forgot Next.js rewrites** in `next.config.ts`
3. **Route Handler returns wrong** (set cookie on wrong response object)

**Quick check**:
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffee.com","password":"password123"}'
```
ดู `Set-Cookie` header — ถ้าไม่มี → Route Handler ผิด

**Fix**:
- Verify `next.config.ts` มี rewrites
- Verify Route Handler ใช้ `NextResponse.json(...).cookies.set(...)` ไม่ใช่ `response.headers.append(...)` (low-level)

---

### Pitfall #2: useQuery ไม่ refetch หลัง mutation

**Symptom**: Create category → list ไม่อัปเดต ต้องรีเฟรชหน้า

**Causes**:
1. **queryKey ไม่ตรง** — list ใช้ `['categories']`, invalidate เรียก `['category']`
2. **ลืม `qc.invalidateQueries()`** ใน `onSuccess`
3. **`refetchOnWindowFocus: false`** + invalidate ไม่ทำงานเพราะ component unmount

**Fix**:
- Standardize queryKeys ใน `lib/query-keys.ts` (single source)
- Always:
  ```ts
  onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories })
  ```

**Debug**:
- เปิด React Query Devtools
- ดู cache key ก่อน vs หลัง mutation
- Devtools มี "trigger: invalidate" log

---

### Pitfall #3: Middleware redirect loop

**Symptom**: เปิด `/admin` → redirect ไป `/login` → redirect ไป `/admin` → loop

**Cause**: Login page ตัวเองโดน middleware match เพราะ matcher กว้างเกิน

**Fix**:
- Verify matcher: `matcher: ['/admin/:path*']` (เฉพาะ /admin, ไม่กิน /login)
- ถ้า matcher = `'/((?!login).*)'` (regex exclude) — verify spelling

---

### Pitfall #4: Server Component fetch ใช้ wrong URL

**Symptom**: `MenuPage` Server Component fetch error: `ECONNREFUSED` หรือ `fetch failed`

**Cause**:
- Server Component runs on server (Node.js) — `/api/...` relative path = current origin
- ใน dev: Next.js running, but fetch from server-side → loopback to itself? Or what?
- จริงๆ Server Component fetch relative paths ไม่ resolve ถูก (ไม่มี origin)

**Fix**:
- ใช้ absolute URL: `process.env.NESTJS_INTERNAL_URL` (e.g., `http://localhost:4000`)
- ห้าม `/api/...` relative ใน Server Component
- (Client Component OK — browser มี origin)

```tsx
// ❌ Server Component
const res = await fetch('/api/menu/products');   // fails

// ✅
const res = await fetch(`${process.env.NESTJS_INTERNAL_URL}/api/menu/products`);
```

---

### Pitfall #5: TanStack Query SSR mismatch

**Symptom**: Console warning "Hydration failed" หรือ data flicker หลัง mount

**Cause**: Server rendered with empty cache, client rendered with fetched data → mismatch

**Fix**:
- Course ไม่ใช้ `useQuery` ใน Server Component (เราใช้ direct fetch)
- ใน Client Component → `useQuery` → SSR not relevant (no data on server)
- ถ้าต้อง prefetch บน server → ใช้ `dehydrate/hydrate` pattern (advanced)

---

### Pitfall #6: Form submits multiple times

**Symptom**: Click submit fast → 2-3 categories created with same data

**Cause**: Button ไม่ disabled ระหว่าง mutation

**Fix**:
```tsx
<Button type="submit" disabled={isSubmitting || mutation.isPending}>
  {mutation.isPending ? 'กำลังบันทึก...' : 'เพิ่ม'}
</Button>
```

---

### Pitfall #7: Cookie not sent in production

**Symptom**: Dev OK, prod fail with 401

**Causes**:
1. **`secure: true`** in cookie options — but prod uses HTTP (not HTTPS yet)
2. **Different domain** — cookie set on www.example.com, fetch goes to api.example.com
3. **`credentials: 'include'`** missing in fetch

**Fix** (Week 6 will address):
- Use Caddy auto-HTTPS in prod
- Same domain (`/api/*` proxies via Caddy)
- All fetches in apiFetch use `credentials: 'include'`

---

### Pitfall #8: `Decimal` price displays weird

**Symptom**: Product price renders as `"75"` (string with quotes) or scientific notation

**Cause**: Prisma `Decimal` serializes as string in JSON

**Fix**:
```tsx
{`฿${Number(product.price)}`}    // convert to number first
// หรือ
{`฿${product.price.toString()}`}  // ถ้า want exact string format
```

---

### Pitfall #9: ZodValidationPipe error message ไม่ขึ้น

**Symptom**: ส่ง invalid body → 500 error แทน 400

**Cause**: `nestjs-zod` ไม่ได้ register ใน module หรือ schema ผิด

**Fix**:
- ตรวจ `pnpm list nestjs-zod` ใน apps/api
- ใช้ `@Body(new ZodValidationPipe(Schema))` syntax (constructor with schema)
- ถ้ายังพัง → fallback: validate manually:
  ```ts
  const parsed = Schema.safeParse(body);
  if (!parsed.success) throw new BadRequestException(parsed.error);
  ```

---

### Pitfall #10: `cookies()` returns Promise (Next.js 15)

**Symptom**: `cookies().get(...)` errors: "Property 'get' does not exist on type 'Promise<...>'"

**Cause**: Next.js 15 made `cookies()` async

**Fix**:
```ts
// ❌ Old (Next.js 14)
const cookieStore = cookies();
const token = cookieStore.get('coffee_token')?.value;

// ✅ New (Next.js 15)
const cookieStore = await cookies();
const token = cookieStore.get('coffee_token')?.value;
```

Same for `headers()` and `params` in dynamic routes

---

## ❓ Extended FAQ

### Cross-Stack Debugging

**Q: Bug ไหนอยู่ใน FE ไหนใน BE?**
A:
- เปิด **DevTools Network tab** ดู request:
  - `/api/...` request fail = check NestJS terminal
  - `/api/...` 200 OK + UI ผิด = FE issue
- เปิด NestJS log — มี request log ไหม?
- ดู Response body ใน Network tab — error message บอกอะไร

**Q: API request ไป NestJS แต่ไม่มี response**
A:
- Hits proxy ไหม? — เช็ค Next.js terminal (มี log forward request)
- NestJS รัน + listening :4000 ไหม?
- Postman ตรงๆ ที่ `localhost:4000/api/...` ทำงานไหม?

---

### TanStack Query

**Q: เมื่อไหร่ใช้ useQuery vs useMutation?**
A:
- `useQuery` = read (GET). Auto-cache, refetch on focus
- `useMutation` = write (POST/PATCH/DELETE). Manual trigger, side effects

**Q: queryKey ใส่ array vs string?**
A: Both work, but array preferred — supports parameters:
```ts
['products']                          // all products
['products', { active: true }]        // filtered
['products', productId]               // single
```

**Q: `staleTime: 0` vs default?**
A: `0` = always stale → refetch on every mount/focus. Default `0` actually. Course ใช้ `60_000` = 1 min cache (less network)

**Q: ป้องกัน double-fetch ตอน mount?**
A:
```ts
useQuery({
  queryKey: ['x'],
  queryFn: fetcher,
  staleTime: Infinity,    // never stale
});
```
ใช้กับ data ที่ไม่เปลี่ยน (constants, lookups)

**Q: Mutation รอ multiple updates?**
A: ใช้ `useMutation` หลายตัว — invalidate keys ที่กระทบ. หรือ batch ด้วย Promise.all

---

### Next.js Cookies + Middleware

**Q: `cookies()` ใน Server Component vs Server Action vs Route Handler?**
A: Same API — `await cookies()`. Set/delete แค่ใน Server Action / Route Handler (Server Component อ่านได้ แต่ set ไม่ได้)

**Q: Middleware ทำ auth verify จริงๆ ได้ไหม?**
A: Edge runtime → ไม่มี Node crypto. Workaround:
- Use `jose` library (Edge-compatible) verify JWT
- หรือ verify ที่ Server Component / Route Handler (Node runtime)

**Q: Middleware รันทุก request — performance?**
A: ใช่. Edge runtime fast (~5-10ms). Use `matcher` exclude routes ที่ไม่ต้อง check (เช่น `/_next/*`, static files)

**Q: Cookie size limit?**
A: ~4KB per cookie. JWT payload ~500-1000 bytes — fits. ถ้าใหญ่ → use session ID (DB lookup)

---

### NestJS Patterns

**Q: เมื่อไหร่ throw exception vs return error?**
A: Throw — ใช้กับ unexpected/error path (404 not found, 401 unauthorized). Return — happy path

**Q: Service ทำ HTTP call ไป external API ได้ไหม?**
A: ได้ — inject `HttpService` (`@nestjs/axios`) หรือใช้ native fetch. Course ไม่มี external — skip

**Q: เพิ่ม controller method ที่ไม่ใช้ guard?**
A: Default = no guard. ใส่ `@UseGuards()` เฉพาะที่ต้อง

**Q: Custom exception filter?**
A: `@Catch()` decorator + implement `ExceptionFilter` interface. Course ใช้ default — sufficient

---

### Prisma Relations

**Q: `include` vs `select` performance?**
A:
- `include: { category: true }` — fetch all category fields (extra bandwidth)
- `select: { category: { select: { name: true } } }` — fetch only what needed

Course ใช้ `include` (simpler). Optimization = stretch

**Q: N+1 query problem?**
A: Prisma default ใช้ JOIN เป็น batched fetch — ไม่เป็น N+1 ส่วนใหญ่. Verify: `prisma.$on('query', console.log)` ดู SQL

**Q: Transactions ตรงไหน?**
A: Week 4 (atomic order create). Week 5 (stock deduct on order completed). Pattern:
```ts
await prisma.$transaction(async (tx) => {
  await tx.order.create({ ... });
  await tx.stockMovement.create({ ... });
});
```

---

### Forms

**Q: RHF + Zod + `valueAsNumber` ทำไม?**
A: HTML input value = string เสมอ. RHF default = string. Zod expects number for `z.number()`. `valueAsNumber: true` → RHF parse เป็น number ก่อน validate

**Q: Optional fields กับ Zod?**
A:
- `z.string().optional()` → undefined OK
- `z.string().nullable()` → null OK
- `z.string().nullable().optional()` → both
- `z.string().or(z.literal(''))` → empty string OK (HTML form quirk)

**Q: Reset form หลัง submit?**
A: `form.reset()` ใน `onSuccess` — RHF API. Or close dialog (which unmounts form)

---

### Misc

**Q: Storefront ทำ static / SSG ได้ไหม?**
A: Course ใช้ `cache: 'no-store'` — always fresh. Static = `cache: 'force-cache'` + revalidate. Week 5 ค่อย optimize

**Q: SEO?**
A: Storefront ใช้ Server Components → SEO friendly automatically. Add `<Metadata>` per page if needed

**Q: API rate limiting?**
A: Stretch — `@nestjs/throttler`. Course skip — single user / small class

---

## 🆘 Emergency Recovery

### Reset everything in dev (clean slate)

```bash
# DB
pnpm db:down
docker volume rm course-full-stack_postgres_dev_data
pnpm db:up

# Re-apply migrations
cd apps/api
pnpm prisma migrate dev

# Re-create admin user via Postman
# - Register
# - SQL: UPDATE users SET role='ADMIN' WHERE email='admin@coffee.com';

# Web cache
rm -rf apps/web/.next
pnpm dev
```

### React Query cache out of sync

```ts
// Devtools → "Clear all queries"
// หรือใน code:
queryClient.clear();
```

### Cookie stuck (login loop)

```bash
# Browser DevTools → Application → Cookies → delete all
# หรือ:
fetch('/api/auth/logout', { method: 'POST' });
```

---

## 📊 Common Mistakes Heatmap (อัปเดตหลังสอน)

| Mistake | Frequency | Notes |
|---|---|---|
| Server Component fetch with relative URL | TBD | — |
| useQuery in Server Component | TBD | — |
| queryKey typo / mismatch | TBD | — |
| Middleware redirect loop | TBD | — |
| `valueAsNumber` forgotten | TBD | — |
| Decimal serialize as string | TBD | — |
| `cookies()` await missing | TBD | — |
