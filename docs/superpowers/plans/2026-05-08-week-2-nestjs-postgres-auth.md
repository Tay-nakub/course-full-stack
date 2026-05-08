# Week 2 — NestJS + Postgres + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง NestJS API server พร้อม Postgres ใน Docker, มี `/auth/register`, `/auth/login`, `/healthz` endpoints ทำงานได้, ใช้ Prisma ORM + JWT auth + Zod validation

**Architecture:** เพิ่ม `apps/api` (NestJS) ใน monorepo เดิมที่มี `apps/web`. สร้าง `packages/shared` สำหรับ Zod schemas ที่ FE/BE ใช้ร่วมกัน. Postgres รัน Docker Compose ใน dev. JWT issued จาก NestJS, FE จะใช้ใน Week 3+

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, Docker Compose, bcrypt, jsonwebtoken, nestjs-zod, Vitest

**Spec Reference:** [course design spec § Week 2](../specs/2026-05-08-fullstack-coffee-shop-course-design.md)

**Pre-requisites:**
- Week 1 complete (monorepo + apps/web)
- Docker Desktop installed (`docker --version`, `docker compose version`)

---

## File Structure (เป้าหมายเมื่อจบ Week 2)

```
course-full-stack/
├── apps/
│   ├── web/                        ← จาก Week 1
│   └── api/                        ← ⭐ ใหม่
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/
│       │   │   └── env.ts          ← Zod env validation
│       │   ├── prisma/
│       │   │   ├── prisma.service.ts
│       │   │   └── prisma.module.ts
│       │   ├── auth/
│       │   │   ├── auth.module.ts
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.service.spec.ts
│       │   │   ├── jwt.strategy.ts
│       │   │   ├── jwt-auth.guard.ts
│       │   │   ├── roles.guard.ts
│       │   │   └── decorators/
│       │   │       ├── roles.decorator.ts
│       │   │       └── current-user.decorator.ts
│       │   └── health/
│       │       ├── health.module.ts
│       │       └── health.controller.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/
│       │   └── jest-e2e.json (ถ้ามี — ตอนนี้ใช้ Vitest)
│       ├── vitest.config.ts
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── package.json
│       └── Dockerfile (Week 6 ค่อยทำ)
│
├── packages/
│   └── shared/                     ← ⭐ ใหม่
│       ├── src/
│       │   ├── index.ts
│       │   ├── schemas/
│       │   │   └── auth.ts         ← LoginSchema, RegisterSchema
│       │   └── types/
│       │       └── user.ts         ← Role enum
│       ├── tsconfig.json
│       └── package.json
│
├── infra/
│   └── docker-compose.dev.yml      ← ⭐ ใหม่ (Postgres only)
│
└── (root files เดิม + อัปเดต turbo.json)
```

---

## Tasks

### Task 1: Add `packages/shared` for FE/BE Schema Sharing

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/types/user.ts`

> 🎓 **Concept**: เริ่ม Week 2 ด้วยการสร้าง `packages/shared` ก่อน → schemas จะใส่ที่นี่ตั้งแต่แรก ใช้ทั้ง FE+BE

- [ ] **Step 1.1: สร้าง `packages/shared/package.json`**

```json
{
  "name": "@coffee/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  }
}
```

> 📝 **Note**: ใช้ `"main": "./src/index.ts"` (TS file) แทน build dist — โปรเจกต์เดียวกันใน monorepo ใช้ TypeScript path mapping ผ่าน Turbopack/tsc โดยตรงได้, ไม่ต้อง pre-build

- [ ] **Step 1.2: สร้าง `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 1.3: สร้าง User Role enum**

Create file `packages/shared/src/types/user.ts`:

```ts
export const ROLES = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof ROLES)[number];
```

> 🎓 **Concept**: `as const` + indexed access = type-safe enum without `enum` keyword. JSON-serializable, treeshakable

- [ ] **Step 1.4: สร้าง index.ts**

