# Week 2 — Session Plan

**Week Goal:** NestJS API + Postgres + Prisma + JWT auth working. จบ Week 2 → student มี backend ที่ login ได้, ออก JWT, มี role-based guards พร้อมเชื่อม FE ใน Week 3

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework ระหว่าง sessions

---

## 📅 Cadence

| Session    | When    | Duration     | Covers (Plan tasks)                                                     |
| ---------- | ------- | ------------ | ----------------------------------------------------------------------- |
| **1**      | Day 1   | 120 min      | Tasks 1-5: shared package + apps/api + Postgres + Prisma + PrismaModule |
| _Homework_ | Day 2-6 | 3-5 hrs self | Practice Prisma queries, study NestJS docs, get familiar with Postman   |
| **2**      | Day 7   | 120 min      | Tasks 6-10: Auth schemas + register + login + guards + tests            |

> **Pre-class for Week 2 Session 1**:
>
> - **Docker Desktop installed** + verified (`docker run hello-world`)
> - Postman or HTTPie installed (อย่างน้อย 1 ตัว)
> - DBeaver / TablePlus installed (สำหรับ inspect Postgres) — optional แต่แนะนำ

---

## 🎯 Week 2 Learning Outcomes

จบ Week 2 student สามารถ:

| Skill                                          | ทดสอบโดย                 |
| ---------------------------------------------- | ------------------------ |
| รัน Postgres ใน Docker Compose + connect       | Session 1 in-class       |
| อธิบาย NestJS modules/controllers/providers/DI | Verbal Q + Q&A           |
| เขียน Prisma schema + รัน migration            | Session 1 in-class build |
| สร้าง NestJS service ที่ inject PrismaService  | Session 1 + Session 2    |
| Hash password with bcrypt + verify             | Session 2 register/login |
| Issue + verify JWT (sign/decode)               | Session 2                |
| สร้าง custom Guard + Decorator                 | Session 2 in-class       |
| Validate env vars with Zod                     | Session 2 wrap           |
| เขียน NestJS unit test (Vitest + mocks)        | Session 2 final block    |

---

## 📊 Time Budget Summary

```
Session 1 (120 min) — Backend Setup & Database
├── Recap Week 1 + Week 2 preview ..... 10 min
├── Block A: Docker + Postgres ........ 25 min
├── Block B: NestJS scaffold + DI ..... 30 min
├── Block C: Prisma + first migration . 30 min
├── Block D: PrismaModule (Service) ... 15 min
├── Wrap-up + homework + Q&A .......... 10 min

Homework (3-5 hrs self-paced)
├── Optional: read NestJS Fundamentals docs
├── Practice: Prisma Studio, write 3 sample queries
└── Read: bcrypt + JWT primer (links provided)

Session 2 (120 min) — Auth Implementation
├── Recap + homework review ........... 10 min
├── Block E: Auth schemas + bcrypt .... 30 min  ← Tasks 6-7
├── Block F: JWT issue + login ........ 30 min  ← Task 8
├── Block G: Guards + decorators ...... 30 min  ← Task 9
├── Block H: Tests + healthcheck + env  15 min  ← Task 10
└── Wrap-up + Week 3 preview .......... 5 min
```

---

## 🎨 Material Checklist (instructor — ก่อนเริ่ม Week 2)

- [ ] Slides Week 2 (build จาก [slides-outline.md](slides-outline.md))
- [ ] Demo project — branch `week2-instructor` ที่มี Week 1 จบสมบูรณ์ (ใช้ start จาก state นี้)
- [ ] Pre-class checklist post ใน Slack:
  - "Docker Desktop ติดตั้งและรัน `docker run hello-world` ผ่าน"
  - "Postman / HTTPie installed"
- [ ] Backup `.env` example file แชร์ใน private channel (กัน student พิมพ์ผิด)
- [ ] DBeaver/TablePlus connection string ตัวอย่าง (host=localhost, user=coffee, db=coffee)
- [ ] เปิด NestJS docs + Prisma docs tab ระหว่างสอน

---

## 🪜 Cognitive Load Considerations

Week 2 มี **3 new things ในหัวพร้อมกัน**: Docker, NestJS, Prisma. Strategies:

1. **Session 1 = "infrastructure"** — focus on getting things running (Docker, scaffold, schema), ไม่ลึก concept
2. **Session 2 = "domain logic"** — auth flow ที่ student เข้าใจอยู่แล้ว (login flow), แค่เปลี่ยน technology
3. **อย่าลึก NestJS DI Container ที่ลึก** — สอน concept พื้นฐานพอ, advanced pattern เก็บไป Week 3+
4. **Postman / HTTPie test ทุก endpoint** — visual feedback ดี (vs curl ที่ student อ่านยาก)

---

## 📄 Related Artifacts

- [Session 1 Lesson Script](session-1-lesson-script.md)
- [Session 2 Lesson Script](session-2-lesson-script.md)
- [Slides Outline](slides-outline.md)
- [Exercises](exercises.md)
- [Pitfalls & FAQ](pitfalls-faq.md)
- [Assessment Checklist](assessment-checklist.md)

---

## 🔗 Connection Backwards/Forwards

**ใช้จาก Week 1:**

- Monorepo structure (เพิ่ม `apps/api` + `packages/shared`)
- TypeScript strict config
- Vitest setup pattern

**ส่งต่อ Week 3:**

- `@coffee/shared` (Zod schemas) — Week 3 จะเพิ่ม Menu/Product schemas
- AuthService + Guards — Week 3 จะใช้ใน Menu Controller
- PrismaService — Week 3 จะ inject ใน Menu Service

> Week 1 = FE foundation. Week 2 = BE foundation. **Week 3 = เชื่อม 2 ฝั่ง**
