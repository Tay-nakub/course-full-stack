# Week 1 — Pitfalls & FAQ

**Audience:** instructor — ใช้เตรียมตัวก่อนคลาส + อ้างอิงตอนตอบคำถามใน live class

> **How to use**: อ่านครั้งหนึ่งก่อนสอน Week 1 ครั้งแรก. เปิดทิ้งไว้ตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls (เกือบทุก class จะเจอ)

### Pitfall #1: ลืม `'use client'` แล้ว debug ผิดทาง

**Symptom**: error ใน terminal:
```
Error: useState only works in Client Components.
Add the "use client" directive at the top of the file...
```

**Why students get stuck**: error message ดี แต่ student อาจไม่อ่าน เพราะ panic — focus ที่ stack trace แทน

**Quick fix**:
1. หา file ที่ใช้ `useState`
2. เพิ่ม `'use client';` บรรทัดแรก
3. Save → re-build

**Teaching opportunity**:
> "Next.js error message ส่วนใหญ่บอกวิธีแก้ตรงๆ. **อ่าน error ก่อน google**"

---

### Pitfall #2: shadcn install ที่ root แทน apps/web

**Symptom**: `pnpm dlx shadcn@latest init` รันที่ root → สร้าง config ใน wrong location

**Why happens**: instructor demo cd เข้า apps/web แล้ว — student อาจไม่ทันสังเกต

**Quick fix**:
```bash
# ลบ components.json + components/ที่ root
rm -rf components.json components/
# cd ไป apps/web ก่อน
cd apps/web
pnpm dlx shadcn@latest init
```

**Prevention**: เน้นให้ student `pwd` ก่อนทุกคำสั่ง shadcn

---

### Pitfall #3: Tailwind classes "ดูเหมือนไม่ทำงาน"

**Symptom**: ใส่ `className="text-red-500"` แต่ไม่เป็นสีแดง

**Common causes** (เรียงตามความถี่):
1. **Tailwind config `content` ไม่ครอบ file** → ตรวจ `tailwind.config.ts`:
   ```ts
   content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}']
   ```
2. **Class spelling ผิด** — `text-red-500` ไม่ใช่ `text-red500`
3. **Cache** — Stop dev → `rm -rf .next` → restart `pnpm dev`
4. **Missing `globals.css` import** ใน `app/layout.tsx`

**Quick test**:
```tsx
<div className="bg-red-500 text-white p-4">If this is red, Tailwind works</div>
```

---

### Pitfall #4: Server Component "fetch ไม่ได้"

**Symptom**: student ใส่ `useEffect(() => fetch(...))` ใน Server Component → error

**Why**: student มี mental model ของ React traditional. ไม่รู้ว่า Server Component fetch ตรงๆ ใน async function ได้

**Teaching point** (ใช้ตอบจริง):
> "Server Component ไม่ต้อง useEffect เพื่อ fetch — เขียน async function ใน component ตรงๆ:
> ```tsx
> export default async function Page() {
>   const data = await fetch('https://api.example.com/menu').then(r => r.json());
>   return <ul>{data.map(...)}</ul>;
> }
> ```
> นี่คือ feature ของ RSC. Week 3 จะลงรายละเอียด."

---

### Pitfall #5: Import alias `@/` ไม่ทำงาน

**Symptom**: `Cannot find module '@/components/ui/button'`

**Causes**:
1. `tsconfig.json` ไม่มี `paths` setup
2. `tsconfig.json` extend แต่ไม่ override `paths` ที่ extends ตั้งไว้

