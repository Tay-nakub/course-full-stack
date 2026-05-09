# 🔧 Pre-Course Setup Checklist

**Audience:** **student-facing**

> **Why this matters**: ถ้า Session 1 ยังไม่ install — เสียเวลา 30+ นาที. ทำล่วงหน้าให้พร้อม → 100% ของเวลาคลาสคือเรียน

**Time to complete**: ~60-90 นาที (ครั้งแรกเท่านั้น)

---

## 🎯 Quick Status Check

ตอบ ✅ ทุกข้อก่อนเริ่ม Week 1:

- [ ] OS รองรับ: macOS / Linux native, **หรือ** Windows + WSL2 Ubuntu
- [ ] Node.js v20+ ติดตั้งแล้ว
- [ ] pnpm v9+ ติดตั้งแล้ว
- [ ] Git ติดตั้งแล้ว + config user.name/email
- [ ] VS Code (or equivalent) + 4 essential extensions
- [ ] GitHub account + SSH key configured
- [ ] Test commands ผ่านทุกตัว (ดู §[Verification](#-verification))
- [ ] (Week 6+) Docker Desktop installed (จะแจ้งก่อน Week 5)

---

## 1️⃣ Operating System

### macOS (recommended)
- macOS 12+ (Monterey or later)
- ทุกอย่าง native — ไม่ต้องการ extra setup

### Linux (recommended)
- Ubuntu 22.04+ / Debian 12 / Fedora 38+
- ทุกอย่าง native

### Windows
- ❌ **ห้ามใช้ Windows native** — Docker, terminal commands, npm scripts จะมี edge cases
- ✅ ใช้ **WSL2 + Ubuntu 22.04** (recommended)
- 📖 **Step-by-step guide:** [docs/student/setup-windows.md](../../student/setup-windows.md) — install WSL2 + nvm + Docker Desktop + VS Code (with screenshots + troubleshooting)
- Quick setup: PowerShell (Admin) → `wsl --install -d Ubuntu-22.04` → restart → ทำตาม guide

---

## 2️⃣ Node.js v20+

### Why v20?
Next.js 15 + NestJS ต้องการ Node 20 LTS ขึ้นไป

### Install (recommended: version manager)

**macOS / Linux / WSL2** — ใช้ `fnm` (Fast Node Manager):
```bash
curl -fsSL https://fnm.vercel.app/install | bash
# Restart terminal
fnm install 20
fnm use 20
fnm default 20
```

**Alternative**: nvm (older but works)
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Verify
```bash
node --version
# Expected: v20.x.x or higher
```

---

## 3️⃣ pnpm v9+

### Why pnpm?
- Faster install (parallel + symlink)
- Strict (กัน phantom dependencies)
- Industry trend สำหรับ monorepo

### Install (recommended: corepack)

```bash
# Corepack ติดตั้งมากับ Node 20+
corepack enable
corepack prepare pnpm@latest --activate
```

**Alternative**: npm install
```bash
npm install -g pnpm@9
```

### Verify
```bash
pnpm --version
# Expected: 9.x.x
```

### Optional: Setup faster mirror (ถ้าอยู่ในไทย)
```bash
pnpm config set registry https://registry.npmmirror.com
```

---

## 4️⃣ Git

### Install
- **macOS**: ติดมากับ Xcode Command Line Tools — `xcode-select --install`
- **Linux**: `sudo apt install git` (Debian/Ubuntu) หรือ `sudo dnf install git` (Fedora)
- **WSL2 Ubuntu**: `sudo apt update && sudo apt install git`

### Configure
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"     # ถ้าใช้ VS Code
```

### Verify
```bash
git --version
# Expected: git version 2.40+ (older may work but recommend latest)
git config --global user.name
git config --global user.email
```

---

## 5️⃣ VS Code (or equivalent)

### Install
[Download VS Code](https://code.visualstudio.com/)

> **Other editors OK**: Cursor, Webstorm, Zed, Vim/Neovim — ใช้ได้แต่ recording/screenshots จะเป็น VS Code

### Essential Extensions (install ทุกตัว)

| Extension | Why |
|---|---|
| **ESLint** | Catch lint errors ใน editor |
| **Prettier** | Format on save (consistent style) |
| **Tailwind CSS IntelliSense** | Autocomplete + class hover docs |
| **Prisma** | Syntax highlight + format `.prisma` files (Week 2+) |

### Recommended (ไม่บังคับ แต่ช่วยมาก)

| Extension | Why |
|---|---|
| **Error Lens** | แสดง error inline (ไม่ต้องเปิด Problems panel) |
| **Pretty TypeScript Errors** | TS error อ่านง่ายขึ้น |
| **GitLens** | Git blame + history ใน editor |
| **Code Spell Checker** | กัน typo ใน variable names |

### Settings (recommended `settings.json`)

`Cmd+Shift+P` → `Preferences: Open User Settings (JSON)` → เพิ่ม:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true,
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## 6️⃣ GitHub Account + SSH Key

### Account
1. Sign up at https://github.com (ถ้ายังไม่มี)
2. Verify email

### SSH Key (สำหรับ push code โดยไม่ต้องใส่ password)

```bash
# Generate key (ใช้ default location)
ssh-keygen -t ed25519 -C "your-email@example.com"
# Press Enter ทุกอย่าง (no passphrase OK สำหรับ dev)

# Copy public key
cat ~/.ssh/id_ed25519.pub
```

จากนั้น:
1. ไปที่ https://github.com/settings/keys
2. Click "New SSH key"
3. Title: "MacBook Pro" (or device name)
4. Paste public key
5. Save

### Test SSH
```bash
ssh -T git@github.com
# Expected: "Hi <username>! You've successfully authenticated..."
```

---

## 7️⃣ Terminal (Optional but Recommended)

### Better Terminal Apps

| Platform | Recommended |
|---|---|
| macOS | [iTerm2](https://iterm2.com) (free) หรือ [Warp](https://warp.dev) |
| Windows + WSL | [Windows Terminal](https://aka.ms/terminal) |
| Linux | Default GNOME/KDE terminal OK, หรือ [Alacritty](https://alacritty.org) |

### Better Shell

```bash
# Install Oh My Zsh (macOS/Linux)
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Better Font (สำหรับ code readability)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) (free, recommended)
- [Fira Code](https://github.com/tonsky/FiraCode) (alt — ligatures)

---

## 8️⃣ Docker (Week 5+ — install ก่อน Week 5)

> **ไม่ต้อง install ตอนนี้** ถ้ายังไม่ถึง Week 5. Instructor จะแจ้งล่วงหน้า

### When ready:

**macOS / Windows**: [Docker Desktop](https://www.docker.com/products/docker-desktop) — ฟรี

**Linux**: Docker Engine + Compose
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Logout + login เพื่อให้ group มีผล
```

### Verify (when installed)
```bash
docker --version
docker compose version
docker run hello-world
```

---

## ✅ Verification

รันทุกคำสั่ง — ทุกตัวต้องสำเร็จ:

```bash
# Node 20+
node --version

# pnpm 9+
pnpm --version

# Git
git --version
git config --global user.name
git config --global user.email

# GitHub SSH
ssh -T git@github.com

# Sandbox install test (สำคัญ — verify pnpm registry ถึง)
mkdir /tmp/pnpm-test && cd /tmp/pnpm-test
pnpm init -y
pnpm add lodash
node -e "console.log(require('lodash').VERSION)"
cd ~ && rm -rf /tmp/pnpm-test

# (Week 5+ only) Docker
docker --version
docker run hello-world
```

ถ้าทุกตัวผ่าน → คุณ **พร้อมเริ่ม Week 1** 🎉

---

## 🆘 Common Issues

### `pnpm: command not found`
- รัน `corepack enable` แล้วเปิด terminal ใหม่
- หรือ `npm install -g pnpm@9` ตรงๆ

### `permission denied (publickey)` ตอน clone GitHub
- SSH key ไม่ได้ add ใน GitHub
- Check: `ssh -T git@github.com` ต้องบอก "Hi <username>"

### `pnpm install` ช้ามาก / hang
- เปลี่ยน registry: `pnpm config set registry https://registry.npmmirror.com`
- เช็ค Internet (ลอง `curl -I https://registry.npmjs.org`)

### `node` version ผิด
- ใช้ fnm/nvm: `fnm use 20` (หรือ `nvm use 20`)
- Restart terminal

### Windows: บอกว่า command ไม่มีใน WSL
- เปิด **Ubuntu** terminal (ไม่ใช่ PowerShell/cmd)
- ทำใน home folder: `cd ~`

### VS Code ใน WSL2 ไม่ render ดี
- Install extension "WSL" ของ Microsoft
- Open project: `code .` จาก WSL terminal

---

## 📝 Confirm Pre-Course Complete

ก่อน Week 1 — โพสต์ใน course channel:

```
✅ Pre-course checklist done!

OS: <macOS Sonoma / Ubuntu 22.04 WSL2 / etc>
Node: <v20.x.x>
pnpm: <9.x.x>
Git user: <your-name>
GitHub SSH: ✅
Verification commands: all passed

Ready for Week 1!
```

> Instructor จะ confirm + พร้อมเจอใน session แรก

---

## 🔮 Optional Pre-Reading

ถ้ามีเวลาก่อน Week 1 — อ่านเล่นๆ:

| Topic | Resource | Time |
|---|---|---|
| TypeScript essentials | [TypeScript Handbook — Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html) | 30 min |
| Modern React (no need to learn class components) | [react.dev — Quick Start](https://react.dev/learn) | 30 min |
| Next.js App Router intro | [Next.js Docs — App Router intro](https://nextjs.org/docs/app) | 20 min |
| Git basics review | [Pro Git — Chapter 2](https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository) | 30 min |

> **Don't pre-learn React deeply** — คอร์สเริ่มจาก zero. ถ้าเรียน React ก่อนล่วงหน้า อาจไป pattern ที่ไม่ใช่ App Router

---

🚀 **Pre-course done? See you in Week 1!**

---

## 📚 Related Guides

- 🪟 [Windows Setup (WSL2 + nvm + Docker Desktop + VS Code)](../../student/setup-windows.md) — full step-by-step
- 🏗️ [Monorepo Setup (clone → install → dev)](../../student/setup-monorepo.md) — what to do AFTER tools are installed
- 🎬 [Week 1 Slides](../../slides/week-1/) — `npm install && npm run dev`
