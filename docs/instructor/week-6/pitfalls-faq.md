# Week 6 — Pitfalls & FAQ

**Audience:** instructor — เปิดตอนสอนสำหรับ quick reference

---

## 🚨 Top Pitfalls

### Pitfall #1: Locked out of VPS

**Symptom**: SSH `deploy@<ip>` denied, can't login

**Common causes**:

1. Disabled root + password auth + lost SSH key
2. Edited `sshd_config` wrong + restarted SSH (current session OK but new fail)
3. ufw blocked port 22

**Recovery options**:

**Option A** (preferred): Hetzner Rescue System

1. Hetzner Console → Server → Rescue → Activate
2. Reboot server (also from Console)
3. SSH as root with rescue password (shown in Console)
4. Mount existing disk: `mount /dev/sda1 /mnt`
5. Fix config: `nano /mnt/etc/ssh/sshd_config`
6. Reboot to normal

**Option B**: Hetzner Web Console

1. Hetzner Console → Server → Console (web shell)
2. Login as root with original password (still works in console)
3. Fix config

**Prevention**:

> "ห้าม disable root + password ก่อน confirm new SSH config works.
> ทดสอบ ssh ใน new terminal ก่อน logout เก่า"

---

### Pitfall #2: Caddy can't get cert (Let's Encrypt)

**Symptom**: Browser shows "Not Secure" or `connection refused` on https

**Common causes**:

