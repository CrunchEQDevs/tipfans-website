// src/app/api/me/route.ts
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { jwtVerify, JWTPayload, decodeJwt } from 'jose';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

const COOKIE_NAME = 'tf_token';

// ===== ENV =====
const WP_URL = process.env.WP_URL;               // ex: https://tipfans.com/wp
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN; // opcional, para fetchWpUserByEmail
const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET;
const SKIP_JWT_VERIFY = process.env.SKIP_JWT_VERIFY === '1';
const ALLOW_WP_TOKEN = process.env.ALLOW_WP_TOKEN === '1'; // ← NOVO

// ===== Mongo singleton (opcional) =====
let mongoClient: MongoClient | null = null;
async function getMongoSafe(): Promise<MongoClient | null> {
  if (!MONGODB_URI) return null;
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient;
}

// ===== Tipos =====
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
  displayName?: string;
  name?: string;
  role?: string;
  avatarUrl?: string;
  memberSince?: string;
  createdAt?: string | Date;
  stats?: Record<string, unknown>;
  phone?: string;
};

// ===== Utils =====
const asString = (v: unknown, fb = ''): string => (typeof v === 'string' ? v : fb);

function gravatarUrl(email: string, size = 128) {
  const hash = crypto.createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

// ===== WordPress helpers =====
async function fetchWpUserByEmail(email: string): Promise<WpUser | null> {
  if (!WP_URL || !WP_ADMIN_TOKEN) return null;
  const url = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', email);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;

  const arr = (await res.json()) as WpUser[];
  return arr.find((u) => u?.email?.toLowerCase() === email.toLowerCase()) || null;
}

// Valida um token **do WordPress** e devolve o utilizador WP
async function validateWpBearer(token: string): Promise<WpUser | null> {
  if (!ALLOW_WP_TOKEN || !WP_URL) return null;
  const url = `${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users/me`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return (await res.json()) as WpUser;
}

// ===== Mongo (opcional) =====
async function fetchMongoExtrasByEmail(email: string): Promise<MongoUser | null> {
  const client = await getMongoSafe();
  if (!client) return null;
  const db = client.db('tipfans');
  const col = db.collection<MongoUser>('users');
  return await col.findOne({ email });
}

// ===== Handler =====
export const GET = async (): Promise<NextResponse> => {
  let debugAuthSource = 'none';
  try {
    // 1) token via cookie OU Authorization: Bearer
    const cookieStore = await cookies();
    const tokenFromCookie = cookieStore.get(COOKIE_NAME)?.value ?? null;

    const hdrs = await headers();
    const auth = hdrs.get('authorization') ?? '';
    const tokenFromHeader = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    const token: string | null = tokenFromCookie || tokenFromHeader;
    debugAuthSource = tokenFromCookie ? 'cookie' : tokenFromHeader ? 'header' : 'none';

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthenticated' },
        { status: 401, headers: { 'x-auth-source': debugAuthSource, Vary: 'Cookie, Authorization' } }
      );
    }

    // 2) decodifica/valida JWT **próprio**
    let payload: JWTPayload | null = null;
    let jwtOk = false;

    if (SKIP_JWT_VERIFY) {
      try {
        payload = decodeJwt(token);
        jwtOk = true;
      } catch {
        jwtOk = false;
      }
    } else if (JWT_SECRET) {
      try {
        const verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
        payload = verified.payload;
        jwtOk = true;
      } catch {
        jwtOk = false;
      }
    }

    // 2.b) Fallback: aceitar token **do WordPress** se permitido
    let wpUserFromBearer: WpUser | null = null;
    if (!jwtOk) {
      wpUserFromBearer = await validateWpBearer(token);
      if (wpUserFromBearer) {
        // sintetiza um payload “mínimo” a partir do WP
        payload = {
          sub: wpUserFromBearer.email || String(wpUserFromBearer.id),
          email: wpUserFromBearer.email,
          name: wpUserFromBearer.name || wpUserFromBearer.slug,
          // role/avatar serão resolvidos mais abaixo
        };
        jwtOk = true;
        debugAuthSource += '+wp';
      }
    }

    if (!jwtOk || !payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401, headers: { 'x-auth-source': debugAuthSource, Vary: 'Cookie, Authorization' } }
      );
    }

    // 3) e-mail base
    const email =
      asString(payload.email) ||
      asString((payload as { user_email?: string }).user_email) ||
      asString(payload.sub);

    if (!email) {
      return NextResponse.json(
        { error: 'Invalid token payload (email missing)' },
        { status: 401, headers: { 'x-auth-source': debugAuthSource, Vary: 'Cookie, Authorization' } }
      );
    }

    // 4) valores do TOKEN (fallbacks)
    const tokenName =
      asString((payload as { name?: string }).name) ||
      asString((payload as { nome?: string }).nome) ||
      email.split('@')[0];

    const tokenRole = asString((payload as { role?: string }).role, 'Utilizador');
    const tokenMemberSince = asString((payload as { memberSince?: string }).memberSince);
    const tokenAvatar = asString((payload as { avatarUrl?: string }).avatarUrl);

    // 5) busca WP e Mongo (ambos opcionais)
    let wpUser: WpUser | null = null;
    let mongoDoc: MongoUser | null = null;

    try {
      // se veio do bearer WP, já temos o utilizador — evita 2º fetch
      wpUser = wpUserFromBearer ?? (await fetchWpUserByEmail(email));
    } catch {}
    try {
      mongoDoc = await fetchMongoExtrasByEmail(email);
    } catch {}

    // 6) resolve NOME/AVATAR/ROLE com prioridade: Mongo > WP > Token
    const mongoName =
      asString(mongoDoc?.displayName) || asString(mongoDoc?.name);

    const wpName = asString(wpUser?.name) || asString(wpUser?.slug);

    const finalName = mongoName || wpName || tokenName;
    const finalRole =
      asString(mongoDoc?.role) ||
      (Array.isArray(wpUser?.roles) && wpUser.roles?.[0]) ||
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

    // 7) resposta
    const user = {
      id: asString(payload.sub) || email,
      name: finalName,
      email,
      role: finalRole,
      memberSince: finalMemberSince || undefined,
      avatarUrl: finalAvatar,
      stats: mongoDoc?.stats || undefined,
      phone: mongoDoc?.phone || undefined,
    };

    const sourceParts = [
      mongoName ? 'name:mongo' : wpName ? 'name:wp' : 'name:token',
      mongoDoc?.avatarUrl
        ? 'avatar:mongo'
        : wpUser?.avatar_urls
        ? 'avatar:wp'
        : tokenAvatar
        ? 'avatar:token'
        : 'avatar:gravatar',
      mongoDoc?.role
        ? 'role:mongo'
        : Array.isArray(wpUser?.roles) && wpUser.roles?.length
        ? 'role:wp'
        : 'role:token',
    ];

    return NextResponse.json(
      { user },
      {
        headers: {
          'Cache-Control': 'no-store',
          Vary: 'Cookie, Authorization',
          'x-auth-source': debugAuthSource,
          'x-email': email,
          'x-user-source': sourceParts.join(','),
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid token' },
      { status: 401, headers: { 'x-auth-source': debugAuthSource, Vary: 'Cookie, Authorization' } }
    );
  }
};
