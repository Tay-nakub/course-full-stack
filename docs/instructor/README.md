# Instructor Materials — Coffee Shop Full-Stack Course

คู่มือ instructor สำหรับ live class (2-6 คน) + 1-on-1 mentorship ของคอร์ส Full-Stack 6 สัปดาห์

> **Source of truth (ห้ามลืม)**:
>
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

| Artifact                 | Purpose                               | Audience                                 | Length target |
| ------------------------ | ------------------------------------- | ---------------------------------------- | ------------- |
| **Session Plan**         | Time-blocked agenda                   | instructor                               | 1 page        |
| **Lesson Script**        | What to say + when to type/click      | instructor                               | 3-5 pages     |
| **Slides Outline**       | Diagrams + key bullets                | instructor (build slides from this)      | 1-2 pages     |
| **Exercises**            | Hands-on tasks + solutions            | shared with students (without solutions) | 2-3 pages     |
| **Pitfalls/FAQ**         | Anticipated Q&A                       | instructor                               | 1-2 pages     |
| **Assessment Checklist** | Checkpoint Qs to verify understanding | instructor                               | 1 page        |

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

| Week | Plan                                                                                | Instructor Pack               |
| ---- | ----------------------------------------------------------------------------------- | ----------------------------- |
| 1    | ✅ [Plan](../superpowers/plans/2026-05-08-week-1-monorepo-and-nextjs-foundation.md) | ✅ **Complete** (7 artifacts) |
| 2    | ✅ [Plan](../superpowers/plans/2026-05-08-week-2-nestjs-postgres-auth.md)           | ✅ **Complete** (7 artifacts) |
| 3    | ✅ [Plan](../superpowers/plans/2026-05-08-week-3-end-to-end-menu-crud.md)           | ✅ **Complete** (7 artifacts) |
| 4    | ✅ [Plan](../superpowers/plans/2026-05-08-week-4-order-flow.md)                     | ✅ **Complete** (7 artifacts) |
| 5    | ✅ [Plan](../superpowers/plans/2026-05-08-week-5-inventory-reports.md)              | ✅ **Complete** (7 artifacts) |
| 6    | ✅ [Plan](../superpowers/plans/2026-05-08-week-6-deploy-gitops.md)                  | ✅ **Complete** (7 artifacts) |

🎉 **COURSE COMPLETE — All 6 weeks delivered**

### Week 2 Instructor Pack — Files

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-2/session-plan.md](week-2/session-plan.md)                       |
| Session 1 Script | [week-2/session-1-lesson-script.md](week-2/session-1-lesson-script.md) |
| Session 2 Script | [week-2/session-2-lesson-script.md](week-2/session-2-lesson-script.md) |
| Slides Outline   | [week-2/slides-outline.md](week-2/slides-outline.md)                   |
| Exercises        | [week-2/exercises.md](week-2/exercises.md)                             |
| Pitfalls & FAQ   | [week-2/pitfalls-faq.md](week-2/pitfalls-faq.md)                       |
| Assessment       | [week-2/assessment-checklist.md](week-2/assessment-checklist.md)       |

### Week 3 Instructor Pack — Files

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-3/session-plan.md](week-3/session-plan.md)                       |
| Session 1 Script | [week-3/session-1-lesson-script.md](week-3/session-1-lesson-script.md) |
| Session 2 Script | [week-3/session-2-lesson-script.md](week-3/session-2-lesson-script.md) |
| Slides Outline   | [week-3/slides-outline.md](week-3/slides-outline.md)                   |
| Exercises        | [week-3/exercises.md](week-3/exercises.md)                             |
| Pitfalls & FAQ   | [week-3/pitfalls-faq.md](week-3/pitfalls-faq.md)                       |
| Assessment       | [week-3/assessment-checklist.md](week-3/assessment-checklist.md)       |

### Week 4 Instructor Pack — Files

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-4/session-plan.md](week-4/session-plan.md)                       |
| Session 1 Script | [week-4/session-1-lesson-script.md](week-4/session-1-lesson-script.md) |
| Session 2 Script | [week-4/session-2-lesson-script.md](week-4/session-2-lesson-script.md) |
| Slides Outline   | [week-4/slides-outline.md](week-4/slides-outline.md)                   |
| Exercises        | [week-4/exercises.md](week-4/exercises.md)                             |
| Pitfalls & FAQ   | [week-4/pitfalls-faq.md](week-4/pitfalls-faq.md)                       |
| Assessment       | [week-4/assessment-checklist.md](week-4/assessment-checklist.md)       |

