// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'tf_token';

// use SEMPRE o host sem barra no final: https://wp.tipfans.com
const WP = (process.env.WP_BASE_URL || process.env.WP_URL || '').replace(/\/$/, '');
const APP_USER = process.env.WP_APP_USER || '';
// aceita WP_APP_PASS ou WP_APP_PASSWORD e remove aspas/espaços
const APP_PASS_RAW = process.env.WP_APP_PASS || process.env.WP_APP_PASSWORD || '';
const APP_PASS = APP_PASS_RAW.replace(/^"(.*)"$/, '$1').replace(/\s+/g, '');

const JWT_SECRET = process.env.JWT_SECRET || '';
const CROSS = process.env.CROSS_SITE_COOKIES === '1';

type WpUser = {
  id?: number | string;
  email?: string;
  name?: string;
  username?: string;
  slug?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
  registered_date?: string;
};

const safe = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

function authHeaderBasic(): string | null {
  if (!APP_USER || !APP_PASS) return null;
  return 'Basic ' + Buffer.from(`${APP_USER}:${APP_PASS}`).toString('base64');
}

async function safeJson<T = any>(res: Response): Promise<T | null> {
  try { return (await res.json()) as T; } catch { return null; }
}

/** login JWT no WP, com fallback para rest_route se rewrite falhar */
async function wpToken(username: string, password: string) {
  const body = JSON.stringify({ username, password });

  let res = await fetch(`${WP}/wp-json/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body,
  });

  if (res.status === 404) {
    res = await fetch(`${WP}/index.php?rest_route=/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body,
    });
  }

  const json = await safeJson<any>(res);
  return { ok: res.ok && !!json?.token, status: res.status, json: json || {} };
}

async function getUserByEmail(email: string, basic: string) {
  const url = new URL(`${WP}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', email);
  const res = await fetch(url.toString(), { headers: { Authorization: basic, Accept: 'application/json' }, cache: 'no-store' });
  const arr = await safeJson<any[]>(res);
  if (!res.ok || !Array.isArray(arr)) return null;
  return arr.find(u => String(u?.email || '').toLowerCase() === email.toLowerCase()) || null;
}

async function usernameExists(username: string, basic: string) {
  const url = new URL(`${WP}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', username);
  const res = await fetch(url.toString(), { headers: { Authorization: basic, Accept: 'application/json' }, cache: 'no-store' });
  const arr = await safeJson<any[]>(res);
  if (!res.ok || !Array.isArray(arr)) return false;
  return arr.some(u => {
    const cand = [u?.username, u?.slug, u?.name].map(x => String(x || '').toLowerCase());
    return cand.includes(username.toLowerCase());
  });
}

function pickPrimaryRole(roles?: string[] | null): string {
  const list = (roles ?? []).map((r) => String(r).toLowerCase());
  const order = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
  for (const r of order) if (list.includes(r)) return r;
  return list[0] ?? 'subscriber';
}

export async function POST(req: Request) {
  try {
    if (!WP) {
      return NextResponse.json({ error: 'WP_BASE_URL/WP_URL não configurado' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET não configurado' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    const basic = authHeaderBasic();
    if (!basic) {
      return NextResponse.json({ error: 'WP_APP_USER/WP_APP_PASS não configurados' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const username = safe(b.username);
    const email = safe(b.email);
    const password = safe(b.password);
    const displayName = safe(b.name);
    const nextPath = typeof b.next === 'string' && (b.next as string).startsWith('/') ? String(b.next) : '/perfil';

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email e password são obrigatórios' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // 1) Checagens de conflito (email e username)
    const existingByEmail = await getUserByEmail(email, basic);
    if (existingByEmail) {
      return NextResponse.json({ error: 'E-mail já registado', code: 'existing_user_email' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    }
    const userTaken = await usernameExists(username, basic);
    if (userTaken) {
      return NextResponse.json({ error: 'Nome de utilizador já existe', code: 'existing_user_login' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
    }

    // 2) Cria utilizador no WP (subscriber). Se não tiver permissão, o próprio WP responde 401/403.
    const createRes = await fetch(`${WP}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: { Authorization: basic, 'Content-Type': 'application/json', Accept: 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        username,
        email,
        password,
        name: displayName || undefined,
        roles: ['subscriber'],
      }),
    });
    const createJson = (await safeJson<WpUser & { code?: string; message?: string }>(createRes)) || {};

    if (!createRes.ok || !createJson?.id) {
      const code = (createJson as any)?.code || '';
      const msg = (createJson as any)?.message || 'Erro ao criar utilizador no WordPress.';
      // mapeia permissão negada
      if (createRes.status === 401 || createRes.status === 403) {
        return NextResponse.json(
          { error: 'As credenciais WP_APP_* não têm permissão para criar utilizadores.', code: code || 'forbidden', wpStatus: createRes.status, wpMessage: msg },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
      return NextResponse.json(
        { error: msg, code: code || 'wp_error', wpStatus: createRes.status },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const createdId = Number(createJson.id);
    let createdUser: WpUser = createJson;

    // 3) Enriquecimento (context=edit) — confirma role/avatar/email
    try {
      const uRes = await fetch(`${WP}/wp-json/wp/v2/users/${createdId}?context=edit`, {
        headers: { Authorization: basic, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (uRes.ok) {
        const uData = await safeJson<WpUser>(uRes);
        if (uData) createdUser = { ...createdUser, ...uData };
      }
    } catch {}

    // 4) Login imediato com a MESMA senha informada (garante senha válida)
    const tok = await wpToken(username, password);
    if (!tok.ok) {
      return NextResponse.json(
        { error: tok.json?.message || 'Conta criada, mas houve falha ao iniciar sessão.', code: tok.json?.code || 'jwt_login_failed', wpStatus: tok.status },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const wpJwt = String(tok.json.token || '');

    const role = pickPrimaryRole(createdUser.roles);
    const avatar = (createdUser.avatar_urls && (createdUser.avatar_urls['96'] || createdUser.avatar_urls['48'])) || '';
    const finalEmail = createdUser.email || email;
    const finalName = createdUser.name || createdUser.username || displayName || finalEmail.split('@')[0];
    const memberSince = createdUser.registered_date ? new Date(createdUser.registered_date).toISOString() : new Date().toISOString();

    // 5) Gera token da app e seta cookies httpOnly no response
    const payload = { email: finalEmail, name: finalName, role, avatarUrl: avatar || '', memberSince, stats: {} as Record<string, unknown>, wpUserId: createdId };

    const appToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(createdId || finalEmail))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    // cookies conforme ambiente (evita SameSite=None sem secure)
    const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '');
    const isHttps = proto === 'https';
    const sameSite: 'lax' | 'strict' | 'none' = CROSS ? 'none' : 'lax';
    const secure = CROSS ? true : isHttps;

    const res = NextResponse.json(
      { ok: true, user: payload, redirect: nextPath },
      { headers: { 'Cache-Control': 'no-store', 'x-register': 'ok' } }
    );

    res.cookies.set({ name: COOKIE_NAME, value: appToken, httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite, secure });
    res.cookies.set({ name: 'wp_jwt', value: wpJwt, httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite, secure });

    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Erro interno no servidor', details: msg }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
