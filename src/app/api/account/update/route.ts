// src/app/api/account/update/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, SignJWT, type JWTPayload } from 'jose';

const COOKIE_NAME = 'tf_token';

const WP_URL = process.env.WP_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || null; // token de admin do WP

function json<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data as unknown, typeof init === 'number' ? { status: init } : init);
}

type AppTokenPayload = JWTPayload & {
  email: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
  memberSince?: string;
  stats?: Record<string, unknown>;
};

type UpdateInput = {
  name?: string;
  email?: string;
  // current_password?: string; // (não utilizado neste fluxo)
  new_password?: string;
};

type WpUser = {
  id: number;
  email?: string;
};

type WpUserUpdate = {
  name?: string;
  email?: string;
  password?: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export async function PATCH(req: Request) {
  try {
    if (!WP_URL || !JWT_SECRET) {
      return json({ error: 'WP_URL/JWT_SECRET ausentes' }, 500);
    }

    // cookie com nosso JWT (não o do WP)
    const cookieStore = await cookies();
    const siteToken = cookieStore.get(COOKIE_NAME)?.value;
    if (!siteToken) return json({ error: 'Não autenticado' }, 401);

    let payload: AppTokenPayload;
    try {
      const verified = await jwtVerify<AppTokenPayload>(
        siteToken,
        new TextEncoder().encode(JWT_SECRET)
      );
      payload = verified.payload;
      if (!isNonEmptyString(payload.email)) {
        return json({ error: 'Token sem email válido' }, 401);
      }
    } catch {
      return json({ error: 'Token inválido' }, 401);
    }

    // body
    const raw = (await req.json().catch(() => ({}))) as unknown;
    const body = (raw ?? {}) as UpdateInput;

    const name = isNonEmptyString(body.name) ? body.name.trim() : '';
    const email = isNonEmptyString(body.email) ? body.email.trim() : '';
    // const current_password = isNonEmptyString(body.current_password) ? body.current_password : ''; // não usado
    const new_password = isNonEmptyString(body.new_password) ? body.new_password : '';

    if (!name && !email && !new_password) {
      return json({ error: 'Nada para atualizar' }, 400);
    }

    // Precisamos de um token válido do WP (usando admin aqui)
    const authHeader = WP_ADMIN_TOKEN ? { Authorization: `Bearer ${WP_ADMIN_TOKEN}` } : undefined;
    if (!authHeader) {
      return json({ error: 'Sem WP_ADMIN_TOKEN para editar perfil no WP.' }, 500);
    }

    // Descobrir o utilizador no WP pelo email atual do payload
    const usersUrl = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
    usersUrl.searchParams.set('context', 'edit');
    usersUrl.searchParams.set('per_page', '100');
    usersUrl.searchParams.set('search', payload.email);

    const findRes = await fetch(usersUrl.toString(), { headers: { ...authHeader }, cache: 'no-store' });
    if (!findRes.ok) return json({ error: 'Falha ao localizar utilizador no WP' }, 502);

    const listJson: unknown = await findRes.json();
    const wpUser: WpUser | undefined = Array.isArray(listJson)
      ? (listJson as WpUser[]).find(
          (u) =>
            !!u &&
            typeof u === 'object' &&
            typeof u.id === 'number' &&
            typeof u.email === 'string' &&
            u.email.toLowerCase() === payload.email.toLowerCase()
        )
      : undefined;

    if (!wpUser?.id) return json({ error: 'Utilizador não encontrado no WP' }, 404);

    // Montar atualização
    const patchData: WpUserUpdate = {};
    if (name) patchData.name = name;
    if (email) patchData.email = email;
    if (new_password) patchData.password = new_password;

    // Enviar para /users/{id}
    const updRes = await fetch(
      `${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users/${wpUser.id}`,
      {
        method: 'POST', // WP aceita POST para update
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patchData),
        cache: 'no-store',
      }
    );

    const updJson = (await updRes.json().catch(() => ({}))) as { message?: string };
    if (!updRes.ok) {
      const msg = isNonEmptyString(updJson?.message)
        ? updJson.message
        : 'Falha ao atualizar utilizador no WP';
      return json({ error: msg }, updRes.status);
    }

    // Se email/nome mudaram, reemitir nosso tf_token
    const newPayload: AppTokenPayload = {
      ...payload,
      email: email || payload.email,
      name: name || payload.name,
    };

    const newToken = await new SignJWT(newPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(newPayload.email))
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    await cookieStore.set({
      name: COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno';
    return json({ error: message }, 500);
  }
}
