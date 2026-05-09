---
theme: seriph
title: 'Coffee Shop Course — Week 6'
info: |
  ## Week 6 — Deploy + GitOps + Course Closing
  Coffee Shop Full-Stack Course (6 weeks)
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: fade
mdc: true
fonts:
  sans: 'Inter, ui-sans-serif, system-ui'
  mono: 'JetBrains Mono, Fira Code, ui-monospace, monospace'
defaults:
  layout: default
---

# ☕ Coffee Shop Course

## Week 6 · Session 1

### Deploy to VPS 🚀

<div class="muted mt-8 text-sm">
From localhost to live URL
</div>

<!--
Last week. ของจริง — VPS, HTTPS, Docker images, public URL.
-->

---

## layout: center

# Course Arc

```text
Week 1: FE foundation         ✅
Week 2: BE foundation         ✅
Week 3: First slice (menu)    ✅
Week 4: Order flow            ✅
Week 5: Inventory + reports   ✅
Week 6: DEPLOY 🚀             ⬅ today
```

<div class="mt-8 grid grid-cols-2 gap-8">

<div>

### Today

Live URL with HTTPS

</div>

<div>

### Session 2

`git push` → auto deploy

</div>

</div>

---

# VPS vs PaaS

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Vercel / Railway

- ✅ Zero config
- ✅ Auto-scale
- ✅ Great DX
- ❌ $$ as you grow
- ❌ Vendor lock-in

</div>

<div>

### VPS (Hetzner CX22) <span class="coffee">←</span>

- ✅ Full control
- ✅ Cheap (€4.5/mo flat)
- ✅ Learn infrastructure
- ✅ Skills transferable
- ⚠️ You maintain

</div>

</div>

<div class="mt-8 text-center text-xl">

Course = <span class="coffee">VPS</span> · cost-effective · skills transferable · learn how internet works

</div>

---

## layout: center

# Server Hardening — Defense in Depth

<div class="text-lg muted mb-4">VPS on internet = 24/7 attacks</div>

```text
- SSH brute force (every minute)
- Port scans
- Default credential attempts
```

<div class="mt-6 text-lg coffee mb-2">5 layers of defense:</div>

<v-clicks>

<div>1. Firewall (<code>ufw</code> — block ports)</div>
<div>2. <code>fail2ban</code> (lockout brute force)</div>
<div>3. SSH key only (no password)</div>
<div>4. Disable root login</div>
<div>5. Auto security updates</div>

</v-clicks>

---

# Multi-stage Dockerfile

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### Single-stage

```dockerfile
FROM node:20
COPY everything
RUN install (dev too)
RUN build
CMD start
```

<div class="mt-2 muted text-sm">Result: <span class="coffee">1.5+ GB</span></div>

</div>

<div>

### Multi-stage <span class="coffee">←</span>

````md magic-move {lines: true}
```dockerfile
# Stage 1 (builder)
FROM node:20
# install + build
```

```dockerfile
# Stage 1 (builder)
FROM node:20
# install + build

# Stage 2 (runtime)
FROM node:20-alpine
COPY --from=builder dist + prod deps
USER nestjs (non-root)
CMD start
```
````

<div class="mt-2 muted text-sm">Result: <span class="coffee">200-300 MB</span></div>

</div>

</div>

<!--
magic-move shows the multi-stage build out reveals stage 2 on click.
-->

---

# Layer Caching

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### ❌ Bad — cache invalidated early

```dockerfile {1-2|3-4}
COPY . .
RUN pnpm install
# any file change = rebuild
# always re-installs
```

</div>

<div>

### ✅ Good — leverage cache

```dockerfile {1-2|3-5}
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
# cached unless deps change
COPY . .
RUN pnpm build
```

</div>

</div>

<div class="mt-8 text-center">

Lockfile change = re-install · Source change = re-build only

</div>

---

# Docker Compose Services

