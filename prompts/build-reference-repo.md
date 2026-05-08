# Build Reference Repo for Coffee Shop Full-Stack Course

## Context

I have a complete 6-week full-stack course designed, with all curriculum documentation already written. **Now I need the actual working source code** — a reference monorepo that follows the 6 weekly plans, so instructors can use it as "instructor-start" branches and students can checkout when stuck.

**Project root**: `/Users/teerapatcheung/Desktop/0-Project/course-full-stack`

**What exists**: Only `docs/` folder with full curriculum.
**What to build**: Working `apps/web` + `apps/api` + `packages/shared` matching the 6 plans, with one git tag per week.

---

## Source of Truth — 6 Implementation Plans

Read these files in order. Each has full code snippets + acceptance criteria. **Follow them exactly** — they are the spec:

1. `docs/superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md`
   pnpm workspace + Turborepo + Next.js 15 + Tailwind + shadcn/ui + RHF/Zod + Vitest

2. `docs/superpowers/plans/2026-05-08-week-2-nestjs-postgres-auth.md`
   packages/shared + NestJS scaffold + Postgres docker-compose + Prisma + JWT auth + bcrypt + Guards + tests

3. `docs/superpowers/plans/2026-05-08-week-3-end-to-end-menu-crud.md`
   Menu schemas + NestJS Menu module + TanStack Query + login flow with httpOnly cookie + admin Menu CRUD UI + storefront wired live

4. `docs/superpowers/plans/2026-05-08-week-4-order-flow.md`
   Order schemas + atomic order create + Zustand cart + checkout + tracking page (polling) + Kitchen UI kanban + admin orders view

5. `docs/superpowers/plans/2026-05-08-week-5-inventory-reports.md`
   Ingredient/Recipe/StockMovement + ⭐ atomic stock deduct on order COMPLETED (4-table transaction) + Reports backend + admin Inventory UI + Recipe editor + Recharts dashboard + seed

6. `docs/superpowers/plans/2026-05-08-week-6-deploy-gitops.md`
   Multi-stage Dockerfiles + Caddyfile + docker-compose.prod.yml + GitHub Actions CI/CD + backup script + DEPLOY.md runbook (skip the actual Hetzner provisioning — just create the local files)

---

## Tech Stack (from spec)

- **Frontend**: Next.js 15 App Router + React 19 + TypeScript + Tailwind + shadcn/ui + TanStack Query + Zustand + RHF + Zod + Vitest
- **Backend**: NestJS 10 + TypeScript + Prisma 5 + Postgres 16 + JWT + bcrypt + nestjs-zod
- **Monorepo**: pnpm 9 workspaces + Turborepo
- **Charts**: Recharts
- **Infra (Week 6)**: Docker Compose + Caddy 2 + GitHub Actions

---

## Deliverables — Tags per Week

Create one git tag per week with sequential commits within. After all weeks are complete:

- `week-1-reference` → just Week 1 work
- `week-2-reference` → Week 1 + Week 2
- `week-3-reference` → Week 1-3
- `week-4-reference` → Week 1-4
- `week-5-reference` → Week 1-5
- `week-6-reference` → all 6 weeks (= main)

Each tag must satisfy that week's "Acceptance Criteria" section in the plan.

Tag commands per week (run after week complete):

    git tag week-N-reference

---

## Branching Strategy

Use a single linear `main` branch with sequential commits. Tag at the end of each week. Don't use merge commits — keep history flat for clarity.

Commit message convention (matching existing course commits):

- `feat(web): add cart store with Zustand persist`
- `feat(api): atomic stock deduct on order COMPLETED`
- `chore: scaffold Next.js 15 app`
- `test(api): OrdersService transition state machine tests`

Atomic commits (1 task = 1 commit, ideally). No batch commits.

---

## Acceptance Criteria

After Week N tag:

- All "Acceptance Criteria" in plan satisfied
- `pnpm install` clean
- `pnpm typecheck` passes
- `pnpm test` passes (where tests exist)
- `pnpm dev` starts both web + api (Week 2+)
- Manual smoke test passes (e.g., login, place order, etc.)

For Week 6 specifically:

- Dockerfiles build (`docker build -f infra/docker/Dockerfile.api .`)
- docker-compose.prod.yml validates (`docker compose config`)
- Caddyfile validates
- GitHub Actions workflow files lint OK (use `actionlint` if available)
- DEPLOY.md complete
- **Don't actually provision Hetzner** — local artifacts only

---

## Important Constraints

1. **Follow plans verbatim where code is given** — they were carefully designed. If you find a bug, fix it AND update the plan with a note.

2. **Don't skip ahead** — if Week 3 expects Week 2's auth to work, actually verify Week 2 works first.

3. **Don't add stretch features** — only HW-N-Stretch items mentioned in `docs/instructor/week-N/exercises.md` are stretch and skip them.

4. **Test atomic transaction at Week 5** — this is the course centerpiece. Verify with DB inspection that order COMPLETED → stock decremented + cogsSnapshot populated + StockMovement rows created, all atomically.

5. **Use seed script after Week 5** — populates initial data for testing reports.

6. **Document any deviations** in `docs/REFERENCE_NOTES.md` — if you had to change anything from the plan, note what + why.

---

## Approach Recommendation

Build sequentially Week 1 → 6, NOT in parallel. Each week depends on previous. Use TodoWrite to track progress per task per week.

For each week:

1. Read the plan top to bottom first
2. Set up TodoWrite with one item per Task
3. Execute Tasks in order
4. Run acceptance criteria checks
5. Tag the week
6. Move to next

Estimated effort: ~6-10 hours total (depending on debugging time).

---

## Pre-flight Checklist

Before starting, verify:

- Node 20+ installed (`node --version`)
- pnpm 9+ installed (`pnpm --version`)
- Docker Desktop running (`docker run hello-world`)
- Git installed
- You're in `/Users/teerapatcheung/Desktop/0-Project/course-full-stack`
- `git status` shows clean working tree
- `ls` shows just `docs/`, `prompts/`, and `.git/`

---

## Context Budget Awareness

Assume 1 chat session can typically handle ~2-3 weeks of build work before context fills.

After completing each week + git tag, output a brief status summary (2-3 lines) noting:

- Which week tag was just created
- Any deviations from plan
- Where to resume in next session

If context approaches limit mid-week:

- Commit progress with clear message (`wip(week-N): partial — stopped at Task X`)
- Output handoff note for next session

---

## Start

Begin with Week 1. Read the plan, create todo list, execute tasks sequentially. After Week 1 acceptance criteria pass:

    git tag week-1-reference

Then proceed to Week 2.

If you encounter ambiguity in any plan, prefer the simpler interpretation and document the choice in `docs/REFERENCE_NOTES.md`.