Create file `packages/shared/src/index.ts`:

```ts
export * from './types/user';
```

- [ ] **Step 1.5: Install + verify**

```bash
pnpm install
pnpm --filter @coffee/shared typecheck
```
Expected: ทั้งสอง command pass

- [ ] **Step 1.6: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add @coffee/shared package with Role type"
```

---

### Task 2: Scaffold NestJS API in `apps/api`

**Files:**
- Create: `apps/api/` (entire NestJS scaffold)

- [ ] **Step 2.1: Install Nest CLI globally (one-time)**

```bash
pnpm add -g @nestjs/cli
nest --version
```

> 📝 **Alternative**: ใช้ `pnpm dlx @nestjs/cli` ทุกครั้ง ก็ได้ (no global install)

- [ ] **Step 2.2: Generate NestJS app**

```bash
cd apps
nest new api --package-manager pnpm --skip-git
cd ..
```

> 📝 ตอบ "pnpm" ถ้าถาม. `--skip-git` กัน NestJS init git ใหม่ (เรามี monorepo git อยู่แล้ว)

- [ ] **Step 2.3: ปรับ `apps/api/tsconfig.json`**

แทนที่ทั้งไฟล์:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "incremental": true,
    "verbatimModuleSyntax": false,
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*", "test/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

> 🎓 **Why these overrides**:
> - `CommonJS` + `experimentalDecorators` + `emitDecoratorMetadata` = NestJS requirements
> - `verbatimModuleSyntax: false` = NestJS ใช้ runtime metadata จาก types
> - `strictPropertyInitialization: false` = injected dependencies (e.g. `@Inject()`) ไม่ต้อง initial value

- [ ] **Step 2.4: ปรับ `apps/api/package.json` scripts ให้ Turbo รู้จัก**

แก้ section `"scripts"`:
```json
"scripts": {
  "dev": "nest start --watch",
  "build": "nest build",
  "start": "node dist/main",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit",
  "lint": "eslint \"{src,test}/**/*.ts\" --fix"
}
```

- [ ] **Step 2.5: ตั้ง port + กลับมา /healthz placeholder**

แก้ `apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');     // ทุก route จะ prefix /api
  app.enableCors();
  await app.listen(4000);
  console.log(`🚀 API ready on http://localhost:4000/api`);
}

