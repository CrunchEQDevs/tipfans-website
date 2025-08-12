import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'tf_token';

export async function POST() {
  const cookieStore = await cookies();
  // Limpa o cookie
  cookieStore.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
