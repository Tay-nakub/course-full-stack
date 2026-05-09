# Week 6 — Deploy + GitOps Implementation Plan 🚀

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `git push origin main` → 2 นาทีต่อมา https://your-coffee-shop.com อัปเดตแบบเป็นอัตโนมัติ. มี HTTPS, มี backup รายวัน, มี healthcheck

**Architecture:** 1 VPS (Hetzner CX22) รัน 4 containers (Caddy + Next.js + NestJS + Postgres) ผ่าน Docker Compose. Caddy auto-issues Let's Encrypt cert. GitHub Actions builds + pushes images to GHCR + SSH-deploys

**Tech Stack:** Hetzner VPS + Ubuntu 24.04 + Docker + Docker Compose + Caddy 2 + GitHub Actions + GHCR

**Spec Reference:** [course design spec § Week 6](../specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Pre-requisites:**

- Week 1-5 complete (full stack working locally)
- **Domain ready** — ซื้อแล้ว (Cloudflare/Namecheap/etc) หรือใช้ subdomain ที่มีอยู่
- **Credit card** สำหรับ Hetzner (~€4.5/mo)
- Docker Desktop installed locally

---

## File Structure (เป้าหมายเมื่อจบ Week 6)

```
course-full-stack/
├── infra/
│   ├── docker/
│   │   ├── Dockerfile.web              ← ⭐ ใหม่ multi-stage
│   │   └── Dockerfile.api              ← ⭐ ใหม่ multi-stage
│   ├── caddy/
│   │   └── Caddyfile                   ← ⭐ ใหม่
│   ├── docker-compose.dev.yml          ← จาก Week 2
│   └── docker-compose.prod.yml         ← ⭐ ใหม่
│
├── scripts/
│   └── backup.sh                       ← ⭐ ใหม่
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      ← ⭐ ใหม่ (PR check)
│       └── deploy.yml                  ← ⭐ ใหม่ (main → deploy)
│
├── apps/
│   ├── web/
│   │   └── (existing)
│   └── api/
│       └── (existing — entrypoint runs prisma migrate deploy)
│
└── docs/
    └── DEPLOY.md                       ← ⭐ runbook
```

---

## Tasks

### Task 1: Provision Hetzner VPS + SSH Setup

**Files:** None (infrastructure setup)

> ⚠️ **Cost**: เริ่มมีค่าใช้จ่ายตรงนี้ ~€4.5/mo (Hetzner CX22). Cancel ได้ตลอด

- [ ] **Step 1.1: สร้าง Hetzner account**

1. Sign up at https://www.hetzner.com/cloud
2. Verify email + add payment method
3. Create new project: "coffee-shop"

- [ ] **Step 1.2: Generate SSH key (local — ถ้ายังไม่มี)**

```bash
# ตรวจมีอยู่แล้วไหม
ls ~/.ssh/id_ed25519.pub

# ถ้ายังไม่มี:
ssh-keygen -t ed25519 -C "deploy@coffee-shop"
# Enter ทุกอย่าง (no passphrase สำหรับ deploy key — หรือ use passphrase + ssh-agent)

cat ~/.ssh/id_ed25519.pub
# Copy ทั้งบรรทัด
```

- [ ] **Step 1.3: Add SSH key ใน Hetzner Cloud**

Hetzner Console → Security → SSH Keys → Add → Paste public key → Save

- [ ] **Step 1.4: Create CX22 server**

Hetzner Console → Servers → New Server:

- Location: Falkenstein, Helsinki, or Singapore (closest to user)
- Image: **Ubuntu 24.04**
- Type: **CX22** (€4.51/mo, 2 vCPU, 4 GB RAM, 40 GB disk)
- Networking: Public IPv4 + IPv6
- SSH keys: select เคยที่ uploaded
- Server name: `coffee-prod`

→ Create — wait ~30 seconds → จะมี Public IP

- [ ] **Step 1.5: Test SSH**

```bash
ssh root@<your-server-ip>
# ถ้า prompt accept fingerprint → yes
# ถ้า login เป็น root → ✓
```

> 📝 **Note**: Hetzner default = root login via SSH key. We'll create non-root user next

- [ ] **Step 1.6: Update + create non-root user**

ใน VPS (as root):

```bash
# Update OS
apt update && apt upgrade -y

# Create deploy user
adduser deploy
# Set password (or skip with --disabled-password)
# Press Enter for personal info defaults

# Add to sudo group
usermod -aG sudo deploy

# Copy SSH keys to deploy user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

- [ ] **Step 1.7: Test deploy user SSH**

```bash
# Logout from root
exit

# SSH as deploy
ssh deploy@<server-ip>
# Should login without password
```

- [ ] **Step 1.8: Document IP + commit (just notes)**

ใน local repo:

```bash
echo "VPS_IP=<your-ip>" > .deploy-notes
echo "Add this to .gitignore (don't commit IP)"
```

แก้ `.gitignore`:

```
.deploy-notes
```

✅ Checkpoint: SSH `deploy@vps` works

---

### Task 2: Server Hardening (ufw + fail2ban + SSH config)

> 🛡️ **Goal**: VPS = อยู่บน Internet 24/7. แต่ละนาทีมี bot scan SSH brute force → ป้องกันก่อนเปิด services

- [ ] **Step 2.1: ufw firewall**

ใน VPS (as deploy via sudo):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable
# y to confirm

sudo ufw status verbose
# Expected: active, deny incoming, allow 22/80/443
```

- [ ] **Step 2.2: fail2ban for SSH brute force**

```bash
sudo apt install -y fail2ban

# Default config protects SSH automatically
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo systemctl status fail2ban
# Expected: active (running)

# Check banned IPs (may be empty initially)
sudo fail2ban-client status sshd
```

- [ ] **Step 2.3: Disable root SSH + password auth**

```bash
sudo nano /etc/ssh/sshd_config
```

Find + set:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

Save. Reload SSH:

```bash
sudo systemctl reload ssh
```

> ⚠️ **Don't logout yet** — keep current session. Open NEW terminal + test:

```bash
# New terminal:
ssh deploy@<ip>     # should still work (key auth)
ssh root@<ip>       # should fail "Permission denied"
```

ถ้า new login OK → safe to logout original session.

- [ ] **Step 2.4: เปิด unattended security upgrades**

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
# Yes
```

> 🎓 **Why**: Auto-install security patches → ลด attack surface

✅ Checkpoint: ufw active + fail2ban running + root SSH disabled

---

### Task 3: Install Docker + Docker Compose

- [ ] **Step 3.1: Install Docker via official script**

ใน VPS:

```bash
curl -fsSL https://get.docker.com | sh
# Wait ~30s

# Add deploy to docker group
sudo usermod -aG docker deploy

# Logout + login เพื่อให้ group มีผล
exit
ssh deploy@<ip>

# Verify
docker --version
docker compose version
docker run hello-world
```

- [ ] **Step 3.2: Disable Docker UFW conflict**

> ⚠️ **Important**: Docker bypasses UFW by default. ทำให้ ports ที่ Docker เปิด (e.g., 5432) accessible ต่อ public!

Create file `/etc/docker/daemon.json`:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "iptables": false
}
```

```bash
sudo systemctl restart docker
```

> 📝 **Better fix**: ใช้ `127.0.0.1:5432:5432` mapping (only bind localhost). Course Caddy = expose 80/443 only, internal services not exposed → safe

✅ Checkpoint: `docker run hello-world` works

---

### Task 4: Multi-stage Dockerfile.api

**Files:**

- Create: `infra/docker/Dockerfile.api`
- Modify: `apps/api/package.json` (add `start:prod` script if missing)

> 🎓 **Multi-stage** = ลด final image size + ป้องกัน source code leak

- [ ] **Step 4.1: สร้าง Dockerfile.api**

Create file `infra/docker/Dockerfile.api`:

```dockerfile
# ───────── Stage 1: Builder ─────────
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /repo

# Copy workspace manifest first (cache layer)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/

# Install all deps (includes dev for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared packages/shared/
COPY apps/api apps/api/

# Generate Prisma client + build
RUN cd apps/api && pnpm prisma generate
RUN cd apps/api && pnpm build

# Prune dev deps for production
RUN pnpm install --frozen-lockfile --prod

# ───────── Stage 2: Runtime ─────────
FROM node:20-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Copy built artifacts + production node_modules
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/package.json ./
COPY --from=builder --chown=nestjs:nodejs /repo/node_modules ./root_node_modules

# Need shared package + Prisma engine
COPY --from=builder --chown=nestjs:nodejs /repo/packages/shared ./packages/shared

USER nestjs

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Entrypoint: migrate then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

> 🎓 **Stages explained**:
>
> - **Builder**: full deps + source + build → produces dist/ + node_modules
> - **Runtime**: minimal — just dist + production node_modules + non-root user
> - **CMD**: `prisma migrate deploy` runs idempotent migrations on container start

- [ ] **Step 4.2: Test build locally**

```bash
cd /Users/teerapatcheung/Desktop/0-Project/course-full-stack
docker build -f infra/docker/Dockerfile.api -t coffee-api:test .
# Wait ~3-5 min for first build (subsequent faster with cache)

# Verify size (should be < 250 MB)
docker images coffee-api:test
```

- [ ] **Step 4.3: Smoke test container**

```bash
# Need real DATABASE_URL — use dev DB
docker run --rm -p 4001:4000 \
  -e DATABASE_URL="postgresql://coffee:coffee_dev_password@host.docker.internal:5432/coffee" \
  -e JWT_SECRET="test-secret-min-32-chars-recommended-here" \
  coffee-api:test

# Should log: "🚀 API ready"
# Test:
curl http://localhost:4001/api/healthz
# Expected: { status: "ok", database: "connected" }

# Ctrl+C to stop
```

- [ ] **Step 4.4: Commit**

```bash
git add infra/docker/Dockerfile.api
git commit -m "feat(infra): add multi-stage Dockerfile for NestJS API"
```

---

### Task 5: Multi-stage Dockerfile.web

**Files:**

- Create: `infra/docker/Dockerfile.web`
- Modify: `apps/web/next.config.ts` (add `output: 'standalone'`)

- [ ] **Step 5.1: เปิด Next.js standalone output**

แก้ `apps/web/next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone', // ⭐ standalone build for Docker
  async rewrites() {
    if (process.env.NODE_ENV === 'production') {
      // ใน prod, Caddy จัดการ /api/* → ไม่ต้อง rewrite
      return [];
    }
    return [{ source: '/api/:path*', destination: 'http://localhost:4000/api/:path*' }];
  },
};

