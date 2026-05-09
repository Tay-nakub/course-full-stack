# Week 6 Session 2 — GitOps + Course Closing 🎉

**Week:** 6
**Session:** 2 (of 2) — FINAL
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 6 Session 1 + homework (manual deploy live)
**Covers:** Tasks 9-10 of [Week 6 Plan](../../superpowers/plans/2026-05-08-week-6-deploy-gitops.md) + course closing

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ GitHub Actions CI workflow (PR validation)
- ✅ GitHub Actions Deploy workflow (push main → live)
- ✅ pg_dump backup cron + retention
- ✅ DEPLOY.md runbook
- ✅ **Course complete!** Live coffee shop with GitOps

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify everyone has live URL (homework)
- [ ] If anyone failed homework → 1-on-1 first 15 min, parallel work
- [ ] GitHub Personal Access Token ready (for explanation)
- [ ] DEPLOY.md template ready

---

## 🗓️ Time-Blocked Agenda

| Time        | Block                    | Activity                             |
| ----------- | ------------------------ | ------------------------------------ |
| 0-10        | **Recap + Verify Live**  | Everyone live?                       |
| **10-35**   | **Block F**              | **GitHub Actions CI**                |
| **35-75**   | **Block G**              | **GitHub Actions Deploy**            |
| **75-100**  | **Block H**              | **Backup + Runbook**                 |
| **100-115** | **Course Recap + Final** | What we built, learning path forward |
| 115-120     | Closing                  | Q&A + celebration                    |

---

## 🟢 Recap + Verify Everyone Live (0-10 min)

### Verify (5 min)

ขอทุกคน:

1. Share live URL ใน chat
2. Open class — verify each student's URL works
3. Click around — login, view menu, place order

ถ้าใครไม่ live → 1-on-1 พร้อมๆ กับ Block F (TA help หรือ instructor parallel)

### Today's End State (5 min)

📢 **Big closing**:

> "ตอน Session ก่อน — ทุกคน manual deploy. วันนี้:
>
> 1. Push to main
> 2. รอ 3 นาที
> 3. Site update โดยอัตโนมัติ
>
> นี่คือ **GitOps** — git = source of truth ของ production"

Show instructor's deploy.yml run live → push small change → ดู Actions tab live

---

## 🤖 Block F: GitHub Actions CI (10-35 min, 25 min)

### 🎯 Block Goals

- CI workflow runs on every PR + main push
- Checks: lint + typecheck + tests
- Postgres service for tests

### 💬 Lecture (~7 min)

**1. CI vs CD** (3 min)

```
CI = Continuous Integration
  - run on every PR
  - validate code quality
  - block bad merges
  - tests + lint + typecheck

CD = Continuous Deployment
  - run after merge to main
  - build + deploy to prod
  - automated rollout
  - "no human touches prod"
```

**2. GitHub Actions concepts** (4 min)

```yaml
on:                       # trigger
  pull_request: ...
  push: ...

jobs:                     # run in parallel by default
  quality:                # job name
    runs-on: ubuntu-latest
    services:             # sidecar containers (DB, Redis)
      postgres:
        image: postgres:16
        ...

    steps:                # sequential steps
      - uses: actions/checkout@v4    # reusable action
      - run: pnpm install            # shell command
```

📢 **Free tier**: GitHub provides 2000 min/mo free for private repos, unlimited for public

### 🖥️ Live Demo (~18 min)

**1. .github/workflows/ci.yml** (Task 9.1 — 12 min)

(พิมพ์ตาม Plan)

📢 **Walkthrough each section**:

```yaml
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
```

> "Run on PR + push to main. PR = pre-merge check. main = post-merge sanity"

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env: { POSTGRES_DB: coffee_test, ... }
    ports: ['5432:5432']
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
```

> "Real Postgres for tests. Could mock — but real DB tests catch more issues"

```yaml
- uses: pnpm/action-setup@v4
  with: { version: 9 }
- uses: actions/setup-node@v4
  with: { node-version: 20, cache: 'pnpm' }
```

> "Cache pnpm store → faster builds. Re-uses across runs"

```yaml
- name: Generate Prisma client
  run: pnpm --filter @coffee/api prisma generate
- name: Typecheck
  run: pnpm typecheck
- name: Test
  run: pnpm test
```

> "Generate Prisma BEFORE typecheck (types depend on it)"

**2. Push + verify** (Task 9.2 — 3 min)

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add quality check workflow"
git push origin main
```

GitHub → Actions tab → ดู run live

📢 **First run**: ~3-5 min (no cache yet). Subsequent ~1-2 min

**3. Demo a failure** (3 min)

