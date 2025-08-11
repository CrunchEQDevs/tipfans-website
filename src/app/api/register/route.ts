// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

const COOKIE_NAME = 'tf_token';

const WP_URL = process.env.WP_URL?.replace(/\/$/, '') || '';
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || '';
const JWT_SECRET = process.env.JWT_SECRET || '';

type WPUser = {
  id: number;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
};

type WPCreateUserResp = {
  id: number;
  email?: string;
  name?: string;
  roles?: string[];
};

type WPLoginResp =
  | { token: string; user_email?: string; user_display_name?: string }
  | { code?: string; message?: string };

export async function POST(req: Request) {
  try {
    // ===== 0) Validar ENV =====
    if (!WP_URL) {
      return NextResponse.json({ error: 'WP_URL ausente no .env' }, { status: 500 });
    }
    if (!WP_ADMIN_TOKEN) {
      return NextResponse.json({ error: 'WP_ADMIN_TOKEN ausente no .env' }, { status: 500 });
    }
    if (!JWT_SECRET) {
      return NextResponse.json({ error: 'JWT_SECRET ausente no .env' }, { status: 500 });
    }

    // ===== 1) Entrada =====
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    // ===== 2) Criar usuário no WordPress (via admin) =====
    const createRes = await fetch(`${WP_URL}/wp-json/wp/v2/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WP_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({ username, email, password }),
      cache: 'no-store',
    });

    const createData = (await createRes.json().catch(() => ({}))) as WPCreateUserResp & {
      code?: string;
      message?: string;
    };

    if (!createRes.ok) {
      return NextResponse.json(
        {
          error: createData?.message || 'Erro ao criar usuário no WordPress.',
          code: createData?.code || 'wp_error',
        },
        { status: 400 }
      );
    }

    // Papel inicial (se WP retornar)
    const createdRole =
      Array.isArray(createData.roles) && createData.roles.length
        ? createData.roles[0]
        : 'subscriber';

    // ===== 3) Login no WP com o usuário recém-criado =====
    // Importante: o endpoint de token espera "username" (login), não email.
    const wpLoginRes = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      cache: 'no-store',
    });

    const wpLoginData = (await wpLoginRes.json().catch(() => ({}))) as WPLoginResp;
    if (!wpLoginRes.ok || !('token' in wpLoginData) || !wpLoginData.token) {
      const msg =
        typeof (wpLoginData as { message?: string }).message === 'string'
          ? (wpLoginData as { message?: string }).message
          : 'Falha no login automático após registro.';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const bearer = wpLoginData.token;

    // ===== 4) Buscar perfil do WP =====
    const wpMeRes = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
    });

    if (!wpMeRes.ok) {
      return NextResponse.json(
        { error: 'Falha ao buscar perfil do WordPress após registro.' },
        { status: 502 }
      );
    }

    const wpUser = (await wpMeRes.json()) as WPUser;

    // ===== 5) Upsert extras no Mongo =====
    try {
      await connectDB();
      await UserExtra.updateOne(
        { email: wpUser.email || email },
        {
          $setOnInsert: {
            email: wpUser.email || email,
            memberSince: new Date().toISOString(),
          },
          $set: {
            avatarUrl:
              (wpUser.avatar_urls && (wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'])) ||
              '',
            stats: {},
          },
        },
        { upsert: true }
      );
    } catch {
      // não falha o fluxo se o Mongo der erro
    }

    // ===== 6) Montar payload do seu JWT =====
    const finalEmail = wpUser.email || email;
    const finalName =
      wpUser.name || wpUser.username || finalEmail.split('@')[0];
    const finalRole =
      (Array.isArray(wpUser.roles) && wpUser.roles.length ? wpUser.roles[0] : undefined) ||
      createdRole ||
      'Subscritor';

    const wpAvatar =
      (wpUser.avatar_urls && (wpUser.avatar_urls['96'] || wpUser.avatar_urls['48'])) || '';

    const payload = {
      email: finalEmail,
      name: finalName,
      role: finalRole,
      avatarUrl: wpAvatar || '',
      memberSince: new Date().toISOString(),
      stats: {} as Record<string, unknown>,
    };

    // ===== 7) Assinar seu JWT e setar cookie =====
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(finalEmail)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode(JWT_SECRET));

    const cookieStore = await cookies();
    await cookieStore.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    // ===== 8) Se for admin, retorna redirect ao painel WP =====
    if (finalRole === 'administrator') {
      return NextResponse.json({
        ok: true,
        role: finalRole,
        redirect: `${WP_URL}/wp-admin/index.php`,
      });
    }

    // ===== 9) Sucesso com login automático =====
    return NextResponse.json({
      ok: true,
      role: finalRole,
      message: 'Usuário criado e autenticado com sucesso.',
      // opcional: token, caso queira debugar
      // token,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[REGISTER_API_ERROR]', msg);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