```yaml
services:
  caddy:        ports: [80, 443]    # public
    image: caddy:2-alpine
    volumes: [Caddyfile, certs]

  web:          expose: 3000        # internal
    image: ghcr.io/<user>/coffee-web

  api:          expose: 4000        # internal
    image: ghcr.io/<user>/coffee-api
    depends_on: postgres

  postgres:     expose: 5432        # internal
    image: postgres:16-alpine
    volumes: [data]
    healthcheck: pg_isready
```

<div class="mt-4 muted text-sm">

Only Caddy is publicly exposed (80/443). Others reachable via Docker DNS (<code>api</code>, <code>postgres</code>).

</div>

---

# Caddyfile Auto-HTTPS

```nginx
{$DOMAIN} {
    encode zstd gzip

    handle /api/* {
        reverse_proxy api:4000
    }

    handle {
        reverse_proxy web:3000
    }
}
```

<div class="mt-4">

### Magic

<v-clicks>

- Caddy reads `{$DOMAIN}`
- Requests Let's Encrypt cert (HTTP-01 challenge)
- Auto-renews before expiry
- Same Caddyfile = HTTPS for life

</v-clicks>

</div>

<div class="mt-4 muted text-center text-sm">
vs nginx + certbot: 50+ lines + cron + reload
</div>

---

# 📝 Homework + Recap

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

### Manual deploy <span class="muted">(~3 hrs)</span>

- [ ] Point domain DNS to VPS IP
- [ ] SCP compose + Caddyfile to VPS
- [ ] Build images locally + push to GHCR
- [ ] Setup `.env` on VPS
- [ ] `docker compose up -d`
- [ ] Verify `https://your-domain.com/menu`

**Seed prod DB:**

- [ ] `docker compose exec api npx prisma db seed`

<div class="mt-3 muted text-sm">
🎯 Session 2 will assume site is LIVE.<br>
Ask in Slack if stuck — don't suffer alone.
</div>

</div>

<div>

### 🎯 Recap quiz

<v-clicks>

1. Why multi-stage Dockerfile?
2. Caddy auto-HTTPS via?
3. `expose` vs `ports` — what's different?

</v-clicks>

</div>

</div>

---

## layout: cover

# ☕ Session 2 — FINAL

## Week 6 · Session 2

### GitOps + Course Closing 🎉

<div class="muted mt-8 text-sm">git push → live in 3 minutes</div>

---

# CI vs CD

<div class="grid grid-cols-2 gap-6 mt-4">

<div>

### CI = Continuous Integration

- Every PR triggers
- Lint + typecheck + test
- Block bad merges
- Quality gate

</div>

<div>

### CD = Continuous Deployment

- Every `main` push triggers
- Build + push images
- SSH deploy
- "No human touches prod"

</div>

</div>

<div class="mt-10 text-center text-xl coffee">
Together: "Push to main = trustworthy live"
</div>

---

## layout: center

# GitOps Flow

```text
[git push origin main]
        │
        ▼
[GitHub Actions]
  ├── Build & push images to GHCR
  │   (tag with git SHA)
  │
  └── SSH to VPS
        ├── docker compose pull
        ├── docker compose up -d
        └── docker image prune

[VPS]
  → pulls new images
  → recreates web + api containers
  → Caddy holds connections during ~3s restart

[Live]
  ~3 minutes total
```

---

# GitHub Actions Workflow Anatomy

```yaml
on: # trigger
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs: # parallel by default
  quality: # job name
    runs-on: ubuntu-latest
    services: # sidecar (DB, Redis)
      postgres: ...

    steps: # sequential
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test
```

---

# Image Tagging Strategy

```yaml
tags: |
  ghcr.io/.../coffee-api:latest
  ghcr.io/.../coffee-api:${{ steps.sha.outputs.sha_short }}
```

<div class="mt-6">

### Two tags every deploy

- `latest` = convenience (current production)
- `sha` = immutable (rollback target)

</div>

<div class="mt-4">

### Rollback in 30 sec

```bash
TAG=abc1234 docker compose up -d
# previous image pulled + restarted
# live in 30 sec
```

</div>

<div class="mt-4 text-center coffee">
Cannot rollback with only "latest"
</div>

---

# Backup Strategy

<div class="grid grid-cols-3 gap-4 mt-4 text-sm">

<div>

### Tier 1 — course

