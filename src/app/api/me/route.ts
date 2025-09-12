// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, decodeJwt, type JWTPayload } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'tf_token';
const WP_COOKIE_NAME = 'wp_jwt';

const JWT_SECRET = process.env.JWT_SECRET || '';
const SKIP_JWT_VERIFY =
  process.env.SKIP_JWT_VERIFY === '1' ||
  String(process.env.SKIP_JWT_VERIFY || '').toLowerCase() === 'true';

// use SEMPRE host sem barra final
const WP = (process.env.WP_URL || process.env.WP_BASE_URL || '').replace(/\/$/, '');
const APP_USER = process.env.WP_APP_USER || '';
const APP_PASS_RAW = process.env.WP_APP_PASS || process.env.WP_APP_PASSWORD || '';
const APP_PASS = APP_PASS_RAW.replace(/^"(.*)"$/, '$1').replace(/\s+/g, '');

// -------------- utils
const asString = (v: unknown, fb = '') => (typeof v === 'string' ? v : fb);

const pickName = (obj: any, fallback: string) => {
  const composed = [asString(obj?.first_name), asString(obj?.last_name)]
    .filter(Boolean)
    .join(' ')
    .trim();
  return (
    asString(obj?.name) ||
    composed ||
    asString(obj?.nickname) ||
    asString(obj?.username) ||
    asString(obj?.slug) ||
    fallback
  );
};

function getCookieFromHeader(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [k, ...rest] = p.split('=');
    if (k && k.trim() === name) {
      try {
        return decodeURIComponent(rest.join('=').trim());
      } catch {
        return rest.join('=').trim();
      }
    }
  }
  return null;
}

function authHeaderBasic(): string | null {
  if (!APP_USER || !APP_PASS) return null;
  return 'Basic ' + Buffer.from(`${APP_USER}:${APP_PASS}`).toString('base64');
}

