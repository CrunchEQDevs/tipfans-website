// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* =========================
   Ambiente
   - Localhost: CROSS_SITE_COOKIES=0 (ou ausente)
   - Produção cross-site: CROSS_SITE_COOKIES=1
   - JWT_SECRET definido
   - WP_URL/ WP_BASE_URL (sem barra final)
   ========================= */

const COOKIE_NAME = 'tf_token';

const WP = (process.env.WP_URL || process.env.WP_BASE_URL || '').replace(/\/$/, '');
const APP_USER = process.env.WP_APP_USER || '';
// limpa aspas e espaços do Application Password (WP mostra com espaços)
const APP_PASS_RAW = process.env.WP_APP_PASS || '';
const APP_PASS = APP_PASS_RAW.replace(/^"(.*)"$/, '$1').replace(/\s+/g, '');
const JWT_SECRET = process.env.JWT_SECRET || '';
const CROSS = process.env.CROSS_SITE_COOKIES === '1';

const safe = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const pickName = (obj: any, fallback: string) => {
  const composed = [safe(obj?.first_name), safe(obj?.last_name)].filter(Boolean).join(' ').trim();
  return (
    safe(obj?.name) ||
    composed ||
    safe(obj?.nickname) ||
    safe(obj?.username) ||
    safe(obj?.slug) ||
    fallback
  );
};

/* ---------- Helpers (via Application Password) ---------- */
function authHeaderBasic(): string | null {
  if (!APP_USER || !APP_PASS) return null;
  return 'Basic ' + Buffer.from(`${APP_USER}:${APP_PASS}`).toString('base64');
}

