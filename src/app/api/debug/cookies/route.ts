// src/app/api/debug/cookies/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, decodeJwt } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_COOKIE = 'tf_token';
const WP_COOKIE  = 'wp_jwt';
const JWT_SECRET = process.env.JWT_SECRET || '';
const SKIP = process.env.SKIP_JWT_VERIFY === '1' || String(process.env.SKIP_JWT_VERIFY).toLowerCase() === 'true';

export async function GET() {
  const ck = await cookies();
  const tf = ck.get(APP_COOKIE)?.value || '';
  const wp = ck.get(WP_COOKIE)?.value || '';

  let payload: any = null;
  if (tf) {
    if (SKIP || !JWT_SECRET) {
      try { payload = decodeJwt(tf); } catch { payload = null; }
    } else {
      try {
        const { payload: p } = await jwtVerify(tf, new TextEncoder().encode(JWT_SECRET));
        payload = p;
      } catch { payload = null; }
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = typeof payload?.exp === 'number' ? payload.exp : undefined;

  return NextResponse.json({
    has_tf_token: !!tf,
    has_wp_jwt: !!wp,
    app_payload: payload ? {
      sub: payload.sub,
      email: payload.email,
      name:  payload.name,
      role:  payload.role,
      avatarUrl: payload.avatarUrl,
    } : null,
    tokenMeta: { exp, expInSeconds: exp ? Math.max(0, exp - now) : undefined },
    crossSiteCookies: process.env.CROSS_SITE_COOKIES,
  }, { headers: { 'Cache-Control': 'no-store' }});
}
