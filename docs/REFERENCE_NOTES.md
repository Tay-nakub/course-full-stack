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
