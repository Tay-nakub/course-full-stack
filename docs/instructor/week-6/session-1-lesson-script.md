# Week 6 Session 1 — VPS + Containers 🚀

**Week:** 6
**Session:** 1 (of 2)
**Duration:** 120 min
**Class size:** 2-6 students
**Pre-requisites:** Week 5 complete + Docker installed locally + domain ready
**Covers:** Tasks 1-7 of [Week 6 Plan](../../superpowers/plans/2026-05-08-week-6-deploy-gitops.md)

---

## 🎯 Session Goals

จบ session นี้ student แต่ละคนต้อง:

- ✅ Hetzner VPS provisioned + accessible via SSH (deploy user, no root)
- ✅ Server hardened (ufw + fail2ban + SSH password disabled)
- ✅ Docker + Docker Compose installed on VPS
- ✅ Multi-stage Dockerfiles for web + api built locally
- ✅ docker-compose.prod.yml + Caddyfile committed
- 🟡 First deploy → Session 2 / homework

---

## 📋 Pre-Session Checklist (instructor)

- [ ] Verify Week 5 working everyone (place order → completed → reports update)
- [ ] **Verify pre-class** — domain + credit card ready
- [ ] Demo Hetzner account ready
- [ ] Demo domain ready (or use class subdomain)
- [ ] Backup pre-built images on instructor's GHCR
- [ ] Open browser tabs: hetzner.com/cloud, caddyserver.com, docker docs

---

## 🗓️ Time-Blocked Agenda

| Time        | Block               | Activity                             |
| ----------- | ------------------- | ------------------------------------ |
| 0-10        | **Recap + Preview** | Course arc + today's outcome         |
| **10-35**   | **Block A**         | **Provision VPS + SSH**              |
| **35-55**   | **Block B**         | **Hardening (ufw + fail2ban + SSH)** |
| **55-65**   | **Block C**         | **Install Docker**                   |
| **65-100**  | **Block D**         | **Multi-stage Dockerfiles**          |
| **100-115** | **Block E**         | **Compose + Caddyfile**              |
| 115-120     | Wrap-up             | Homework + Q&A                       |

---

## 🟢 Recap + Preview (0-10 min)

### Course Arc Recap (3 min)

แสดง slide:

```
Week 1: FE foundation         ✅ static UI
Week 2: BE foundation         ✅ API + auth
Week 3: First slice (menu)    ✅ FE↔BE working
Week 4: Order flow            ✅ multi-actor
Week 5: Inventory + reports   ✅ business logic
Week 6: DEPLOY 🚀              ⬅ today
```

### Today's End State (7 min)

📢 **Setup the moment**:

> "วันนี้ student แต่ละคน → ของจริง LIVE บน internet ของตัวเอง.
> https://your-name-coffee.com → app ที่สร้างมา 5 สัปดาห์
>
> Session ที่ 2: git push → 3 minutes → deployed"

Show instructor's live demo URL → ทำงานจริง

📢 **Cost reality check**:

> "Hetzner = ~€4.5/mo (~165 บาท). Cancel ได้ทุกเมื่อ. Domain = ~30 บาท/เดือน.
> รวม ~200 บาท/เดือน เพื่อ live portfolio. คุ้ม"

📢 **Cognitive load warning**:

> "Week 6 = many small pieces. ต้อง patient. Verify ทุก checkpoint ก่อนไป block ต่อ"

---

## 🖥️ Block A: Provision VPS + SSH (10-35 min, 25 min)

### 🎯 Block Goals

- Hetzner account + CX22 server running
- SSH key authentication (no password)
- Non-root deploy user

### 💬 Lecture (~5 min)

**1. Why VPS not PaaS?** (3 min)

```
Vercel / Railway:           VPS:
─────────────────           ─────────────────
+ zero config               + full control
+ auto-scale                + cheap (€4.5/mo flat)
+ great DX                  + learn infrastructure
- $$ as you grow             - you maintain
- vendor lock-in             - more setup

Course choice: VPS
  - cost-effective
  - skills transferable
  - learn how internet works
```

**2. Hetzner CX22 specs** (2 min)

- 2 vCPU (Intel)
- 4 GB RAM
- 40 GB SSD
- 20 TB traffic/month
- €4.51/mo
- Locations: EU + Singapore

📢 **For Thailand class**: Singapore = best latency

### 🖥️ Live Demo (~20 min)

**1. Hetzner signup + project** (Task 1.1 — 4 min)

(walk-through registration on screen share)

