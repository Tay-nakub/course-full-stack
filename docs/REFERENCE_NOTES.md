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
