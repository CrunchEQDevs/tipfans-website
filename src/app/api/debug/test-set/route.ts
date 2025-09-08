// src/app/api/debug/test-set/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const ck = await cookies();

  // calcula secure/sameSite com base no protocolo da request
  const url = new URL(req.url);
  const proto = (req.headers.get('x-forwarded-proto') || url.protocol.replace(':',''));
  const isHttps = proto === 'https';
  const sameSite: 'lax' | 'none' = 'lax'; // em localhost usamos Lax
  const secure = false; // em localhost (http) deve ser false

  ck.set('test_cookie', 'ok', {
    httpOnly: false,   // visível no DevTools/Application
    path: '/',
    maxAge: 60 * 10,
    sameSite,
    secure,
  });

  ck.set('test_cookie2', 'ok2', {
    httpOnly: false,
    path: '/',
    maxAge: 60 * 10,
    sameSite,
    secure,
  });

  return NextResponse.json({
    set: true,
    note: 'Cookies de teste foram setados (não-httpOnly) para aparecerem no DevTools.',
    inferred_is_https: isHttps,
    sameSite,
    secure,
  }, { headers: { 'Cache-Control': 'no-store' }});
}