export default nextConfig;
```

> 🎓 **Standalone**: Next.js สร้าง self-contained server bundle → ใส่ใน image เล็กลงเยอะ

- [ ] **Step 5.2: สร้าง Dockerfile.web**

Create file `infra/docker/Dockerfile.web`:

```dockerfile
# ───────── Stage 1: Builder ─────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared/
COPY apps/web apps/web/

# Build standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && pnpm build

# ───────── Stage 2: Runtime ─────────
FROM node:20-alpine AS runtime

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

WORKDIR /app

# Copy standalone output (includes node_modules)
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
```

> 📝 **Note**: standalone server is at `apps/web/server.js` (Next.js generates this)

- [ ] **Step 5.3: Test build**

```bash
docker build -f infra/docker/Dockerfile.web -t coffee-web:test .
docker images coffee-web:test
# Should be < 300 MB
```

- [ ] **Step 5.4: Smoke test**

```bash
docker run --rm -p 3001:3000 \
  -e NESTJS_INTERNAL_URL="http://host.docker.internal:4000" \
  coffee-web:test

# Open http://localhost:3001/menu
# Should redirect or show menu
```

- [ ] **Step 5.5: Commit**

```bash
git add infra/docker/Dockerfile.web apps/web/next.config.ts
git commit -m "feat(infra): add multi-stage Dockerfile for Next.js standalone"
```

---

### Task 6: docker-compose.prod.yml

**Files:**

- Create: `infra/docker-compose.prod.yml`
- Create: `infra/.env.prod.example`

- [ ] **Step 6.1: docker-compose.prod.yml**

Create file `infra/docker-compose.prod.yml`:

```yaml
services:
  caddy:
    image: caddy:2-alpine
    container_name: coffee-caddy
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - web
      - api
    restart: unless-stopped

  web:
    image: ghcr.io/${GH_USER}/coffee-web:${TAG:-latest}
    container_name: coffee-web
    environment:
      NEXT_PUBLIC_API_URL: /api
      NESTJS_INTERNAL_URL: http://api:4000
    expose:
      - '3000'
    restart: unless-stopped

  api:
    image: ghcr.io/${GH_USER}/coffee-api:${TAG:-latest}
    container_name: coffee-api
    environment:
      DATABASE_URL: postgresql://coffee:${DB_PASSWORD}@postgres:5432/coffee?schema=public
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: '7d'
      NODE_ENV: production
    expose:
      - '4000'
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    container_name: coffee-postgres
    environment:
      POSTGRES_DB: coffee
      POSTGRES_USER: coffee
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'coffee']
      interval: 5s
      timeout: 3s
      retries: 5
    expose:
      - '5432'
    restart: unless-stopped

