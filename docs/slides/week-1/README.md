# Week 1 Slides — Coffee Shop Course

Slidev deck สำหรับ Week 1 (Session 1 + Session 2 รวม 25 slides).

## Run

```bash
cd docs/slides/week-1
pnpm install
pnpm dev          # opens http://localhost:3030
```

## Build static site

```bash
pnpm build        # outputs to dist/
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
