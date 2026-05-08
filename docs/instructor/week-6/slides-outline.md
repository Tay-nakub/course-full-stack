# Week 6 — Slides Outline

**Audience:** instructor

**Total slides target:** ~18 slides

---

## 🎬 Session 1 Slides (9 slides) — VPS + Containers

### Slide 1.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 6 · Session 1             │
│       Deploy to VPS 🚀               │
│                                      │
│       From localhost to live URL     │
└──────────────────────────────────────┘
```

### Slide 1.02 — Course Arc

```
Week 1: FE foundation         ✅
Week 2: BE foundation         ✅
Week 3: First slice (menu)    ✅
Week 4: Order flow            ✅
Week 5: Inventory + reports   ✅
Week 6: DEPLOY 🚀              ⬅ today

  Today: live URL with HTTPS
  Session 2: git push → auto deploy
```

### Slide 1.03 — VPS vs PaaS

```
Vercel/Railway:              VPS (Hetzner CX22):
─────────────────            ─────────────────────
+ zero config                + full control
+ auto-scale                 + cheap (€4.5/mo flat)
+ great DX                   + learn infrastructure
- $$ as you grow             + skills transferable
- vendor lock-in             - you maintain

Course = VPS
  - cost-effective
  - skills transferable
  - learn how internet works
```

### Slide 1.04 — Server Hardening Defense in Depth

```
VPS on internet = 24/7 attacks
  - SSH brute force (every minute)
  - Port scans
  - Default credential attempts

5 layers of defense:
  1. Firewall (ufw — block ports)
  2. fail2ban (lockout brute force)
  3. SSH key only (no password)
  4. Disable root login
  5. Auto security updates
```

### Slide 1.05 — Multi-stage Dockerfile

```
Single-stage:                Multi-stage:
──────────────────           ─────────────────────
FROM node:20                 Stage 1 (builder):
COPY everything                FROM node:20
RUN install (dev too)          install + build
RUN build                      
CMD start                    Stage 2 (runtime):
                               FROM node:20-alpine
                               COPY --from=builder
Result: 1.5+ GB                  dist + prod deps
                               USER nestjs (non-root)
                               CMD start

                             Result: 200-300 MB
```

### Slide 1.06 — Layer Caching

```
Bad (cache invalidated early):
  COPY . .              ← any file change = rebuild
  RUN pnpm install      ← always re-installs

Good (leverage cache):
  COPY package.json pnpm-lock.yaml ./
  RUN pnpm install      ← cached unless deps change
  COPY . .
  RUN pnpm build        ← rebuilt when source changes

  Lockfile change = re-install
  Source change = re-build only
```

### Slide 1.07 — Docker Compose Services

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

  Only Caddy is publicly exposed (80/443)
  Others reachable via Docker DNS (`api`, `postgres`)
```

### Slide 1.08 — Caddyfile Auto-HTTPS

```
{$DOMAIN} {
    encode zstd gzip
    
    handle /api/* {
        reverse_proxy api:4000
    }
    
    handle {
        reverse_proxy web:3000
    }
}

  Magic:
  - Caddy reads {$DOMAIN}
  - Requests Let's Encrypt cert (HTTP-01 challenge)
  - Auto-renews before expiry
  - Same Caddyfile = HTTPS for life

  vs nginx + certbot: 50+ lines + cron + reload
```

### Slide 1.09 — Wrap + Homework

```
📝 HOMEWORK (~3 hrs)

Manual deploy:
□ Point domain DNS to VPS IP
□ SCP compose + Caddyfile to VPS
□ Build images locally + push to GHCR
□ Setup .env on VPS
□ docker compose up -d
□ Verify https://your-domain.com/menu

Seed prod DB:
□ docker compose exec api npx prisma db seed

🎯 Session 2 will assume site is LIVE.
   Ask in Slack if stuck — don't suffer alone.

─── 🎯 RECAP ───────────────────
1. Why multi-stage Dockerfile?
2. Caddy auto-HTTPS via?
3. expose vs ports — what's different?
```

---

## 🎬 Session 2 Slides (9 slides) — GitOps + Closing

### Slide 2.01 — Cover

