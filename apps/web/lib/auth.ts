import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from './auth-constants';

export { AUTH_COOKIE_NAME };

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