📢 **Caution**: real CC required. Tell class — if anyone uncomfortable → pair with classmate or use instructor's account

**2. SSH key generate + upload** (Task 1.2-1.3 — 5 min)

```bash
# Local terminal
ls ~/.ssh/id_ed25519.pub
# If missing:
ssh-keygen -t ed25519 -C "deploy@coffee-shop"
cat ~/.ssh/id_ed25519.pub
```

📢 **Walk through Hetzner console** — paste key

**3. Create CX22** (Task 1.4 — 4 min)

(live in console — Singapore for Thai students, Ubuntu 24.04, CX22)

⏱️ ~30 sec → server has IP

**4. Test SSH** (Task 1.5 — 3 min)

```bash
ssh root@<ip>
# accept fingerprint → yes
# logged in as root ✓
```

**5. Create deploy user** (Task 1.6-1.7 — 4 min)

(พิมพ์ตาม Plan)

📢 **เน้น**:

- `usermod -aG sudo deploy` — grants sudo
- Copy `authorized_keys` → SSH key works for deploy too
- chmod 700/600 — important for SSH security

Test:

```bash
exit
ssh deploy@<ip>
# logged in without password ✓
```

✅ **Checkpoint**: SSH `deploy@vps` works for everyone

### ❓ Common Questions (Block A)

| Q                                    | A                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| ใช้ AWS/DigitalOcean ได้ไหม?         | ได้ — same concepts. Hetzner = cheapest with good performance                                      |
| Free tier ที่ไหน?                    | AWS free tier (t2.micro 750hr/mo) แต่ complex setup. Railway $5 credit. Course = pragmatic Hetzner |
| ssh-copy-id ทำงานไหม?                | Default: ไม่ — Hetzner คาดหวัง paste key ใน UI. Manual copy ที่เราใช้ = explicit                   |
| 2 user — admin + staff ต่างกันยังไง? | root = god mode. deploy = limited (need sudo for system changes). Best practice                    |

---

## 🛡️ Block B: Hardening (35-55 min, 20 min)

### 🎯 Block Goals

- ufw firewall (allow 22/80/443 only)
- fail2ban SSH brute force
- Disable root SSH + password auth

### 💬 Lecture (~5 min)

**Why hardening?** (3 min)

```
VPS on internet = bot scans 24/7
  - SSH brute force (try common passwords)
  - Port scans (looking for exposed services)
  - Default credentials (root/123456 etc.)

Without hardening:
  - first day: 100s of failed login attempts
  - eventually: someone gets in
  - your server → crypto mining or worse
```

**Defense in depth** (2 min):

1. Firewall (block at network level)
2. fail2ban (lockout after failed attempts)
3. SSH key only (no password auth)
4. Disable root login (no easy target)
5. Auto security updates

### 🖥️ Live Demo (~15 min)

**1. ufw firewall** (Task 2.1 — 4 min)

(พิมพ์ตาม Plan)

📢 **เน้น order**:

- Set defaults FIRST (deny incoming, allow outgoing)
- Allow 22 BEFORE enable ← critical (don't lock yourself out)
- Then 80, 443
- Then enable

```bash
sudo ufw status verbose
# Expected: Status: active
```

**2. fail2ban** (Task 2.2 — 3 min)

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status sshd
# Default: bans IP after 5 failed attempts for 10 min
```

📢 **Show banned IPs** หลังคลาส 1 ชั่วโมง — มักมี attempted attacks

**3. Disable root + password SSH** (Task 2.3 — 5 min)

```bash
sudo nano /etc/ssh/sshd_config
```

Find + modify:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
sudo systemctl reload ssh
```

📢 **CRITICAL**:

> "**ห้าม logout จาก current session**. เปิด terminal ใหม่ → test ก่อน. ถ้า lock ตัวเอง → ต้องใช้ Hetzner web console (ปวดหัว)"

```bash
# New terminal
ssh deploy@<ip>     # ✓
ssh root@<ip>       # ✗ permission denied
```

ถ้า OK → safe to logout

**4. Auto-updates** (Task 2.4 — 3 min)

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
# Yes
```

✅ **Checkpoint**: ufw active + fail2ban running + root SSH blocked

### ❓ Common Questions (Block B)

| Q                                          | A                                                           |
| ------------------------------------------ | ----------------------------------------------------------- |
| ลืม disable root ก่อน reload — locked out? | ใช่ — Hetzner web console (rescue mode) → re-enable. ระวัง! |
| fail2ban ล้ม คือ?                          | systemctl status — check logs. Mostly: bad config syntax    |
| ufw block Docker bridge?                   | จะแก้ใน Block C — Docker bypasses ufw, ต้อง config          |

---

## 🐳 Block C: Install Docker (55-65 min, 10 min)

### 🎯 Block Goals

- Docker installed via official script
- deploy user in docker group
- Disable Docker iptables conflict with ufw

### 🖥️ Live Demo (~10 min)

**1. Install + group** (Task 3.1 — 5 min)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
exit
ssh deploy@<ip>
docker --version
docker compose version
docker run hello-world
```

📢 **Pause for student verification**: ทุกคน hello-world success?

**2. UFW conflict fix** (Task 3.2 — 3 min)

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

📢 **อธิบาย**:

> "Docker default = manage iptables เอง → bypass ufw.
> Set false → docker ใช้ ufw rules.
> Trade-off: containers ที่ port 0.0.0.0 จะไม่ accessible publicly.
> ใน prod เรา expose แค่ Caddy → safe"

✅ **Checkpoint**: Docker works + UFW respect

### ❓ Common Questions (Block C)

| Q                          | A                                                                 |
| -------------------------- | ----------------------------------------------------------------- |
| ต้องลง Docker Desktop GUI? | ไม่ — VPS = headless server. CLI เพียงพอ                          |
| Docker hub rate limit?     | Anonymous: 100 pulls/6hr/IP. Course OK. Stretch: GHCR (unlimited) |
| Compose v1 vs v2?          | v1 deprecated. ใช้ `docker compose` (no hyphen) — v2              |

---

## 📦 Block D: Multi-stage Dockerfiles (65-100 min, 35 min)

### 🎯 Block Goals

- Dockerfile.api (multi-stage, < 250 MB)
- Dockerfile.web (Next.js standalone, < 300 MB)
- Test build locally + smoke test

### 💬 Lecture (~10 min)

**1. Why multi-stage?** (4 min)

```
Single-stage Dockerfile:
  FROM node:20
  COPY everything
  RUN pnpm install (with dev deps)
  RUN build
  CMD start

  Result: 1.5+ GB image
  - includes git history
  - includes dev deps
  - includes source code
  - includes build cache

Multi-stage:
  Stage 1 (builder):
    full deps + build
  Stage 2 (runtime):
    copy ONLY built artifacts
    + production deps

  Result: 200-300 MB image
  - smaller pull on deploy (faster)
  - smaller attack surface
  - source code not exposed
```

**2. Layer caching** (3 min)

```dockerfile
# Bad: changes invalidate cache early
COPY . .
RUN pnpm install

# Good: leverage cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install     # cached unless deps change
COPY . .
RUN pnpm build
```

> "Lockfile change = re-install. Source change = re-build only"

**3. Next.js standalone** (3 min)

```ts
// next.config.ts
const nextConfig = {
  output: 'standalone',
};
```

> "Standalone = self-contained server bundle. Includes all needed node_modules in build output. Image = small + fast to start"

### 🖥️ Live Demo (~25 min)

**1. Dockerfile.api** (Task 4.1 — 12 min)

(พิมพ์ตาม Plan, อธิบาย stage by stage)

📢 **Walk through**:

- Builder: install full deps → copy source → prisma generate → build → prune dev deps
- Runtime: alpine base → non-root user → copy only dist + node_modules + prisma → CMD with migrate deploy

```bash
docker build -f infra/docker/Dockerfile.api -t coffee-api:test .
# Wait ~3-5 min first build
docker images coffee-api:test
# Should be < 250 MB
```

📢 **Pause for student build** — wait for everyone

**2. Smoke test api** (Task 4.3 — 3 min)

```bash
docker run --rm -p 4001:4000 \
  -e DATABASE_URL="postgresql://coffee:coffee_dev_password@host.docker.internal:5432/coffee" \
  -e JWT_SECRET="test-secret-min-32-chars-recommended-here" \
  coffee-api:test

# Another terminal:
curl http://localhost:4001/api/healthz
# Expected: { status: "ok" }
```

**3. Next.js standalone config** (Task 5.1 — 3 min)

(พิมพ์ตาม Plan)

📢 **เน้น**:

```ts
async rewrites() {
  if (process.env.NODE_ENV === 'production') {
    return [];   // Caddy handles
  }
  return [{ source: '/api/:path*', destination: '...' }];
}
```

> "Dev = Next.js proxy. Prod = Caddy proxy. Same FE code"

**4. Dockerfile.web** (Task 5.2 — 5 min)

(พิมพ์ตาม Plan — pattern คล้าย api แต่ Next.js standalone)

```bash
docker build -f infra/docker/Dockerfile.web -t coffee-web:test .
docker images coffee-web:test
# < 300 MB
```

**5. Smoke test web** (Task 5.4 — 2 min)

```bash
docker run --rm -p 3001:3000 coffee-web:test
# Open http://localhost:3001/menu
# Should render (might error fetching /api but that's OK)
```

Commit:

```bash
git commit -m "feat(infra): multi-stage Dockerfiles for api + web"
```

### ❓ Common Questions (Block D)

| Q                             | A                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------ |
| Build slow ครั้งแรก — 5 นาที? | First build = no cache. Subsequent = cached layers, < 1 min                          |
| Image ใหญ่กว่า 300 MB?        | ตรวจ: ลืม `--prod` deps prune? .dockerignore exclude .git, node_modules?             |
| Why alpine?                   | Glibc-free Linux, ~5 MB base. Smaller than ubuntu (~80 MB)                           |
| Health check ใน Dockerfile?   | `HEALTHCHECK CMD curl ...` — course ใช้ Compose healthcheck แทน (cleaner separation) |

---

## 🔌 Block E: Compose + Caddyfile (100-115 min, 15 min)

### 🎯 Block Goals

- docker-compose.prod.yml (4 services)
- Caddyfile (auto-HTTPS reverse proxy)

### 🖥️ Live Demo (~15 min)

**1. docker-compose.prod.yml** (Task 6.1 — 8 min)

(พิมพ์ตาม Plan)

📢 **เน้น 3 patterns**:

- `expose:` (internal only) vs `ports:` (public bind)
- `depends_on: { condition: service_healthy }` — wait for postgres ready
- `${VAR}` for env substitution

**2. Caddyfile** (Task 7.1 — 5 min)

(พิมพ์ตาม Plan)

📢 **อธิบาย Caddy magic**:

- `{$DOMAIN}` matches host header
- Auto-HTTPS = ดู domain → request Let's Encrypt cert → renew before expire
- `handle /api/*` matches first (specific to general)
- `reverse_proxy api:4000` → Docker DNS resolves "api" container

**3. Validate** (Task 7.2 — 2 min)

```bash
docker run --rm -v $(pwd)/infra/caddy/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
# "Valid configuration"
```

Commit:

```bash
git commit -m "feat(infra): production compose + Caddyfile"
```

### ❓ Common Questions (Block E)

| Q                            | A                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| Caddy vs nginx?              | nginx more common, more features. Caddy = auto-HTTPS built-in (huge), simpler config. Course = pragmatic |
| Docker DNS — "api" resolves? | Compose creates network, services reachable by name                                                      |
| HTTPS work without Caddy?    | Manual certbot setup ใช้ได้. Caddy = automate that                                                       |

---

## 🏁 Wrap-up + Homework (115-120 min, 5 min)

### Recap (2 min)

- "Multi-stage = ลด อะไร?"
- "Caddy auto-HTTPS = ผ่านอะไร?"
- "Compose `expose` vs `ports` ต่างไง?"

### Homework (3 min)

📦 **Required** (~3 hrs)

1. **Manual deploy** (Task 8 of plan):
   - Point domain DNS to VPS IP
   - SCP compose + Caddyfile to VPS
   - Build + push images to GHCR
   - Setup .env on VPS
   - Run `docker compose up -d`
   - Verify https://your-domain.com/menu

2. **Seed prod DB**:
   - Run seed inside container

📢 **Important**:

> "ถ้าตรงไหนติด — post Slack ทันที. ห้าม stuck คนเดียวเพราะตอน Session 2 จะ assume site live แล้ว"

📢 **Key milestone**:

> "Session 2 ที่ทุกคนมี live URL = unlock GitOps automation"

### Q&A

รับคำถาม

---

## 📝 Post-Session Self-Review (instructor)

| Item                                  | Note   |
| ------------------------------------- | ------ |
| ทุกคน VPS provisioned + SSH?          | \_\_\_ |
| Hardening (ufw/fail2ban) ทุกคน?       | \_\_\_ |
| Docker installed everyone?            | \_\_\_ |
| Dockerfiles built locally?            | \_\_\_ |
| Block ไหน over-run?                   | \_\_\_ |
| Cost concerns ใครยังกังวล?            | \_\_\_ |
| Pre-Session 2: ใครยังไม่ deploy live? | \_\_\_ |
