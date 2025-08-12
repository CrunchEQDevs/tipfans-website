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

type ExtrasDoc = {
  avatarUrl?: string;
  memberSince?: string;
  stats?: Record<string, unknown>;
} | null;

function isProd() {
  return process.env.NODE_ENV === 'production';
}

// ❌ Era useCrossSite → ✅ isCrossSiteEnv (não é Hook)
function isCrossSiteEnv() {
  // Set CROSS_SITE_COOKIES=1 se o front e a API estiverem em domínios diferentes
  return process.env.CROSS_SITE_COOKIES === '1';
}

export async function POST(req: Request) {
  try {
    // ===== 0) ENV =====
    const wpUrl = process.env.WP_URL;
    const jwtSecret = process.env.JWT_SECRET;
    if (!wpUrl) return NextResponse.json({ error: 'WP_URL ausente no .env' }, { status: 500 });
    if (!jwtSecret) return NextResponse.json({ error: 'JWT_SECRET ausente no .env' }, { status: 500 });

    // ===== 1) Entrada =====
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    // ===== 2) Login WP =====
    const loginRes = await fetch(`${wpUrl.replace(/\/$/, '')}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username: email, password }),
    });

    const loginData = (await loginRes.json()) as WpTokenResp;
    if (!loginRes.ok || !loginData.token) {
      const msg = typeof loginData.message === 'string' ? loginData.message : 'Falha no login WP';
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
    const extrasRaw = await UserExtra.findOne({ email }).lean().catch(() => null);
    const extras = (extrasRaw ?? null) as ExtrasDoc;

    // ===== 5) Payload =====
    const finalEmail = wpUser.email || loginData.user_email || email;
    const finalName =
      wpUser.name || wpUser.username || loginData.user_display_name || finalEmail.split('@')[0];
    const finalRole =
      (Array.isArray(wpUser.roles) && wpUser.roles.length ? wpUser.roles[0] : undefined) ||
      'Subscritor';
    const wpAvatar =
      (wpUser.avatar_urls && (wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'])) || '';

    const payload = {
      email: finalEmail,
      name: finalName,
      role: finalRole,
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
