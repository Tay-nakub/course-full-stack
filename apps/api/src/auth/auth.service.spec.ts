import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret-min-32-chars-required-here',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('throws ConflictException ถ้า email มีอยู่แล้ว', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('สร้าง user ใหม่และคืน accessToken พร้อม hash password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: any) =>
        Promise.resolve({
          id: 'cuid1',
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      );

      const result = await authService.register({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBeDefined();
      expect(result.user).toEqual({
        id: 'cuid1',
        email: 'new@example.com',
        role: 'STAFF',
      });

      // Verify password was hashed (not stored plaintext)
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      const firstCall = prisma.user.create.mock.calls[0];
      if (!firstCall) throw new Error('expected create to be called');
      const callArg = firstCall[0] as {
        data: { email: string; password: string; role: string };
      };
      expect(callArg.data.email).toBe('new@example.com');
      expect(callArg.data.role).toBe('STAFF');
      expect(callArg.data.password).not.toBe('password123');
      const matchesHash = await bcrypt.compare(
        'password123',
        callArg.data.password,
      );
      expect(matchesHash).toBe(true);
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException ถ้า user ไม่พบ', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'noone@example.com',
          password: 'whatever',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException ถ้า password ผิด', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'e@e.com',
        password: hashed,
        role: 'STAFF',
      });

      await expect(
        authService.login({ email: 'e@e.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('คืน accessToken ถ้า credentials ถูก', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'e@e.com',
        password: hashed,
        role: 'STAFF',
      });

      const result = await authService.login({
        email: 'e@e.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(result.accessToken.split('.').length).toBe(3); // JWT = header.payload.sig
      expect(result.user.email).toBe('e@e.com');
      expect(result.user.role).toBe('STAFF');
    });
  });
});
