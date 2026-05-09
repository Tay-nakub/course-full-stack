# Week 3 Slides — Coffee Shop Course

Slidev deck สำหรับ Week 3 (Session 1 + Session 2 — Menu CRUD + first end-to-end slice).

## Run

```bash
cd docs/slides/week-3
npm install
npm run dev          # opens http://localhost:3030
```

> สังเกต: deck แต่ละ Week ใช้ `npm install` (ไม่ใช่ pnpm) เพราะ `docs/slides/*` อยู่นอก pnpm workspace ของ monorepo.

## Build static site

```bash
npm run build        # outputs to dist/
```

## Export to PDF

```bash
npm install -D playwright-chromium
npm run export       # outputs slides-export.pdf
```

## Editing

- เนื้อหาทั้งหมดอยู่ใน `slides.md`
- ดู [Slidev docs](https://sli.dev) สำหรับ syntax
- Theme: `seriph` (clean academic look) — เปลี่ยนใน frontmatter ได้
- Color tokens กำหนดที่ `style.css` (coffee accent `#f5a623`)

## Source of truth

เนื้อหามาจาก [`docs/instructor/week-3/slides-outline.md`](../../instructor/week-3/slides-outline.md).
ถ้า outline เปลี่ยน → sync เข้า `slides.md` แล้ว.
