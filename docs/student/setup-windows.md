# 🪟 Windows Setup Guide — Coffee Shop Course

> **Audience:** student-facing
> **Time:** ~90-120 นาที (ครั้งแรกเท่านั้น)
> **Target:** Windows 10 (build 19041+) หรือ Windows 11

คอร์สนี้ใช้ **Linux toolchain** (Node, pnpm, Docker, Bash). Windows native มี edge cases เยอะมาก — เราเลยใช้ **WSL2 + Ubuntu** เป็น runtime + Docker Desktop + VS Code.

---

## 📋 ภาพรวมที่จะติดตั้ง

```
┌─────────────────── Windows 11 ───────────────────┐
│                                                   │
│   VS Code  ←──── (Remote-WSL extension)           │
│      │                                            │
│      ▼                                            │
│   ┌──────── WSL2 Ubuntu 22.04 ────────┐          │
│   │                                    │          │
│   │   nvm → Node 20                    │          │
│   │   pnpm 9                           │          │
│   │   Git                              │          │
│   │   (project code อยู่ตรงนี้)        │          │
│   │                                    │          │
│   └────────────────────────────────────┘          │
│                                                   │
│   Docker Desktop (uses WSL2 backend)              │
│                                                   │
└───────────────────────────────────────────────────┘
```

**กฎทอง:** code/terminal ทุกอย่าง **อยู่ใน WSL2 Ubuntu**. Windows native (PowerShell, CMD) ใช้แค่เปิด Docker Desktop และ launch WSL.

---

## ✅ Quick Status (ตรวจก่อนเริ่ม Week 1)

ใน **Ubuntu terminal** (ไม่ใช่ PowerShell):

```bash
node --version    # v20.x.x
pnpm --version    # 9.x.x
git --version     # git 2.x
docker --version  # Docker version 24+ (ใช้จาก Docker Desktop)
code --version    # 1.90+ (เปิดผ่าน Remote-WSL)
```

