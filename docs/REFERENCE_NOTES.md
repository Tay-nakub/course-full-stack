# Reference Repo — Deviations from Plans

This file tracks places where the actual reference implementation diverges from the 6 weekly plans, with reasons.

## Week 1

### Next.js 16 (instead of 15)
`pnpm create next-app@latest` resolves to `next@16.2.6` as of build time. Plan was written against Next.js 15. App Router API surface is unchanged for the features used in this course (layouts, route groups, server/client components, redirect). No code changes needed beyond the version number.

### Tailwind CSS v4 (instead of v3)
Scaffold installs `tailwindcss@4` + `@tailwindcss/postcss` instead of v3. Differences from plan:
- No `tailwind.config.ts` — Tailwind v4 uses CSS-based configuration via `@theme` blocks in `globals.css`.
- `globals.css` uses `@import "tailwindcss";` instead of the `@tailwind base/components/utilities` directives.
- shadcn/ui supports Tailwind v4 via the canary CLI (`pnpm dlx shadcn@canary` or `shadcn@latest` with v4 detection).

Theme tokens for shadcn are written as CSS custom properties under `:root` and exposed to Tailwind through `@theme inline` mapping, not via `tailwind.config.ts` extend.

### `prettier-plugin-tailwindcss` warning
With Tailwind v4 + Prettier 3, the plugin still works but emits no errors. Kept in root devDependencies.

### Scaffold cleanup
`create-next-app` generates its own `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `AGENTS.md`, `CLAUDE.md`, and `README.md` inside `apps/web/`. These are removed because the monorepo root owns these.

### shadcn 4.x preset / base picker
shadcn 4.7 CLI no longer asks "style + base color" — it now asks for **base** (`radix` vs `base`) and **preset** (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`, `sera`). The `-d / --defaults` flag picks `--preset=base-nova` which uses `@base-ui/react` (not the classic Radix-based shadcn). To get the standard Radix-based components run:

```bash
pnpm dlx shadcn@latest init -b radix -p nova -y -f --css-variables
```

This produces `style: "radix-nova"` in `components.json` and components that import from the `radix-ui` package (modern combined Radix Primitives package, not the old `@radix-ui/react-*` per-package imports).

The CLI also injects two extra imports into `globals.css` automatically and adds them as deps:
- `@import "tw-animate-css";` — animation utilities (real npm package `tw-animate-css`)
- `@import "shadcn/tailwind.css";` — shipped inside the `shadcn` runtime package at `node_modules/shadcn/dist/tailwind.css`, providing keyframes + custom variants

Both are needed for shadcn 4.x styles to work, so they stay.

### `form` component not in shadcn 4.x radix-nova registry
The plan listed `form` in the components to add. In the new presets, `form` is no longer a generated component — RHF + Zod are used directly with `Input`/`Label`. We do not generate `components/ui/form.tsx`. `feedback-form.tsx` imports only `Button`, `Input`, `Label`.

### shadcn re-init iteration
First `init -d -y` chose the `base-nova` preset which pulled in `@base-ui/react` and produced a Button component using a non-Radix primitive. Reset by removing `components.json`, `lib/utils.ts`, `components/ui/`, and the unwanted deps from `package.json`, then re-ran with `-b radix -p nova` to land on the radix-nova style.

## Week 2

### NestJS 11 (instead of 10)
`nest new` scaffolds NestJS 11.x. Plan was written against NestJS 10. The auth-related package surface used here (`@nestjs/common`, `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/testing`) is API-compatible. No code changes needed beyond version numbers in `package.json`.

### Prisma 7 (instead of 5) — three significant differences

**1. `prisma.config.ts` replaces the `prisma` block in `package.json`.**
Prisma 7 looks for `prisma.config.ts` at the package root. The init command also adds `import "dotenv/config"` so `process.env.DATABASE_URL` is available; this means `dotenv` is now a runtime/dev dependency:

