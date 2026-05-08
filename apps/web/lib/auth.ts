import { cookies } from 'next/headers';

export const AUTH_COOKIE_NAME = 'coffee_token';

export async function getServerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}