volumes:
  caddy_data:
  caddy_config:
  postgres_data:
```

> 🎓 **Concepts**:
>
> - `expose:` (not `ports:`) for internal services — only Caddy gets public ports
> - `${GH_USER}` + `${TAG}` = parameterized images
> - Caddy `caddy_data` volume persists Let's Encrypt certs

- [ ] **Step 6.2: .env.prod.example**

Create file `infra/.env.prod.example`:

```
GH_USER=your-github-username
TAG=latest
DB_PASSWORD=change-this-to-strong-random-password
JWT_SECRET=change-this-to-32-plus-char-random-string
DOMAIN=your-coffee-shop.com
```

- [ ] **Step 6.3: Commit**

```bash
git add infra/docker-compose.prod.yml infra/.env.prod.example
git commit -m "feat(infra): production docker-compose with Caddy + apps + postgres"
```

---

### Task 7: Caddyfile (auto-HTTPS reverse proxy)

**Files:**

- Create: `infra/caddy/Caddyfile`

- [ ] **Step 7.1: Caddyfile**

Create file `infra/caddy/Caddyfile`:

```
{$DOMAIN} {
    encode zstd gzip

    # API routes → NestJS
    handle /api/* {
        reverse_proxy api:4000
    }

    # Healthcheck (passthrough to NestJS)
    handle /healthz {
        reverse_proxy api:4000/api/healthz
    }

    # Everything else → Next.js
    handle {
        reverse_proxy web:3000
    }

    log {
        output stdout
        format console
    }
}
```

> 🎓 **Concepts**:
>
> - `{$DOMAIN}` = env var substitution
> - **Auto-HTTPS** = Caddy ดู domain → request Let's Encrypt cert ครั้งแรก → renew ก่อน expire
> - `handle /api/*` matches first → proxy to NestJS (Caddy doesn't strip prefix unless told)
> - `encode` = brotli/gzip compression

- [ ] **Step 7.2: Test config syntax**

```bash
docker run --rm -v $(pwd)/infra/caddy/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
# Expected: "Valid configuration"
```

- [ ] **Step 7.3: Commit**

```bash
git add infra/caddy/Caddyfile
git commit -m "feat(infra): Caddy reverse proxy with auto-HTTPS"
```

---

### Task 8: Domain DNS + First Manual Deploy

> 🎯 **Goal**: ทดสอบ stack บน prod ก่อน automate

- [ ] **Step 8.1: Point domain A record to VPS IP**

ใน DNS provider (Cloudflare/Namecheap/etc):

- Type: A
- Name: `@` (apex) or `coffee` (subdomain)
- Value: `<vps-ip>`
- TTL: Auto / 300s
- Proxy: OFF (Cloudflare) — direct connection สำคัญสำหรับ Let's Encrypt verification

Wait ~5 min, verify:

```bash
dig +short your-coffee-shop.com
# Should return your VPS IP
```

- [ ] **Step 8.2: Setup repo on VPS (manual deploy first)**

ใน VPS:

```bash
mkdir -p ~/coffeeshop
cd ~/coffeeshop

# Copy compose + Caddyfile (until automated)
mkdir -p caddy
# (will copy via scp from local)
```

ใน local:

```bash
scp infra/docker-compose.prod.yml deploy@<ip>:~/coffeeshop/docker-compose.yml
scp infra/caddy/Caddyfile deploy@<ip>:~/coffeeshop/caddy/Caddyfile
```

- [ ] **Step 8.3: Build images locally + push to GHCR**

```bash
# Login to GHCR (use Personal Access Token with write:packages)
echo $GHCR_TOKEN | docker login ghcr.io -u <your-gh-username> --password-stdin

# Build + tag
docker build -f infra/docker/Dockerfile.api -t ghcr.io/<your-gh-username>/coffee-api:latest .
docker build -f infra/docker/Dockerfile.web -t ghcr.io/<your-gh-username>/coffee-web:latest .

# Push
docker push ghcr.io/<your-gh-username>/coffee-api:latest
docker push ghcr.io/<your-gh-username>/coffee-web:latest

# Make GHCR images public (or VPS needs token)
# GitHub → Profile → Packages → coffee-api → Package settings → Change visibility → Public
```

- [ ] **Step 8.4: Setup .env บน VPS**

ใน VPS:

```bash
cd ~/coffeeshop
nano .env
```

Paste (ปรับ values):

```
GH_USER=your-github-username
TAG=latest
DB_PASSWORD=<strong-random-password-min-16-chars>
JWT_SECRET=<random-32-plus-chars>
DOMAIN=your-coffee-shop.com
```

```bash
chmod 600 .env
```

> ⚠️ Generate JWT_SECRET: `openssl rand -base64 32`
> Generate DB password: `openssl rand -base64 24`

- [ ] **Step 8.5: First deploy**

ใน VPS:

```bash
cd ~/coffeeshop
docker compose pull
docker compose up -d
docker compose logs -f
```

ดู logs:

- caddy: "issuing certificate" → "successfully obtained certificate"
- api: "🚀 API ready"
- web: Next.js ready
- postgres: "ready to accept connections"

- [ ] **Step 8.6: Verify HTTPS**

```bash
# From local
curl -I https://your-coffee-shop.com/healthz
# Expected: 200 OK + valid cert

# Open browser
open https://your-coffee-shop.com/menu
# Should redirect /menu, show empty (DB ใหม่ — ยังไม่มี data)
```

- [ ] **Step 8.7: Seed prod DB (one-time)**

```bash
ssh deploy@<ip>
cd ~/coffeeshop

# Run seed via api container
docker compose exec api npx prisma db seed
# (uses seed.ts from Wk 5)

# Verify
docker compose exec postgres psql -U coffee -d coffee -c "SELECT COUNT(*) FROM users;"
# Expected: 2 (admin + staff)
```

- [ ] **Step 8.8: End-to-end smoke test**

1. Visit https://your-coffee-shop.com → /menu (live)
2. Login as `admin@coffee.com` / `admin1234` (from seed)
3. ทุก page ทำงาน

🎉 **Congratulations**: Coffee shop is LIVE!

✅ Checkpoint: live URL accessible with HTTPS

---

### Task 9: GitHub Actions — CI Workflow

**Files:**

- Create: `.github/workflows/ci.yml`

- [ ] **Step 9.1: CI workflow**

Create file `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: coffee_test
          POSTGRES_USER: coffee
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Generate Prisma client
        run: pnpm --filter @coffee/api prisma generate
        env:
          DATABASE_URL: postgresql://coffee:test@localhost:5432/coffee_test

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test
        env:
          DATABASE_URL: postgresql://coffee:test@localhost:5432/coffee_test
          JWT_SECRET: test-secret-32-chars-min-required-length-here
```

- [ ] **Step 9.2: Test by pushing**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add quality check workflow"
git push origin main
```

GitHub → Actions tab → see workflow run

✅ Checkpoint: CI green on push

---

### Task 10: GitHub Actions — Deploy Workflow + Backup

**Files:**

- Create: `.github/workflows/deploy.yml`
- Create: `scripts/backup.sh`
- Create: `docs/DEPLOY.md`

- [ ] **Step 10.1: Add GitHub Secrets**

GitHub repo → Settings → Secrets and variables → Actions → New repository secret:

| Name              | Value                                         |
| ----------------- | --------------------------------------------- |
| `SSH_PRIVATE_KEY` | Contents of `~/.ssh/id_ed25519` (private key) |
| `VPS_HOST`        | Your VPS IP                                   |
| `VPS_USER`        | `deploy`                                      |

> 📝 **Note**: For SSH_PRIVATE_KEY, paste entire file including BEGIN/END lines

- [ ] **Step 10.2: Deploy workflow**

Create file `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      sha: ${{ steps.sha.outputs.sha_short }}

    steps:
      - uses: actions/checkout@v4

      - id: sha
        run: echo "sha_short=$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"

      - uses: docker/setup-buildx-action@v3

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

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

      - name: Build & push web
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/Dockerfile.web
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/coffee-web:latest
            ghcr.io/${{ github.repository_owner }}/coffee-web:${{ steps.sha.outputs.sha_short }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-push
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - name: Add VPS to known hosts
        run: ssh-keyscan -H ${{ secrets.VPS_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy
        run: |
          ssh ${{ secrets.VPS_USER }}@${{ secrets.VPS_HOST }} '
            cd ~/coffeeshop &&
            export TAG=${{ needs.build-push.outputs.sha }} &&
            docker compose pull &&
            docker compose up -d --remove-orphans &&
            docker image prune -f
          '
```

- [ ] **Step 10.3: Backup script**

Create file `scripts/backup.sh`:

```bash
#!/bin/bash
# Daily Postgres backup
set -euo pipefail

BACKUP_DIR="/var/backups/coffee"
DATE=$(date +%F)
RETENTION_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump from container
docker exec coffee-postgres pg_dump -U coffee coffee \
  | gzip > "$BACKUP_DIR/coffee-$DATE.sql.gz"

# Cleanup old
find "$BACKUP_DIR" -name 'coffee-*.sql.gz' -mtime +$RETENTION_DAYS -delete

# Log
echo "[$(date)] Backup complete: coffee-$DATE.sql.gz" >> "$BACKUP_DIR/backup.log"
```

- [ ] **Step 10.4: Deploy backup script + cron**

ใน VPS:

```bash
sudo mkdir -p /var/backups/coffee
sudo chown deploy:deploy /var/backups/coffee

# Create script (paste from local)
mkdir -p ~/scripts
nano ~/scripts/backup.sh
# paste content
chmod +x ~/scripts/backup.sh

# Test run
~/scripts/backup.sh
ls /var/backups/coffee/
# Expected: coffee-YYYY-MM-DD.sql.gz

# Add cron
crontab -e
# Add line: 0 3 * * * /home/deploy/scripts/backup.sh
```

- [ ] **Step 10.5: docs/DEPLOY.md (runbook)**

Create file `docs/DEPLOY.md`:

````markdown
# Deployment Runbook

## Live URL

https://your-coffee-shop.com

## Architecture

- VPS: Hetzner CX22 (Ubuntu 24.04)
- Containers: Caddy + Next.js (web) + NestJS (api) + Postgres
- Reverse proxy: Caddy with auto-HTTPS via Let's Encrypt
- CI/CD: GitHub Actions

## Deploy a new version

1. Push to `main` branch
2. GitHub Actions auto-builds + deploys (~2-3 min)
3. Verify at https://your-coffee-shop.com/healthz

## Manual deploy (rollback)

```bash
ssh deploy@<vps-ip>
cd ~/coffeeshop
TAG=<commit-sha-short> docker compose pull
TAG=<commit-sha-short> docker compose up -d
```
````

## Database operations

### Run migrations manually

```bash
docker compose exec api npx prisma migrate deploy
```

### Backup (daily auto + manual)

```bash
~/scripts/backup.sh
```

### Restore

```bash
gunzip < /var/backups/coffee/coffee-YYYY-MM-DD.sql.gz \
  | docker compose exec -T postgres psql -U coffee coffee
```

### Connect to DB

```bash
docker compose exec postgres psql -U coffee coffee
```

## Logs

```bash
docker compose logs -f         # all services
docker compose logs -f api     # just api
docker compose logs --tail 100 web
```

## Healthchecks

- https://your-coffee-shop.com/healthz → 200 OK + DB connected

## Common issues

### Cert renewal failing

```bash
docker compose logs caddy
# Check Let's Encrypt rate limits
```

### App down after deploy

```bash
docker compose ps
docker compose logs api --tail 200
# Most common: env var missing, migration failed
```

### Disk full

```bash
df -h
docker system prune -af --volumes  # ⚠️ removes unused volumes too
```

````

- [ ] **Step 10.6: Test full GitOps flow**

```bash
# Local
git add .github/workflows/deploy.yml scripts/backup.sh docs/DEPLOY.md
git commit -m "feat: GitOps deploy workflow + backup script + runbook"
git push origin main

# GitHub → Actions → see "Deploy" run
# Wait ~3-5 min
# Verify https://your-coffee-shop.com still works (or has new feature if you changed something)
````

🎉 **GitOps complete**: `git push` → live in ~3 min

---

## Acceptance Criteria — Week 6 Done When:

- [ ] **Infrastructure**
  - [ ] Hetzner VPS running, ufw + fail2ban active
  - [ ] Non-root deploy user, SSH key only
  - [ ] Docker + Docker Compose installed
- [ ] **Containers**
  - [ ] Multi-stage Dockerfile.web (< 300 MB)
  - [ ] Multi-stage Dockerfile.api (< 250 MB)
  - [ ] docker-compose.prod.yml with Caddy + web + api + postgres
- [ ] **Network**
  - [ ] Domain DNS points to VPS
  - [ ] Caddy auto-HTTPS works (Let's Encrypt cert valid)
  - [ ] /api/\* routes to NestJS, / to Next.js
- [ ] **CI/CD**
  - [ ] CI workflow: lint + typecheck + test on PR (green)
  - [ ] Deploy workflow: push main → build + push GHCR → SSH deploy
  - [ ] Images tagged with git SHA + latest
- [ ] **Operations**
  - [ ] pg_dump cron runs daily at 03:00
  - [ ] Backups in /var/backups/coffee, 7-day retention
  - [ ] DEPLOY.md runbook complete
- [ ] **Verification**
  - [ ] https://your-coffee-shop.com/menu shows live menu
  - [ ] Admin login works
  - [ ] Order place → kitchen → COMPLETED → reports update
  - [ ] git push to main → deployed in ~3 min

## Self-Review Notes

**Spec coverage:**

- ✅ Day 1 (provision): Tasks 1-2
- ✅ Day 2 (Dockerfiles): Tasks 4-5
- ✅ Day 3 (compose + Caddyfile): Tasks 6-7
- ✅ Day 4 (domain + manual deploy): Task 8
- ✅ Day 5-6 (CI + Deploy workflows): Tasks 9-10
- ✅ Day 7 (backup + runbook): Task 10

**Concepts taught:**

- VPS provisioning, ufw, fail2ban, SSH hardening
- Multi-stage Docker builds (size + security)
- Docker Compose orchestration
- Caddy auto-HTTPS, reverse proxy
- DNS A records, Let's Encrypt
- GitHub Actions: matrix runs, cache, GHCR, SSH
- pg_dump backup pattern, cron
- Prisma migrate deploy (idempotent migrations on container start)

**Out of Week 6 scope:**

- ❌ k8s, microservices (Tier 3)
- ❌ Multi-region / load balancer (Tier 3)
- ❌ Sentry/Datadog (Tier 1 self-study)
- ❌ Image registry mirror (advanced)
- ❌ Blue-green deploy (Tier 2 — current = restart-based)

---

## 🎉 Course Complete!

หลัง Week 6 → student มี:

- 🌐 Live coffee shop on cloud VPS with HTTPS
- 🔄 GitOps: git push → auto deploy
- 🧪 CI on every PR
- 💾 Daily DB backup
- 📚 Production runbook
- 🎓 Skills: full-stack TS, monorepo, NestJS, Prisma, Docker, GitOps

จบ 6 สัปดาห์ → portfolio + skills + working app

**See [Final Project Rubric](../../instructor/master/final-project-rubric.md)** for assessment criteria