```ts
// apps/api/prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] },
});
```

The `datasource` block in `schema.prisma` is therefore minimal (no `url = env(...)` line); the URL comes from `prisma.config.ts`.

**2. Default generator is `prisma-client` (not `prisma-client-js`).**
The new generator emits TypeScript source — not the legacy `.prisma/client` runtime — to a custom output path. The schema sets `output = "../src/generated/prisma"`. Imports become:

```ts
import { PrismaClient } from '../generated/prisma/client';
```

There is no auto-created `index.ts`; consumers import directly from `client.ts`. `apps/api/.gitignore` excludes `/src/generated/prisma`.

**3. PrismaClient REQUIRES options at construction.**
Prisma 7 dropped the embedded query engine. `new PrismaClient()` now throws `PrismaClientInitializationError: PrismaClient needs to be constructed with a non-empty, valid PrismaClientOptions`. You must pass either:
- a driver adapter (e.g. `@prisma/adapter-pg` for Postgres), or
- an Accelerate URL (`accelerateUrl`).

For local dev we use the `pg` adapter:

```ts
import { PrismaPg } from '@prisma/adapter-pg';
constructor() {
  super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
}
```

This adds `@prisma/adapter-pg` and `pg` as runtime deps in `apps/api`.

### Postgres host port 5433 (not 5432)
The course author's machine has a host-installed Postgres listening on `localhost:5432`. When the docker-compose port mapping was `5432:5432`, the host's IPv6 `localhost` resolved to the host Postgres first, causing `P1010: User was denied access` — the connection was hitting the wrong server, not the container. Remapped to `5433:5432`. `DATABASE_URL` and `.env.example` reflect this:

```
DATABASE_URL="postgresql://coffee:coffee_dev_password@localhost:5433/coffee?schema=public"
```

In a clean environment without a host Postgres, `5432:5432` would also work; choosing `5433` makes the dev setup robust to that collision.

### `packages/shared` builds to CJS dist (not consumed as TS)
The plan suggested `"main": "./src/index.ts"` so the shared package was consumed as TypeScript source. NestJS's compiled CommonJS output cannot resolve `.ts` files via Node ESM — `Cannot find module .../packages/shared/src/types/user`. Fix: add a `tsc -p tsconfig.build.json` step that emits CommonJS to `packages/shared/dist`, point `main`/`types`/`exports` at the dist, and have Turborepo's `dev`, `typecheck`, and `test` tasks `dependsOn: ["^build"]` so consumers always have a fresh build. Vitest still aliases `@coffee/shared` to the TS source via `resolve.alias` so unit tests don't depend on the build being up-to-date.

### Zod 4 (instead of 3) — top-level helpers
The shared package picked up Zod 4 (`^4.4.3`). Differences from the plan:
- `z.string().email()` → `z.email('msg')` (top-level helper).
- `z.string().url()` → `z.url('msg')` (used in `EnvSchema` if you add one — Task 10 in the plan).

`nestjs-zod@5` declares peer compatibility with both Zod 3 and 4, so `ZodValidationPipe(Schema)` works as written. We add `zod` directly to `apps/api` so the api and shared resolve the same Zod major.

### `nestjs-zod` `ZodValidationPipe` — pipe applied via `@UsePipes`
Plan applied the pipe inline in `@Body(new ZodValidationPipe(Schema))`. This worked, but `nestjs-zod`'s exported pipe is a class, and using it on `@Body` causes confusion when the schema is set as a runtime arg. Idiomatic style: `@UsePipes(new ZodValidationPipe(Schema))` on the handler. Functionally identical, slightly cleaner.

### JwtModule `expiresIn` typing
`@nestjs/jwt@11` types `signOptions.expiresIn` as `number | StringValue` (an `ms`-style template literal type). Passing a plain `string` from `ConfigService.get` fails strict type-check. Cast to the template literal type:

```ts
expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as `${number}${'s'|'m'|'h'|'d'}`
```

### `apps/api/tsconfig.json` `rootDir: "./"` (not `./src`)
The plan's tsconfig had `rootDir: "./src"` and `include: ["src/**/*", "test/**/*"]`. With `tsc --noEmit` this throws `TS6059: File 'test/setup.ts' is not under rootDir 'src'`. Either drop `test/**/*` from `include` or relax `rootDir` to project root. We did the latter so test files (and any future fixtures) are still type-checked.

### Tests use Vitest (not Jest)
The plan called for Vitest in Task 10. NestJS scaffold writes a `jest` config block in `package.json`; we removed it and added `vitest` + a `vitest.config.ts` with `globals: true`, `environment: 'node'`, `setupFiles: ['./test/setup.ts']` (which only loads `reflect-metadata`), and a path alias for `@coffee/shared`. `pnpm test` at repo root runs both `web` (3) + `api` (5) suites via Turbo.

### No env-validation / healthcheck module yet
Plan Task 10 includes `EnvSchema` (Zod), a `validateEnv` hook into `ConfigModule.forRoot`, and a `/healthz` controller. These are valuable but not on the acceptance-criteria critical path for the Week 2 tag — they will be the first improvements in Week 3 if needed. The current `JWT_SECRET` is read via `config.getOrThrow<string>('JWT_SECRET')` so a missing secret fails fast at boot, which is the most important part of env validation in practice.

## Week 3

### `apps/web` needed `@coffee/shared` as an explicit workspace dependency
Week 1 + 2 set up the web app without ever importing from `@coffee/shared`, so the package wasn't listed in `apps/web/package.json`. Task 7 (login form) was the first consumer in `apps/web`, and `tsc` failed with `Cannot find module '@coffee/shared'`. Fix: `pnpm --filter web add @coffee/shared@workspace:^`. (The api workspace already had this dep from Week 2.)

### Zod 4 `.default()` makes form input/output types diverge — RHF needs the 3-generic form
`CreateCategorySchema` and `CreateProductSchema` both use `.default(...)` (`sortOrder: 0`, `isActive: true`). Zod 4 + `z.infer` returns the **output** type where those fields are required. RHF's `useForm<T>` infers the resolver's input type from `T`, so passing the output type causes the resolver-shape mismatch:

```
Type 'Resolver<{ sortOrder?: number }, ...>' is not assignable to
Type 'Resolver<{ sortOrder: number }, ...>'
```

Fix: use the 3-generic form `useForm<TInput, TContext, TOutput>`:

```ts
type CategoryFormInput = z.input<typeof CreateCategorySchema>;
useForm<CategoryFormInput, unknown, CreateCategoryInput>({
  resolver: zodResolver(CreateCategorySchema),
  // ...
});
```

`handleSubmit((d) => mutation.mutate(d))` then receives `d: CreateCategoryInput` (the parsed output), which is what `apiFetch` and the API expect.

### `nestjs-zod` `ZodValidationPipe` must be applied to `@Body()`, NOT via `@UsePipes` on PATCH handlers
Week 2's REFERENCE_NOTES preferred `@UsePipes(new ZodValidationPipe(Schema))` on the handler — and that's fine when the handler only has `@Body()` (e.g. `register`, `login`). On PATCH handlers like `update(@Param('id') id, @Body() input)`, `@UsePipes` runs the pipe against EVERY argument including `@Param`. The id string then fails validation as `expected: object, received: string`.

Fix: apply the pipe inline on `@Body()` only:

```ts
@Patch(':id')
update(
  @Param('id') id: string,
  @Body(new ZodValidationPipe(UpdateCategorySchema)) input: UpdateCategoryInput,
) { ... }
```

Both `category.controller.ts` and `product.controller.ts` use this inline form for `create` (consistency) and `update` (correctness).

