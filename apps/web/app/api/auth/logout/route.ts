import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth-constants';

export async function POST(request: Request) {
  // Browser <form> submits navigate — return a redirect so the user lands on
  // /login. Programmatic fetchers can still read the response status.
  const response = NextResponse.redirect(new URL('/login', request.url), {
    status: 303,
  });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
