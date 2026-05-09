# Week 1 Slides — Coffee Shop Course

Slidev deck สำหรับ Week 1 (Session 1 + Session 2 รวม 25 slides).

## Run

```bash
cd docs/slides/week-1
npm install
npm run dev          # opens http://localhost:3030
```

> The `predev` hook auto-runs `scripts/build-docs.mjs` which renders the 3 setup
> guides referenced in the slides (`docs/student/*.md` + pre-course-checklist)
> into `public/docs/.../*.html` so the in-slide links work on localhost.

## Build static site

```bash
npm run build        # outputs to dist/ (includes pre-rendered docs/)
```

## Export to PDF

```bash
pnpm add -D playwright-chromium
pnpm export       # outputs slides-export.pdf
```

## Editing

- เนื้อหาทั้งหมดอยู่ใน `slides.md`
- ดู [Slidev docs](https://sli.dev) สำหรับ syntax
- Theme: `seriph` (clean academic look) — เปลี่ยนใน frontmatter ได้
- Color tokens กำหนดที่ `style.css` (coffee accent `#f5a623`)

## Source of truth

เนื้อหามาจาก [`docs/instructor/week-1/slides-outline.md`](../../instructor/week-1/slides-outline.md).
ถ้า outline เปลี่ยน → sync เข้า `slides.md` แล้ว.
