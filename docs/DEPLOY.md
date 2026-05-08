# Deployment Runbook — Coffee Shop

Live URL placeholder: `https://your-coffee-shop.com`

## Architecture

```
            ┌──────────────────────────────────────────────────────────┐
            │                       Hetzner CX22                       │
            │                  (Ubuntu 24.04 + Docker)                 │
            │                                                          │
 Internet ──▶│   Caddy 2 (80/443) ──┬─── /api/*  → coffee-api:4000     │
 (HTTPS)    │     auto Let's Encrypt│                                   │
            │                       └─── /*       → coffee-web:3000   │
            │                                          ▲                │
            │                            coffee-api ───┤                │
            │                                          ▼                │
            │                                 coffee-postgres:5432     │
            │                                  (volume: postgres_data) │
            └──────────────────────────────────────────────────────────┘
```

Everything is one VPS, four containers, one docker compose file. The VPS only
exposes ports 22, 80, 443. Internal services use docker network names.

## Files

| Path                                | Role                                      |
| ----------------------------------- | ----------------------------------------- |
| `infra/docker/Dockerfile.api`       | Multi-stage build for NestJS API          |
| `infra/docker/Dockerfile.web`       | Multi-stage build for Next.js standalone  |
| `infra/docker-compose.prod.yml`     | The production stack                      |
| `infra/caddy/Caddyfile`             | TLS edge + reverse proxy rules            |
| `infra/.env.prod.example`           | Template for production `.env`            |
| `scripts/backup.sh`                 | Daily Postgres dump (cron entrypoint)     |
| `.github/workflows/ci.yml`          | PR + main: typecheck + tests              |
| `.github/workflows/deploy.yml`      | main: build, push to GHCR, ssh deploy     |

## Required environment variables (production `infra/.env` on the VPS)

```bash
GH_USER=<github-user-or-org>          # owner of the GHCR images
TAG=latest                            # or a 7-char commit SHA
DB_PASSWORD=<openssl rand -base64 24> # Postgres password
JWT_SECRET=<openssl rand -base64 32>  # NestJS JWT signing key (>= 32 chars)
DOMAIN=your-coffee-shop.com           # public domain pointing to VPS
```

> **Never commit a real `.env`.** `infra/.env.prod.example` ships the template.

## GitHub Secrets needed by `deploy.yml`

| Name              | Value                                                 |
| ----------------- | ----------------------------------------------------- |
| `SSH_PRIVATE_KEY` | Full contents of `~/.ssh/id_ed25519` (BEGIN…END)      |
| `VPS_HOST`        | VPS IPv4 address                                      |
| `VPS_USER`        | `deploy`                                              |
| `DEPLOY_DOMAIN`   | `your-coffee-shop.com` (used by smoke-test step)      |

`GITHUB_TOKEN` is auto-injected by Actions and has `packages:write` scope via
the workflow's `permissions:` block.

## First-time deploy (manual, ~15 minutes)

These steps assume Tasks 1–3 of the Week 6 plan are done (VPS exists,
hardened, Docker installed, `deploy@vps` reachable).

1. **Local: build + push images to GHCR.**
   ```bash
   echo $GHCR_PAT | docker login ghcr.io -u <gh-user> --password-stdin
   docker build -f infra/docker/Dockerfile.api -t ghcr.io/<gh-user>/coffee-api:latest .
   docker build -f infra/docker/Dockerfile.web -t ghcr.io/<gh-user>/coffee-web:latest .
   docker push ghcr.io/<gh-user>/coffee-api:latest
   docker push ghcr.io/<gh-user>/coffee-web:latest
   ```
   Make both packages public: GitHub → Profile → Packages → coffee-api →
   Package settings → Change visibility → Public. Repeat for `coffee-web`.

2. **Local: copy compose + Caddyfile to VPS.**
   ```bash
   ssh deploy@$VPS_IP 'mkdir -p ~/coffeeshop/caddy ~/scripts'
   scp infra/docker-compose.prod.yml      deploy@$VPS_IP:~/coffeeshop/docker-compose.yml
   scp infra/caddy/Caddyfile              deploy@$VPS_IP:~/coffeeshop/caddy/Caddyfile
   scp scripts/backup.sh                  deploy@$VPS_IP:~/scripts/backup.sh
   ```

3. **VPS: write `.env`.**
   ```bash
   ssh deploy@$VPS_IP
   cd ~/coffeeshop
   cat > .env <<'EOF'
   GH_USER=<gh-user>
   TAG=latest
   DB_PASSWORD=<paste output of: openssl rand -base64 24>
   JWT_SECRET=<paste output of: openssl rand -base64 32>
   DOMAIN=your-coffee-shop.com
   EOF
   chmod 600 .env
   ```

4. **VPS: point DNS at the VPS IP.** Cloudflare/Namecheap/Route53 → A record
   for `@` (or your subdomain) → VPS IPv4. Cloudflare proxy must be **OFF**
   for the initial Let's Encrypt cert issuance. Wait ~5 min for propagation:
   ```bash
   dig +short your-coffee-shop.com   # should print VPS IP
   ```

5. **VPS: bring up the stack.**
   ```bash
   cd ~/coffeeshop
   docker compose pull
   docker compose up -d
   docker compose logs -f caddy   # watch for "successfully obtained certificate"
   ```

6. **VPS: run migrations + seed.** The `api` container's CMD already runs
   `prisma migrate deploy` on every start, so migrations are applied. Seed
   once:
   ```bash
   docker compose exec api npx prisma db seed
   docker compose exec postgres psql -U coffee -d coffee \
     -c "SELECT email, role FROM users;"
   # Expected: admin@coffee.com (ADMIN) + staff@coffee.com (STAFF)
   ```

