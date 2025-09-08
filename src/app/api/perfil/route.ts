// src/app/api/perfil/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = 'tf_token';
const WP = (process.env.WP_URL || process.env.WP_BASE_URL || '').replace(/\/$/, '');
const JWT_SECRET = process.env.JWT_SECRET || '';
const CROSS = process.env.CROSS_SITE_COOKIES === '1';

/* ========== utils ========== */
function noStoreJson(data: any, init?: number | ResponseInit) {
  const resInit: ResponseInit = typeof init === 'number' ? { status: init } : (init || {});
  const headers = new Headers(resInit.headers || {});
  headers.set('Cache-Control', 'no-store');
  return NextResponse.json(data, { ...resInit, headers });
}
const safe = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const pickName = (obj: any, fallback: string) => {
  const composed = [safe(obj?.first_name), safe(obj?.last_name)].filter(Boolean).join(' ').trim();
  return safe(obj?.name) || composed || safe(obj?.nickname) || safe(obj?.username) || safe(obj?.slug) || fallback;
};

function normalizeBirthdate(input: unknown): string | undefined {
  if (typeof input !== 'string') return undefined;
  const v = input.trim();
  if (!v) return undefined;
  // aceita YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  // aceita DD/MM/YYYY
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dd = m[1], mm = m[2], yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  // devolve como veio (o mu-plugin pode sanitizar)
  return v;
}

async function getWpJwtFromCookie() {
  const ck = await cookies();
  const token = ck.get('wp_jwt')?.value || '';
  return token || null;
}

async function getAppJwtPayload() {
  const ck = await cookies();
  const app = ck.get(COOKIE_NAME)?.value || '';
  if (!app || !JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(app, new TextEncoder().encode(JWT_SECRET));
    return payload as any;
  } catch {
    return null;
  }
}