1. DNS not propagated / wrong IP
2. Port 80 blocked (Let's Encrypt HTTP-01 challenge needs)
3. Cloudflare proxy enabled (intercepts challenge)
4. Rate limit hit (too many cert requests)

**Debug**:

```bash
# Check DNS resolves to your IP
dig +short your-domain.com

# Check port 80 reachable
curl -v http://your-domain.com/.well-known/acme-challenge/test

# Check Caddy logs
docker compose logs caddy --tail 50
# Look for "issuing certificate" / "successfully obtained"
```

**Fixes**:

- DNS: wait 5-10 min, verify with `dig`
- Cloudflare: turn off proxy (gray cloud) for cert issue, can re-enable after
- Rate limit: 50 certs/week per domain. Wait or use staging endpoint:
  ```caddyfile
  {
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
  }
  ```
- Port 80 must be open even if redirecting to HTTPS

---

### Pitfall #3: GHCR push fails with 401/403

**Symptom**: `denied: permission_denied` ตอน docker push

**Common causes**:

1. PAT token missing `write:packages` scope
2. Workflow missing `permissions: packages: write`
3. Image namespace mismatch (`<owner>/<repo>` should match GitHub user/org)

**Fix Workflow**:

```yaml
permissions:
  contents: read
  packages: write
```

**Fix local**:

```bash
# Token scopes: write:packages, read:packages, delete:packages
echo $GHCR_TOKEN | docker login ghcr.io -u <username> --password-stdin

# Use lowercase username
docker push ghcr.io/<username-lowercase>/coffee-api:latest
```

---

### Pitfall #4: GHCR images not pulled on VPS

**Symptom**: `docker compose pull` fails with `manifest unknown` or `unauthorized`

**Causes**:

1. Image is private + no auth on VPS
2. Image namespace mismatch
3. Wrong image name in compose

**Fix options**:

**A** (simplest): Make GHCR image public

- GitHub → Profile → Packages → coffee-api → Settings → Change visibility → Public

**B**: Login on VPS

```bash
# Generate PAT with read:packages
ssh deploy@<ip>
echo $TOKEN | docker login ghcr.io -u <user> --password-stdin
```

---

### Pitfall #5: GitHub Actions SSH fails

**Symptom**: Deploy job: `Permission denied (publickey)` หรือ `Host key verification failed`

**Common causes**:

1. SSH_PRIVATE_KEY secret missing/incomplete
2. Forgot `ssh-keyscan` to known_hosts
3. Public key not in VPS authorized_keys

**Debug**:

```yaml
- name: Debug SSH
  run: |
    echo "Host: ${{ secrets.VPS_HOST }}"
    echo "User: ${{ secrets.VPS_USER }}"
    ssh-keyscan -H ${{ secrets.VPS_HOST }}    # should show keys
```

**Fix SSH_PRIVATE_KEY format**:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAA...
...
-----END OPENSSH PRIVATE KEY-----

  → must include BEGIN + END lines
  → must be ed25519 or RSA
  → no extra whitespace
```

---

### Pitfall #6: docker compose up fails on VPS

**Symptom**: Some containers won't start, others restart

**Debug**:

```bash
docker compose ps
# Status: Restarting (1) → check logs

docker compose logs <service> --tail 100
```

**Common errors**:

- `database "coffee" does not exist` → first deploy + Postgres not migrated
  - Run: `docker compose exec api npx prisma migrate deploy`
- `JWT_SECRET must be at least 32 characters` → env var too short
- `EADDRINUSE :::3000` → another container using port (run docker ps)

---

### Pitfall #7: Migration runs on every container start (slow)

**Symptom**: API container takes 30+ sec to start

**Cause**: `prisma migrate deploy` ทำงาน even if no new migrations

**Reality check**: Idempotent — fast (~1-2 sec) when no new migrations. ถ้าช้าจริง:

- Many migrations to apply (ปกติ + first start)
- Slow DB (network latency)
- Verify: `docker compose logs api | grep migrate`

**Acceptable**: course = OK. Production: use `migrate diff` to check first

---

### Pitfall #8: Persistent storage lost on docker-compose down

**Symptom**: After `docker compose down`, ข้อมูลหาย

**Cause**: ใช้ `down -v` (removes volumes!) แทน `down`

**Rule**:

```bash
docker compose down       # ✓ stop containers, keep volumes
docker compose down -v    # ✗ stop containers + DELETE volumes
```

> **Never use `-v` in production**. Local dev OK to wipe DB

---

### Pitfall #9: Disk full → API crash

**Symptom**: Container restart loop, logs show `ENOSPC`

**Cause**: Disk filled with old Docker images + logs + DB data + backups

**Cleanup**:

```bash
# Check disk usage
df -h

# Docker cleanup
docker system df              # show disk usage
docker image prune -a         # remove unused images
docker container prune        # remove stopped containers

# Logs cleanup
sudo journalctl --vacuum-time=7d

# Backups: handled by backup.sh retention
```

**Prevention**: deploy.yml includes `docker image prune -f` after each deploy

---

### Pitfall #10: Backup not running

**Symptom**: `/var/backups/coffee` empty after several days

**Common causes**:

1. Cron not enabled
2. Script not executable
3. Path in cron wrong
4. Script fails silently

**Debug**:

```bash
# Cron service running?
systemctl status cron

# View cron jobs
crontab -l

# Run script manually to check for errors
~/scripts/backup.sh

# Check syslog for cron output
grep CRON /var/log/syslog | tail
```

**Fix**:

- Make sure script `chmod +x`
- Use absolute paths in cron entry (not `~`)
- Test script manually first
- Add `2>&1 >> /var/log/backup.log` to cron entry to capture output

---

## ❓ Extended FAQ

### VPS

**Q: Why Hetzner over DigitalOcean?**
A: Cost — Hetzner CX22 €4.5/mo = DO $6 droplet. Specs similar. EU + Singapore. Fine for course

**Q: เลือก datacenter location ไหน?**
A: Closest to user. Thai class → Singapore. EU users → Falkenstein/Helsinki

**Q: scale up later?**
A: Easy — Hetzner console: change type. CX22 → CX32 → ... CCX series for high CPU. Reboot required (~10 sec downtime)

**Q: Backup snapshot?**
A: Hetzner offers snapshots (extra cost). Better: pg_dump + off-site. Course = pg_dump

---

### Docker

**Q: Image size matters?**
A: ใช่ — pull time (deploy speed) + disk space + attack surface. < 300 MB for Node app = good

**Q: Multi-arch images (ARM + x86)?**
A: Stretch — `docker buildx build --platform linux/amd64,linux/arm64`. Hetzner default = x86. Apple Silicon dev → ARM. Multi-arch = both work

**Q: Bind mount vs volume?**
A:

- Bind mount: `./data:/app/data` — host folder
- Volume: `data:/app/data` (named) — Docker-managed
- Volume = preferred (portable, no permission issues)

**Q: Compose vs Swarm vs k8s?**
A:

- Compose = single host (course)
- Swarm = multi-host, simple (Docker built-in)
- k8s = multi-host, complex (industry std for scale)

---

### Caddy

**Q: nginx แทนได้ไหม?**
A: ได้ — nginx + certbot + cron. ~50 lines config + manual renew. Caddy = 8 lines + auto

**Q: Multiple sites on same Caddy?**
A: ใช่:

```caddyfile
site1.com { reverse_proxy app1:3000 }
site2.com { reverse_proxy app2:3000 }
```

**Q: Custom domain on top of subdomain?**
A: Multiple domains in Caddyfile:

```caddyfile
example.com, www.example.com { ... }
```

---

### GitHub Actions

**Q: Free tier ใช้ได้ไหม?**
A: ใช่ — 2000 min/mo private repos. Public repos = unlimited. Course = ใช้น้อย

**Q: Self-hosted runner?**
A: Stretch — install runner on own server. ฟรี (use own resources)

**Q: Secrets in workflow?**
A: GitHub Secrets = encrypted. ใช้ `${{ secrets.NAME }}`. ห้าม echo เข้า log

**Q: Cache npm/pnpm?**
A: `actions/setup-node@v4` มี `cache: 'pnpm'` built-in. ใช้แล้ว — no extra setup

---

### Production Concerns

**Q: Monitoring at scale?**
A:

- Tier 1: Uptime Kuma (self-host) or UptimeRobot
- Tier 2: Grafana + Prometheus + node_exporter
- Tier 3: Datadog/New Relic (paid)

**Q: Log aggregation?**
A:

- Course: `docker compose logs` (direct read)
- Production: Loki + Grafana, or hosted (Datadog, Logtail)

**Q: Incident response?**
A:

- DEPLOY.md runbook = first steps
- On-call rotation (PagerDuty if team)
- Post-mortem after every incident

---

### Database

**Q: Connection pooling?**
A: Course = direct connection (Prisma default). At scale: PgBouncer

**Q: Read replicas?**
A: Stretch — Hetzner doesn't offer managed Postgres. Self-host replica + configure Prisma read URL

**Q: Failover?**
A: Course = single Postgres (downtime if crash). Prod: managed (RDS) or Patroni

---

### Cost Optimization

**Q: ทำให้ถูกกว่า €4.5/mo?**
A:

- Free: Render free tier (750hr/mo, sleeps after inactivity)
- Free: Fly.io free tier (3 small VMs)
- Cheap: Oracle Cloud Free Tier (forever 4 ARM cores!)
- Cheap: Hetzner Cloud (current)

**Q: Reduce traffic costs?**
A: Hetzner = 20 TB/mo free. Way more than course needs

---

## 🆘 Emergency Recovery

### Site down — quick checklist

```bash
ssh deploy@<ip>

# 1. Containers running?
docker compose ps
# All Up? Move to step 2. Some down? Step 4.

# 2. Healthcheck working?
curl https://your-domain.com/healthz
# 200 OK? Site OK. Issue elsewhere.

# 3. Cert valid?
curl -vI https://your-domain.com 2>&1 | grep "expire"

# 4. Logs (latest issues)
docker compose logs --tail 50

# 5. Restart all
docker compose restart
# Or: docker compose down && docker compose up -d
```

### Database emergency

```bash
# Restore from latest backup
ls /var/backups/coffee/

# Test in restore DB first
docker compose exec postgres createdb -U coffee coffee_restore_test
gunzip < /var/backups/coffee/coffee-<date>.sql.gz | \
  docker compose exec -T postgres psql -U coffee coffee_restore_test

# Verify
docker compose exec postgres psql -U coffee coffee_restore_test -c "SELECT COUNT(*) FROM users;"

# If good, restore to main DB:
# 1. Stop api (prevent writes)
docker compose stop api

# 2. Drop + recreate
docker compose exec postgres dropdb -U coffee coffee
docker compose exec postgres createdb -U coffee coffee
gunzip < /var/backups/coffee/coffee-<date>.sql.gz | \
  docker compose exec -T postgres psql -U coffee coffee

# 3. Restart api
docker compose up -d api
```

### Rollback bad deploy

```bash
# Get previous git SHA from GitHub commits
# OR from VPS if cloned

cd ~/coffeeshop
TAG=<previous-sha-short> docker compose up -d
# 30 sec — back to old version
```

---

## 📊 Common Mistakes Heatmap (อัปเดตหลังสอน)

| Mistake                            | Frequency | Notes |
| ---------------------------------- | --------- | ----- |
| Locked out via SSH config          | TBD       | —     |
| DNS not propagated                 | TBD       | —     |
| GHCR auth on VPS                   | TBD       | —     |
| GitHub Secrets format              | TBD       | —     |
| Cert request fails                 | TBD       | —     |
| docker compose down -v (data loss) | TBD       | —     |