bootstrap();
```

> 🎓 **Concept**: `setGlobalPrefix('api')` ตรงกับ Caddy reverse proxy ใน Week 6 — single domain, FE ที่ `/`, API ที่ `/api/*`

- [ ] **Step 2.6: รัน + verify**

```bash
pnpm install
pnpm --filter @coffee/api dev
```

ใน browser/curl:
```bash
curl http://localhost:4000/api
# Expected: "Hello World!" (NestJS default)
```

- [ ] **Step 2.7: Commit**

```bash
git add apps/api
git commit -m "feat(api): scaffold NestJS app with /api prefix on port 4000"
```

---

### Task 3: Postgres in Docker Compose

**Files:**
- Create: `infra/docker-compose.dev.yml`
- Modify: `.env.example` (root)
- Modify: `apps/api/.env.example`

- [ ] **Step 3.1: สร้าง `infra/docker-compose.dev.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: coffee-postgres-dev
    environment:
      POSTGRES_DB: coffee
      POSTGRES_USER: coffee
      POSTGRES_PASSWORD: coffee_dev_password
    ports:
      - '5432:5432'
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'coffee']
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_dev_data:
```

> 🎓 **Concept**:
> - `postgres:16-alpine` = lightweight image (~80 MB)
> - `volumes:` named volume → data persist หลัง container restart
> - `healthcheck` → ใช้ใน Prisma migration container ภายหลัง
> - dev password OK ที่ commit (prod จะใช้ env secret)

- [ ] **Step 3.2: เพิ่ม root scripts สำหรับ DB**

แก้ root `package.json`:

```json
"scripts": {
  ...,
  "db:up": "docker compose -f infra/docker-compose.dev.yml up -d",
  "db:down": "docker compose -f infra/docker-compose.dev.yml down",
  "db:logs": "docker compose -f infra/docker-compose.dev.yml logs -f postgres"
}
```

- [ ] **Step 3.3: Start Postgres**

```bash
pnpm db:up
```

Expected: Container `coffee-postgres-dev` running

Verify:
```bash
docker ps | grep coffee-postgres
docker exec coffee-postgres-dev pg_isready -U coffee
```

- [ ] **Step 3.4: สร้าง `apps/api/.env.example`**

```
DATABASE_URL="postgresql://coffee:coffee_dev_password@localhost:5432/coffee?schema=public"
JWT_SECRET="change-me-in-production-min-32-chars-recommended"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=4000
```

- [ ] **Step 3.5: สร้าง `.env` (จริง — ห้าม commit)**

```bash
cp apps/api/.env.example apps/api/.env
```

ตรวจ `.gitignore` ที่ root มี `.env` แล้ว (จาก Week 1) → safe

- [ ] **Step 3.6: Commit**

```bash
git add infra/docker-compose.dev.yml apps/api/.env.example package.json
git commit -m "feat(infra): add Postgres dev docker-compose with healthcheck"
```

---

### Task 4: Install Prisma + Define User Schema

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/package.json`

- [ ] **Step 4.1: Install Prisma**

```bash
cd apps/api
pnpm add -D prisma
pnpm add @prisma/client
cd ../..
```

- [ ] **Step 4.2: Initialize Prisma**

```bash
cd apps/api
pnpm prisma init --datasource-provider postgresql
cd ../..
```

> 📝 **Note**: `prisma init` สร้าง `prisma/schema.prisma` + `.env` (มี `DATABASE_URL` placeholder). เราใช้ `.env` ที่สร้างเองแล้ว — ลบ DATABASE_URL ที่ Prisma init เพิ่ม ถ้ามี duplicate

- [ ] **Step 4.3: เขียน schema.prisma**

แทนที่ `apps/api/prisma/schema.prisma` ทั้งไฟล์:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  ADMIN
  STAFF
}
```

> 🎓 **Concepts**:
> - `cuid()` = collision-resistant unique ID (URL-safe, sortable-ish)
> - `@@map("users")` = table name lowercase (Postgres convention)
> - `Role` enum sync กับ TS enum ใน `@coffee/shared`

- [ ] **Step 4.4: เพิ่ม script สำหรับ Prisma**

แก้ `apps/api/package.json`:
```json
"scripts": {
  ...,
  "prisma:generate": "prisma generate",
  "prisma:migrate": "prisma migrate dev",
  "prisma:studio": "prisma studio"
}
```

- [ ] **Step 4.5: รัน migration ครั้งแรก**

ตรวจว่า Postgres ยังรันอยู่ (`pnpm db:up`), แล้ว:

```bash
cd apps/api
pnpm prisma:migrate --name init
cd ../..
```

ตอบชื่อ migration: `init` → enter

Expected:
- โฟลเดอร์ `prisma/migrations/<timestamp>_init/` ถูกสร้าง
- ตาราง `users` ใน Postgres
- Prisma Client generate ที่ `node_modules/@prisma/client`

Verify ใน Postgres:
```bash
docker exec -it coffee-postgres-dev psql -U coffee -d coffee -c "\dt"
# Expected: users + _prisma_migrations
```

- [ ] **Step 4.6: Commit**

```bash
git add apps/api/prisma apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add Prisma with User+Role schema and initial migration"
```

---

### Task 5: PrismaService NestJS Module

**Files:**
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 5.1: สร้าง PrismaService**

Create file `apps/api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

> 🎓 **Concept**: `extends PrismaClient` = service ตัวเดียวกับ client. NestJS lifecycle hooks (`onModuleInit/Destroy`) ผูกกับ `$connect/$disconnect`

- [ ] **Step 5.2: สร้าง PrismaModule (global)**

Create file `apps/api/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

> 🎓 **Concept**: `@Global()` = ทุก module ใช้ PrismaService ได้โดยไม่ต้อง import. ใช้ pattern นี้สำหรับ singleton infrastructure (DB, logger, redis)

- [ ] **Step 5.3: Register ใน AppModule**

แก้ `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 5.4: Install @nestjs/config**

```bash
cd apps/api
pnpm add @nestjs/config
cd ../..
```

- [ ] **Step 5.5: Verify**

```bash
pnpm --filter @coffee/api dev
```
Expected: NestJS เริ่ม → log "🚀 API ready" — Prisma connect สำเร็จ (ถ้า disconnect → จะ error)

- [ ] **Step 5.6: Commit**

```bash
git add apps/api/src apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add global PrismaModule with lifecycle-managed service"
```

---

### Task 6: Auth Module — Schemas + DTOs in `packages/shared`

**Files:**
- Create: `packages/shared/src/schemas/auth.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 6.1: สร้าง auth schemas**

Create file `packages/shared/src/schemas/auth.ts`:

```ts
import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องอย่างน้อย 8 ตัว'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthTokenSchema = z.object({
  accessToken: z.string(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(['ADMIN', 'STAFF']),
  }),
});
export type AuthTokenResponse = z.infer<typeof AuthTokenSchema>;
```

- [ ] **Step 6.2: Export จาก index**

แก้ `packages/shared/src/index.ts`:
```ts
export * from './types/user';
export * from './schemas/auth';
```

- [ ] **Step 6.3: Verify**

```bash
pnpm --filter @coffee/shared typecheck
```
Expected: pass

- [ ] **Step 6.4: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): add auth schemas (Register/Login/AuthToken)"
```

---

### Task 7: Auth Module — Register Endpoint

**Files:**
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.service.ts`

- [ ] **Step 7.1: Install dependencies**

```bash
cd apps/api
pnpm add bcrypt @nestjs/jwt @nestjs/passport passport passport-jwt nestjs-zod
pnpm add -D @types/bcrypt @types/passport-jwt
cd ../..
```

อย่าลืม install `@coffee/shared` ใน apps/api workspace:

แก้ `apps/api/package.json`, เพิ่ม dependency:
```json
"dependencies": {
  ...,
  "@coffee/shared": "workspace:*"
}
```

แล้วรัน:
```bash
pnpm install
```

- [ ] **Step 7.2: สร้าง AuthService — register method**

Create file `apps/api/src/auth/auth.service.ts`:

```ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterInput, LoginInput, AuthTokenResponse } from '@coffee/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthTokenResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('อีเมลนี้ถูกใช้แล้ว');
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        role: 'STAFF',  // default — admin promote ทีหลังด้วย script
      },
    });

    return this.issueToken(user);
  }

  // login + issueToken จะเขียนใน Task 8
  private issueToken(user: { id: string; email: string; role: string }): AuthTokenResponse {
    const accessToken = this.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as 'ADMIN' | 'STAFF',
      },
    };
  }
}
```

> 🎓 **Concept**:
> - `bcrypt.hash(plain, 10)` — 10 rounds = good default (security vs perf)
> - `ConflictException` = HTTP 409 (NestJS exception filter handle ให้)
> - JWT payload: `sub` (subject) ใส่ user ID — JWT standard

- [ ] **Step 7.3: สร้าง AuthController — register endpoint**

Create file `apps/api/src/auth/auth.controller.ts`:

```ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { RegisterSchema, type RegisterInput } from '@coffee/shared';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(RegisterSchema)) input: RegisterInput) {
    return this.authService.register(input);
  }
}
```

> 🎓 **Concept**:
> - `@Controller('auth')` + global prefix `'api'` → URL = `/api/auth/register`
> - `ZodValidationPipe(Schema)` = validate body, throw 400 ถ้าไม่ผ่าน
> - `@HttpCode(201)` = override default 201 (already default for POST in NestJS — explicit เพื่อชัดเจน)

- [ ] **Step 7.4: สร้าง AuthModule**

Create file `apps/api/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 7.5: Register AuthModule**

แก้ `apps/api/src/app.module.ts`, เพิ่ม `AuthModule` ใน imports:

```ts
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
  ],
  ...
})
```

- [ ] **Step 7.6: ทดสอบ register**

รัน api:
```bash
pnpm --filter @coffee/api dev
```

ใช้ curl หรือ Postman:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffee.com","password":"password123"}'
```

Expected response (201):
```json
{
  "accessToken": "eyJhbGciOiJ...",
  "user": {
    "id": "c...",
    "email": "admin@coffee.com",
    "role": "STAFF"
  }
}
```

ลองส่งข้อมูลผิด:
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"short"}'
```
Expected: 400 Bad Request + Zod error messages

- [ ] **Step 7.7: Commit**

```bash
git add apps/api/src apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add /api/auth/register with bcrypt+JWT and Zod validation"
```

---

### Task 8: Auth Module — Login Endpoint

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 8.1: เพิ่ม login method ใน AuthService**

แก้ `apps/api/src/auth/auth.service.ts`, เพิ่ม method:

```ts
async login(input: LoginInput): Promise<AuthTokenResponse> {
  const user = await this.prisma.user.findUnique({
    where: { email: input.email },
  });
  if (!user) {
    throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  }

  return this.issueToken(user);
}
```

> 🎓 **Security note**: ใช้ message เดียวกันทั้งสองเคส (user ไม่มี + password ผิด) → ป้องกัน user enumeration attack

- [ ] **Step 8.2: เพิ่ม login endpoint ใน controller**

แก้ `apps/api/src/auth/auth.controller.ts`:

```ts
import { LoginSchema, type LoginInput, RegisterSchema, type RegisterInput } from '@coffee/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(new ZodValidationPipe(RegisterSchema)) input: RegisterInput) {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(new ZodValidationPipe(LoginSchema)) input: LoginInput) {
    return this.authService.login(input);
  }
}
```

- [ ] **Step 8.3: ทดสอบ login**

```bash
# ใช้ user ที่ register จาก Task 7
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffee.com","password":"password123"}'
```
Expected: 200 OK + accessToken

Test invalid:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffee.com","password":"wrong"}'
```
Expected: 401 Unauthorized + error message

- [ ] **Step 8.4: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(api): add /api/auth/login endpoint with secure error messages"
```

---

### Task 9: JWT Auth Guard + Roles Guard + Decorators

**Files:**
- Create: `apps/api/src/auth/jwt.strategy.ts`
- Create: `apps/api/src/auth/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/roles.guard.ts`
- Create: `apps/api/src/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/auth/decorators/current-user.decorator.ts`
- Modify: `apps/api/src/auth/auth.module.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

- [ ] **Step 9.1: JWT Strategy**

Create file `apps/api/src/auth/jwt.strategy.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

- [ ] **Step 9.2: JWT Auth Guard**

Create file `apps/api/src/auth/jwt-auth.guard.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 9.3: Roles decorator**

Create file `apps/api/src/auth/decorators/roles.decorator.ts`:

```ts
import { SetMetadata } from '@nestjs/common';
import type { Role } from '@coffee/shared';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 9.4: Roles Guard**

Create file `apps/api/src/auth/roles.guard.ts`:

```ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@coffee/shared';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;     // no @Roles() = open
    }

    const { user } = context.switchToHttp().getRequest<{ user?: { role: Role } }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึง resource นี้');
    }
    return true;
  }
}
```

- [ ] **Step 9.5: Current User decorator**

Create file `apps/api/src/auth/decorators/current-user.decorator.ts`:

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Role } from '@coffee/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return request.user;
  },
);
```

- [ ] **Step 9.6: Register strategy ใน AuthModule**

แก้ `apps/api/src/auth/auth.module.ts`, เพิ่ม `JwtStrategy`:

```ts
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({...})
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 9.7: เพิ่ม `/auth/me` endpoint (test guard)**

แก้ `apps/api/src/auth/auth.controller.ts`:

```ts
import { Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

// ในตัว class AuthController เพิ่ม:

@Get('me')
@UseGuards(JwtAuthGuard)
async me(@CurrentUser() user: AuthUser) {
  return user;
}

@Get('admin-only')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async adminOnly(@CurrentUser() user: AuthUser) {
  return { message: 'Welcome admin', user };
}
```

- [ ] **Step 9.8: ทดสอบ guards**

Login → ดึง accessToken:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@coffee.com","password":"password123"}' \
  | jq -r '.accessToken')
echo $TOKEN
```

ทดสอบ `/auth/me`:
```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
Expected: 200 + user info

ทดสอบ `/auth/admin-only`:
```bash
curl http://localhost:4000/api/auth/admin-only \
  -H "Authorization: Bearer $TOKEN"
```
Expected: 403 Forbidden (เพราะ user role = STAFF, ไม่ใช่ ADMIN)

> 📝 **Note**: ปลายๆ Week 2 จะมี script promote user เป็น ADMIN — ตอนนี้ test forbidden behavior OK

- [ ] **Step 9.9: Commit**

```bash
git add apps/api/src/auth
git commit -m "feat(api): add JWT strategy, JwtAuthGuard, RolesGuard, decorators"
```

---

### Task 10: Healthcheck + Env Validation + Tests

**Files:**
- Create: `apps/api/src/config/env.ts`
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/auth/auth.service.spec.ts`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/test/setup.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 10.1: Env validation with Zod**

Create file `apps/api/src/config/env.ts`:

```ts
import { z } from 'zod';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    throw new Error(
      `Invalid environment variables:\n${result.error.errors
        .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n')}`,
    );
  }
  return result.data;
}
```

- [ ] **Step 10.2: Wire env validation ใน AppModule**

แก้ `apps/api/src/app.module.ts`:

```ts
import { validateEnv } from './config/env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
  ],
  ...
})
```

- [ ] **Step 10.3: สร้าง HealthModule**

Create file `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('healthz')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'degraded', database: 'disconnected', timestamp: new Date().toISOString() };
    }
  }
}
```

Create file `apps/api/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

ทดสอบ:
```bash
curl http://localhost:4000/api/healthz
# Expected: { "status": "ok", "database": "connected", "timestamp": "..." }
```

- [ ] **Step 10.4: ใช้ Vitest แทน Jest**

ลบ Jest config ที่ NestJS scaffold ใส่ — ใน `apps/api/package.json` ลบ section `"jest": { ... }`

Install Vitest:
```bash
cd apps/api
pnpm add -D vitest @vitest/ui @nestjs/testing
cd ../..
```

- [ ] **Step 10.5: vitest.config.ts**

Create file `apps/api/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@coffee/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
```

- [ ] **Step 10.6: test/setup.ts (empty for now)**

Create file `apps/api/test/setup.ts`:

```ts
// Place to put global test setup
```

- [ ] **Step 10.7: Write AuthService unit tests**

Create file `apps/api/src/auth/auth.service.spec.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: { user: { findUnique: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: 'test-secret-min-32-chars-required-here', signOptions: { expiresIn: '1h' } })],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException ถ้า email มีอยู่แล้ว', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'existing@example.com' });

      await expect(authService.register({ email: 'existing@example.com', password: 'password123' }))
        .rejects.toThrow(ConflictException);
    });

    it('สร้าง user ใหม่และคืน accessToken', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const created = { id: 'cuid1', email: 'new@example.com', password: 'hashed', role: 'STAFF' };
      prisma.user.create.mockResolvedValue(created);

      const result = await authService.register({ email: 'new@example.com', password: 'password123' });

      expect(result.accessToken).toBeDefined();
      expect(result.user).toEqual({ id: 'cuid1', email: 'new@example.com', role: 'STAFF' });
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ email: 'new@example.com', role: 'STAFF' }),
      }));
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException ถ้า user ไม่พบ', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.login({ email: 'noone@example.com', password: 'whatever' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException ถ้า password ผิด', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: '1', email: 'e@e.com', password: hashed, role: 'STAFF',
      });

      await expect(authService.login({ email: 'e@e.com', password: 'wrong-password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('คืน accessToken ถ้า credentials ถูก', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: '1', email: 'e@e.com', password: hashed, role: 'STAFF',
      });

      const result = await authService.login({ email: 'e@e.com', password: 'correct-password' });

      expect(result.accessToken).toBeDefined();
      expect(result.user.email).toBe('e@e.com');
    });
  });
});
```

- [ ] **Step 10.8: รัน tests**

```bash
pnpm --filter @coffee/api test
```
Expected: 5 tests pass

- [ ] **Step 10.9: Commit**

```bash
git add apps/api
git commit -m "feat(api): add env validation, healthcheck, and AuthService tests"
```

---

## Acceptance Criteria — Week 2 Done When:

- [ ] `pnpm db:up` รัน Postgres ได้
- [ ] `pnpm dev` รันทั้ง web + api ผ่าน Turborepo (web port 3000, api port 4000)
- [ ] `curl http://localhost:4000/api/healthz` คืน status: ok
- [ ] `POST /api/auth/register` ใส่ email + password → คืน accessToken + user
- [ ] `POST /api/auth/login` → คืน accessToken
- [ ] `GET /api/auth/me` พร้อม Bearer token → คืน user info
- [ ] `GET /api/auth/admin-only` พร้อม STAFF token → 403 Forbidden
- [ ] `pnpm test` ทั้ง root pass (web 3 tests จาก Week 1 + api 5 tests)
- [ ] `pnpm typecheck` pass ทั้งหมด
- [ ] `packages/shared` มี Zod schemas + Role type ที่ทั้ง FE+BE ใช้ได้
- [ ] Git history สะอาด: ~10 commits, atomic per task

## Self-Review Notes

**Spec coverage:**
- ✅ Week 2 Day 1 (Postgres Docker): Task 3
- ✅ Week 2 Day 2-3 (NestJS basics): Tasks 2, 5
- ✅ Week 2 Day 4-5 (Prisma): Tasks 4, 5
- ✅ Week 2 Day 6-7 (Auth + JWT + Guards): Tasks 6-9
- ✅ Bonus: env validation + healthcheck + tests (Task 10)

**Concepts taught:**
- Docker Compose, Postgres setup, named volumes, healthchecks
- NestJS modules/controllers/providers/DI, lifecycle hooks
- Prisma schema, migrations, client generation
- bcrypt password hashing, JWT issuing/validation, Passport strategies
- Guards, custom decorators, Reflector
- Zod env validation, ZodValidationPipe

**Out of Week 2 scope:**
- ❌ Refresh token rotation (Tier 1 self-study)
- ❌ Email verification (out of scope)
- ❌ E2E tests for HTTP endpoints (Vitest unit only — saves time)
- ❌ Seed script (Week 3 with menu data)
- ❌ Admin promote script (Week 3 — แก้ใน DB ตรงๆ ก่อน)

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-08-week-2-nestjs-postgres-auth.md`. สองตัวเลือก execution:**

**1. Subagent-Driven** — fresh subagent ทำทีละ task, review ระหว่าง
**2. Inline Execution** — รันใน session นี้ตาม executing-plans
**3. Self-execute (สอนคลาส)** ⭐ — instructor ใช้เป็น demo source-of-truth, student ทำตาม

**Recommendation สำหรับ instructor**: Option 3 — Plan นี้คือ "demo script" ที่ instructor follow ใน live class. ทุก code block พร้อมพิมพ์, ทุก expected output ตรวจสอบได้
