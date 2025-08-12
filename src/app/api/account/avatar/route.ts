// src/app/api/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

const COOKIE_NAME = 'tf_token';

type WpTokenResp =
  | {
      token: string;
      user_email?: string;
      user_display_name?: string;
    }
  | {
      code: string;
      message: string;
      data?: unknown;
    };

type WpUser = {
  id: number;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
};

type ExtrasDoc = {
  avatarUrl?: string;
  memberSince?: string;
  stats?: Record<string, unknown>;
} | null;

type LoginBody = {
  username: string;
  password: string;
};

function getJwtSecret(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não definido no ambiente');
  }
  return new TextEncoder().encode(jwtSecret);
}

export async function POST(req: Request) {
  try {
    // 0) Validar ENV
    const wpUrl = process.env.WP_URL;
    if (!wpUrl) {
      return NextResponse.json(
        { error: 'WP_URL não configurado' },
        { status: 500 }
      );
    }

    // 1) Body
    const { username, password } = (await req.json()) as LoginBody;
    if (!username || !password) {
      return NextResponse.json(
        { error: 'username e password são obrigatórios' },
        { status: 400 }
      );
    }

    // 2) Autenticar no WordPress (JWT plugin)
    const tokenResp = await fetch(`${wpUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ username, password }),
    });

    if (!tokenResp.ok) {
      const errJson = (await tokenResp.json()) as Record<string, unknown>;
      return NextResponse.json(
        { error: 'Falha ao autenticar no WordPress', details: errJson },
        { status: 401 }
      );
    }

    const tokenJson = (await tokenResp.json()) as WpTokenResp;
    if (!('token' in tokenJson) || !tokenJson.token) {
      return NextResponse.json(
        { error: 'Resposta do WP sem token válido', details: tokenJson },
        { status: 401 }
      );
    }

    const wpBearer = tokenJson.token;

    // 3) Buscar dados do usuário logado no WP
    const meResp = await fetch(`${wpUrl}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${wpBearer}` },
      cache: 'no-store',
    });

    if (!meResp.ok) {
      const errJson = (await meResp.json()) as Record<string, unknown>;
      return NextResponse.json(
        { error: 'Falha ao obter dados do usuário no WP', details: errJson },
        { status: 401 }
      );
    }

    const me = (await meResp.json()) as WpUser;

    // 4) Extras no Mongo (avatarUrl, memberSince, stats)
    await connectDB();
    const extras = (await UserExtra.findOne({ wpUserId: me.id }).lean()) as ExtrasDoc;

    const avatarUrl =
      extras?.avatarUrl ||
      me.avatar_urls?.['96'] ||
      me.avatar_urls?.['48'] ||
      me.avatar_urls?.['24'] ||
      undefined;

    // 5) Montar payload do JWT da aplicação
    const payload = {
      email: me.email ?? tokenJson.user_email ?? '',
      name: me.name ?? tokenJson.user_display_name ?? me.username ?? 'User',
      role: Array.isArray(me.roles) && me.roles.length > 0 ? me.roles[0] : 'subscriber',
      avatarUrl,
      memberSince: extras?.memberSince ?? new Date().toISOString(),
      stats: extras?.stats ?? {},
    };

    // 6) Assinar JWT próprio
    const secret = getJwtSecret();
    const appToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // 7) Definir cookie httpOnly
    const ck = await cookies();
    ck.set(COOKIE_NAME, appToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return NextResponse.json(
      {
        ok: true,
        user: payload,
      },
      { status: 200 }
    );
  } catch (err) {
    // Nunca usar hooks aqui. Apenas tratar erro.
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
