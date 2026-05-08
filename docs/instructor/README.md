# Instructor Materials — Coffee Shop Full-Stack Course

คู่มือ instructor สำหรับ live class (2-6 คน) + 1-on-1 mentorship ของคอร์ส Full-Stack 6 สัปดาห์

> **Source of truth (ห้ามลืม)**:
> - [Course design spec](../superpowers/specs/2026-05-08-fullstack-coffee-shop-course-design.md) — decision rationale ครบทุกข้อ
> - [Week N Plan](../superpowers/plans/) — implementation plan ละเอียดต่อสัปดาห์ ใช้เป็น "demo source-of-truth"

---

## 📂 Folder Structure

```
docs/instructor/
├── README.md                     ← (ไฟล์นี้)
├── master/
│   ├── syllabus.md               ← student-facing course outline
│   ├── pre-course-checklist.md   ← student preparation
│   └── final-project-rubric.md   ← portfolio assessment
├── week-1/
│   ├── session-plan.md           ← 1-2 sessions, time-blocked
│   ├── session-1-lesson-script.md ← talking points + demo flow
│   ├── session-2-lesson-script.md
│   ├── slides-outline.md         ← key visuals to draw/show
│   ├── exercises.md              ← in-class + homework + solutions
│   ├── pitfalls-faq.md           ← common student questions
│   └── assessment-checklist.md   ← checkpoint questions
├── week-2/ … week-6/             ← เหมือน week-1
└── 1-on-1/
    └── mentorship-plan.md        ← lesson plan adapter for solo students
```

---

## 📄 Artifact Conventions

| Artifact | Purpose | Audience | Length target |
|---|---|---|---|
| **Session Plan** | Time-blocked agenda | instructor | 1 page |
| **Lesson Script** | What to say + when to type/click | instructor | 3-5 pages |
| **Slides Outline** | Diagrams + key bullets | instructor (build slides from this) | 1-2 pages |
| **Exercises** | Hands-on tasks + solutions | shared with students (without solutions) | 2-3 pages |
| **Pitfalls/FAQ** | Anticipated Q&A | instructor | 1-2 pages |
| **Assessment Checklist** | Checkpoint Qs to verify understanding | instructor | 1 page |

### Naming Convention
- `session-N-lesson-script.md` — N = session ลำดับ (1-based)
- ทุกไฟล์ใช้ kebab-case
- ภาษา: ผสมไทย/อังกฤษตามสไตล์ instructor (technical terms ปล่อย English)

### Header Block (ทุก artifact)
```markdown
# [Title]
**Week:** N
**Session:** N (ถ้ามี)
**Duration:** XX min (ถ้ามี)
**Class size:** 2-6 / 1-on-1
**Pre-requisites:** [previous sessions / pre-course]
**Covers:** [link to plan tasks]
```

---

## 🗓️ Default Session Cadence (ปรับได้)

**สำหรับ live class 2-6 คน:**
- **1 session/สัปดาห์ × 120 นาที** (default — เหมาะกับนักเรียนทำงาน, มีเวลาเสาร์/อาทิตย์)
- หรือ **2 sessions/สัปดาห์ × 90 นาที** (เหมาะกับ intensive cohort)

**สำหรับ 1-on-1:**
- **Flexible** — ใช้ session plan เดียวกันแต่ pace ตาม student
- เน้น "you do it while I watch" — instructor ดู student พิมพ์ live

---

## 🎓 Teaching Philosophy (ตั้งไว้ให้ทุก artifact aligned)

1. **Project-driven > Concept-driven** — สอน concept "ผ่าน" การสร้างของจริง ไม่ใช่ theory ก่อน
2. **Show-then-tell** — demo ก่อน, อธิบายตาม (สมองคนเรียน "เห็น" ก่อนเสมอ)
3. **Forced checkpoints** — student ต้องตอบคำถามทุก 20-30 นาที (กัน autopilot)
4. **Embrace bugs in class** — ถ้า demo bug → ใช้เป็นโอกาสสอน debugging
5. **Homework = ทำเอง, class = สอน concept** — class ไม่ใช่ที่นั่งทำ tutorial ทีละบรรทัด

---

## 🚦 Status Per Week

| Week | Plan | Instructor Pack |
|---|---|---|
| 1 | ✅ [Plan](../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) | ✅ **Complete** (7 artifacts) |
| 2 | ⏳ Plan ยังไม่เขียน | ⏳ ยังไม่ทำ |
| 3 | ⏳ | ⏳ |
| 4 | ⏳ | ⏳ |
| 5 | ⏳ | ⏳ |
| 6 | ⏳ | ⏳ |

**Master artifacts** (syllabus, pre-course, rubric): ⏳ ยังไม่ทำ

### Week 1 Instructor Pack — Files

| Artifact | File |
|---|---|
| Session Plan | [week-1/session-plan.md](week-1/session-plan.md) |
| Session 1 Script | [week-1/session-1-lesson-script.md](week-1/session-1-lesson-script.md) |
| Session 2 Script | [week-1/session-2-lesson-script.md](week-1/session-2-lesson-script.md) |
| Slides Outline | [week-1/slides-outline.md](week-1/slides-outline.md) |
| Exercises | [week-1/exercises.md](week-1/exercises.md) |
| Pitfalls & FAQ | [week-1/pitfalls-faq.md](week-1/pitfalls-faq.md) |
| Assessment | [week-1/assessment-checklist.md](week-1/assessment-checklist.md) |

---

## ▶️ Next Steps

1. **Review Week 1 Instructor Pack** — อ่านครบ 7 ไฟล์, ปรับ tone/format ตามต้องการ
2. Decide format final → scale ทำ Week 2-6 (Plan + Instructor Pack คู่กัน)
3. **Master artifacts** ที่ยังขาด:
   - `master/syllabus.md` — student-facing course outline
   - `master/pre-course-checklist.md` — student preparation (Node, pnpm, Git, VS Code)
   - `master/final-project-rubric.md` — portfolio assessment

### Recommended Order
1. Master artifacts (syllabus + pre-course) — ใช้ก่อนเริ่มสอน batch แรก
2. Week 2 Plan + Instructor Pack — backend foundation (NestJS + Postgres)
3. Week 3-6 ตามลำดับ
4. Final project rubric — ก่อน Week 5
