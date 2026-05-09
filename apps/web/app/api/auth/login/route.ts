import { NextResponse } from 'next/server';
import { LoginSchema } from '@coffee/shared';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  }

  const upstream = await fetch(`${NESTJS_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed.data),
  });

  const data = await upstream.json();

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const response = NextResponse.json({ user: data.user });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: data.accessToken,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
