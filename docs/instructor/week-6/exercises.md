# Week 6 — Exercises

**Audience:** instructor (with solutions)

---

## 📋 Exercise Map

| #                | Type     | When               | Difficulty | Time    |
| ---------------- | -------- | ------------------ | ---------- | ------- |
| **EX-6.1**       | In-class | Session 1, Block A | ⭐         | 5 min   |
| **EX-6.2**       | In-class | Session 1, Block D | ⭐⭐       | 7 min   |
| **HW-6-mid**     | Homework | Between sessions   | ⭐⭐⭐     | 3-4 hrs |
| **EX-6.3**       | In-class | Session 2, Block G | ⭐⭐       | 10 min  |
| **HW-6-final**   | Homework | After course       | ⭐⭐⭐⭐   | 6+ hrs  |
| **HW-6-stretch** | Optional | Anytime            | ⭐⭐⭐⭐   | 4-8 hrs |

---

## EX-6.1 — Verify SSH Hardening

**When**: Session 1, Block A end
**Difficulty**: ⭐
**Time**: 5 min

### Task

หลัง provision VPS + create deploy user. ทำตาม + ตอบคำถาม:

1. Logout from root, ssh as deploy
2. Try: `ssh root@<ip>` — เกิดอะไรขึ้น?
3. From phone or another network: try `ssh deploy@<ip>` with wrong password 5 times — เกิดอะไร?
4. รัน: `sudo ufw status numbered`. ดู rules

### 🟢 Solution

1. (handled in steps)
2. Hetzner default = `PermitRootLogin yes` initially. ต้อง modify `sshd_config` (Block B) → root denied
3. After 5 failed attempts in 10 min → IP banned by fail2ban for 10 min. Subsequent connections refused
4. Output:
   ```
   Status: active
   1: 22/tcp ALLOW IN
   2: 80/tcp ALLOW IN
   3: 443/tcp ALLOW IN
   ```

> **Teaching point**: defense in depth — multiple layers fail before attacker gets in

---

## EX-6.2 — Predict Image Sizes

**When**: Session 1, Block D end
**Difficulty**: ⭐⭐
**Time**: 7 min

### Task

หลัง Dockerfile.api + Dockerfile.web build:

```bash
docker images | grep coffee
```

ตอบ:

1. ขนาดของ coffee-api ประมาณเท่าไร? (MB)
2. ขนาดของ coffee-web ประมาณเท่าไร?
3. ถ้า single-stage build (ไม่มี multi-stage): จะใหญ่กี่เท่า?
4. ลองเปลี่ยน base image จาก `node:20-alpine` เป็น `node:20` (Debian) — ขนาดเปลี่ยนไงบ้าง?

### 🟢 Solution

1. ~150-220 MB (depends on dependencies)
2. ~200-280 MB (Next.js standalone has more deps)
3. ~5-7x larger (1+ GB) — includes dev deps, source, build cache
4. Debian base = +50-80 MB (alpine = ~5 MB, Debian slim = ~80 MB, full Debian = ~120 MB)

```bash
# Test alpine vs debian
FROM node:20-alpine    # ~140 MB final
FROM node:20-slim      # ~200 MB final
FROM node:20           # ~270 MB final
```

> **Teaching point**: alpine = smaller but check for native module compatibility (bcrypt!)

---

## HW-6-Mid — First Manual Deploy 🚀

**When**: Between Session 1 and 2
**Difficulty**: ⭐⭐⭐
**Time**: ~3-4 hours
**Deliverable**: Live URL shared in class chat

### Task

ทำตาม Plan Task 8 ทุก step:

1. **DNS setup**:
   - Point A record from your domain to VPS IP
   - Verify with `dig +short your-domain.com`

2. **Setup VPS folders**:
   - SSH to VPS, create `~/coffeeshop`
   - SCP `docker-compose.prod.yml` (rename to `docker-compose.yml`) and `Caddyfile` to VPS

3. **Build + push images locally**:
   - GitHub Personal Access Token with `write:packages` scope
   - `docker login ghcr.io`
   - Build api + web images locally
   - Push to GHCR
   - Make GHCR images public

4. **Configure .env on VPS**:
   - Strong DB_PASSWORD (`openssl rand -base64 24`)
   - Strong JWT_SECRET (`openssl rand -base64 32`)
   - Set DOMAIN, GH_USER, TAG=latest

5. **Deploy**:
   - `docker compose pull`
   - `docker compose up -d`
   - Watch logs: `docker compose logs -f`

6. **Seed prod DB**:
   - `docker compose exec api npx prisma db seed`

7. **Verify**:
   - https://your-domain.com/menu loads
   - https://your-domain.com/healthz returns 200 + DB connected
   - Login as admin@coffee.com / admin1234
   - Place a test order through the live URL

### Acceptance Criteria

- [ ] HTTPS valid (browser shows lock icon)
- [ ] Domain resolves correctly
- [ ] All 4 containers running
- [ ] Can login + interact with site
- [ ] Healthcheck endpoint passes