/* ================= GET /api/perfil ================= */
export async function GET() {
  try {
    if (!WP) return noStoreJson({ error: 'WP_URL/WP_BASE_URL não configurado' }, 500);

    const wpJwt = await getWpJwtFromCookie();
    if (!wpJwt) return noStoreJson({ error: 'Não autenticado' }, 401);

    const res = await fetch(`${WP}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${wpJwt}` },
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return noStoreJson({ error: 'Falha ao obter perfil WP', details: json }, res.status);

    const meta = json?.meta || {};
    const result = {
      id: json?.id,
      email: json?.email,
      name: pickName(json, safe(json?.username) || safe(json?.slug) || ''),
      first_name: json?.first_name || '',
      last_name: json?.last_name || '',
      nickname: json?.nickname || '',
      description: json?.description || '',
      url: json?.url || '',
      phone: meta?.phone ?? json?.acf?.phone ?? '',
      birthdate: meta?.birthdate ?? json?.acf?.birthdate ?? '',
      marketing_optin: !!(meta?.marketing_optin ?? json?.acf?.marketing_optin ?? false),
      avatar_urls: json?.avatar_urls || {},
      roles: json?.roles || [],
      registered_date: json?.registered_date,
    };

    return noStoreJson({ ok: true, user: result }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return noStoreJson({ error: 'Erro interno', details: msg }, 500);
  }
}

/* ================= PUT /api/perfil ================= */
type UpdateBody = Partial<{
  // nativos
  name: string;
  first_name: string;
  last_name: string;
  nickname: string;
  description: string;
  url: string;
  password: string;
  // extras (mu-plugin)
  phone: string;
  birthdate: string; // aceita DD/MM/YYYY e normaliza para YYYY-MM-DD
  marketing_optin: boolean;
  // compatibilidade com front antigo
  displayName: string;
}>;

export async function PUT(req: Request) {
  try {
    if (!WP) return noStoreJson({ error: 'WP_URL/WP_BASE_URL não configurado' }, 500);
    if (!JWT_SECRET) return noStoreJson({ error: 'JWT_SECRET não configurado' }, 500);

    const wpJwt = await getWpJwtFromCookie();
    if (!wpJwt) return noStoreJson({ error: 'Não autenticado' }, 401);

    const body = (await req.json().catch(() => ({}))) as UpdateBody;

    // Mapeia displayName -> name (compat)
    if (!body.name && typeof body.displayName === 'string') {
      body.name = body.displayName.trim();
    }

    // Filtra campos nativos
    const base: Record<string, any> = {};
    (['name','first_name','last_name','nickname','description','url','password'] as const).forEach(k => {
      const v = (body as any)[k];
      if (typeof v === 'string') base[k] = v.trim();
    });

    // Filtra metas
    const meta: Record<string, any> = {};
    if (typeof body.phone === 'string') meta.phone = body.phone.trim();
    if (typeof body.birthdate === 'string') meta.birthdate = normalizeBirthdate(body.birthdate);
    if (typeof body.marketing_optin === 'boolean') meta.marketing_optin = body.marketing_optin;

    const hasBase = Object.keys(base).length > 0;
    const hasMeta = Object.keys(meta).length > 0;
    if (!hasBase && !hasMeta) {
      return noStoreJson({ error: 'Nenhum campo para atualizar' }, 400);
    }

    const payloadToSend: Record<string, any> = { ...(hasBase ? base : {}) };
    if (hasMeta) payloadToSend.meta = meta;

    // 1) obter ID (context=edit para garantir meta)
    const meRes = await fetch(`${WP}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${wpJwt}` },
      cache: 'no-store',
    });
    const meJson = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !meJson?.id) {
      return noStoreJson({ error: 'Falha ao obter o ID do usuário', details: meJson }, 502);
    }
    const userId = Number(meJson.id);

    // 2) atualizar no WP
    const updRes = await fetch(`${WP}/wp-json/wp/v2/users/${userId}`, {
      method: 'POST', // WP aceita POST para update
      headers: {
        Authorization: `Bearer ${wpJwt}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(payloadToSend),
    });
    const updJson = await updRes.json().catch(() => ({}));
    if (!updRes.ok) {
      return noStoreJson(
        { error: 'Falha ao atualizar perfil no WP', details: updJson },
        updRes.status
      );
    }

    // 3) Reemitir tf_token com novo nome/avatar (UI reflete sem relogar)
    const appPayload = await getAppJwtPayload();
    if (appPayload && JWT_SECRET) {
      const newName = pickName(updJson, (appPayload.name as string) || '');
      const newAvatar =
        safe(updJson?.avatar_urls?.['96']) ||
        safe(updJson?.avatar_urls?.['48']) ||
        (appPayload.avatarUrl as string) ||
        '';

      const refreshed = { ...appPayload, name: newName, avatarUrl: newAvatar };

      const newToken = await new SignJWT(refreshed as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(String(refreshed.email || ''))
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(new TextEncoder().encode(JWT_SECRET));

      const ck = await cookies();
      // flags de cookie corretas para localhost vs produção
      const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', '');
      const isHttps = proto === 'https';
      const sameSite = CROSS ? 'none' : 'lax';
      const secure = CROSS ? true : isHttps;

      await ck.set({
        name: COOKIE_NAME,
        value: newToken,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite,
        secure,
      });
    }

    // 4) resposta limpa (com metas refletidas)
    const metaOut = updJson?.meta || {};
    const result = {
      id: updJson?.id,
      email: updJson?.email,
      name: pickName(updJson, safe(updJson?.username) || safe(updJson?.slug) || ''),
      first_name: updJson?.first_name || '',
      last_name: updJson?.last_name || '',
      nickname: updJson?.nickname || '',
      description: updJson?.description || '',
      url: updJson?.url || '',
      phone: metaOut?.phone ?? '',
      birthdate: metaOut?.birthdate ?? '',
      marketing_optin: !!metaOut?.marketing_optin,
      avatar_urls: updJson?.avatar_urls || {},
      roles: updJson?.roles || [],
    };

    const res = noStoreJson({ ok: true, profile: result }, 200);
    (res.headers as Headers).set('x-perfil-flow', 'put:bearer');
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return noStoreJson({ error: 'Erro interno', details: msg }, 500);
  }
}

/* ================= PATCH /api/perfil =================
   (delegando para PUT para compatibilidade com front antigo) */
export async function PATCH(req: Request) {
  return PUT(req);
}
