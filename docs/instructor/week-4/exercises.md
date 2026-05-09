# Week 4 — Exercises

**Audience:** instructor (with solutions). Strip solutions before sharing.

---

## 📋 Exercise Map

| #                | Type     | When                   | Difficulty | Time    |
| ---------------- | -------- | ---------------------- | ---------- | ------- |
| **EX-4.1**       | In-class | Session 1, Block A end | ⭐⭐       | 5 min   |
| **EX-4.2**       | In-class | Session 1, Block B end | ⭐⭐       | 5 min   |
| **HW-4-mid**     | Homework | Between sessions       | ⭐⭐⭐     | 3 hrs   |
| **EX-4.3**       | In-class | Session 2, Block F     | ⭐⭐⭐     | 15 min  |
| **HW-4-post**    | Homework | After Session 2        | ⭐⭐⭐     | 3-4 hrs |
| **HW-4-stretch** | Optional | Anytime                | ⭐⭐⭐⭐   | 2-4 hrs |

---

## EX-4.1 — Spot the Transaction Bug

**When**: Session 1, Block A end
**Type**: Code review
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

ดู code นี้ — มีปัญหาอะไรบ้าง?

```ts
async create(input: CreateOrderInput) {
  const products = await this.prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) } },
  });

  const order = await this.prisma.order.create({
    data: {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      subtotal: input.subtotal,        // ← ผิดข้อ 1
      total: input.total,              // ← ผิดข้อ 2
    },
  });

  for (const item of input.items) {
    await this.prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,     // ← ผิดข้อ 3
      },
    });
  }

  return order;
}
```

ตอบ:

1. หาปัญหาทั้งหมด
2. เขียน fix

### 🟢 Solution

**Problems**:

1. **Trust client total/subtotal** — security hole. Server ต้องคำนวณเอง
2. **Trust client unitPrice** — same security hole
3. **Not in transaction** — ถ้า orderItem create ล้ม → order in DB without items (corrupt)
4. **N+1 inserts** — for loop sequential. Should batch with `items: { create: [...] }`
5. **No validation** — ถ้า productId ไม่มีใน products → silent failure or DB constraint error

**Fix**:

```ts
async create(input: CreateOrderInput) {
  return this.prisma.$transaction(async (tx) => {
    // Validate products
    const products = await tx.product.findMany({
      where: { id: { in: input.items.map((i) => i.productId) } },
    });
    if (products.length !== input.items.length) {
      throw new BadRequestException('สินค้าบางรายการไม่พบ');
    }

    // Server-side calculation
    const productMap = new Map(products.map((p) => [p.id, p]));
    const items = input.items.map((line) => {
      const product = productMap.get(line.productId)!;
      const unitPrice = Number(product.price);
      return {
        productId: product.id,
        productName: product.name,
        qty: line.qty,
        unitPrice,
        lineTotal: unitPrice * line.qty,
      };
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);

    return tx.order.create({
      data: {
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        subtotal,
        total: subtotal,
        items: { create: items },     // batch insert
      },
      include: { items: true },
    });
  });
}
```

> **Teaching point**: Order create = perfect example of WHY $transaction. Multi-step + multi-table = atomicity required

---

## EX-4.2 — Predict the State Transition

**When**: Session 1, Block B end
**Type**: State machine quiz
**Difficulty**: ⭐⭐
**Time**: 5 min

### Task

Given:

```ts
const VALID_TRANSITIONS = {
  PENDING: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
```

ตอบ: แต่ละกรณีจะ throw หรือ allow?

| ปัจจุบัน  | จะเปลี่ยนเป็น | ผล  |
| --------- | ------------- | --- |
| PENDING   | PREPARING     | ?   |
| PENDING   | READY         | ?   |
| PREPARING | PENDING       | ?   |
| READY     | PENDING       | ?   |
| READY     | COMPLETED     | ?   |
| COMPLETED | PREPARING     | ?   |
| CANCELLED | PENDING       | ?   |

### 🟢 Solution

| ปัจจุบัน  | →         | ผล                   |
| --------- | --------- | -------------------- |
| PENDING   | PREPARING | ✅ allow             |
| PENDING   | READY     | ❌ throw (skip step) |
| PREPARING | PENDING   | ❌ throw (no rewind) |
| READY     | PENDING   | ❌ throw (no rewind) |
| READY     | COMPLETED | ✅ allow             |
| COMPLETED | PREPARING | ❌ throw (terminal)  |
| CANCELLED | PENDING   | ❌ throw (terminal)  |

> **Teaching point**: State machine ป้องกัน invalid business operations ที่ DB constraint ไม่จับ

---

## HW-4-Mid — Pre-build Cart + Checkout Skeleton

**When**: Between Session 1 and 2
**Type**: Pre-work
**Difficulty**: ⭐⭐⭐
**Time**: ~3 hours

### Task

1. **Polish cart UX** (Task 5):
   - `/cart` page (full implementation)
   - Empty state with link to /menu
   - Qty +/- buttons (use `setQty` from store)
   - Subtotal display
   - "ไปชำระเงิน" button → /checkout