### Week 5 Instructor Pack — Files ⭐

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-5/session-plan.md](week-5/session-plan.md)                       |
| Session 1 Script | [week-5/session-1-lesson-script.md](week-5/session-1-lesson-script.md) |
| Session 2 Script | [week-5/session-2-lesson-script.md](week-5/session-2-lesson-script.md) |
| Slides Outline   | [week-5/slides-outline.md](week-5/slides-outline.md)                   |
| Exercises        | [week-5/exercises.md](week-5/exercises.md)                             |
| Pitfalls & FAQ   | [week-5/pitfalls-faq.md](week-5/pitfalls-faq.md)                       |
| Assessment       | [week-5/assessment-checklist.md](week-5/assessment-checklist.md)       |

### Week 6 Instructor Pack — Files 🚀 FINAL

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-6/session-plan.md](week-6/session-plan.md)                       |
| Session 1 Script | [week-6/session-1-lesson-script.md](week-6/session-1-lesson-script.md) |
| Session 2 Script | [week-6/session-2-lesson-script.md](week-6/session-2-lesson-script.md) |
| Slides Outline   | [week-6/slides-outline.md](week-6/slides-outline.md)                   |
| Exercises        | [week-6/exercises.md](week-6/exercises.md)                             |
| Pitfalls & FAQ   | [week-6/pitfalls-faq.md](week-6/pitfalls-faq.md)                       |
| Assessment       | [week-6/assessment-checklist.md](week-6/assessment-checklist.md)       |

### Master Artifacts ✅ Complete

| Artifact             | File                                                             | Audience           |
| -------------------- | ---------------------------------------------------------------- | ------------------ |
| Course Syllabus      | [master/syllabus.md](master/syllabus.md)                         | **student-facing** |
| Pre-Course Checklist | [master/pre-course-checklist.md](master/pre-course-checklist.md) | **student-facing** |
| Final Project Rubric | [master/final-project-rubric.md](master/final-project-rubric.md) | shared             |

### Week 1 Instructor Pack — Files

| Artifact         | File                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| Session Plan     | [week-1/session-plan.md](week-1/session-plan.md)                       |
| Session 1 Script | [week-1/session-1-lesson-script.md](week-1/session-1-lesson-script.md) |
| Session 2 Script | [week-1/session-2-lesson-script.md](week-1/session-2-lesson-script.md) |
| Slides Outline   | [week-1/slides-outline.md](week-1/slides-outline.md)                   |
| Exercises        | [week-1/exercises.md](week-1/exercises.md)                             |
| Pitfalls & FAQ   | [week-1/pitfalls-faq.md](week-1/pitfalls-faq.md)                       |
| Assessment       | [week-1/assessment-checklist.md](week-1/assessment-checklist.md)       |

---

## ▶️ Next Steps (Course Complete!)

### Before First Batch

1. **Customize student-facing artifacts**:
   - `master/syllabus.md` — fill in instructor name, cohort dates, communication channel, tuition
   - `master/pre-course-checklist.md` — adjust per batch needs
2. **Build slides** from each week's `slides-outline.md`
3. **Create demo project repos** for each week's "instructor-start" branch
4. **Test deploy demo end-to-end** before Week 6
5. **Set up alumni community** (Slack/Discord channel)

### After First Batch

1. **Update pitfalls-faq.md** — add real student issues encountered
2. **Update common-mistakes heatmap** in each FAQ
3. **Refine time blocks** based on actual session timing
4. **Collect testimonials + portfolio links** for next batch marketing
5. **Improve content** for next batch

### All Complete ✅

- ✅ Master artifacts (3 files)
- ✅ Week 1 Plan + Pack — FE foundation
- ✅ Week 2 Plan + Pack — BE foundation
- ✅ Week 3 Plan + Pack — First end-to-end slice
- ✅ Week 4 Plan + Pack — Order flow (multi-actor)
- ✅ Week 5 Plan + Pack — Inventory + Reports ⭐
- ✅ Week 6 Plan + Pack — Deploy + GitOps 🚀

**Total artifacts**: 6 plans + 6 packs (7 files each) + 3 master = **48 files, ~30,000+ lines**

### Course Stats

- **Total class time**: 12 sessions × 120 min = **24 hours**
- **Total student time** (incl. homework): ~74 hours over 6 weeks
- **Final deliverable**: Live coffee shop with HTTPS + GitOps + portfolio
