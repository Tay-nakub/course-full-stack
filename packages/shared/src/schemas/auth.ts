import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(8, 'รหัสผ่านต้องอย่างน้อย 8 ตัว'),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.email('รูปแบบอีเมลไม่ถูกต้อง'),
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