**Fix**:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": { "@/*": ["./*"] }
  }
}
```

> **Teaching point**: TS path alias = compile-time. Bundler (Next.js / Vite) ต้องตามด้วย — Next.js handle ให้แล้ว

---

### Pitfall #6: `pnpm install` ช้ามาก / ติด

**Symptom**: install hangs หรือ timeout

**Causes**:
1. Corporate firewall block npm registry
2. Slow Internet
3. Registry mirror config ผิด

**Quick fix**:
```bash
# ใช้ Asia-Pacific mirror
pnpm config set registry https://registry.npmmirror.com

# หรือ China mirror
pnpm config set registry https://registry.npmmirror.com/

# กลับ default ทีหลัง
pnpm config set registry https://registry.npmjs.org
```

**Prevention**: ใน pre-course checklist, ขอให้ student verify `pnpm install <small-package>` ก่อนคลาส

---

### Pitfall #7: Git commit ไม่ atomic

**Symptom**: student commit "fix everything" ที่มี 200 lines change รวมหลาย concerns

**Teaching opportunity** (ครั้งแรกที่เจอใน class):
> "Commit เดียวควร = 1 logical change. ถ้า message ต้องใช้ ‘and’ → quote: ‘init monorepo AND scaffold Next.js’ → ควรแยก 2 commits"

**Quick fix**:
```bash
git reset HEAD~1                   # undo commit, keep changes
git add <file1>
git commit -m "first concern"
git add <file2>
git commit -m "second concern"
```

---

## ❓ Extended FAQ

### Setup & Tools

**Q: ใช้ npm workspace แทน pnpm ได้ไหม?**
A: ได้ครับ ทำงานเหมือนกันโดยรวม. แต่ pnpm strict กว่า — phantom dependency ถูกบล็อก, disk-efficient (symlink), faster install. Industry trend ก็ไป pnpm. คอร์สนี้ใช้ pnpm

**Q: ใช้ Yarn ได้ไหม?**
A: Yarn Berry (v4) ทำได้, แต่ syntax workspace ต่างจาก pnpm. ถ้าใช้ที่ทำงาน Yarn อยู่แล้ว — แปลงได้ภายหลัง. ตอนเรียนใช้ pnpm เพื่อ consistency

**Q: ทำไมต้อง `private: true` ที่ root package.json?**
A: กัน accident `pnpm publish` ทั้ง root ไป npm registry. Workspace root ไม่ใช่ package ที่จะ publish

**Q: `packageManager: "pnpm@9.x.x"` field ทำอะไร?**
A: บอก corepack (built-in Node.js) ใช้ pnpm version ไหน. เปิด `corepack enable` ครั้งเดียว → version pin ตามไฟล์นี้ทุกที่

**Q: Turbo จำเป็นไหม ถ้ามีแค่ 2 apps?**
A: ไม่จำเป็น — manual `pnpm --filter web dev` ก็ได้. แต่ถ้ามี dependencies + cache คุ้มมาก. คอร์สใส่เพราะ habit ดี + Week 3+ จะเริ่มใช้ cache feature

**Q: ใช้ Nx แทน Turbo ได้ไหม?**
A: Nx feature เยอะกว่า (generators, plugins) แต่ซับซ้อนกว่า. Turbo เหมาะ "JavaScript-only, simple". เรียน Turbo ก่อน → ถ้าโปรเจกต์โต ค่อยพิจารณา Nx

---

### Next.js / App Router

**Q: ทำไม Next.js ไม่ใช่ Vite + React?**
A: Vite + React = build tool + library — assemble routing/SSR/image opt เอง. Next.js = framework ครบจบ ตั้งแต่ routing ถึง deploy. คอร์สเลือก Next.js เพื่อให้ focus ที่ business logic ไม่ใช่ infrastructure

**Q: Pages Router ตายแล้วเหรอ?**
A: ยังใช้ได้ใน Next.js แต่ไม่มี new feature. โปรเจกต์ใหม่ทุกตัวใช้ App Router

**Q: ทำไม Next.js 15 แรงเรื่อง async params?**
A: Next.js 15 เปลี่ยน `params` ใน dynamic routes เป็น `Promise` — ต้อง `await` ก่อน. คอร์สนี้ตรงตาม:
```tsx
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  ...
}
```
จะเจอครั้งแรกใน Week 4 (`/order/[id]`)

**Q: Turbopack กับ Webpack ต่างยังไง?**
A: Turbopack = next-gen Rust-based bundler, dev server เร็วกว่า Webpack ~10x. Production build ปัจจุบันยังใช้ Webpack — เปลี่ยนเร็วๆ นี้

**Q: ใช้ Turbopack แล้วตัว plugin ของ Webpack จะใช้ได้ไหม?**
A: ส่วนใหญ่ไม่ได้ — ecosystem Turbopack ยังเล็ก. ถ้าโปรเจกต์ depend Webpack plugin → ใช้ `next dev` (no `--turbopack`)

---

### React Server Components

**Q: ใส่ `'use client'` ที่ root layout ได้ไหม?**
A: ได้ทาง syntax — แต่**ห้าม**ทำ. ทุกอย่างจะกลายเป็น Client → bundle ใหญ่ + ไม่ได้ใช้ feature ของ RSC. ใส่ `'use client'` "ใกล้ leaf ที่สุด" — เฉพาะ component ที่ต้อง interact

**Q: Component library อย่าง shadcn — components ไหน Server, ไหน Client?**
A: shadcn primitive ที่ใช้ Radix UI + state (Dialog, DropdownMenu, Sheet) = Client. Pure UI (Card, Badge, Avatar) = Server (compatible ทั้งสองฝั่ง)

**Q: ถ้า Client Component ต้อง fetch จาก DB?**
A: Client ไม่ access DB ตรง. ทำผ่าน:
- API route (`/api/...`) — แต่คอร์สเลือก NestJS แยก
- Server Action (Next.js feature) — out of scope คอร์สนี้
- TanStack Query เรียก API — Week 3 onwards

**Q: ถ้าผม render `<MenuCard>` (Server) ใน `<CartIcon>` (Client) ได้ไหม?**
A: **ผ่าน import โดยตรง — ไม่ได้**. แต่**ผ่าน children prop — ได้**:
```tsx
// Server Component
<CartIcon><MenuCard /></CartIcon>
```
Pattern นี้เรียก "interleaving" — Week 4 จะใช้

**Q: Server Component log ขึ้นไหน?**
A: terminal (server). Client log ขึ้น browser console. ทดสอบโดย `console.log` แล้ว switch `'use client'` ดู

---

### TypeScript

**Q: `noUncheckedIndexedAccess: true` ทำให้ code ยากเขียน?**
A: เพิ่ม null check แต่กัน runtime error ตั้งแต่ compile time. Trade-off: code verbose นิดหน่อย แต่ปลอดภัยกว่า. คอร์สเปิดเพราะ best practice

**Q: ทำไมไม่ใช้ JavaScript?**
A: Type safety = catch bug ก่อน runtime. คอร์สใช้ TypeScript เพราะ Industry standard, IDE autocomplete ดี, refactor ปลอดภัย

**Q: `z.infer<typeof Schema>` คืออะไร?**
A: TypeScript utility type ที่ Zod expose ให้ — extract type จาก schema. Single source of truth: schema → both validation + type

---

### Testing

**Q: Vitest กับ Jest ต่างยังไง?**
A: Same API (`describe`, `it`, `expect`). Vitest = native ESM, faster, build บน Vite. Modern Next.js project → Vitest เป็นตัวเลือกหลัก

**Q: Test ต้อง 100% coverage ไหม?**
A: ไม่. Focus business-critical paths (form validation, order calculation). UI presentation ที่ static — skip OK

**Q: ทำไมไม่ใช้ Cypress/Playwright?**
A: นั่นเป็น E2E (slow, expensive). Course นี้เน้น unit/component tests. E2E ใส่หลังจบ (Tier 2 learning path ตาม [spec § 7.2](../../superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md#72-learning-path-ต่อเรียงลำดับความคุ้ม))

**Q: TDD ช้ากว่าเขียนๆ ใช่ไหม?**
A: ครั้งแรกช้า — เพราะ context-switch. หลัง 5-10 ครั้งเร็วกว่า เพราะ code ที่ test-driven design มาดีกว่า + debug น้อยกว่า

---

### Tooling Edge Cases

**Q: Windows ใช้ได้ไหม?**
A: ใช้ได้ผ่าน WSL2 (recommended) หรือ PowerShell. คำสั่ง `chmod`, `find`, etc ใน Plan ต้องปรับ. แนะนำให้ Windows users ใช้ WSL2 + Ubuntu

**Q: M-series Mac (Apple Silicon) มี issue อะไรไหม?**
A: ส่วนใหญ่ไม่มี. Docker images บางตัวอาจไม่มี ARM64 build → spec จะมี note ใน Week 6

**Q: VS Code extension อะไรจำเป็น?**
A: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma. แนะนำเพิ่ม: GitLens, Error Lens, Pretty TypeScript Errors

---

## 🆘 Emergency Recovery

### Student stuck กับ broken state — checkout reference

```bash
# Save work in progress
git stash

# Switch to instructor's reference branch
git fetch origin
git checkout week1-homework-reference

# After session, return to own work
git checkout <student-branch>
git stash pop
```

### Pnpm install มี conflict

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

(ปกติ shouldn't do — แต่ Week 1 เร็วๆ ไม่มี complex dep yet, safe)

### `.next` cache เพี้ยน

```bash
rm -rf apps/web/.next
pnpm dev
```

### Port 3000 ติด

```bash
lsof -i :3000      # macOS/Linux
kill -9 <PID>

# หรือใช้ port อื่น
pnpm dev -- --port 3001
```

---

## 📊 Common Mistakes Heatmap (จาก class จริง — update หลังสอน)

> Instructor: หลังสอนแต่ละ batch อัปเดตตารางนี้ — ทำให้ FAQ ตามจริง

| Mistake | Frequency | Last Updated |
|---|---|---|
| ลืม `'use client'` | TBD | — |
| Tailwind config content array | TBD | — |
| `pnpm install` ช้า | TBD | — |
| ... | | |