2. **Checkout form skeleton** (preview Task 6):
   - `/checkout` page with form (customerName + customerPhone)
   - Zod validation (use `CheckoutSchema` you'll define)
   - Display order summary (right column)
   - **Don't wire mutation yet** — just `console.log(input)` on submit

### Acceptance Criteria

- [ ] Cart page handles empty state
- [ ] Qty controls work (using cart store)
- [ ] Checkout form validates (Zod errors visible)
- [ ] On submit: console.log shows correct shape `{ customerName, customerPhone, items: [...] }`

### 🟢 Solution

ดู Plan Task 5 + Task 6 — full code

### Common Mistakes

- ลืม `'use client'` ที่ /cart (เพราะใช้ store)
- Cart store selectors used แค่ `useCart()` ตรงๆ → re-render issue
- Phone validation min `< 9` — UX issue (some Thai numbers 9 digits, some 10)

---

## EX-4.3 — Build OrderCard Component

**When**: Session 2, Block F (during Kitchen UI build)
**Type**: Live in-class build
**Difficulty**: ⭐⭐⭐
**Time**: 15 min (with instructor support)

### Task

Build OrderCard component that:

- Receives `order: Order` prop
- Shows order number, customer info, items, total
- Has primary action button based on current status (รับออเดอร์ / ทำเสร็จ / ลูกค้ารับแล้ว)
- Has cancel button (PENDING/PREPARING only)
- Mutations call PATCH `/orders/:id/status`
- onSuccess invalidates `['orders']` query

### 🟢 Solution

ดู Plan Task 9.1 — full code

### Hints (when student stuck)

- "Status → next action map" — use object lookup
- "Mutation invalidate same key as query in KitchenPage"
- "Cancel = different mutation (different button + flow)"
- "Disable button while pending — `mutation.isPending`"

### Common Mistakes

| Mistake                           | Fix                                 |
| --------------------------------- | ----------------------------------- |
| Hardcoded button label per status | Use `NEXT_STATUS` map               |
| Cancel button on COMPLETED        | Conditional: only PENDING/PREPARING |
| `mutation.mutate()` no arg        | Pass status string explicitly       |
| Forget `onSuccess invalidate`     | List won't refresh                  |

---

## HW-4-Post — Refinement + Bonus Endpoint

**When**: After Session 2
**Type**: Homework
**Difficulty**: ⭐⭐⭐
**Time**: ~3-4 hrs
**Deliverable**: PR `week4-homework`

### Required

1. **Order numbering improvement**:
   - Replace random 5-char with **daily sequential**: `#YYYYMMDD-001`, `#YYYYMMDD-002`, ...
   - Hint: query orders created today, count + 1
   - **Beware**: race condition. ใช้ `$transaction` ให้ atomic

2. **Add "Today's Orders" stat to admin orders page**:
   - At top: card showing count of orders today (PENDING + PREPARING + READY + COMPLETED)
   - Card: count of today's revenue (sum total of COMPLETED today)

3. **Component test for OrderCard**:
   - Render with PENDING order
   - Click "รับออเดอร์" → expect mutation called with PREPARING
   - Use TanStack Query test wrapper

### 🟢 Solution sketch

**Sequential order number**:

```ts
async create(input) {
  return this.prisma.$transaction(async (tx) => {
    // ... validations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await tx.order.count({ where: { createdAt: { gte: today } } });
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `#${dateStr}-${String(count + 1).padStart(3, '0')}`;
    // ... create
  });
}
```

**Today stat card**: query both today's orders + sum total. New endpoint `/orders/today/stats`

**Component test**:

```tsx
it('PENDING order → button "รับออเดอร์" → mutation called', async () => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  const order = {
    id: 'o1',
    orderNumber: '#A1',
    status: 'PENDING',
    items: [],
    total: 100,
    customerName: 'A',
    customerPhone: '0800000000',
  };

  renderWithQuery(<OrderCard order={order as any} />);
  await user.click(screen.getByRole('button', { name: /รับออเดอร์/ }));
  await vi.waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/orders/o1/status',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });
});
```

### Acceptance Criteria

- [ ] Sequential order numbers visible in DB
- [ ] Race condition handled (transaction test: spam create → numbers unique)
- [ ] Admin orders page shows stat cards
- [ ] OrderCard test passes

---

## HW-4-Stretch — Optional Challenges

**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Sound Notification on New Order (1 hr)

- Kitchen UI: when new PENDING order arrives → play short ding sound
- Detect via diff (compare ids in current vs previous)
- Use `<audio>` element + `useEffect`

### Stretch 2: Aging Indicator (1 hr)

- Order PENDING > 5 min → red border
- Order PENDING > 10 min → flashing
- Use `setInterval` or computed value from createdAt + Date.now()

### Stretch 3: Kitchen Live with WebSocket (4 hrs)

- Replace polling with Socket.io
- NestJS gateway: `nest g gateway orders`
- Emit `orders.updated` event when status changes
- Client: connect, listen, invalidate query
- Compare load: polling vs socket (Network tab)

### Stretch 4: Print Receipt (2 hrs)

- Tracking page: button "พิมพ์ใบเสร็จ"
- Open new tab with printable layout
- CSS @media print to hide navigation

---

## 📤 Student-Facing Format

ก่อนแชร์ — strip solutions + hint sections เท่าที่เหมาะ
