// src/app/api/session/exchange/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'tf_token';

export const POST = async (): Promise<NextResponse> => {
  const cookieStore = await cookies();
  const hdrs = await headers();

  const auth = hdrs.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token) {
    return NextResponse.json({ error: 'Missing Bearer token' }, { status: 400 });
  }

  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return NextResponse.json({ ok: true });
};