instructor introduces typecheck error:

```ts
const x: number = 'string'; // intentional
```

push → CI fails → red X
fix → green check

📢 **Teaching moment**: "Red CI = blocked merge. Quality gate"

Commit (revert):

```bash
git push origin main
```

### ❓ Common Questions (Block F)

| Q                                      | A                                              |
| -------------------------------------- | ---------------------------------------------- |
| Workflow timeout?                      | Default 6 hours. Max. Course tests ~3 min      |
| Run on PR เฉพาะ specific branches?     | `paths-ignore` filter — change docs ไม่ต้อง CI |
| Matrix tests (multiple Node versions)? | Stretch — `strategy.matrix.node: [18, 20, 22]` |

---

## 🚀 Block G: GitHub Actions Deploy (35-75 min, 40 min)

### 🎯 Block Goals

- Build images via Actions → push to GHCR
- SSH to VPS → docker compose pull + up
- Tag images with git SHA + latest

### 💬 Lecture (~10 min)

**1. Why GHCR (vs Docker Hub)?** (3 min)

- Free unlimited (public images, ทำ private ก็ได้)
- Auto-authenticated via `GITHUB_TOKEN`
- Same org as repo (clean separation)
- Tier 1 alternative: Docker Hub Free (rate limits)

**2. Deploy flow** (4 min)

```
1. Push to main
2. Actions trigger:
   ┌─ Job 1: build-push ─────────┐
   │  docker build images        │
   │  push to GHCR (tag: sha)    │
   └──────────┬──────────────────┘
              │ needs:
              ▼
   ┌─ Job 2: deploy ─────────────┐
   │  SSH to VPS                 │
   │  TAG=sha docker compose pull│
   │  docker compose up -d       │
   └─────────────────────────────┘
3. Verify (next-step in workflow or manual)
```

**3. SSH from Actions** (3 min)

```yaml
- uses: webfactory/ssh-agent@v0.9.0
  with:
    ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

- name: Add VPS to known hosts
  run: ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

- run: ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} 'docker compose pull...'
```

📢 **Security**:

- SSH key in GitHub Secrets (encrypted at rest)
- known_hosts prevents MITM
- No password ever leaves GitHub

### 🖥️ Live Demo (~28 min)

**1. Add GitHub Secrets** (Task 10.1 — 5 min)

GitHub → Settings → Secrets:

- `SSH_PRIVATE_KEY` (paste `~/.ssh/id_ed25519` content)
- `VPS_HOST` = your IP
- `VPS_USER` = `deploy`

📢 **CRITICAL paste**: full file including `-----BEGIN OPENSSH PRIVATE KEY-----` to `-----END OPENSSH PRIVATE KEY-----`. ห้ามลืม last newline

**2. .github/workflows/deploy.yml** (Task 10.2 — 15 min)

(พิมพ์ตาม Plan)

📢 **Walk through 2 jobs**:

**Job 1: build-push**

```yaml
permissions:
  contents: read
  packages: write # critical for GHCR push
```

```yaml
outputs:
  sha: ${{ steps.sha.outputs.sha_short }}
```

> "Output = pass to next job"

