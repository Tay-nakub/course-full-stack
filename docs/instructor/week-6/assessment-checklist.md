# Week 6 — Assessment Checklist (FINAL)

**Audience:** instructor — diagnostic + course completion criteria

---

## 🎯 Pass Criteria (Course Complete)

Student "จบคอร์สสำเร็จ" ถ้า:

- ✅ Live URL with HTTPS accessible
- ✅ All Week 1-5 features work in production
- ✅ Verbal Q ≥ 7/10 (Week 6 specific)
- ✅ Final project rubric — at least "Functional Baseline"

ถ้า ≤ 6/10 → 1-on-1 follow-up (no penalty — focus on understanding)

**"Distinction"** = Production Ready tier in [Final Rubric](../master/final-project-rubric.md)

---

## 🗣️ Verbal Checkpoint Questions (10 ข้อ)

### Q1 — VPS hardening

> "ทำไม disable root SSH + password auth?"

**Acceptable**: Reduce attack surface — bots scan SSH 24/7. Key auth = harder to brute force. No root login = no easy target name

### Q2 — UFW + fail2ban

> "บอกบทบาทของ ufw vs fail2ban"

**Acceptable**: ufw = network firewall (allow/block ports). fail2ban = application-level (lockout IP after failed attempts). Layered defense

### Q3 — Multi-stage Dockerfile

> "ทำไม multi-stage? size + อะไรอีก?"

**Acceptable**: Size (smaller image = faster pull). + Security (no source/dev deps in final). + Layer caching efficiency

### Q4 — Caddy auto-HTTPS

> "Caddy ออก cert ยังไง? ใช้ cron renew ไหม?"

**Acceptable**: Let's Encrypt HTTP-01 challenge (port 80 must be open). Auto-renew internally — no cron needed

### Q5 — Compose expose vs ports

> "expose: '3000' vs ports: '3000:3000' ต่างกันยังไง?"

**Acceptable**: ports = bind to host (publicly accessible). expose = internal only (other containers can reach). Caddy gets ports, web/api/postgres get expose

### Q6 — GitOps definition

> "GitOps คืออะไร?"

**Acceptable**: Git = source of truth for production. Push to main → automated deploy. No manual server changes — all via git history

### Q7 — Image tagging

> "ทำไม tag ด้วย latest + git SHA?"

**Acceptable**: latest = convenience (current). SHA = immutable, used for rollback. ย้อนกลับ = `TAG=<sha> docker compose up`

### Q8 — Migration on container start

> "Prisma migrate deploy ใน entrypoint — idempotent ไหม? ทำไม OK รัน wrong?"

**Acceptable**: Idempotent — only runs pending migrations. Already applied = skip. Safe even with multiple containers via advisory lock

### Q9 — Backup + restore

> "ทำไมต้องทดสอบ restore?"

**Acceptable**: Untested backup = no backup. ระหว่างเหตุการณ์จริง = ไม่ใช่เวลาเรียน restore. ทดสอบเดือนละครั้ง

### Q10 — Layered network architecture

> "Caddy public, web/api/postgres internal — ทำไม?"

**Acceptable**: Reduce attack surface. Only Caddy exposes to internet. Postgres + apps = inside Docker network. Defense in depth

---

## 📋 Final Project Code Review Checklist

Use [Final Rubric](../master/final-project-rubric.md) for full assessment.

### Quick Review Checklist (15 min per student)

#### Setup verification

- [ ] `git clone` + `docker compose up` works in instructor's env
- [ ] DEPLOY.md sufficient to deploy from scratch
- [ ] `.env.example` has all required vars

#### Live deployment

- [ ] HTTPS accessible at provided URL
- [ ] Lock icon (valid cert)
- [ ] All pages respond (no 500s)
- [ ] Login as admin works
- [ ] Place order → kitchen → reports update

#### Code quality

- [ ] `pnpm typecheck` passes
- [ ] Tests pass
- [ ] Linting OK
- [ ] No `any` types in business logic
- [ ] Atomic commits with clear messages

