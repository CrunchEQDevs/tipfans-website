// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

const COOKIE_NAME = 'tf_token';

type WpTokenResp = {
  token?: string;
  user_email?: string;
  user_display_name?: string;
  message?: string;
  [k: string]: unknown;
};

type WpUser = {
  id: number;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
  [k: string]: unknown;
};

type WpUserLite = {
  id: number;
  email?: string;
  slug?: string;      // costuma ser o login
  username?: string;  // alguns setups expõem
  roles?: string[];
};

type ExtrasDoc =
  | {
      avatarUrl?: string;
      memberSince?: string;
      stats?: Record<string, unknown>;
    }
  | null;

function isProd() {
  return process.env.NODE_ENV === 'production';
}

// não é Hook; só lê env
function isCrossSiteEnv() {
  // Set CROSS_SITE_COOKIES=1 se o front e a API estiverem em domínios diferentes
  return process.env.CROSS_SITE_COOKIES === '1';
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function pickPrimaryRole(roles: string[] | undefined): string {
  const list = (roles ?? []).map((r) => String(r).toLowerCase());
  const order = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
  for (const r of order) if (list.includes(r)) return r;
  return list[0] ?? 'subscriber';
}

export async function POST(req: Request) {
  try {
    // ===== 0) ENV =====
    const wpUrl = process.env.WP_URL;
    const jwtSecret = process.env.JWT_SECRET;
    const wpAdminToken = process.env.WP_ADMIN_TOKEN || null;

    if (!wpUrl) return NextResponse.json({ error: 'WP_URL ausente no .env' }, { status: 500 });
    if (!jwtSecret) return NextResponse.json({ error: 'JWT_SECRET ausente no .env' }, { status: 500 });

    // ===== 1) Entrada =====
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const emailOrLogin = isNonEmptyString((body as Record<string, unknown>).email)
      ? String((body as Record<string, unknown>).email).trim()
      : '';
    const password = isNonEmptyString((body as Record<string, unknown>).password)
      ? String((body as Record<string, unknown>).password)
      : '';
    if (!emailOrLogin || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    // ===== 2) Login WP =====
    const tokenUrl = `${wpUrl.replace(/\/$/, '')}/wp-json/jwt-auth/v1/token`;

    // 2a. tenta direto com o que o utilizador digitou (pode ser email ou username)
    let loginRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: emailOrLogin, password }),
    });
    let loginData = (await loginRes.json().catch(() => ({}))) as WpTokenResp;

    // 2b. se falhar e o input parecer email, tenta resolver o username via admin e refazer
    if ((!loginRes.ok || !loginData.token) && emailOrLogin.includes('@') && wpAdminToken) {
      try {
        const usersUrl = new URL(`${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users`);
        usersUrl.searchParams.set('context', 'edit');
        usersUrl.searchParams.set('per_page', '100');
        usersUrl.searchParams.set('search', emailOrLogin);

        const ures = await fetch(usersUrl.toString(), {
          headers: { Authorization: `Bearer ${wpAdminToken}` },
          cache: 'no-store',
        });

        if (ures.ok) {
          const list = (await ures.json().catch(() => [])) as WpUserLite[];
          const found = Array.isArray(list)
            ? list.find(
                (u) => isNonEmptyString(u?.email) && u.email!.toLowerCase() === emailOrLogin.toLowerCase()
              )
            : undefined;

          const wpLogin =
            (found?.slug && String(found.slug)) ||
            (found?.username && String(found.username)) ||
            '';

          if (isNonEmptyString(wpLogin)) {
            // tenta novamente com o username real do WP
            loginRes = await fetch(tokenUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              cache: 'no-store',
              body: JSON.stringify({ username: wpLogin, password }),
            });
            loginData = (await loginRes.json().catch(() => ({}))) as WpTokenResp;
          }
        }
      } catch {
        // mantém o erro original
      }
    }

    if (!loginRes.ok || !loginData.token) {
      const msg = isNonEmptyString(loginData.message) ? loginData.message : 'Falha no login WP';
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    // ===== 3) Perfil WP =====
    const meRes = await fetch(`${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` },
      cache: 'no-store',
    });
    if (!meRes.ok) return NextResponse.json({ error: 'Falha ao buscar perfil WP' }, { status: 502 });
    const wpUser = (await meRes.json()) as WpUser;

    // ===== 4) Extras Mongo (opcional) =====
    await connectDB().catch(() => null);
    const lookupEmail = wpUser.email || loginData.user_email || emailOrLogin;
    const extrasRaw = await UserExtra.findOne({ email: lookupEmail }).lean().catch(() => null);
    const extras = (extrasRaw ?? null) as ExtrasDoc;

    // ===== 5) Payload =====
    const finalEmail = wpUser.email || loginData.user_email || emailOrLogin;
    const finalName =
      wpUser.name || wpUser.username || loginData.user_display_name || finalEmail.split('@')[0];

    // Papel: tenta dos roles do /me; se vazio, tenta buscar via admin por email; fallback 'subscriber'
    let primaryRole = pickPrimaryRole(wpUser.roles);
    if ((!primaryRole || primaryRole === 'subscriber') && wpAdminToken && isNonEmptyString(finalEmail)) {
      try {
        const usersUrl2 = new URL(`${wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users`);
        usersUrl2.searchParams.set('context', 'edit');
        usersUrl2.searchParams.set('per_page', '100');
        usersUrl2.searchParams.set('search', finalEmail);
        const ures2 = await fetch(usersUrl2.toString(), {
          headers: { Authorization: `Bearer ${wpAdminToken}` },
          cache: 'no-store',
        });
        if (ures2.ok) {
          const list2 = (await ures2.json().catch(() => [])) as WpUserLite[];
          const found2 = Array.isArray(list2)
            ? list2.find(
                (u) => isNonEmptyString(u?.email) && u.email!.toLowerCase() === finalEmail.toLowerCase()
              )
            : undefined;
          if (found2?.roles?.length) {
            primaryRole = pickPrimaryRole(found2.roles);
          }
        }
      } catch {
        // ignora; fica o já determinado
      }
    }
    if (!primaryRole) primaryRole = 'subscriber';

    const wpAvatar =
      (wpUser.avatar_urls && (wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'])) || '';

    const payload = {
      email: finalEmail,
      name: finalName,
      role: String(primaryRole).toLowerCase(), // slug em inglês, minúsculo
      avatarUrl: (extras?.avatarUrl || wpAvatar || '') as string,
      memberSince: (extras?.memberSince || new Date().toISOString()) as string,
      stats: (extras?.stats || {}) as Record<string, unknown>,
    };

    // ===== 6) Assina o TEU JWT =====
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(finalEmail)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(jwtSecret));

    // ===== 7) Cookie httpOnly =====
    const cookieStore = await cookies();
    const cross = isCrossSiteEnv();
    await cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      sameSite: cross ? 'none' : 'lax',
      secure: cross ? true : isProd(),
    });

    return NextResponse.json({ ok: true, user: payload });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Erro interno', details: msg }, { status: 500 });
  }
}