```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

> "GITHUB_TOKEN auto-issued. No manual setup"

```yaml
- name: Build & push api
  uses: docker/build-push-action@v5
  with:
    context: .
    file: infra/docker/Dockerfile.api
    push: true
    tags: |
      ghcr.io/${{ github.repository_owner }}/coffee-api:latest
      ghcr.io/${{ github.repository_owner }}/coffee-api:${{ steps.sha.outputs.sha_short }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

> "Multi-tag: latest + SHA. SHA = rollback target. cache-from/to = reuse layers across runs"

**Job 2: deploy**

```yaml
- uses: webfactory/ssh-agent@v0.9.0
  with: { ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }} }
- run: ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts
- run: |
    ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} '
      cd ~/coffeeshop &&
      export TAG=${{ needs.build-push.outputs.sha }} &&
      docker compose pull &&
      docker compose up -d --remove-orphans &&
      docker image prune -f
    '
```

> "5 commands chained. `--remove-orphans` clean stale containers. `image prune` cleanup old images"

**3. Test by pushing** (5 min)

```bash
# Make a small visible change (e.g., add to footer text)
# In apps/web/app/(storefront)/layout.tsx footer
# - © 2026 Coffee Shop · Learning Project
# + © 2026 Coffee Shop · Learning Project · 🚀 v2

git add apps/web
git commit -m "feat: footer version marker"
git push origin main
```

GitHub Actions tab → see "Deploy" run

📢 **Watch live**:

- Job 1 builds (~3-5 min) — student sees layers caching
- Job 2 deploys (~30 sec) — SSH + pull + up

After done:

```bash
curl https://your-coffee-shop.com/menu
# See new footer
```

🎉 **GitOps working**: `git push` → live in ~3-5 min

**4. Show rollback** (3 min)

```bash
# On VPS
ssh deploy@<ip>
cd ~/coffeeshop

# Get previous SHA
git log --oneline ~/coffeeshop  # if cloned, or just remember last SHA

# Rollback
TAG=<previous-sha> docker compose pull
TAG=<previous-sha> docker compose up -d
# 30 sec — back to old version
```

📢 **Pattern**:

> "Tag everything with SHA → easy rollback. Latest is just convenience"

Commit:

```bash
git commit -m "ci: deploy workflow"
git push origin main
```

### ❓ Common Questions (Block G)

| Q                                     | A                                                                  |
| ------------------------------------- | ------------------------------------------------------------------ |
| Deploy ล้มกลางคัน?                    | docker compose up partial — some new, some old. Re-run workflow    |
| Migration runs ทุกครั้ง deploy?       | ใช่ — entrypoint `prisma migrate deploy`. Idempotent (safe re-run) |
| Zero-downtime?                        | Course = restart-based (~3 sec downtime). Stretch: blue-green      |
| Notify success/failure ใน Slack/LINE? | Add step: `slackapi/slack-github-action@v1` — Tier 1 stretch       |

---

## 💾 Block H: Backup + Runbook (75-100 min, 25 min)

### 🎯 Block Goals

- pg_dump cron daily at 03:00
- 7-day retention
- DEPLOY.md runbook complete

### 💬 Lecture (~5 min)

**Backup strategy**:

```
Tier 1 (course): Local file backup
  - pg_dump → gzip → /var/backups
  - Retention 7 days
  - Cost: free (uses existing disk)

Tier 2 (production): Off-site backup
  - rclone /var/backups → S3/B2/cheap-cloud
  - Retention 30+ days
  - Cost: ~$0.005/GB/mo

Tier 3 (regulated): Point-in-time recovery
  - Continuous WAL archiving
  - PITR via pgBackRest or Barman
```

📢 **Restore = critical**:

> "Untested backup = no backup. Course homework: do a restore drill"

### 🖥️ Live Demo (~15 min)

**1. Backup script** (Task 10.3 — 5 min)

(พิมพ์ตาม Plan)

📢 **Highlights**:

```bash
docker exec coffee-postgres pg_dump -U coffee coffee \
  | gzip > "$BACKUP_DIR/coffee-$DATE.sql.gz"
```

> "Stream from container → gzip on host. ~50% smaller than uncompressed"

```bash
find "$BACKUP_DIR" -name 'coffee-*.sql.gz' -mtime +$RETENTION_DAYS -delete
```

> "Auto-cleanup old. mtime +7 = older than 7 days"

**2. Deploy + cron** (Task 10.4 — 5 min)

ใน VPS:

```bash
sudo mkdir -p /var/backups/coffee
sudo chown deploy:deploy /var/backups/coffee
mkdir -p ~/scripts
nano ~/scripts/backup.sh
# paste content
chmod +x ~/scripts/backup.sh

~/scripts/backup.sh
ls /var/backups/coffee/

crontab -e
# Add: 0 3 * * * /home/deploy/scripts/backup.sh
```

**3. Restore drill** (5 min) — student exercise

> "Practice restore — important skill"

```bash
# On VPS, test in a copy DB:
docker compose exec postgres createdb -U coffee coffee_restore_test
gunzip < /var/backups/coffee/coffee-<date>.sql.gz \
  | docker compose exec -T postgres psql -U coffee coffee_restore_test
docker compose exec postgres psql -U coffee coffee_restore_test -c "SELECT COUNT(*) FROM users;"
docker compose exec postgres dropdb -U coffee coffee_restore_test
```

📢 **Critical**:

> "ทดสอบ restore เดือนละครั้ง. Backup ที่ restore ไม่ได้ = no backup"

### 🖥️ Runbook Creation (5 min)

**4. DEPLOY.md** (Task 10.5 — 5 min)

(พิมพ์/copy ตาม Plan — runbook for ops)

📢 **Sections**:

- Live URL
- Architecture
- Deploy
- Manual rollback
- Database operations
- Logs
- Healthchecks
- Common issues + fixes

> "When server is down at 2 AM, this is what you read. Document NOW while still fresh"

Commit:

```bash
git add scripts/backup.sh docs/DEPLOY.md
git commit -m "feat: backup automation + deployment runbook"
git push origin main
# Auto-deploys (no real change but tests workflow)
```

✅ **Checkpoint**: backup running + runbook documented

---

## 🎓 Course Recap + Closing (100-115 min, 15 min)

### What We Built (5 min)

แสดง slide:

```
Week 1: FE Foundation
  ✓ pnpm + Turborepo monorepo
  ✓ Next.js 15 + App Router
  ✓ Tailwind + shadcn/ui
  ✓ React Hook Form + Zod
  ✓ Vitest TDD basics

Week 2: BE Foundation
  ✓ NestJS + DI + modules
  ✓ Postgres + Prisma + migrations
  ✓ JWT auth + bcrypt + Guards

Week 3: First End-to-End Slice
  ✓ Schema sharing (1 schema, 2 sides)
  ✓ TanStack Query
  ✓ httpOnly cookie auth
  ✓ Admin Menu CRUD

Week 4: Order Flow
  ✓ Atomic transactions ($transaction)
  ✓ Snapshot pattern
  ✓ State machine
  ✓ Zustand cart with persist
  ✓ Polling-based realtime

Week 5: Inventory + Reports ⭐
  ✓ Event-sourced inventory
  ✓ 4-table atomic stock deduct
  ✓ Recipe whole-replace
  ✓ Prisma groupBy + $queryRaw
  ✓ Recharts dashboard

Week 6: Deploy 🚀
  ✓ Hetzner VPS + hardening
  ✓ Multi-stage Dockerfiles
  ✓ Caddy auto-HTTPS
  ✓ GitHub Actions CI/CD
  ✓ Backup automation
```

### Final Project (5 min)

แชร์ link:

- [Final Project Rubric](../master/final-project-rubric.md)

📢 **3 tiers**:

- **Functional Baseline** — passes course
- **Professional Quality** — portfolio-ready
- **Production Ready** (Distinction) — live on VPS + GitOps

> "ทุกคนตอนนี้ = Production Ready. ดี! ส่ง self-assessment + ขอ instructor review"

### Learning Path Forward (3 min)

> [ดู spec § 7.2](../../superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Tier 1** (เรียนต่อทันที):

1. Auth deep dive (NextAuth.js, OAuth, refresh)
2. Real Payment (Stripe / Omise + webhooks)
3. Observability (Sentry, OpenTelemetry)

**Tier 2** (engineering depth): 4. E2E Testing (Playwright) 5. Performance (Redis, indexing) 6. Background Jobs (BullMQ)

**Tier 3** (system scale): 7. Multi-tenant (RLS) 8. Mobile (React Native + Expo, reuse API) 9. Container Orchestration (k3s/k8s) 10. Real-time (Socket.io)

### Mindset Takeaways (2 min)

🎓 **6 ideas to remember**:

1. **Schema-first** — define data shape, code follows
2. **Snapshot pattern** — historical accuracy via captured values
3. **Event-sourced** — log everything, derive state
4. **Atomic transactions** — multi-table changes = all-or-nothing
5. **GitOps** — git is source of truth for production
6. **Single VPS first** — k8s/microservices = overkill until proven needed

---

## 🎉 Closing (115-120 min, 5 min)

### Q&A + Celebration

📢 **Speech**:

> "5 สัปดาห์ที่ผ่านมา + วันนี้ = คุณได้:
>
> 🌐 ระบบ live ที่ทำงานจริง
> 📚 Skills ที่ industry ใช้
> 💼 Portfolio piece ที่ recruiter ดู
> 🤝 Friends ที่เรียนด้วยกัน
>
> สิ่งที่เหลือคือ keep building. หา feature ใหม่ที่อยากใส่ → ใส่. ทำ. ปรับ. ส่งต่อ.
>
> Coffee shop ที่คุณสร้าง = first of many. ขอบคุณที่อยู่จนจบครับ 🙏"

แชร์ live URLs ของแต่ละ student → group celebration

---

## 📝 Post-Session Self-Review (instructor)

| Item                         | Note   |
| ---------------------------- | ------ |
| Everyone live with GitOps?   | \_\_\_ |
| CI/Deploy workflows running? | \_\_\_ |
| Backup cron set?             | \_\_\_ |
| Final project clear?         | \_\_\_ |
| Course energy: closing?      | \_\_\_ |
| Things to improve next batch | \_\_\_ |

## 📋 Post-Course Follow-up (instructor)

- [ ] Schedule final project review meeting (1 month)
- [ ] Send Tier 1-3 learning path PDF to students
- [ ] Add cohort to alumni Slack/Discord
- [ ] Collect testimonials for next batch marketing
- [ ] Update pitfalls/FAQ with new common issues
- [ ] Personal reflection: what worked / what didn't