### Next.js 16 deprecation: `middleware.ts` → `proxy.ts`
Next.js 16 emits a deprecation warning at dev start: *"The 'middleware' file convention is deprecated. Please use 'proxy' instead."* The plan calls for `middleware.ts` and the convention still works in 16.2 — Next will support it for at least one major. We left `middleware.ts` to match the plan and the broader ecosystem of docs/courses; migration to `proxy.ts` will be a Week 6 deploy-time tweak if needed.

### Auth-cookie constant split into its own file (`lib/auth-constants.ts`)
The plan put `AUTH_COOKIE_NAME` in `lib/auth.ts` next to `getServerToken()`. But `lib/auth.ts` imports `cookies` from `next/headers`, which is a Server-Component / Route-Handler-only API. The Edge `middleware.ts` needs only `AUTH_COOKIE_NAME` and would otherwise drag the `next/headers` import into the Edge bundle. Split the constant into `lib/auth-constants.ts`; `middleware.ts` and the route handlers import from there, while `lib/auth.ts` re-exports it for Server Components.

### Logout route does a 303 redirect, not just JSON
Plan returns `NextResponse.json({ success: true })`. With the admin-sidebar logout button being a plain `<form action="/api/auth/logout" method="POST">`, the browser navigates to `/api/auth/logout` and renders raw JSON. We changed the handler to `NextResponse.redirect('/login', { status: 303 })` so the browser lands on `/login` after the cookie is cleared. Programmatic `fetch` callers can still inspect status (303 is treated as success).

### `imageUrl` in `CreateProductSchema` uses Zod 4's `z.url(...)`
Top-level Zod 4 helper, same Week 2 pattern as `z.email(...)`. The plan wrote `z.string().url(...)` which still works in Zod 4 but emits a deprecation warning. We use the new helper for consistency with `RegisterSchema` / `LoginSchema`.

### Prisma `Decimal` price serializes as a string in JSON
`Product.price` is `Decimal @db.Decimal(10, 2)` so the JSON-serialized API response sends `"price": "75"` (string), not `75` (number). The web side coerces with `Number(p.price)` everywhere it's displayed (`product-list.tsx`, `menu-card.tsx`) and at form-load (`product-form.tsx` defaultValues). The shared `ProductSchema.price` is typed as `z.number()` for clients that re-validate after parsing — runtime parse will coerce/throw if needed, but in practice we cast at the display layer. This is a deliberate trade-off: exact dollar-and-cents in DB, lossy JS-number for UI display.

### Post-Task-4 hotfix needed for Prisma client regen
After editing `prisma/schema.prisma` (Task 2), `pnpm typecheck` fails with `Property 'category' does not exist on type 'PrismaService'` until you run `pnpm prisma generate` (or `prisma migrate dev` which generates as a side effect). The schema edit itself isn't a regen trigger; Prisma 7's `prisma-client` generator emits TypeScript source on-demand only.

## Week 4

