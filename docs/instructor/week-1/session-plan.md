# Week 1 — Session Plan

**Week Goal:** monorepo + Next.js 15 foundation. จบ Week 1 → student มี static coffee shop UI + interactive form + tests pass

**Total class time:** 240 min (2 sessions × 120 min) + ~3-5 ชม. homework ระหว่าง sessions

---

## 📅 Cadence

| Session | When | Duration | Covers (Plan tasks) |
|---|---|---|---|
| **1** | Day 1 (เช่น เสาร์) | 120 min | Tasks 1-4: monorepo + Next.js + App Router + Layouts |
| _Homework_ | Day 2-6 | 3-5 hrs self | Tasks 5-8: shadcn install + static menu + Cart Client |
| **2** | Day 7 (เสาร์ถัดไป) | 120 min | Tasks 9-10: Vitest + RHF/Zod TDD form + recap |

> **1-on-1 mentor mode**: ใช้ session plan เดียวกันแต่ student พิมพ์เองทุก step. Instructor ดูข้างๆ + interrupt เมื่อ debug. Pace ปรับตาม student — โดยเฉลี่ย 1.5x ของ live class เวลา (ละเอียดกว่า)

---

## 🎯 Week 1 Learning Outcomes

จบ Week 1 student สามารถ:

| Skill | ทดสอบโดย |
|---|---|
| ตั้ง pnpm monorepo + Turborepo จาก scratch | Live exercise Session 1 + homework |
| อธิบาย App Router file conventions | Checkpoint Q (Session 1 + 2) |
| แยก Server vs Client Component (เลือกถูกตัว) | Cart icon homework + Q&A |
| ใช้ shadcn/ui workflow (init + add components) | Homework Task 6 |
| เขียน form ด้วย React Hook Form + Zod ผูกกัน | Session 2 in-class build |
| เขียน Vitest test สำหรับ form behavior (TDD) | Session 2 in-class TDD |
| Commit ที่ atomic + meaningful message | ทุก task ต้อง commit |

---

## 📊 Time Budget Summary

```
Session 1 (120 min)
├── Pre-roll + course preview ......... 10 min
├── Block A: monorepo + pnpm + Turbo .. 25 min
├── Block B: Next.js App Router ........ 35 min
├── Block C: Layouts + Route Groups .... 30 min
├── Wrap-up + homework + Q&A .......... 15 min
└── Buffer .............................. 5 min

Homework (3-5 hrs self-paced)
├── Task 5: Tailwind verify
├── Task 6: shadcn init + 5 components
├── Task 7: static menu page (Server Component)
└── Task 8: Cart icon (Client Component)

Session 2 (120 min)
├── Recap + homework review ........... 20 min
├── Block D: Server vs Client deep dive 25 min
├── Block E: Vitest setup + TDD intro . 20 min
├── Block F: RHF + Zod feedback form .. 40 min
├── Wrap-up + Week 2 preview .......... 10 min
└── Buffer .............................. 5 min
```

---

## 🎨 Material Checklist (instructor — ก่อนเริ่ม Week 1)

- [ ] Pre-course checklist ส่งให้ student อ่านก่อนล่วงหน้า ≥ 3 วัน
- [ ] Slides Week 1 (build จาก [slides-outline.md](slides-outline.md))
- [ ] Demo project repo ใน VS Code พร้อม (clean folder)
- [ ] Backup recording ของ "final coffee shop" ไว้โชว์ตอน course preview
- [ ] Screen-share + terminal font ≥ 16pt + dark mode (อ่านง่ายกว่า)
- [ ] Slack/LINE channel สำหรับ class — ใช้ post code snippets, error messages

---

## 📄 Related Artifacts

- [Session 1 Lesson Script](session-1-lesson-script.md) — full talking script + demo flow
- [Session 2 Lesson Script](session-2-lesson-script.md)
- [Slides Outline](slides-outline.md)
- [Exercises](exercises.md) — in-class + homework + solutions
- [Pitfalls & FAQ](pitfalls-faq.md)
- [Assessment Checklist](assessment-checklist.md)
