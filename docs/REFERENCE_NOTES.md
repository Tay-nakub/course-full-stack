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