7. **Smoke test from your laptop.**
   ```bash
   curl -I https://your-coffee-shop.com/healthz   # 200 + valid TLS
   open https://your-coffee-shop.com/menu
   # Login at /login as admin@coffee.com / admin1234 → /admin/* should work
   ```

## CI/CD: how a normal change flows

1. Open a PR against `main` → `.github/workflows/ci.yml` runs typecheck + the
   28 unit tests against an ephemeral Postgres 16 service container.
2. Merge to `main` → `deploy.yml` runs:
   1. `build-push` job builds both Dockerfiles (with GitHub Actions cache
      scoped per image) and pushes `:latest` plus `:<sha-short>` to GHCR.
   2. `deploy` job opens an SSH session to the VPS, exports `TAG=<sha>`,
      runs `docker compose pull && up -d --remove-orphans && image prune -f`.
   3. Smoke test: curls `https://$DEPLOY_DOMAIN/healthz` (up to 60 s).

End-to-end takes ~3 min depending on cache warmth.

## Rollback (manual)

Every commit to `main` produces a tagged image (`:<sha-short>`). To roll back:

```bash
ssh deploy@$VPS_IP
cd ~/coffeeshop
# Pick the previous good SHA from git log or GHCR's package versions page
export TAG=abc1234
docker compose pull
docker compose up -d --remove-orphans
```

If the bad commit also added a destructive migration, you may need to
`docker compose exec postgres psql -U coffee` and undo it manually, then
restore from the most recent backup (next section).

## Database operations

### Run migrations manually

The `api` container runs `prisma migrate deploy` on every boot. To force a
run without a restart:

```bash
docker compose exec api npx prisma migrate deploy
```

### Connect to the DB shell

```bash
docker compose exec postgres psql -U coffee coffee
```

### Backup (manual)

```bash
~/scripts/backup.sh
ls -lh /var/backups/coffee/
```

### Backup (automatic) — install the cron entry

```bash
# As deploy user on the VPS:
sudo mkdir -p /var/backups/coffee
sudo chown deploy:deploy /var/backups/coffee
sudo touch /var/log/coffee-backup.log
sudo chown deploy:deploy /var/log/coffee-backup.log

crontab -e
# Add:
0 3 * * * /home/deploy/scripts/backup.sh >> /var/log/coffee-backup.log 2>&1
```

Verify a few days later: `ls /var/backups/coffee/` shows one `*.sql.gz` per
day, capped at 7 by the script's `find … -mtime +7 -delete` rotation.

### Restore a backup

```bash
# Pick a file
ls /var/backups/coffee/

# Stop the api so it doesn't fight migrations during restore
docker compose stop api

# Pipe the dump back into Postgres (creates tables + data)
gunzip < /var/backups/coffee/coffee-20260509-030000.sql.gz \
  | docker compose exec -T postgres psql -U coffee -d coffee

# Bring the api back up
docker compose start api
```

> If the restore is to a fresh DB, drop and recreate the `coffee` database
> first (`DROP DATABASE coffee; CREATE DATABASE coffee OWNER coffee;`) so
> the dump's `CREATE TABLE` statements don't clash.

## Logs & debugging

```bash
docker compose ps                       # all containers, health status
docker compose logs -f                  # tail all services together
docker compose logs -f api              # just NestJS
docker compose logs --tail 200 caddy    # last 200 lines of Caddy
docker compose exec api node -v         # sanity check inside container
```

Healthcheck endpoint: `https://your-coffee-shop.com/healthz`. Expected
response: `200 OK` with body `{"status":"ok"}`.

## Common issues

### "Let's Encrypt cert failing"

Symptom: Caddy logs `obtaining certificate: ... timeout` or rate-limit
errors.

- Confirm DNS A record actually points at the VPS: `dig +short DOMAIN`.
- Confirm port 80 is open in `ufw` (Let's Encrypt HTTP-01 needs it):
  `sudo ufw status`.
- Cloudflare proxy must be off until the cert is issued (orange cloud →
  grey cloud).
- LE has a 5-cert-per-week-per-domain prod limit; if you've been retrying,
  switch Caddy to staging temporarily (add `acme_ca https://acme-staging-v02.api.letsencrypt.org/directory`
  inside the global block), confirm flow works, then remove.

### "App down after deploy"

```bash
docker compose ps
# Look for STATUS = "Restarting" or "Exited"

docker compose logs api --tail 200
# Most common: missing env var, JWT_SECRET too short, migration failed
```

If a migration failed, the container will restart in a loop. Either fix the
schema and re-deploy, or roll back to the previous tag (see Rollback).

### "Disk full"

```bash
df -h
docker system df

# Safe: removes only stopped containers + dangling images
docker system prune -f

# Aggressive: ALSO removes unused volumes — DESTROYS the postgres_data
# volume if no container is using it. Make sure the stack is running first.
docker system prune -af --volumes
```

Postgres data and Caddy certs live in named volumes (`postgres_data`,
`caddy_data`) which `docker compose down` preserves. Never run
`docker compose down -v` in production unless you mean to wipe state.

### "Need to update env vars without rebuilding images"

```bash
ssh deploy@$VPS_IP
cd ~/coffeeshop
nano .env
docker compose up -d --force-recreate
```

`up -d` re-reads `.env`; `--force-recreate` makes sure containers pick up
the change instead of reusing the cached layer.

## Course-mode note (no real deploy)

For this reference repo, the actual VPS provisioning (Hetzner, ufw, fail2ban,
SSH hardening) is documented in the Week 6 plan but not executed. To take
this stack live, follow the Week 6 plan's Tasks 1–3 (provision + harden +
install Docker), then return to "First-time deploy" above.