#### Documentation

- [ ] README has: tech stack, setup, demo URL
- [ ] DEPLOY.md exists
- [ ] At least 1 ADR (recommended for Distinction)

#### Stretch feature (for Distinction)

- [ ] Functional + integrated
- [ ] Documented in README
- [ ] Tests if applicable

---

## 🧪 Live Build Checkpoints

### Session 1 — Block A (VPS provision)

- [ ] Hetzner CX22 running
- [ ] SSH as deploy works (no password)
- [ ] root SSH still works (revoked in Block B)

### Session 1 — Block B (hardening)

- [ ] `sudo ufw status` shows active + 22/80/443
- [ ] `systemctl status fail2ban` running
- [ ] root SSH denied (`Permission denied`)
- [ ] new terminal: deploy SSH still works

### Session 1 — Block C (Docker)

- [ ] `docker run hello-world` succeeds
- [ ] `docker compose version` shows v2

### Session 1 — Block D (Dockerfiles)

- [ ] `docker images` shows coffee-api < 250 MB
- [ ] `docker images` shows coffee-web < 300 MB
- [ ] Smoke test container responds

### Session 1 — Block E (compose + Caddyfile)

- [ ] Caddyfile validates
- [ ] Compose file references env vars correctly

### Session 1 — Homework

- [ ] DNS A record → VPS IP
- [ ] `docker compose up -d` runs all 4 containers
- [ ] HTTPS valid at custom domain
- [ ] Healthcheck endpoint returns 200 + DB connected
- [ ] Seed prod DB succeeded

### Session 2 — Block F (CI)

- [ ] `.github/workflows/ci.yml` committed
- [ ] CI workflow runs on push (green)
- [ ] Tests run on real Postgres service container

### Session 2 — Block G (Deploy)

- [ ] GitHub Secrets set: SSH_PRIVATE_KEY, VPS_HOST, VPS_USER
- [ ] `.github/workflows/deploy.yml` committed
- [ ] Push main → see Deploy run
- [ ] Live URL updated within 3-5 min
- [ ] Rollback tested (TAG=<old-sha> docker compose up)

### Session 2 — Block H (backup + runbook)

- [ ] backup.sh runs successfully
- [ ] Cron entry installed
- [ ] DEPLOY.md committed

---

## 📊 Final Self-Assessment

```
Course Completion Self-Assessment

Live deployment:
□ URL: __________________________________________
□ HTTPS valid: ✓/✗
□ All features working: ✓/✗

Concept depth (1-5):
□ Monorepo + Turborepo (Wk 1)               [1] [2] [3] [4] [5]
□ Server vs Client Components (Wk 1)         [1] [2] [3] [4] [5]
□ NestJS DI + modules (Wk 2)                 [1] [2] [3] [4] [5]
□ Prisma + migrations (Wk 2)                 [1] [2] [3] [4] [5]
□ JWT auth + Guards (Wk 2)                   [1] [2] [3] [4] [5]
□ Schema sharing (Wk 3)                      [1] [2] [3] [4] [5]
□ TanStack Query (Wk 3)                      [1] [2] [3] [4] [5]
□ httpOnly cookie auth (Wk 3)                [1] [2] [3] [4] [5]
□ $transaction atomic (Wk 4-5)               [1] [2] [3] [4] [5]
□ Snapshot pattern (Wk 4-5)                  [1] [2] [3] [4] [5]
□ State machines (Wk 4)                      [1] [2] [3] [4] [5]
□ Zustand + persist (Wk 4)                   [1] [2] [3] [4] [5]
□ Event-sourced inventory (Wk 5)             [1] [2] [3] [4] [5]
□ Recharts (Wk 5)                            [1] [2] [3] [4] [5]
□ Multi-stage Docker (Wk 6)                  [1] [2] [3] [4] [5]
□ Caddy auto-HTTPS (Wk 6)                    [1] [2] [3] [4] [5]
□ GitOps with GitHub Actions (Wk 6)          [1] [2] [3] [4] [5]
□ Backup + recovery (Wk 6)                   [1] [2] [3] [4] [5]

Overall confidence (full stack):              [1] [2] [3] [4] [5]
Confidence to build similar app solo:         [1] [2] [3] [4] [5]

Final project tier achieved:
□ Functional Baseline (Complete)
□ Professional Quality (Complete - Strong)
□ Production Ready + 1 stretch (Distinction)

Top 3 things I learned:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

Top 3 things I'd improve in this course:
1. ___________________________________________
2. ___________________________________________
3. ___________________________________________

Next learning topic (Tier 1/2/3):
___________________________________________
```