// via Application Password (context=edit)
async function getUserByIdViaApp(id: number) {
  const basic = authHeaderBasic();
  if (!basic || !WP || !id) return null;
  const res = await fetch(`${WP}/wp-json/wp/v2/users/${id}?context=edit`, {
    headers: { Authorization: basic, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

async function getUserByEmailViaApp(email: string) {
  const basic = authHeaderBasic();
  if (!basic || !WP) return null;
  const url = new URL(`${WP}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', email);
  const res = await fetch(url.toString(), {
    headers: { Authorization: basic, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const arr = await res.json().catch(() => null);
  if (!Array.isArray(arr)) return null;
  return arr.find((x: any) => String(x?.email || '').toLowerCase() === email.toLowerCase()) || null;
}

// Valida JWT do WP no próprio WP e devolve payload com sub=userId
async function validateWpJwt(token: string): Promise<{ payload: JWTPayload & { wpUserId?: number } } | null> {
  if (!WP || !token) return null;

  // 1) valida no WP
  let res = await fetch(`${WP}/wp-json/jwt-auth/v1/token/validate`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  // fallback sem rewrite
  if (res.status === 404) {
    res = await fetch(`${WP}/index.php?rest_route=/jwt-auth/v1/token/validate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  }

  if (!res.ok) return null;

  // 2) decodifica localmente só para extrair id/email básicos
  const decoded = decodeJwt(token) as any;
  const wpUserId = Number(decoded?.data?.user?.id || 0) || undefined;

  // injeta sub para cumprir a regra do /api/me (email || user_email || sub)
  const payload: JWTPayload & { wpUserId?: number } = {
    ...(decoded || {}),
    sub: decoded?.sub || (wpUserId ? String(wpUserId) : undefined),
    wpUserId,
  };

  return { payload };
}

async function verifyAppJwt(token: string): Promise<JWTPayload | null> {
  if (!token) return null;

  if (SKIP_JWT_VERIFY) {
    try {
      return decodeJwt(token);
    } catch {
      return null;
    }
  }

  if (!JWT_SECRET) return null;

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload;
  } catch {
    return null;
  }
}

// -------------- handler
export async function GET(req: Request) {
  const ck = await cookies();

  // ordem de origem: cookies() -> Authorization -> Cookie header
  const fromCookies = ck.get(COOKIE_NAME)?.value || null;
  const fromWpCookie = ck.get(WP_COOKIE_NAME)?.value || null;

  const auth = req.headers.get('authorization') ?? '';
  const fromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  const cookieHeader = req.headers.get('cookie') ?? '';
  const fromCookieHeader = getCookieFromHeader(cookieHeader, COOKIE_NAME) || null;
  const fromWpCookieHeader = getCookieFromHeader(cookieHeader, WP_COOKIE_NAME) || null;

  // tente app token primeiro
  const candidateAppToken = fromCookies || fromCookieHeader || (fromHeader || '').trim();
  const candidateWpToken = fromWpCookie || fromWpCookieHeader || (fromHeader || '').trim();

  let tokenUsed = '';
  let authSource: 'cookies()' | 'authorization' | 'cookie-header' | 'none' = 'none';
  let meMode: 'app' | 'wp' | 'unknown' = 'unknown';

  // 1) tenta validar como token da APP
  let payload = await verifyAppJwt(candidateAppToken);
  if (payload) {
    tokenUsed = candidateAppToken!;
    authSource = fromCookies || fromCookieHeader ? (fromCookies ? 'cookies()' : 'cookie-header') : 'authorization';
    meMode = 'app';
  }

  // 2) fallback: tenta JWT do WP
  if (!payload && candidateWpToken) {
    const wpCheck = await validateWpJwt(candidateWpToken);
    if (wpCheck?.payload) {
      payload = wpCheck.payload;
      tokenUsed = candidateWpToken!;
      // fonte para header
      authSource =
        fromWpCookie || fromWpCookieHeader
          ? (fromWpCookie ? 'cookies()' : 'cookie-header')
          : 'authorization';
      meMode = 'wp';
    }
  }

  // sem token válido
  if (!payload) {
    return NextResponse.json(
      { error: 'Unauthenticated' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': authSource,
          'x-me-mode': meMode,
        },
      }
    );
  }

  // --------- compor dados do usuário (espelha o login)
  // preferências: email | user_email | sub
  let email =
    asString((payload as any).email) ||
    asString((payload as any).user_email) ||
    asString(payload.sub);

  // nome
  const composedName =
    [asString((payload as any).first_name), asString((payload as any).last_name)]
      .filter(Boolean)
      .join(' ')
      .trim();

  let name =
    asString((payload as any).name) ||
    composedName ||
    asString((payload as any).nickname) ||
    asString((payload as any).username) ||
    asString((payload as any).slug) ||
    (email ? email.split('@')[0] : '');

  let avatarUrl =
    asString((payload as any).avatarUrl) ||
    asString((payload as any).avatar_url) ||
    '';

  let role = asString((payload as any).role) || 'subscriber';
  let memberSince = asString((payload as any).memberSince) || undefined;
  let wpUserId =
    Number((payload as any).wpUserId || (payload as any).id || (payload as any).user_id || 0) || undefined;

  // Enriquecimento opcional (igual ao login):
  // - se veio token do WP, tenta APP_PASSWORD; se não, tenta /users/me com o próprio JWT do WP
  if (meMode === 'wp') {
    // tenta APP PASSWORD
    if (!memberSince || !role || !avatarUrl || !email || !name) {
      let userByApp: any = null;
      if (wpUserId) userByApp = await getUserByIdViaApp(wpUserId);
      if (!userByApp && email) userByApp = await getUserByEmailViaApp(email);

      if (userByApp) {
        email = asString(userByApp?.email) || email;
        name = pickName(userByApp, name);
        avatarUrl =
          asString(userByApp?.avatar_urls?.['96']) ||
          asString(userByApp?.avatar_urls?.['48']) ||
          avatarUrl;
        role =
          (Array.isArray(userByApp?.roles) && userByApp.roles.length
            ? String(userByApp.roles[0]).toLowerCase()
            : role) || role;
        memberSince = userByApp?.registered_date
          ? new Date(userByApp.registered_date).toISOString()
          : memberSince;
        wpUserId = Number(userByApp?.id || wpUserId) || wpUserId;
      } else if (WP && tokenUsed) {
        // fallback: /users/me com JWT do WP
        try {
          const meRes = await fetch(`${WP}/wp-json/wp/v2/users/me`, {
            headers: { Authorization: `Bearer ${tokenUsed}` },
            cache: 'no-store',
          });
          const meJson: any = await meRes.json().catch(() => ({}));
          if (meRes.ok) {
            email = asString(meJson?.email) || email;
            name = pickName(meJson, name);
            avatarUrl =
              asString(meJson?.avatar_urls?.['96']) ||
              asString(meJson?.avatar_urls?.['48']) ||
              avatarUrl;
            role =
              (Array.isArray(meJson?.roles) && meJson.roles.length
                ? String(meJson.roles[0]).toLowerCase()
                : role) || role;
            memberSince = meJson?.registered_date
              ? new Date(meJson.registered_date).toISOString()
              : memberSince;
            wpUserId = Number(meJson?.id || wpUserId) || wpUserId;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // sanity: precisa de identificador mínimo (email || sub)
  if (!email) {
    email = asString(payload.sub);
  }
  if (!email) {
    return NextResponse.json(
      { error: 'Invalid token payload (email missing)' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': authSource,
          'x-me-mode': meMode,
        },
      }
    );
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
  const iat = typeof payload.iat === 'number' ? payload.iat : undefined;
  const expInSeconds = exp ? Math.max(0, exp - nowSec) : undefined;

  const user = {
    id: asString(payload.sub) || email,
    email,
    name,
    role,
    memberSince,
    avatarUrl,
    stats:
      (payload as any).stats && typeof (payload as any).stats === 'object'
        ? ((payload as any).stats as Record<string, unknown>)
        : undefined,
    wpUserId,
  };

  return NextResponse.json(
    { user, tokenMeta: { exp, iat, expInSeconds } },
    {
      headers: {
        'Cache-Control': 'no-store',
        Vary: 'Cookie, Authorization',
        'x-auth-source': authSource,
        'x-me-mode': meMode,
      },
    }
  );
}
