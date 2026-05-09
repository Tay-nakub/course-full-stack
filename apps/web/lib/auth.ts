import { cookies } from 'next/headers';
import type { Role } from '@coffee/shared';
import { AUTH_COOKIE_NAME } from './auth-constants';

export { AUTH_COOKIE_NAME };

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getServerToken();
  if (!token) return null;

  // Decode JWT payload locally (signature is verified server-side on every API
  // call, so trusting it for UI purposes here is safe — worst case the user
  // sees a stale role and the API returns 403).
  const [, payloadPart] = token.split('.');
  if (!payloadPart) return null;

  try {
    const json = Buffer.from(payloadPart, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as {
      sub: string;
      email: string;
      role: Role;
      exp?: number;
    };
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}
