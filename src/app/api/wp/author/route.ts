// src/app/api/wp/author/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';

const COOKIE_NAME = 'tf_token';
const WP_URL = process.env.WP_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || null;

type AppJWTPayload = JWTPayload & { email?: string; sub?: string };
type WpUser = { id: number; email?: string; name?: string; roles?: string[] };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}
function pickPrimaryRole(roles: string[] | undefined): string {
  const list = (roles ?? []).map((r) => r.toLowerCase());
  const order = ['administrator', 'editor', 'author', 'contributor', 'subscriber'];
  for (const r of order) if (list.includes(r)) return r;
  return list[0] ?? 'subscriber';
}

async function getEmailFromCookie(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !JWT_SECRET) return null;
  const { payload } = await jwtVerify<AppJWTPayload>(token, new TextEncoder().encode(JWT_SECRET));
  const email = (isNonEmptyString(payload.email) && payload.email) || (isNonEmptyString(payload.sub) && payload.sub) || null;
  return email;
}

export async function GET() {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });

    const email = await getEmailFromCookie();
    if (!email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const url = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
    url.searchParams.set('context', 'edit');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('search', email);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Falha ao consultar utilizador no WP' }, { status: 502 });

    const list = (await res.json()) as unknown;
    const user = Array.isArray(list)
      ? (list as WpUser[]).find((u) => isNonEmptyString(u?.email) && u.email!.toLowerCase() === email.toLowerCase())
      : undefined;

    if (!user?.id) return NextResponse.json({ error: 'Utilizador não encontrado no WP' }, { status: 404 });

    const primaryRole = pickPrimaryRole(user.roles);
    return NextResponse.json({ ok: true, author: { id: user.id, email: user.email ?? email, name: user.name ?? '', role: primaryRole, roles: user.roles ?? [] } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
