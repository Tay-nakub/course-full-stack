# Week 6 — Session Plan 🚀 FINAL

**Week Goal:** Deploy to live VPS — `git push` → live URL with HTTPS in ~3 minutes

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework

---

## 📅 Cadence

| Session    | When    | Duration | Covers (Plan tasks)                                                     |
| ---------- | ------- | -------- | ----------------------------------------------------------------------- |
| **1**      | Day 1   | 120 min  | Tasks 1-7: VPS + hardening + Docker + Dockerfiles + compose + Caddyfile |
| _Homework_ | Day 2-6 | 3-5 hrs  | First manual deploy + verify live                                       |
| **2**      | Day 7   | 120 min  | Tasks 8-10: domain DNS + GitHub Actions CI + deploy + backup            |

> **⚠️ Pre-class IMPORTANT**:
>
> - Student ต้อง **มี domain แล้ว** (ซื้อ subdomain ของของที่มีก็ได้ฟรี)
> - Student ต้อง **มี credit card** สำหรับ Hetzner (~€4.5/mo)
> - GitHub account ต้อง verified

---

## 🎯 Week 6 Learning Outcomes

| Skill                                          | ทดสอบโดย                                   |
| ---------------------------------------------- | ------------------------------------------ |
| Provision Hetzner VPS + SSH key auth           | Live deploy own VPS                        |
| Server hardening (ufw + fail2ban + SSH config) | `ufw status` + try root login (fail)       |
| Multi-stage Dockerfile (size + security)       | Final image < 300 MB                       |
| Docker Compose orchestration                   | `docker compose up` runs 4-container stack |
| Caddy auto-HTTPS reverse proxy                 | https:// works with valid cert             |
| GitHub Actions CI/CD                           | Push main → deployed                       |
| pg_dump backup automation                      | Daily cron runs                            |

---

## 📊 Time Budget Summary

```
Session 1 (120 min) — VPS + Containers
├── Recap Week 5 + Week 6 preview ........ 10 min
├── Block A: Provision VPS + SSH ......... 25 min  ← Tasks 1
├── Block B: Hardening (ufw + fail2ban +
│           SSH config) ................... 20 min  ← Task 2
├── Block C: Install Docker + UFW conflict 10 min  ← Task 3
├── Block D: Multi-stage Dockerfiles
│           (api + web) .................... 35 min  ← Tasks 4-5
├── Block E: Compose + Caddyfile .......... 15 min  ← Tasks 6-7
└── Wrap-up + homework + Q&A .............. 5 min

Homework (3-5 hrs)
├── Manual deploy steps (Task 8.1-8.7)
├── Verify live URL with HTTPS
└── Seed prod DB

Session 2 (120 min) — GitOps + Polish
├── Recap + verify everyone live ......... 10 min
├── Block F: GitHub Actions CI ........... 25 min  ← Task 9
├── Block G: GitHub Actions Deploy ....... 40 min  ← Task 10 (deploy.yml)
├── Block H: Backup + Runbook ............ 25 min  ← Task 10 (backup + DEPLOY.md)
├── Course recap + final project ......... 15 min
└── Closing + Q&A ........................ 5 min
```

---

## 🪜 Cognitive Load Considerations

Week 6 = "many small pieces, must work together":

- VPS commands (Linux fluency varies)
- Docker (new for ~50% of students)
- DNS (often confusing)
- GitHub Actions (YAML syntax + secrets)

**Strategies**:

- **Show, don't tell** — instructor's screen visible always
- **Verify checkpoint after each block** — don't move on until working
- **Backup branch ready** — if student ติด Block A, give them path forward
- **Small test wins** — `docker run hello-world`, `curl`, `ssh-test`

---

## 🎨 Material Checklist

- [ ] Hetzner account demo set up
- [ ] Demo domain ready (have one for instructor)
- [ ] Test/burner credit card for Hetzner if doing live demo
- [ ] Pre-built Docker images for fallback (instructor's GHCR)
- [ ] DEPLOY.md template ready
- [ ] DNS provider tabs open (Cloudflare/Namecheap)

---

## 📄 Related Artifacts

- [Session 1 Lesson Script](session-1-lesson-script.md)
- [Session 2 Lesson Script](session-2-lesson-script.md)
- [Slides Outline](slides-outline.md)
- [Exercises](exercises.md)
- [Pitfalls & FAQ](pitfalls-faq.md)
- [Assessment Checklist](assessment-checklist.md)

---

## 🔗 Course Closing

**ใช้จาก Week 1-5:**

- Whole monorepo (Wk 1)
- NestJS + Prisma + Auth (Wk 2)
- Menu CRUD UI (Wk 3)
- Order flow + Kitchen (Wk 4)
- Inventory + Reports + seed (Wk 5)

**ส่งต่อ student**:

- Live URL → portfolio piece
- Tier 1-3 learning path (from spec § 7.2)
- Final project rubric self-assessment

> "Week 1 = ตั้งต้น. Week 6 = ส่งของ. ระหว่างทาง = สร้างของจริงที่ใช้งานได้"

---

## 🎓 Course Stats

After Week 6, student มี:

- 🌐 **Live web app** with HTTPS
- 📦 **GitHub repo** with clean history (~50+ atomic commits)
- 🧪 **Test suite** ≥ 25 unit tests
- 📊 **Portfolio piece** ที่ recruiter clone-and-run ได้
- 🛠️ **Skills**: TypeScript, React/Next.js, NestJS, Prisma, Postgres, Docker, GitOps
