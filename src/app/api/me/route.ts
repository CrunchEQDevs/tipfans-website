// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { jwtVerify, JWTPayload, decodeJwt } from 'jose';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const COOKIE_NAME = 'tf_token';

// ===== ENV =====
const WP_URL = process.env.WP_URL; // ex: https://tipfans.com/wp
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN; // token p/ /wp-json/wp/v2
const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET;
const SKIP_JWT_VERIFY = process.env.SKIP_JWT_VERIFY === '1';

// ===== Mongo singleton =====
let mongoClient: MongoClient | null = null;
async function getMongo(): Promise<MongoClient> {
  if (!MONGODB_URI) throw new Error('MONGODB_URI missing');
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

// ===== Tipos =====
type CurrentUser = {
  id: string;
  nome: string;
  email: string;
  role?: string;
  memberSince?: string;
  avatarUrl?: string;
  stats?: Record<string, unknown>;
  phone?: string;
};

type WpUser = {
  id: number;
  name: string;
  slug: string;
  email?: string;
  roles?: string[];
  avatar_urls?: Record<string, string>;
};

type MongoUser = {
  email: string;
  nome?: string;
  displayName?: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
  memberSince?: string;
  createdAt?: string | Date;
  stats?: Record<string, unknown>;
  phone?: string;
};

const asString = (v: unknown, fb = ''): string =>
  typeof v === 'string' ? v : fb;

function gravatarUrl(email: string, size = 128) {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

// ===== WordPress =====
async function fetchWpUserByEmail(email: string): Promise<WpUser | null> {
  if (!WP_URL || !WP_ADMIN_TOKEN) return null;
  const url = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', email);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${WP_ADMIN_TOKEN}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const arr = (await res.json()) as WpUser[];
  return arr.find((u) => u?.email?.toLowerCase() === email.toLowerCase()) || null;
}

// ===== Mongo =====
async function fetchMongoExtrasByEmail(email: string): Promise<MongoUser | null> {
  if (!MONGODB_URI) return null;
  const client = await getMongo();
  const db = client.db('tipfans'); // ajuste se necessário
  const col = db.collection<MongoUser>('users'); // ajuste se necessário
  return await col.findOne({ email });
}

export const GET = async (): Promise<NextResponse> => {
  try {
    // 1) token via cookie OU Authorization: Bearer
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value ?? null;

    const hdrs = await headers();
    const auth = hdrs.get('authorization') ?? '';
    const tokenFromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    const token: string | null = tokenFromCookie || tokenFromHeader;
    if (!token) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    // 2) decodifica/valida JWT
    let payload: JWTPayload;
    if (SKIP_JWT_VERIFY) {
      try {
        payload = decodeJwt(token);
      } catch {
        return NextResponse.json({ error: 'Invalid token (decode)' }, { status: 401 });
      }
    } else {
      if (!JWT_SECRET) {
        return NextResponse.json({ error: 'JWT_SECRET missing' }, { status: 500 });
      }
      const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      payload = verified.payload;
    }

    // 3) e-mail base
    const email =
      asString(payload.email) ||
      asString((payload as { user_email?: string }).user_email) ||
      asString(payload.sub);

    if (!email) {
      return NextResponse.json({ error: 'Invalid token payload (email missing)' }, { status: 401 });
    }

    // 4) valores do TOKEN (fallbacks)
    const tokenNome =
      asString((payload as { name?: string }).name) ||
      asString((payload as { nome?: string }).nome) ||
      email.split('@')[0];

    const tokenRole = asString((payload as { role?: string }).role, 'Utilizador');
    const tokenMemberSince = asString((payload as { memberSince?: string }).memberSince);
    const tokenAvatar = asString((payload as { avatarUrl?: string }).avatarUrl);

    // 5) busca WP e Mongo
    let wpUser: WpUser | null = null;
    let mongoDoc: MongoUser | null = null;

    try {
      wpUser = await fetchWpUserByEmail(email);
    } catch {}
    try {
      mongoDoc = await fetchMongoExtrasByEmail(email);
    } catch {}

    // 6) resolve NOME/AVATAR/ROLE com prioridade: Mongo > WP > Token
    const mongoNome =
      asString(mongoDoc?.displayName) ||
      asString(mongoDoc?.nome) ||
      asString(mongoDoc?.name);

    const wpNome = asString(wpUser?.name) || asString(wpUser?.slug);

    const finalNome = mongoNome || wpNome || tokenNome;
    const finalRole =
      asString(mongoDoc?.role) ||
      (Array.isArray(wpUser?.roles) && wpUser.roles[0]) ||
      tokenRole ||
      'Utilizador';

    let finalAvatar =
      asString(mongoDoc?.avatarUrl) ||
      asString(wpUser?.avatar_urls?.['96'] || wpUser?.avatar_urls?.['48']) ||
      tokenAvatar ||
      '';

    if (!finalAvatar) finalAvatar = gravatarUrl(email);

    const finalMemberSince =
      asString(mongoDoc?.memberSince) ||
      tokenMemberSince ||
      (mongoDoc?.createdAt ? new Date(mongoDoc.createdAt).toISOString() : '');

    const user: CurrentUser = {
      id: asString(payload.sub) || email,
      nome: finalNome,
      email,
      role: finalRole,
      memberSince: finalMemberSince || undefined,
      avatarUrl: finalAvatar,
      stats: mongoDoc?.stats || undefined,
      phone: mongoDoc?.phone || undefined,
    };

    // Cabeçalho de debug para você ver qual fonte “venceu”
    const sourceParts = [
      mongoNome ? 'name:mongo' : wpNome ? 'name:wp' : 'name:token',
      mongoDoc?.avatarUrl
        ? 'avatar:mongo'
        : wpUser?.avatar_urls
        ? 'avatar:wp'
        : tokenAvatar
        ? 'avatar:token'
        : 'avatar:gravatar',
      mongoDoc?.role
        ? 'role:mongo'
        : Array.isArray(wpUser?.roles) && wpUser.roles.length
        ? 'role:wp'
        : 'role:token',
    ];

    return NextResponse.json(
      { user },
      {
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-user-source': sourceParts.join(','),
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
};
