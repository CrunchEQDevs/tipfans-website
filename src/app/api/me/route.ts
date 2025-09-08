// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'tf_token';
const JWT_SECRET = process.env.JWT_SECRET;
const SKIP_JWT_VERIFY =
  process.env.SKIP_JWT_VERIFY === '1' || String(process.env.SKIP_JWT_VERIFY).toLowerCase() === 'true';

function asString(v: unknown, fb = ''): string {
  return typeof v === 'string' ? v : fb;
}

function gravatarUrl(email: string, size = 128) {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!token) return null;
  if (SKIP_JWT_VERIFY) {
    try { return decodeJwt(token); } catch { return null; }
  }
  if (!JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload;
  } catch {
    return null;
  }
}

function getCookieFromHeader(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k && k.trim() === name) {
      try { return decodeURIComponent(rest.join('=').trim()); }
      catch { return rest.join('=').trim(); }
    }
  }
  return null;
}

export async function GET(req: Request) {
  // 1) tenta via cookies() (servidor), 2) fallback: Authorization, 3) fallback: header Cookie
  const ck = await cookies();
  const fromCookies = ck.get(COOKIE_NAME)?.value || null;

  const auth = req.headers.get('authorization') ?? '';
  const fromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  const cookieHeader = req.headers.get('cookie') ?? '';
  const fromCookieHeader = getCookieFromHeader(cookieHeader, COOKIE_NAME);

  const token = fromCookies || fromHeader || fromCookieHeader;
  const authSource = fromCookies ? 'cookies()'
                    : fromHeader ? 'authorization'
                    : fromCookieHeader ? 'cookie-header'
                    : 'none';

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': authSource,
        },
      }
    );
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid token' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': authSource,
        },
      }
    );
  }

  const email =
    asString(payload.email) ||
    asString((payload as any).user_email) ||
    asString(payload.sub);

  if (!email) {
    return NextResponse.json(
      { error: 'Invalid token payload (email missing)' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': authSource,
        },
      }
    );
  }

  // === Nome com múltiplos fallbacks ===
  const composedName =
    [asString((payload as any).first_name), asString((payload as any).last_name)]
      .filter(Boolean)
      .join(' ')
      .trim();

  const name =
    asString((payload as any).name) ||
    (composedName || '') ||
    asString((payload as any).nickname) ||
    asString((payload as any).username) ||
    asString((payload as any).slug) ||
    asString((payload as any).nome) ||
    email.split('@')[0];

  const role = asString((payload as any).role) || 'subscriber';
  const memberSince = asString((payload as any).memberSince) || undefined;

  let avatarUrl =
    asString((payload as any).avatarUrl) ||
    asString((payload as any).avatar_url) ||
    '';
  if (!avatarUrl) avatarUrl = gravatarUrl(email);

  const stats =
    (payload as any).stats && typeof (payload as any).stats === 'object'
      ? ((payload as any).stats as Record<string, unknown>)
      : undefined;

  // metadados úteis para debug/UX
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  const iat = typeof payload.iat === 'number' ? payload.iat : undefined;
  const expInSeconds = exp ? Math.max(0, exp - nowSec) : undefined;

  const user = {
    id: asString(payload.sub) || email,
    name,
    email,
    role,
    memberSince,
    avatarUrl,
    stats,
  };

  return NextResponse.json(
    { user, tokenMeta: { exp, iat, expInSeconds } },
    {
      headers: {
        'Cache-Control': 'no-store',
        Vary: 'Cookie, Authorization',
        'x-auth-source': authSource,
      },
    }
  );
}
