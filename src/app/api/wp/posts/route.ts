// src/app/api/wp/posts/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';

const COOKIE_NAME = 'tf_token';
const WP_URL = process.env.WP_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || null;

type AppJWTPayload = JWTPayload & { email?: string; sub?: string };
type WpUser = { id: number; email?: string; roles?: string[] };
type WpPost = {
  id: number;
  date: string;
  modified: string;
  status: string;
  link?: string;
  title?: { rendered?: string };
  featured_media?: number;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

async function getEmailFromCookie(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !JWT_SECRET) return null;
  const { payload } = await jwtVerify<AppJWTPayload>(token, new TextEncoder().encode(JWT_SECRET));
  return (isNonEmptyString(payload.email) && payload.email) || (isNonEmptyString(payload.sub) && payload.sub) || null;
}
async function getWpAuthorId(email: string): Promise<number> {
  const url = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
  url.searchParams.set('context', 'edit');
  url.searchParams.set('per_page', '100');
  url.searchParams.set('search', email);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` }, cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao localizar utilizador no WP');
  const list = (await res.json()) as WpUser[];
  const found = list.find((u) => isNonEmptyString(u.email) && u.email!.toLowerCase() === email.toLowerCase());
  if (!found?.id) throw new Error('Utilizador não encontrado no WP');
  return found.id;
}

export async function GET(req: Request) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });

    const email = await getEmailFromCookie();
    if (!email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const urlReq = new URL(req.url);
    const perPage = Math.min(Math.max(Number(urlReq.searchParams.get('per_page') ?? 10), 1), 50);
    const page = Math.max(Number(urlReq.searchParams.get('page') ?? 1), 1);
    const summary = urlReq.searchParams.get('summary') === '1';

    const authorId = await getWpAuthorId(email);

    if (summary) {
      // usar X-WP-Total com per_page=1 para publicar/rascunho
      async function count(status: 'publish' | 'draft') {
        const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts`);
        u.searchParams.set('author', String(authorId));
        u.searchParams.set('status', status);
        u.searchParams.set('per_page', '1');
        u.searchParams.set('context', 'edit');
        const r = await fetch(u.toString(), { headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` }, cache: 'no-store' });
        if (!r.ok) return 0;
        return Number(r.headers.get('X-WP-Total') ?? '0');
      }
      const [pub, draft] = await Promise.all([count('publish'), count('draft')]);
      return NextResponse.json({ ok: true, summary: { published: pub, drafts: draft, total: pub + draft } });
    }

    const url = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts`);
    url.searchParams.set('author', String(authorId));
    url.searchParams.set('status', 'any'); // requer token com permissão (admin)
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    url.searchParams.set('_fields', 'id,date,modified,status,link,title,featured_media');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Falha a obter posts' }, { status: 502 });

    const posts = (await res.json()) as WpPost[];
    const items = posts.map((p) => ({
      id: p.id,
      date: p.date,
      status: p.status,
      title: p.title?.rendered ?? '(sem título)',
      link: p.link ?? null,
      featured_media: p.featured_media ?? null,
    }));

    const total = Number(res.headers.get('X-WP-Total') ?? '0');
    const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? '0');

    return NextResponse.json({ ok: true, items, pagination: { page, perPage, total, totalPages } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });

    const email = await getEmailFromCookie();
    if (!email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const body = (await req.json()) as unknown;
    const b = body as {
      title?: unknown;
      content?: unknown;
      status?: unknown; // 'draft' | 'publish'
      featured_media?: unknown; // number
      categories?: unknown; // number[]
      tags?: unknown; // number[]
    };

    const title = isNonEmptyString(b.title) ? b.title.trim() : '';
    const content = isNonEmptyString(b.content) ? b.content : '';
    const statusRaw = isNonEmptyString(b.status) ? b.status.toLowerCase() : 'draft';
    const status = statusRaw === 'publish' ? 'publish' : 'draft';
    const featured_media =
      typeof b.featured_media === 'number' ? b.featured_media : undefined;
    const categories =
      Array.isArray(b.categories) ? (b.categories as unknown[]).filter((n) => typeof n === 'number') : undefined;
    const tags =
      Array.isArray(b.tags) ? (b.tags as unknown[]).filter((n) => typeof n === 'number') : undefined;

    if (!title) return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });

    const authorId = await getWpAuthorId(email);

    const res = await fetch(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WP_ADMIN_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status,
        author: authorId,
        ...(featured_media ? { featured_media } : {}),
        ...(categories?.length ? { categories } : {}),
        ...(tags?.length ? { tags } : {}),
      }),
      cache: 'no-store',
    });

    const json = (await res.json().catch(() => ({}))) as { id?: number; link?: string; message?: string };
    if (!res.ok) {
      return NextResponse.json({ error: json?.message ?? 'Falha ao criar post' }, { status: res.status });
    }

    return NextResponse.json({ ok: true, post: { id: json.id, link: json.link ?? null } }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