```
┌──────────────────────────────────────┐
│       ☕ COFFEE SHOP COURSE          │
│       Week 6 · Session 2 — FINAL     │
│       GitOps + Course Closing 🎉     │
│                                      │
│       git push → live in 3 minutes   │
└──────────────────────────────────────┘
```

### Slide 2.02 — CI vs CD

```
CI = Continuous Integration
  - Every PR triggers
  - Lint + typecheck + test
  - Block bad merges
  - Quality gate

CD = Continuous Deployment  
  - Every main push triggers
  - Build + push images
  - SSH deploy
  - "No human touches prod"

Together: "Push to main = trustworthy live"
```

### Slide 2.03 — GitOps Flow

```
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

### Slide 2.04 — GitHub Actions Workflow Anatomy

```yaml
on:                       # trigger
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:                     # parallel by default
  quality:                # job name
    runs-on: ubuntu-latest
    services:             # sidecar (DB, Redis)
      postgres: ...
    
    steps:                # sequential
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm test
```

### Slide 2.05 — Image Tagging Strategy

```yaml
tags: |
  ghcr.io/.../coffee-api:latest
  ghcr.io/.../coffee-api:${{ steps.sha.outputs.sha_short }}

Two tags every deploy:
  - latest = convenience (current production)
  - sha   = immutable (rollback target)

Rollback in 30 sec:
  TAG=abc1234 docker compose up -d
  → previous image pulled + restarted
  → live in 30 sec

Cannot rollback with only "latest"
```

### Slide 2.06 — Backup Strategy

```
Tier 1 (course): Local file
  pg_dump → gzip → /var/backups
  Cron: 0 3 * * *
  Retention: 7 days
  Cost: free

Tier 2 (production):
  + rclone → S3/B2 off-site
  + Retention: 30 days
  + Cost: ~$0.005/GB/mo

Tier 3 (regulated):
  + Continuous WAL archiving
  + Point-in-time recovery
  + pgBackRest or Barman

⚠️ Untested backup = no backup
   Practice restore monthly
```

### Slide 2.07 — Course Recap

```
What we built:

  Week 1: FE foundation (Next.js + monorepo)
  Week 2: BE foundation (NestJS + Postgres)
  Week 3: First slice (menu CRUD)
  Week 4: Order flow (multi-actor)
  Week 5: Inventory + reports ⭐
  Week 6: Deploy + GitOps 🚀

Now you have:
  🌐 Live coffee shop with HTTPS
  🔄 GitOps: git push → auto deploy
  🧪 CI on every PR
  💾 Daily DB backup
  📚 Production runbook
  🎓 Skills: full-stack TS, monorepo, NestJS,
            Prisma, Docker, GitOps
```

### Slide 2.08 — Mindset Takeaways

```
🎓 6 ideas to remember:

1. Schema-first
   define data shape, code follows

2. Snapshot pattern
   historical accuracy via captured values

3. Event-sourced inventory
   log everything, derive state

4. Atomic transactions
   multi-table changes = all-or-nothing

5. GitOps
   git is source of truth for production

6. Single VPS first
   k8s = overkill until proven needed
```

### Slide 2.09 — Learning Path Forward

```
Tier 1 — เรียนต่อทันที:
□ Auth deep dive (OAuth, refresh)
□ Real payment (Stripe/Omise)
□ Observability (Sentry, OpenTelemetry)

Tier 2 — engineering depth:
□ E2E Testing (Playwright)
□ Performance (Redis, indexing)
□ Background jobs (BullMQ)

Tier 3 — system scale:
□ Multi-tenant (RLS)
□ Mobile app (React Native)
□ Container orchestration (k3s/k8s)
□ Real-time (Socket.io)

Course taught the FOUNDATION.
The rest is practice + reading docs.
```

---

## 🛠️ Build Notes

### Critical Visual Aids
- **2 browsers**: GitHub Actions tab + live URL (verify deploy)
- **Live demo deploy**: actually push during class, watch run live
- **DBeaver**: verify data persistence across deploys

### Closing Tone
- Celebrate — student built real thing
- Encourage continuation
- Share live URLs in group chat
- Invite to alumni community