---

## 📈 Tracking Sheet — Final

| Student   | Live URL   | Tier | Q1-10   | Notes      |
| --------- | ---------- | ---- | ------- | ---------- |
| Student A | ****\_**** | \_\_ | \_\_/10 | ****\_**** |
| Student B | ****\_**** | \_\_ | \_\_/10 | ****\_**** |
| Student C | ****\_**** | \_\_ | \_\_/10 | ****\_**** |
| Student D | ****\_**** | \_\_ | \_\_/10 | ****\_**** |
| Student E | ****\_**** | \_\_ | \_\_/10 | ****\_**** |
| Student F | ****\_**** | \_\_ | \_\_/10 | ****\_**** |

---

## 🎓 Course Completion Certificate Criteria

Award certificate if student:

- ✅ Live deployment working
- ✅ All Week 1-5 features functional in prod
- ✅ Final project at least "Functional Baseline" tier
- ✅ Attendance ≥ 70%

Award **with Distinction** if also:

- ✅ Production Ready tier
- ✅ Stretch feature implemented
- ✅ ADRs documented
- ✅ Polished portfolio repo

---

## 🔁 Catch-up Plans

### Live URL Not Working

- Schedule 1-2 hr 1-on-1 within 1 week
- Bisect: VPS → Docker → DNS → Cert → Compose
- Provide working reference repo

### CI/CD Not Setup

- Lower priority — local deploy is enough for "Complete"
- Stretch goal for those who want Distinction

### Backup Not Setup

- Critical for production but not for course completion
- Document in DEPLOY.md as "to do" if not done

---

## 📝 Course Closing — Instructor Reflection

```
Course completion reflection (instructor)

Cohort details:
- Batch: ____
- Students: ____
- Live URLs deployed: ___ / ___
- Distinction tier: ___ / ___
- Certificates issued: ___ / ___

What worked across all weeks:
___________________________________________________

What didn't:
___________________________________________________

Concept progression — too fast/slow at:
- Week 1: ___
- Week 2: ___
- Week 3: ___
- Week 4: ___
- Week 5: ___
- Week 6: ___

Materials to update for next batch:
___________________________________________________

Pre-course filter (entry level requirements):
- Were students at expected level? Y/N
- What did some struggle with that we should screen for?
___________________________________________________

Time-block totals:
- Average deviation per session: ____ min
- Sessions over by 10+ min: ____

Drop-off points (if any):
- Week ___ session ___ — reason ___

Pivot ideas for next batch:
___________________________________________________

ROI assessment:
- Tuition vs effort: ___
- Student satisfaction: ___
- Recommend repeat: ___
```

---

## 🎉 Course Complete

**Student deliverables**:

- 🌐 Live coffee shop with HTTPS
- 📦 GitHub repo (production-ready code)
- 🔄 GitOps workflow (push = deploy)
- 💾 Daily DB backup
- 📚 DEPLOY.md runbook
- 🎓 Skills: TS, React/Next.js, NestJS, Prisma, Docker, GitOps

**Total course delivery**:

- 12 sessions × 120 min = 24 hours of class time
- 10 weeks × 5 hours homework = 50 hours self-paced
- Total: ~74 hours over 6 weeks
- Live deployment + working portfolio piece

> 🙏 Thank student for trust + encourage continuation
