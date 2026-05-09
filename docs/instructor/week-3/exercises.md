# Week 3 — Exercises

**Audience:** instructor (with solutions). Strip solutions before sharing student-facing copy.

---

## 📋 Exercise Map

| #                | Type     | When                   | Difficulty | Time    |
| ---------------- | -------- | ---------------------- | ---------- | ------- |
| **EX-3.1**       | In-class | Session 1, Block A end | ⭐⭐       | 5 min   |
| **EX-3.2**       | In-class | Session 1, Block C end | ⭐⭐       | 5 min   |
| **HW-3-mid**     | Homework | Between Session 1 & 2  | ⭐⭐⭐     | 3 hrs   |
| **EX-3.3**       | In-class | Session 2, Block F     | ⭐⭐⭐     | 12 min  |
| **HW-3-post**    | Homework | After Session 2        | ⭐⭐⭐     | 3-4 hrs |
| **HW-3-stretch** | Optional | Anytime                | ⭐⭐⭐⭐   | 2-4 hrs |

---

## EX-3.1 — Spot the Layer Violation

**When**: Session 1, Block A end
**Type**: Code review exercise
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

ดู NestJS code ต่อไปนี้ — ผิดอะไร? ปรับยังไง?

```ts
@Controller('menu/categories')
export class CategoryController {
  constructor(private readonly prisma: PrismaService) {} // ← ❌

  @Get()
  async list() {
    const categories = await this.prisma.category.findMany();
    if (categories.length === 0) {
      throw new HttpException('No categories', 404);
    }
    const sorted = categories.sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted;
  }
}
```

### 🟢 Solution

**Violations**:

1. **Controller injects PrismaService directly** — should go through Service layer
2. **Business logic in controller** (sort, error handling) — should move to service
3. **Throwing on empty list** — empty list ≠ error. Return [] instead

**Refactored**:

```ts
@Injectable()
class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' }, // sort in DB, not in JS
    });
  }
}

@Controller('menu/categories')
class CategoryController {
  constructor(private readonly service: CategoryService) {}

  @Get()
  list() {
    return this.service.findAll();
  }
}
```

> **Teaching point**: Controllers thin. Services hold logic. DB does ordering when possible (faster + correct)

---

## EX-3.2 — Predict Cache Behavior

**When**: Session 1, Block C end
**Type**: Conceptual exercise
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

ดู code:

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 }, // 1 minute
  },
});

// Component A
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});

// Component B (mounted 30 sec after A)
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});

// Component C (mounted 90 sec after A)
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

ตอบ: เกิด network request กี่ครั้ง? (assume default focusRefetch off)

### 🟢 Solution

- A mount: **1 fetch** (cache miss)
- B mount (30s later): **0 fetches** — cache fresh (within staleTime)
- C mount (90s later): **1 fetch** — cache stale (past staleTime), refetch

**Total**: 2 fetches across 3 components

> **Teaching point**: queryKey เดียว → cache แชร์. staleTime → ไม่ refetch ภายใน window

---

## HW-3-Mid — Pre-build Categories Admin UI

**When**: Between Session 1 and Session 2
**Type**: Pre-work for Session 2
**Difficulty**: ⭐⭐⭐
**Time**: ~3 hours

### Task

สร้าง skeleton ของ Categories admin UI ที่ Session 2 จะใช้:

1. **Test Postman thoroughly**: 3 categories + 6 products. Test edge cases (delete with products → 409)
2. **Skeleton CategoryList**:
   - File: `apps/web/app/(admin)/admin/menu/components/category-list.tsx`
   - Use `useQuery` to fetch categories
   - Display in `<Table>` with columns: name, sortOrder
   - **No CRUD actions yet** (Session 2 จะใส่)

### Acceptance Criteria

- [ ] `useQuery` ใช้ถูกต้อง (queryKey + queryFn)
- [ ] Loading state (`isLoading`)
- [ ] Empty state ("ยังไม่มีหมวด")
- [ ] Type-safe (Category[] จาก @coffee/shared)

### 🟢 Solution sketch

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Category } from '@coffee/shared';