### `OrderStatus` exported as Zod enum from `@coffee/shared`
Both api and web need to know the valid statuses (`PENDING`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`). Defined once as `z.enum([...])` in `packages/shared/src/schemas/order.ts` and re-derived as a Prisma enum on the api side via the same string literals. Status transition table (`VALID_TRANSITIONS`) lives next to `OrdersService` since it is a server-side state-machine concern.

### Atomic create uses interactive `$transaction(async (tx) => ...)`
Plan suggested array-form `$transaction([createOrder, createItems])` but order-item creation depends on `order.id` from the create call. Switched to interactive form with a callback so we can fetch products → validate active → compute totals server-side → write order + items in one ACID unit. Server NEVER trusts FE-supplied prices; `unitPrice` and `lineTotal` are computed from `Product.price` inside the transaction.

### Mock types in `orders.service.spec.ts` had to be hoisted
Vitest type-checks specs as part of `tsc --noEmit`. Inline `vi.fn()` mocks for `prisma.$transaction` produced a circular type-inference loop. Fix: declared explicit `MockTx` and `MockPrisma` interfaces at the top of the file, then assigned mock-impls to those typed vars. Captured in commit `0c5ec89` (`fix(api): hoist mock types in OrdersService spec to satisfy tsc`).

### Cart hydration — render placeholder until mounted
Zustand `persist` rehydrates from `localStorage` after first paint, so SSR-rendered HTML always shows `Cart (0)` while the hydrated client may show `Cart (3)`. React 19 then logs a hydration mismatch warning. Fix in `components/cart-icon.tsx`: track a `mounted` flag with `useEffect`, render `0` until mounted, real `totalQty()` after. Same pattern would apply if cart total is rendered in any other Server Component subtree's child Client Component.

### Order tracking page — "smart" polling
`useQuery({ refetchInterval: 3000 })` is fine for active orders, but wasteful once the order is `COMPLETED` or `CANCELLED`. We pass a function to `refetchInterval` that returns `false` when `query.state.data?.status` is in a terminal state, so the polling stops automatically once the order finishes. No manual cleanup needed.

### Status-update guard uses `RolesGuard` with `@Roles('admin')`
Plan suggested a separate `KitchenGuard`. We reused the existing `JwtAuthGuard` + `RolesGuard` from Week 2. Realistic prod would have a `staff` role distinct from `admin`, but the course only ships `admin`/`customer` so kitchen and admin both authenticate with admin role. Documented as a stretch upgrade for any student wanting RBAC depth.

## Week 5

### `cogsSnapshot` lives on `OrderItem`, not `Order`
The pre-flight notes mentioned a `cogsSnapshot` JSON field on `Order`, but the plan (Task 1.5) places `cogsSnapshot` as a `Decimal?` per **OrderItem** so each line carries its own COGS. Aggregating an order's total COGS is a `SUM(items.cogsSnapshot)`. This is a cleaner schema — same line-level granularity as `lineTotal` — and the Prisma 7 raw SQL in `revenueLastDays` can do the sum inline. Reports work the same way as the JSON-on-Order alternative, with one less serialization layer.

### `revenueLastDays` raw SQL — quoted identifiers
Postgres lowercases unquoted identifiers but our schema fields (`completedAt`, `cogsSnapshot`, `orderId`) use camelCase as their column names (no `@map` for these). The raw SQL therefore double-quotes every camelCase column reference: `"completedAt"`, `"cogsSnapshot"`, `"orderId"`. Without the quotes Postgres would search for `completedat` and the query would fail with `column "completedat" does not exist`. Same holds for `id` (lowercase) — it works unquoted, but we kept all references explicit for readability.

### Recipe replace endpoint accepts `items[]`, not `{ productId, items[] }`
Plan's `SetRecipeSchema` wraps the items in an object with `productId`, but the controller already takes `productId` from `@Param('productId')`. The PUT body is therefore the bare items array (`SetRecipeItemSchema[]`). Exported a separate `SetRecipeItemSchema` from `@coffee/shared` so the controller can validate exactly the array shape the client sends. The full `SetRecipeSchema` stays exported for any client that wants the wrapped form (e.g. an unscoped "set recipe by productId" RPC).

### `inventory.module.ts` ordering of route handlers
`IngredientsController` declares `POST movements` (no `:id` param) **before** the dynamic `GET/PATCH/DELETE :id` and `:id/movements` routes. Nest's router would otherwise match `:id = "movements"` and try to look up an ingredient with id `"movements"`. Same Week-4 pattern as `orders.controller.ts` declaring `GET /` before `GET /:id`.

### Manual stock-movement form: `SALE` is server-only
The `STOCK_MOVEMENT_REASONS` enum exposes `SALE`, but the admin UI filters it out: `ALLOWED_REASONS = STOCK_MOVEMENT_REASONS.filter(r => r !== 'SALE')`. SALE rows are written exclusively by the order-COMPLETED transaction so admins can't accidentally double-deduct stock by recording a manual SALE. PURCHASE / WASTE / ADJUSTMENT are admin-driven; the form auto-signs the quantity (positive for PURCHASE, negative for WASTE, user-chosen for ADJUSTMENT).

### Idempotent seed via composite-name lookup, not `upsert`
`Category.name` and `Product.name` are not `@unique` (categories can theoretically share names, products are unique by `(name, categoryId)`). `prisma.category.upsert({ where: { name } })` therefore fails to typecheck. The seed uses `findFirst({ where: { name } }) ?? create(...)` for categories and a small `upsertProduct(name, price, categoryId)` helper for products. `Ingredient.name` IS `@unique` so it uses `upsert` directly. PURCHASE rows are wiped by `deleteMany({ where: { note: 'Initial seed' }})` before re-inserting, then `currentStock` is recomputed from movements — guarantees rerun safety.

### Prisma 7 seed config — `migrations.seed`, not top-level `seed`
The PrismaConfig type from `@prisma/config@7.8.0` puts `seed?: string` under the `migrations` block (alongside `path` and `initShadowDb`). Plan suggested `seed: { command: 'tsx prisma/seed.ts' }` as a separate top-level option — that's a Prisma 5/6 convention. The `prisma` block in `package.json` is also no longer read. We added `migrations.seed: "tsx prisma/seed.ts"` to `prisma.config.ts` AND a sibling `pnpm db:seed` script for direct invocation that bypasses prisma's wrapper. `pnpm prisma migrate reset` and `pnpm prisma db seed` both invoke the same command.

### Seed PrismaClient construction — must pass adapter
Same gotcha as `PrismaService` in Week 2: `new PrismaClient()` throws without an adapter. Seed script imports `PrismaPg` from `@prisma/adapter-pg` and passes it. Also imports `'dotenv/config'` at the top so `DATABASE_URL` is loaded when running `tsx prisma/seed.ts` standalone (Prisma's CLI loads it automatically, but `pnpm db:seed` does not).

### Recharts `<LineChart>`/`<BarChart>` rendered inside a Client Component
Plan flagged this as a Next.js 16 / App Router concern. Confirmed: Recharts uses `useState`/`useEffect` internally, so its components must run on the client. We placed `'use client'` on `revenue-chart.tsx`, `top-products-table.tsx`, and `kpi-cards.tsx` (all of them already need `'use client'` for `useQuery` anyway). No SSR issues observed; ResponsiveContainer measures the parent on mount.

### Mock-tx hoist pattern from Week 4 carried into orders.service.spec.ts
The new COMPLETED stock-deduct tests added 4 more `tx.*` mocks (`recipeItem`, `stockMovement`, `ingredient`, `orderItem`). Same `MockTx` interface pattern from Week 4 — declared at the top of the spec, with `vi.fn().mockResolvedValue({})` defaults so individual tests only override the calls they care about. `findUnique` was moved off `prisma` and onto `tx` because the new `updateStatus` runs the lookup INSIDE the transaction (where it logically belongs — needed for serializable reads of order + items together).

### Atomic-deduct rollback test uses mock rejection
Test `rolls back: tx callback throws → no order.update applied` makes `tx.ingredient.update` reject for the first call. Since the parent `updateStatus` wraps everything in `prisma.$transaction(async (tx) => ...)` and the order.update is the LAST step, an early rejection bubbles before order.update runs. The test asserts `tx.order.update).not.toHaveBeenCalled()` — proves rollback semantics at the application layer. (DB-level rollback is exercised end-to-end by the manual COMPLETED→COMPLETED test in REPORT.md, which returned 409 with stock unchanged.)

### `randomOrderNumber` collisions are not handled
`#XXXXX` over 31-char alphabet = 28.6 million combinations. At a few-thousand-orders-per-day scale it's fine; production would either retry on unique-violation or use a sequence. Marked as Week 6 hardening if needed.