- `pg_dump` → gzip → `/var/backups`
- Cron: `0 3 * * *`
- Retention: 7 days
- Cost: free

</div>

<div>

### Tier 2 — production

- `+` rclone → S3 / B2 off-site
- Retention: 30 days
- Cost: ~$0.005/GB/mo

</div>

<div>

### Tier 3 — regulated

- `+` Continuous WAL archiving
- Point-in-time recovery
- pgBackRest or Barman

</div>

</div>

<div class="mt-10 text-center text-xl coffee">
⚠️ Untested backup = no backup
</div>

<div class="mt-2 muted text-center">Practice restore monthly</div>

---

# Course Recap

<div class="text-lg muted mb-3">What we built:</div>

<div class="grid grid-cols-2 gap-x-6 gap-y-2 text-base">

<div><span class="coffee font-mono">Week 1</span> · FE foundation</div>
<div class="muted">Next.js + monorepo</div>

<div><span class="coffee font-mono">Week 2</span> · BE foundation</div>
<div class="muted">NestJS + Postgres</div>

<div><span class="coffee font-mono">Week 3</span> · First slice</div>
<div class="muted">Menu CRUD</div>

<div><span class="coffee font-mono">Week 4</span> · Order flow</div>
<div class="muted">Multi-actor</div>

<div><span class="coffee font-mono">Week 5</span> · Inventory + reports ⭐</div>
<div class="muted">Stock + COGS + Recharts</div>

<div><span class="coffee font-mono">Week 6</span> · Deploy + GitOps 🚀</div>
<div class="muted">Live ขึ้น VPS</div>

</div>

<div class="mt-6 text-sm">

**Now you have:** 🌐 Live coffee shop with HTTPS · 🔄 git push → auto deploy · 🧪 CI on every PR · 💾 daily DB backup · 📚 production runbook · 🎓 skills

</div>

---

# Mindset Takeaways

<div class="text-lg coffee mb-3">🎓 6 ideas to remember:</div>

<v-clicks>

<div class="mt-2">

**1. Schema-first** <span class="muted">— define data shape, code follows</span>

</div>

<div>

**2. Snapshot pattern** <span class="muted">— historical accuracy via captured values</span>

</div>

<div>

**3. Event-sourced inventory** <span class="muted">— log everything, derive state</span>

</div>

<div>

**4. Atomic transactions** <span class="muted">— multi-table changes = all-or-nothing</span>

</div>

<div>

**5. GitOps** <span class="muted">— git is source of truth for production</span>

</div>

<div>

**6. Single VPS first** <span class="muted">— k8s = overkill until proven needed</span>

</div>

</v-clicks>

---

# Learning Path Forward

<div class="grid grid-cols-3 gap-4 mt-4 text-sm">

<div>

### Tier 1 — เรียนต่อทันที

- [ ] Auth deep dive (OAuth, refresh)
- [ ] Real payment (Stripe / Omise)
- [ ] Observability (Sentry, OpenTelemetry)

</div>

<div>

### Tier 2 — engineering depth

- [ ] E2E Testing (Playwright)
- [ ] Performance (Redis, indexing)
- [ ] Background jobs (BullMQ)

</div>

<div>

### Tier 3 — system scale

- [ ] Multi-tenant (RLS)
- [ ] Mobile app (React Native)
- [ ] Container orchestration (k3s/k8s)
- [ ] Real-time (Socket.io)

</div>

</div>

<div class="mt-12 text-center text-xl coffee">
Course taught the FOUNDATION.<br>
The rest is practice + reading docs.
</div>

---

layout: center
class: text-center

---

# 🎉 Congratulations! 🎉

<div class="text-2xl muted mt-6">You shipped a real coffee shop.</div>

<div class="mt-12 text-lg space-y-3">

<v-clicks>

- Share your live URL in the group chat
- Stay in the alumni community
- Keep building

</v-clicks>

</div>

<div class="mt-16 coffee text-xl">
☕ Thank you. ☕
</div>

<style>
.coffee { color: #f5a623; font-weight: 600; }
.muted { color: #a6adc8; }
</style>
