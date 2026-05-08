# Course Full-Stack — Coffee Shop

A learning project building a coffee shop web app with Next.js + NestJS in a pnpm monorepo.

See [docs/superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md](docs/superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md) for the full course design.

## Setup

```bash
nvm use            # or fnm use
pnpm install
pnpm dev           # starts all apps
```

## Structure

- `apps/web/` — Next.js 15 frontend (storefront, admin, kitchen)
- `apps/api/` — NestJS backend (Week 2+)
- `packages/shared/` — Zod schemas + types (Week 3+)
- `infra/` — Docker, Caddy, deployment (Week 6)
