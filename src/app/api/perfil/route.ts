// src/app/api/perfil/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';
import { connectDB } from '@/lib/mongo';
import UserExtra from '@/models/UserExtra';

const COOKIE_NAME = 'tf_token';

type AppJWTPayload = JWTPayload & {
  email?: string;
  user_email?: string;
  sub?: string;
};

async function getEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET ausente no .env');

  const { payload } = await jwtVerify<AppJWTPayload>(token, new TextEncoder().encode(secret));

  const fromPayload =
    (typeof payload.email === 'string' && payload.email) ||
    (typeof payload.user_email === 'string' && payload.user_email) ||
    (typeof payload.sub === 'string' && payload.sub) ||
    null;

  return fromPayload;
}

async function fetchMeWithSameCookie() {
  const hdrs = await headers();
  const proto = hdrs.get('x-forwarded-proto') ?? 'http';
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  if (!host) throw new Error('Host não encontrado nos headers');

  const cookieStore = await cookies();
  const tf = cookieStore.get(COOKIE_NAME)?.value;
  if (!tf) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const url = `${proto}://${host}/api/me`;
  const meRes = await fetch(url, {
    headers: { cookie: `${COOKIE_NAME}=${tf}` },
    cache: 'no-store',
  });

  return meRes;
}

// GET /api/perfil → retorna o perfil (protegido)
export async function GET() {
  try {
    const email = await getEmailFromCookie();
    if (!email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Reutiliza a lógica consolidada do /api/me
    const meRes = await fetchMeWithSameCookie();
    if (!meRes.ok) {
      return NextResponse.json({ error: 'Falha ao enriquecer perfil' }, { status: 502 });
    }
    const data = (await meRes.json()) as { user?: unknown };

    return NextResponse.json({ ok: true, user: data.user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Token inválido', details: msg }, { status: 401 });
  }
}

// PATCH /api/perfil → atualiza extras no Mongo e devolve perfil atualizado
export async function PATCH(req: Request) {
  try {
    const email = await getEmailFromCookie();
    if (!email) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const raw = await req.json().catch(() => ({}));
    const body = (raw ?? {}) as {
      displayName?: unknown;
      avatarUrl?: unknown;
      phone?: unknown;
      stats?: unknown;
    };

    const updates: {
      displayName?: string;
      avatarUrl?: string;
      phone?: string;
      stats?: Record<string, unknown>;
    } = {};

    if (typeof body.displayName === 'string') updates.displayName = body.displayName.trim();
    if (typeof body.avatarUrl === 'string') updates.avatarUrl = body.avatarUrl.trim();
    if (typeof body.phone === 'string') updates.phone = body.phone.trim();
    if (body.stats && typeof body.stats === 'object' && !Array.isArray(body.stats)) {
      updates.stats = body.stats as Record<string, unknown>;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    await connectDB();

    await UserExtra.updateOne(
      { email },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
        $setOnInsert: { email, createdAt: new Date() },
      },
      { upsert: true }
    );

    // Depois de atualizar, devolve o perfil enriquecido “fresco”
    const meRes = await fetchMeWithSameCookie();
    if (!meRes.ok) {
      // fallback mínimo se /api/me falhar por algum motivo
      return NextResponse.json({ ok: true, user: { email }, warning: 'Falha ao enriquecer' });
    }
    const data = (await meRes.json()) as { user?: unknown };

    return NextResponse.json({ ok: true, user: data.user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Erro ao atualizar perfil', details: msg }, { status: 500 });
  }
}
