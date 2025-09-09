import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'tf_token';

const WP_BASE = (process.env.WP_BASE_URL || process.env.WP_URL || '').replace(/\/$/, '');
const APP_USER = process.env.WP_APP_USER || '';
const APP_PASS_RAW = process.env.WP_APP_PASS || '';
const APP_PASS = APP_PASS_RAW.replace(/^"(.*)"$/, '$1').replace(/\s+/g, ''); // limpa aspas/espaços
const JWT_SECRET = process.env.JWT_SECRET || '';

const CROSS = process.env.CROSS_SITE_COOKIES === '1';
const IS_PROD = process.env.NODE_ENV === 'production';

function authHeaderBasic(): string | null {
  if (!APP_USER || !APP_PASS) return null;
  return `Basic ${Buffer.from(`${APP_USER}:${APP_PASS}`).toString('base64')}`;
}
function pickPrimaryRole(roles?: string[] | null): string {
  const list = (roles ?? []).map((r) => String(r).toLowerCase());
  const order = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
  for (const r of order) if (list.includes(r)) return r;
  return list[0] ?? 'subscriber';
}
async function safeJson<T = any>(res: Response): Promise<T | null> {
  try { return (await res.json()) as T; } catch { return null; }
}
const safe = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

type WpUser = {
  id?: number | string;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL/WP_URL ausente no .env' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    const basic = authHeaderBasic();
    if (!basic) {
      return NextResponse.json({ error: 'WP_APP_USER/WP_APP_PASS não configurados' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET ausente no .env' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const username = safe(body.username);
    const email = safe(body.email);
    const password = safe(body.password);
    const displayName = safe(body.name);
    const nextPath = typeof body.next === 'string' && (body.next as string).startsWith('/') ? String(body.next) : '/perfil';

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'username, email e password são obrigatórios' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // (Opcional) Garante que as credenciais são de administrador
    try {
      const meRes = await fetch(`${WP_BASE}/wp-json/wp/v2/users/me?context=edit`, {
        headers: { Authorization: basic, Accept: 'application/json' },
        cache: 'no-store',
      });
      const me = await safeJson<any>(meRes);
      const roles: string[] = Array.isArray(me?.roles) ? me.roles.map((r: string) => r.toLowerCase()) : [];
      if (!meRes.ok || !roles.includes('administrator')) {
        return NextResponse.json(
          { error: 'As credenciais WP_APP_* não são de administrador.' },
          { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    } catch { /* continua sem travar */ }

    // (Opcional) Verifica se o e-mail já existe para UX melhor
    try {
      const checkRes = await fetch(`${WP_BASE}/wp-json/wp/v2/users?context=edit&per_page=100&search=${encodeURIComponent(email)}`, {
        headers: { Authorization: basic, Accept: 'application/json' }, cache: 'no-store',
      });
      const arr = await safeJson<any[]>(checkRes);
      if (Array.isArray(arr) && arr.some((u) => String(u?.email || '').toLowerCase() === email.toLowerCase())) {
        return NextResponse.json({ error: 'E-mail já registado', code: 'existing_user_email' }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
      }
    } catch { /* segue o jogo */ }

    // Cria utilizador
    const createRes = await fetch(`${WP_BASE}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: {
        Authorization: basic,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify({
        username,
        email,
        password,
        ...(displayName ? { name: displayName } : {}),
      }),
    });

    const createJson = (await safeJson<WpUser & { code?: string; message?: string }>(createRes)) || {};
    if (!createRes.ok || !createJson?.id) {
      return NextResponse.json(
        {
          error: createJson?.message || 'Erro ao criar utilizador no WordPress.',
          code: createJson?.code || 'wp_error',
          wpStatus: createRes.status,
          wpBody: createJson, // remover depois do debug se quiser
        },
        {
          status: createRes.status === 401 ? 401 : 400,
          headers: { 'Cache-Control': 'no-store', 'x-wp-status': String(createRes.status) },
        }
      );
    }

    const userId = Number(createJson.id);
    let createdUser: WpUser = createJson;

    // Enriquecimento
    try {
      const uRes = await fetch(`${WP_BASE}/wp-json/wp/v2/users/${userId}?context=edit`, {
        headers: { Authorization: basic, Accept: 'application/json' },
        cache: 'no-store',
      });
      if (uRes.ok) {
        const uData = await safeJson<WpUser>(uRes);
        if (uData) createdUser = { ...createdUser, ...uData };
      }
    } catch {}

    const role = pickPrimaryRole(createdUser.roles);
    const wpAvatar = (createdUser.avatar_urls && (createdUser.avatar_urls['96'] || createdUser.avatar_urls['48'])) || '';
    const finalEmail = createdUser.email || email;
    const finalName = createdUser.name || createdUser.username || displayName || finalEmail.split('@')[0];

    const payload = {
      email: finalEmail,
      name: finalName,
      role,
      avatarUrl: wpAvatar || '',
      memberSince: new Date().toISOString(),
      stats: {} as Record<string, unknown>,
    };

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(userId || finalEmail))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    const ck = await cookies();
    await ck.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: CROSS ? 'none' : 'lax',
      secure: CROSS ? true : IS_PROD,
    });

    return NextResponse.json(
      { ok: true, user: payload, redirect: nextPath, message: 'Conta criada e sessão iniciada.' },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[REGISTER_API_ERROR]', msg);
    return NextResponse.json(
      { error: 'Erro interno no servidor', details: msg },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
