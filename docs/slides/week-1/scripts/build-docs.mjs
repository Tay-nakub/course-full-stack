// Pre-render markdown docs referenced by Week 1 slides into public/docs/.
// Runs before slidev dev/build so links to setup guides work on localhost:3030
// and in the static `dist/` output.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const publicDir = resolve(__dirname, '../public/docs');

const docs = [
  {
    src: 'docs/student/setup-windows.md',
    out: 'student/setup-windows.html',
    title: '🪟 Windows Setup Guide',
  },
  {
    src: 'docs/student/setup-monorepo.md',
    out: 'student/setup-monorepo.html',
    title: '🏗️ Monorepo Setup',
  },
  {
    src: 'docs/instructor/master/pre-course-checklist.md',
    out: 'instructor/master/pre-course-checklist.html',
    title: '🔧 Pre-Course Checklist',
  },
];

const cssReset = `
  :root {
    --bg: #1e1e2e;
    --fg: #cdd6f4;
    --muted: #a6adc8;
    --coffee: #f5a623;
    --code-bg: #181825;
    --border: #313244;
  }
  * { box-sizing: border-box; }
  html, body { background: var(--bg); color: var(--fg); margin: 0; }
  body {
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
    line-height: 1.6;
    max-width: 820px;
    margin: 0 auto;
    padding: 2rem 1.5rem 6rem;
  }
  h1, h2, h3, h4 { color: var(--coffee); margin-top: 2em; }
  h1 { border-bottom: 2px solid var(--border); padding-bottom: 0.4em; }
  h2 { border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }
  a { color: var(--coffee); }
  a:hover { opacity: 0.85; }
  code, pre {
    font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  }
  code { background: var(--code-bg); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.92em; }
  pre {
    background: var(--code-bg);
    padding: 1em 1.2em;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid var(--border);
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid var(--coffee);
    background: rgba(245, 166, 35, 0.06);
    padding: 0.6em 1em;
    margin: 1em 0;
    color: var(--muted);
  }
  blockquote > p:first-child { margin-top: 0; }
  blockquote > p:last-child { margin-bottom: 0; }
  table { border-collapse: collapse; margin: 1em 0; width: 100%; }
  th, td { border: 1px solid var(--border); padding: 0.5em 0.8em; text-align: left; }
  th { background: var(--code-bg); color: var(--coffee); }
  hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }
  ul li { margin: 0.3em 0; }
  .back {
    position: fixed;
    top: 1rem;
    left: 1rem;
    background: var(--code-bg);
    border: 1px solid var(--border);
    color: var(--fg);
    padding: 0.4em 0.8em;
    border-radius: 6px;
    text-decoration: none;
    font-size: 0.9em;
  }
  .back:hover { color: var(--coffee); }
`;

function htmlPage(title, body) {
  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>${cssReset}</style>
</head>
<body>
  <a href="javascript:history.back()" class="back">← Back to slides</a>
  ${body}
</body>
</html>`;
}

await mkdir(publicDir, { recursive: true });

for (const { src, out, title } of docs) {
  const md = await readFile(resolve(repoRoot, src), 'utf8');
  const html = marked.parse(md);
  const outPath = resolve(publicDir, out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, htmlPage(title, html));
  console.log(`✓ ${out}`);
}