### 🟢 Solution

ดู Plan Task 8 — full step-by-step

### Common Mistakes

| Mistake                         | Fix                                                                                |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| DNS not propagated yet          | Wait 5-10 min, use `dig +short` to verify                                          |
| Cert request fails              | Caddy logs say "rate limit" or "challenge fail". Verify port 80 open + DNS correct |
| GHCR pull fails on VPS          | Make image public, or login on VPS with token                                      |
| Env var typo                    | `docker compose config` shows resolved env                                         |
| Caddyfile path wrong in compose | Volume mount `./caddy/Caddyfile:/etc/caddy/Caddyfile:ro`                           |

---

## EX-6.3 — Deploy a Visible Change

**When**: Session 2, Block G (during deploy workflow demo)
**Difficulty**: ⭐⭐
**Time**: 10 min

### Task

หลัง deploy workflow ทำงาน:

1. Make a small visible change (e.g., footer text, button color)
2. Commit + push to main
3. Watch GitHub Actions tab — wait for "Deploy" workflow
4. Verify live URL shows change
5. Note total time from push → live

ตอบ:

- กี่นาที total?
- Build + push: กี่นาที? (Job 1 timing)
- SSH deploy: กี่วินาที? (Job 2 timing)
- Cache hit ratio (run again, faster?)

### 🟢 Solution

ผลลัพธ์ปกติ:

- Total: 3-5 min first run, 1.5-2 min subsequent (cached)
- Job 1 (build + push):
  - First: 3-4 min (no cache)
  - Subsequent: 30-60 sec (layers cached)
- Job 2 (deploy):
  - 20-40 sec (SSH + pull + restart)

> **Teaching point**: layer caching = huge win. Don't break the cache (don't `COPY .` early)

### Common Mistakes

- Push but no Actions run → check `branches: [main]` in YAML
- Image push 401 → check `permissions: packages: write`
- SSH fail → check secrets format (entire key including BEGIN/END)

---

## HW-6-Final — Final Project Submission

**When**: After Session 2 (final course deliverable)
**Difficulty**: ⭐⭐⭐⭐
**Time**: ~6+ hours (polish + 1 stretch)
**Deliverable**: Final project review + self-assessment

### Required

1. **Polish to "Production Ready" tier** of [Final Rubric](../master/final-project-rubric.md):
   - Functionality complete (all Week 1-5 features work)
   - Code quality: no `any`, formatted, tested
   - Architecture: clean monorepo, schema sharing
   - Documentation: README + DEPLOY.md + ADRs
   - Live deployment with GitOps

2. **Pick 1 stretch feature** to implement:
   - Real payment (Stripe sandbox)
   - OAuth login (Google/LINE)
   - Email receipts
   - Real-time kitchen (Socket.io)
   - Mobile app (React Native + Expo)
   - Multi-tenant
   - Other (with instructor approval)

3. **Submit**:
   - GitHub repo URL
   - Live URL
   - Brief README highlighting features + tech
   - Self-assessment form (from rubric)
   - Optional: 3-5 min walkthrough video

### Timeline

- Soft deadline: 2 weeks after course
- Final review: 1 month after course (instructor 1-on-1)

### 🟢 Tier guidance

ตาม rubric:

- **Functional Baseline** → "Complete"
- **Professional Quality** → "Complete (Strong)"
- **Production Ready + 1 stretch** → "Distinction"

---

## HW-6-Stretch — Optional Advanced Challenges

**Difficulty**: ⭐⭐⭐⭐

### Stretch 1: Blue-Green Deploy (4 hrs)

- Run 2 instances of api (blue + green)
- Caddy weighted load balance: 100/0 → 0/100
- Zero-downtime deploys

### Stretch 2: Off-site Backup with B2 (3 hrs)

- Sign up Backblaze B2 (10GB free)
- rclone config + auto-upload to B2
- Restore drill from B2

### Stretch 3: Add Slack Deploy Notifications (1 hr)

- GitHub Actions step: post to Slack on success/fail
- Use `slackapi/slack-github-action@v1`

### Stretch 4: Sentry Integration (4 hrs)

- Sign up Sentry (free tier)
- Add `@sentry/nextjs` + `@sentry/nestjs`
- Track errors + releases (link to git SHA)

### Stretch 5: Uptime Monitor (1 hr)

- Self-host Uptime Kuma in another container
- Or use UptimeRobot.com (free 50 monitors)
- Alert via Slack/LINE/email

### Stretch 6: Container Image Scanning (2 hrs)

- Add Trivy scan in CI (`aquasecurity/trivy-action`)
- Block deploys with critical CVEs
- Document accepted vulnerabilities

---

## 📤 Student-Facing Format

ก่อนแชร์ — strip solutions

> Note: Week 6 = practical deployment. Most "exercise" = follow Plan steps. Final project replaces traditional exam.