async function getUserByIdViaApp(id: number) {
  const basic = authHeaderBasic(); if (!basic || !WP || !id) return null;
  const res = await fetch(`${WP}/wp-json/wp/v2/users/${id}?context=edit`, {
    headers: { Authorization: basic, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return await res.json().catch(() => null);
}

async function getUserByEmailViaApp(email: string) {
  const basic = authHeaderBasic(); if (!basic || !WP) return null;

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

/* ---------- WP JWT ---------- */
async function wpToken(username: string, password: string) {
  const res = await fetch(`${WP}/wp-json/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json().catch(() => ({} as any));
  return { ok: res.ok && !!json?.token, status: res.status, json };
}

function json401(body: any, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, {
    status: 401,
    headers: { 'Cache-Control': 'no-store', ...(extraHeaders || {}) },
  });
}

/* ---------- Handler ---------- */
export async function POST(req: Request) {
  try {
    if (!WP) {
      return NextResponse.json(
        { error: 'WP_URL/WP_BASE_URL não configurado' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'JWT_SECRET não configurado' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      username?: string; email?: string; identifier?: string; password?: string;
    };

    const identifier = safe(body.username || body.email || body.identifier || '');
    const password = safe(body.password || '');
    if (!identifier || !password) {
      return json401({ error: 'Credenciais obrigatórias' }, { 'x-login-hint': 'missing-credentials' });
    }

    const attempts: string[] = [];
    let lastWpStatus = 0;

    // 1) tenta o que o user digitou (username OU e-mail)
    let loginName = identifier;
    let tok = await wpToken(loginName, password);
    lastWpStatus = tok.status;
    if (tok.ok) attempts.push(`direct:${loginName}`);

    // 2) se falhou e é e-mail, resolve username por APP
    if (!tok.ok && identifier.includes('@')) {
      const byEmail = await getUserByEmailViaApp(identifier);
      const mapped = safe(byEmail?.slug || byEmail?.username || byEmail?.name || byEmail?.user_login);
      if (mapped) {
        loginName = mapped;
        tok = await wpToken(loginName, password);
        lastWpStatus = tok.status;
        if (tok.ok) attempts.push(`mapped:${loginName}`);
      }
    }

    // 3) fallback: parte local do e-mail como username
    if (!tok.ok && identifier.includes('@')) {
      const localPart = identifier.split('@')[0];
      if (localPart) {
        loginName = localPart;
        tok = await wpToken(loginName, password);
        lastWpStatus = tok.status;
        if (tok.ok) attempts.push(`local:${loginName}`);
      }
    }

    // 4) último: tenta e-mail de novo
    if (!tok.ok && identifier.includes('@')) {
      loginName = identifier;
      tok = await wpToken(loginName, password);
      lastWpStatus = tok.status;
      if (tok.ok) attempts.push(`email-fallback:${loginName}`);
    }

    if (!tok.ok) {
      const msg = tok.json?.message || 'Usuário ou senha inválidos';
      return json401(
        { error: msg },
        {
          'x-login-hint': attempts.join('>') || 'failed',
          'x-wp-token-status': String(lastWpStatus),
          'x-wp-code': String(tok.json?.code || ''),
        }
      );
    }

    // Token do WP
    const wpTokenStr = safe(tok.json?.token || '');
    const wpUserId   = Number(tok.json?.user_id || 0);
    const tEmail     = safe(tok.json?.user_email || '');
    const tDispName  = safe(tok.json?.user_display_name || '');
    const tNiceName  = safe(tok.json?.user_nicename || '');
    const tLogin     = safe(tok.json?.user_login || '');

    // Base inicial do payload
    let email = tEmail || (identifier.includes('@') ? identifier : '');
    let name  = tDispName || tNiceName || tLogin || (identifier.includes('@') ? identifier.split('@')[0] : identifier);
    let avatarUrl = '';
    let role = 'subscriber';
    let memberSince = new Date().toISOString();
    let finalUserId = wpUserId || undefined;

    // === Enriquecimento prioritário via Application Password (o mais confiável) ===
    let userByApp: any = null;
    if (wpUserId) {
      userByApp = await getUserByIdViaApp(wpUserId);
    }
    if (!userByApp && email) {
      userByApp = await getUserByEmailViaApp(email);
    }
    if (userByApp) {
      email = safe(userByApp?.email) || email;
      name = pickName(userByApp, name);
      avatarUrl = safe(userByApp?.avatar_urls?.['96']) || safe(userByApp?.avatar_urls?.['48']) || avatarUrl;
      role = (Array.isArray(userByApp?.roles) && userByApp.roles.length)
        ? String(userByApp.roles[0]).toLowerCase()
        : role;
      memberSince = (userByApp?.registered_date ? new Date(userByApp.registered_date).toISOString() : memberSince);
      finalUserId = Number(userByApp?.id || finalUserId) || undefined;
    } else {
      // === Opcional: tentar /users/me com o JWT do próprio usuário, mas só se o ID bater ===
      try {
        const meRes = await fetch(`${WP}/wp-json/wp/v2/users/me`, {
          headers: { Authorization: `Bearer ${wpTokenStr}` },
          cache: 'no-store',
        });
        const meJson = await meRes.json().catch(() => ({}));
        const idMatches = wpUserId ? Number(meJson?.id || 0) === wpUserId : false; // se não tem user_id, NÃO confiar
        if (meRes.ok && idMatches) {
          email = safe(meJson?.email) || email;
          name = pickName(meJson, name);
          avatarUrl = safe(meJson?.avatar_urls?.['96']) || safe(meJson?.avatar_urls?.['48']) || avatarUrl;
          role = (Array.isArray(meJson?.roles) && meJson.roles.length)
            ? String(meJson.roles[0]).toLowerCase()
            : role;
          memberSince = (meJson?.registered_date ? new Date(meJson.registered_date).toISOString() : memberSince);
          finalUserId = Number(meJson?.id || finalUserId) || undefined;
        }
      } catch { /* ignora */ }
    }

    // Payload final do cookie da app
    const payload = {
      email,
      name,
      role,
      avatarUrl,
      memberSince,
      stats: {} as Record<string, unknown>,
      wpUserId: finalUserId,
    };

    const appToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.email || email || '')
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    const ck = await cookies();

    // Cookies: dinâmicos conforme protocolo
    const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '');
    const isHttps = proto === 'https';
    const sameSite = CROSS ? 'none' : 'lax';
    const secure   = CROSS ? true : isHttps; // em localhost (http) => false

    await ck.set({
      name: COOKIE_NAME,
      value: appToken,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite,
      secure,
    });

    await ck.set({
      name: 'wp_jwt',
      value: wpTokenStr,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite,
      secure,
    });

    return NextResponse.json(
      { ok: true, user: payload },
      { headers: { 'Cache-Control': 'no-store', 'x-login-hint': attempts.join('>') || 'ok' } }
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: 'Erro interno', details: msg },
      { status: 500, headers: { 'Cache-Control': 'no-store', 'x-login-hint': 'exception' } }
    );
  }
}