export function CategoryList() {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => apiFetch<Category[]>('/menu/categories'),
  });

  if (isLoading) return <p>กำลังโหลด...</p>;
  if (categories.length === 0) return <p>ยังไม่มีหมวด</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ชื่อ</TableHead>
          <TableHead>ลำดับ</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((c) => (
          <TableRow key={c.id}>
            <TableCell>{c.name}</TableCell>
            <TableCell>{c.sortOrder}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

### Common Mistakes

- ลืม `'use client'` → useQuery ใน Server Component → error
- ใช้ `fetch` ตรงๆ แทน `apiFetch` → no cookie + no error class
- queryKey ไม่ตรง → cache miss ตลอด

---

## EX-3.3 — Build ProductList + ProductForm

**When**: Session 2, Block F (live in-class)
**Type**: Live build, pattern application
**Difficulty**: ⭐⭐⭐
**Time**: 12 min in-class (with instructor support)

### Task

ทำ ProductList + ProductForm ตาม pattern ของ Category (instructor demo Categories แล้ว)

### Requirements

- ProductList: แสดงสินค้าใน table, columns: ชื่อ, ราคา, หมวด, สถานะ, actions
- ProductForm: name + price (number) + categoryId (select dropdown) + imageUrl (optional) + isActive (checkbox)
- ProductForm ใน edit mode: pre-fill values
- Cache invalidation: products + (อาจ) categories ถ้าจำเป็น

### 🟢 Solution

ดู Plan Task 9.5 — full code

### Hints (instructor offers when student stuck)

- "categoryId select dropdown — fetch categories ผ่าน useQuery + map options"
- "price input — ใช้ `valueAsNumber: true` ใน register"
- "imageUrl optional — Zod `.nullable().optional()`"
- "isActive checkbox — Zod `.default(true)` + register normally"

### Common Mistakes

| Mistake                          | Fix                                          |
| -------------------------------- | -------------------------------------------- |
| Price comes as string            | `register('price', { valueAsNumber: true })` |
| categoryId required แต่ Zod พลาด | Make sure `min(1)` in schema                 |
| Edit mode ไม่ pre-fill           | `defaultValues` ใน useForm                   |
| imageUrl `null` ทำให้ Zod fail   | `.nullable()` + handle ใน apiFetch           |

---

## HW-3-Post — Polish + Add Search

**When**: After Session 2
**Type**: Homework
**Difficulty**: ⭐⭐⭐
**Time**: ~3-4 hrs
**Deliverable**: PR `week3-homework`

### Required

1. **Polish admin UI**:
   - Empty state messages (no categories, no products)
   - Loading skeleton (use shadcn `<Skeleton>`)
   - Form validation: show all errors at once on submit
   - Mutation isPending state → disable buttons + show spinner text

2. **Add search to ProductList**:
   - Input above table
   - Filter products client-side by name (case-insensitive)
   - Use `useState` + `useDeferredValue` (smooth UX)

3. **Test**: write 1 component test for CategoryForm
   - Setup TanStack Query test wrapper
   - Render form, fill input, submit, expect mutation called

### 🟢 Solution sketch

**Search input**:

```tsx
const [search, setSearch] = useState('');
const deferredSearch = useDeferredValue(search);

const filtered = products.filter(p =>
  p.name.toLowerCase().includes(deferredSearch.toLowerCase())
);

return (
  <>
    <Input value={search} onChange={(e) => setSearch(e.target.value)}
           placeholder="ค้นหาสินค้า..." />
    <Table>...{filtered.map(...)}</Table>
  </>
);
```

**Component test**:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CategoryForm } from './category-form';

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

it('submits valid input', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}), status: 201 });
  const onSuccess = vi.fn();
  const user = userEvent.setup();

  renderWithQuery(<CategoryForm onSuccess={onSuccess} />);

  await user.type(screen.getByLabelText(/ชื่อหมวด/), 'เครื่องดื่ม');
  await user.click(screen.getByRole('button', { name: /เพิ่ม/ }));

  await vi.waitFor(() => expect(onSuccess).toHaveBeenCalled());
});
```

### Acceptance Criteria

- [ ] All admin UI has loading + empty states
- [ ] Search filters products real-time
- [ ] CategoryForm test passes
- [ ] PR opened, all tests pass

---

## HW-3-Stretch — Optional Challenges

**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Optimistic Updates (2 hrs)

ทำให้ delete category รู้สึก instant — UI อัปเดตทันทีก่อน server confirm:

```tsx
const removeMutation = useMutation({
  mutationFn: (id) => apiFetch(`/menu/categories/${id}`, { method: 'DELETE' }),
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: queryKeys.categories });
    const previous = qc.getQueryData(queryKeys.categories);
    qc.setQueryData(queryKeys.categories, (old: Category[] = []) => old.filter((c) => c.id !== id));
    return { previous };
  },
  onError: (_err, _id, context) => {
    qc.setQueryData(queryKeys.categories, context?.previous);
  },
  onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
});
```

### Stretch 2: Image Upload (3-4 hrs)

- POST `/api/upload` route handler ที่รับ FormData
- Forward to S3 / Cloudinary / Supabase Storage
- Return URL
- ProductForm: เพิ่ม `<Input type="file">` แทน URL ตรงๆ

**Why valuable**: real apps มี file upload — pattern transferable

### Stretch 3: Bulk Operations (2 hrs)

- Checkbox column in ProductList
- "Activate selected" / "Deactivate selected" / "Delete selected"
- Mutation ที่ accept array of IDs
- BE: `PATCH /api/menu/products/bulk` endpoint

### Stretch 4: Category Reorder Drag-and-Drop (3 hrs)

- Use `@dnd-kit/sortable`
- Drag categories → update sortOrder
- Mutation: PATCH multiple categories at once

---

## 📤 Student-Facing Format

**ก่อนแชร์ exercises ให้ student**:

1. ลบ section "🟢 Solution" ทั้งหมด
2. เก็บ "Common Mistakes" hints ไว้ใน HW-3-Mid (ใหม่ student → useful guardrail)
3. ลบ "Common Mistakes" hints ของ EX-3.3 (in-class instructor offer when stuck)
4. ลบ Stretch solution sketch — ให้ student คิดเอง
