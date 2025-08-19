// src/app/api/wp/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';

const COOKIE_NAME = 'tf_token';
const WP_URL = process.env.WP_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || null;

type AppJWTPayload = JWTPayload & { email?: string; sub?: string; role?: string };
type WpUser = { id: number; email?: string | null; roles?: string[] };
type WpPost = {
  id: number;
  author: number;
  date: string;
  modified: string;
  status: string;
  link?: string;
  title?: { rendered?: string };
  content?: { rendered?: string; protected?: boolean };
  featured_media?: number;
};

function nonEmpty(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}
async function getJwt(): Promise<AppJWTPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !JWT_SECRET) return null;
  const { payload } = await jwtVerify<AppJWTPayload>(token, new TextEncoder().encode(JWT_SECRET));
  return payload;
}
async function getWpAuthorIdByEmail(email: string): Promise<number> {
  if (!WP_ADMIN_TOKEN) throw new Error('WP_ADMIN_TOKEN ausente');
  const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
  u.searchParams.set('context', 'edit');
  u.searchParams.set('per_page', '100');
  u.searchParams.set('search', email);
  const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` }, cache: 'no-store' });
  if (!r.ok) throw new Error('Falha ao localizar utilizador no WP');
  const list = (await r.json()) as WpUser[];
  const found = Array.isArray(list) ? list.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase()) : undefined;
  if (!found?.id) throw new Error('Utilizador não encontrado no WP');
  return found.id;
}
async function getPostById(id: number): Promise<WpPost> {
  if (!WP_ADMIN_TOKEN) throw new Error('WP_ADMIN_TOKEN ausente');
  const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts/${id}`);
  u.searchParams.set('context', 'edit'); // precisamos do autor, status etc
  const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` }, cache: 'no-store' });
  if (!r.ok) throw new Error('Post não encontrado no WP');
  return (await r.json()) as WpPost;
}
function canEdit(payload: AppJWTPayload | null, post: WpPost, authorId: number): boolean {
  const role = String((payload?.role ?? '')).toLowerCase();
  if (role === 'administrator') return true;
  return post.author === authorId; // autor só edita os próprios posts
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });
    const payload = await getJwt();
    if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const post = await getPostById(id);
    const email = (payload.email ?? payload.sub) as string | undefined;
    if (!email) return NextResponse.json({ error: 'Sem e-mail no token' }, { status: 401 });
    const authorId = await getWpAuthorIdByEmail(email);

    if (!canEdit(payload, post, authorId)) {
      return NextResponse.json({ error: 'Sem permissão para aceder a este post' }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: post.id,
        author: post.author,
        date: post.date,
        status: post.status,
        title: post.title?.rendered ?? '',
        content: post.content?.rendered ?? '',
        featured_media: post.featured_media ?? null,
        link: post.link ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });
    const payload = await getJwt();
    if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const id = Number(params.id);
    if (!Number.isFinite(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const current = await getPostById(id);
    const email = (payload.email ?? payload.sub) as string | undefined;
    if (!email) return NextResponse.json({ error: 'Sem e-mail no token' }, { status: 401 });
    const authorId = await getWpAuthorIdByEmail(email);

    if (!canEdit(payload, current, authorId)) {
      return NextResponse.json({ error: 'Sem permissão para editar este post' }, { status: 403 });
    }

    const raw = await req.json().catch(() => ({} as Record<string, unknown>));
    const title = nonEmpty(raw.title) ? raw.title : undefined;
    const content = nonEmpty(raw.content) ? raw.content : undefined;
    const statusRaw = nonEmpty(raw.status) ? raw.status.toLowerCase() : undefined; // 'draft'|'publish'
    const status = statusRaw === 'publish' ? 'publish' : statusRaw === 'draft' ? 'draft' : undefined;
    const featured_media = typeof raw.featured_media === 'number' ? raw.featured_media : undefined;

    const res = await fetch(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts/${id}`, {
      method: 'POST', // WP aceita POST para update
      headers: {
        Authorization: `Bearer ${WP_ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(featured_media !== undefined ? { featured_media } : {}),
      }),
      cache: 'no-store',
    });

    const json = (await res.json().catch(() => ({}))) as { id?: number; link?: string; message?: string; status?: string };
    if (!res.ok) {
      return NextResponse.json({ error: json?.message ?? 'Falha ao atualizar post' }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      post: {
        id: json.id ?? id,
        link: json.link ?? null,
        status: json.status ?? status ?? current.status,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