ถ้าผ่านทุกตัว → ข้ามไปดู [§9 Verification](#9-verification-สุดท้าย).

---

## 1️⃣ Install WSL2 + Ubuntu

WSL2 = Linux kernel ฝังใน Windows. คือ Linux จริงๆ ทำให้ command, path, ไฟล์ behaviour ตรงกับ macOS/Linux.

### ติดตั้ง

1. **เปิด PowerShell แบบ Administrator** (Right-click → Run as administrator)
2. รัน:
   ```powershell
   wsl --install -d Ubuntu-22.04
   ```
3. รอ download + reboot Windows
4. เปิด Windows ขึ้นใหม่ → Ubuntu จะ launch อัตโนมัติ
5. ตั้ง **Linux username** + **password** (จำให้ดี — ใช้บ่อย)

### ถ้า `wsl --install` error

อาจต้องเปิด features manually:

1. Settings → "Turn Windows features on or off"
2. ✅ Windows Subsystem for Linux
3. ✅ Virtual Machine Platform
4. Restart
5. PowerShell (Admin):
   ```powershell
   wsl --set-default-version 2
   wsl --install -d Ubuntu-22.04
   ```

### Verify

```powershell
# ใน PowerShell
wsl --list --verbose
# Expected: Ubuntu-22.04   Running   2
```

```bash
# ใน Ubuntu terminal (เปิดผ่าน Start → "Ubuntu")
uname -a
# Expected: Linux ... x86_64 GNU/Linux
```

> 💡 **Pro tip:** Install [Windows Terminal](https://aka.ms/terminal) (Microsoft Store) — มี tabs, profiles, สวยกว่าเยอะ. ตั้ง default profile เป็น "Ubuntu".

---

## 2️⃣ Update Ubuntu + Essentials

ใน **Ubuntu terminal**:

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install build essentials (compile native deps later)
sudo apt install -y build-essential curl wget unzip git
```

> ⏱ ครั้งแรก ~5-10 นาที.

### Verify

```bash
git --version    # git version 2.x
gcc --version    # gcc (Ubuntu) 11+
```

---

## 3️⃣ Install nvm + Node 20

`nvm` = Node Version Manager. ทำให้สลับ Node version ได้ง่าย.

### ติดตั้ง nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell (หรือปิด/เปิด terminal ใหม่)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### ติดตั้ง Node 20 (LTS)

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Verify

```bash
node --version    # v20.x.x
nvm current       # v20.x.x
which node        # /home/<user>/.nvm/versions/node/v20.x.x/bin/node
```

> ⚠️ **อย่าใช้ `apt install nodejs`** — มันได้ Node เก่าและขัดกับ nvm.

---

## 4️⃣ Install pnpm 9

```bash
# Corepack มากับ Node 20 แล้ว — เปิดมัน
corepack enable
corepack prepare pnpm@latest --activate
```

### Verify

```bash
pnpm --version    # 9.x.x
```

### (Optional) Faster mirror สำหรับไทย

```bash
pnpm config set registry https://registry.npmmirror.com
```

---

## 5️⃣ Configure Git

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"   # เดี๋ยว install code ก่อน
```

### Generate SSH Key (สำหรับ push GitHub)

```bash
ssh-keygen -t ed25519 -C "your-email@example.com"
# กด Enter ทุกอย่าง (ไม่ต้องตั้ง passphrase สำหรับ dev)

cat ~/.ssh/id_ed25519.pub
```

Copy public key → ไปที่ **https://github.com/settings/keys** → "New SSH key" → paste → Save.

### Test

```bash
ssh -T git@github.com
# Expected: "Hi <username>! You've successfully authenticated..."
```

---

## 6️⃣ Install Docker Desktop (Windows side)

Docker Desktop รันบน Windows แต่ใช้ **WSL2 backend** — Linux containers ใช้ได้เลย.

### Download + Install

1. Download: https://www.docker.com/products/docker-desktop
2. Run installer
3. ✅ ติ๊ก **"Use WSL 2 instead of Hyper-V"** (default in modern installer)
4. Restart Windows
5. เปิด **Docker Desktop**
6. Settings (gear icon) → **Resources → WSL Integration**:
   - ✅ Enable integration with my default WSL distro
   - ✅ Enable integration with **Ubuntu-22.04**
7. Apply & Restart

### Verify (ใน Ubuntu terminal)

```bash
docker --version           # Docker version 24+
docker compose version     # Docker Compose version v2.x
docker run hello-world     # ✓ Hello from Docker!
```

> ⚠️ Docker Desktop **ต้องเปิดอยู่** ใน Windows ตอนใช้ docker commands ใน WSL. ถ้าไม่เปิด → `Cannot connect to the Docker daemon`.

> 💡 ปรับ resource: Docker Desktop → Settings → Resources → ตั้ง CPU 4, Memory 4GB ขึ้นไปจะ run dev เร็วกว่า.

---

## 7️⃣ Install VS Code + WSL Integration

VS Code เป็น editor ของคอร์ส. Run บน Windows แต่ **edit/run code ที่อยู่ใน WSL2** ผ่าน Remote-WSL extension.

### Install VS Code (Windows side)

1. Download: https://code.visualstudio.com/
2. Run installer
3. ✅ ติ๊ก **"Add to PATH"** (default)
4. ✅ ติ๊ก **"Open with Code"** (Explorer context menu)

### Install WSL Extension

เปิด VS Code → Extensions tab (`Ctrl+Shift+X`) → ค้นหา + install:

| Extension                     | Publisher     | Required                            |
| ----------------------------- | ------------- | ----------------------------------- |
| **WSL**                       | Microsoft     | ✅ — ทำให้ VS Code edit code ใน WSL |
| **ESLint**                    | Microsoft     | ✅ — lint errors                    |
| **Prettier**                  | Prettier      | ✅ — auto-format on save            |
| **Tailwind CSS IntelliSense** | Tailwind Labs | ✅ — class autocomplete             |
| **Prisma**                    | Prisma        | ✅ — `.prisma` file support         |

### Open Project Through WSL

1. ใน **Ubuntu terminal**:
   ```bash
   cd ~
   mkdir -p projects && cd projects
   git clone git@github.com:<you>/course-full-stack.git
   cd course-full-stack
   code .
   ```
2. VS Code จะเปิดและ install "VS Code Server" ใน WSL ครั้งแรก (~30 sec)
3. Status bar ล่างซ้ายต้องแสดง: **"WSL: Ubuntu-22.04"** ← นี่คือสัญญาณว่าทำงานใน WSL ถูก

### Recommended Settings

`Ctrl+Shift+P` → "Preferences: Open User Settings (JSON)" → paste:

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
  "terminal.integrated.defaultProfile.linux": "bash",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## 8️⃣ Where to Put Project Files (สำคัญมาก)

> ❌ **อย่า** clone repo ใน `/mnt/c/Users/...` (Windows filesystem ผ่าน WSL)
> ✅ **clone ใน Linux home folder** เช่น `~/projects/` หรือ `/home/<user>/projects/`

**เหตุผล:** การ access Windows files จาก WSL ช้ามาก (10-100x). Node/pnpm/git ที่อ่าน-เขียนไฟล์เยอะจะหน่วงทันที.

### Setup ที่แนะนำ

```bash
mkdir -p ~/projects
cd ~/projects
# clone, install, dev — ทุกอย่างที่นี่
```

Open VS Code: `code .` จาก folder นั้น — มันจะเปิดผ่าน WSL อัตโนมัติ.

---

## 9️⃣ Verification (สุดท้าย)

รันทุกตัวใน Ubuntu terminal:

```bash
# Versions
node --version              # v20.x
pnpm --version              # 9.x
git --version               # 2.x
docker --version            # 24+
docker compose version      # v2.x

# GitHub auth
ssh -T git@github.com       # "Hi <username>!"

# Docker actually works
docker run hello-world      # "Hello from Docker!"

# pnpm registry reachable
mkdir /tmp/pnpm-test && cd /tmp/pnpm-test
pnpm init -y
pnpm add lodash
node -e "console.log(require('lodash').VERSION)"
cd ~ && rm -rf /tmp/pnpm-test
```

ถ้าทุกอันผ่าน → 🎉 **พร้อมเริ่ม Week 1!**

---

## 🆘 Common Windows Issues

### Docker daemon not running

- เปิด Docker Desktop จาก Windows Start menu — รอ icon เป็นสีเขียว
- ถ้ายัง error: Settings → "Reset to factory defaults"

### `code: command not found` ใน WSL

- ออกจาก WSL → เปิดใหม่
- ถ้ายังไม่ได้: ใน VS Code (Windows) เปิด Command Palette → "Shell Command: Install 'code' command in PATH"

### `Permission denied` ตอน clone

- SSH key ยังไม่ได้ add บน GitHub → ไปที่ https://github.com/settings/keys
- ลอง `ssh -T git@github.com` ก่อนเสมอ

### Slow performance / file watcher errors

- ตรวจ project อยู่ใน `~/...` (Linux home) ไม่ใช่ `/mnt/c/...` (Windows)
- ย้ายโดย: `cp -r /mnt/c/path/to/project ~/projects/`

### `pnpm: command not found` ทั้งที่ install แล้ว

- Reload shell: `source ~/.bashrc` หรือเปิด terminal ใหม่
- ถ้า corepack fail → fallback: `npm install -g pnpm@9`

### `nvm: command not found` หลังเปิด terminal ใหม่

- เพิ่ม config ใน `~/.bashrc` (nvm installer ปกติเพิ่มให้แล้ว — เช็คท้ายไฟล์):
  ```bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  ```

### WSL kernel outdated

- PowerShell (Admin): `wsl --update`
- Restart WSL: `wsl --shutdown` แล้วเปิด Ubuntu ใหม่

### Docker eats too much RAM

- สร้าง `~/.wslconfig` ใน Windows home (`C:\Users\<you>\.wslconfig`):
  ```
  [wsl2]
  memory=6GB
  processors=4
  swap=2GB
  ```
- PowerShell: `wsl --shutdown` แล้วเปิดใหม่

---

## 📝 Confirm Pre-Course Complete

โพสต์ใน course channel ก่อน Week 1:

```
✅ Windows pre-course done!

OS: Windows 11 + WSL2 Ubuntu 22.04
Node: v20.x.x (via nvm)
pnpm: 9.x.x
Git user: <name>
GitHub SSH: ✅
Docker: 24.x via Docker Desktop (WSL2 backend)
VS Code: 1.90+ with WSL extension
All 9 verification commands passed.

Ready for Week 1!
```

---

## 🔗 References

- [WSL Install Docs](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Docker Desktop WSL Backend](https://docs.docker.com/desktop/wsl/)
- [VS Code Remote-WSL](https://code.visualstudio.com/docs/remote/wsl)
- [nvm GitHub](https://github.com/nvm-sh/nvm)
- [Master pre-course-checklist](../instructor/master/pre-course-checklist.md) (general OS-agnostic version)

---

🚀 **Done? See you in Week 1!**
