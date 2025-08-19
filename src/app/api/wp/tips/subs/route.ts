import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, type JWTPayload } from 'jose';


const COOKIE = 'tf_token';
const WP_URL = process.env.WP_URL!;
const JWT_SECRET = process.env.JWT_SECRET!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || '';
const CAT_SLUG = process.env.WP_TIPS_SUBS_CATEGORY_SLUG || 'tips-subscritor';

type AppJWTPayload = JWTPayload & { email?: string; sub?: string; role?: string };

type WpCat = { id: number; slug: string };
type WpPost = {
  id: number;
  date: string;
  status: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  _embedded?: {
    ['wp:featuredmedia']?: Array<{ source_url?: string }>;
    author?: Array<{ name?: string }>;
  };
};

function nonEmpty(s?: unknown): s is string { return typeof s === 'string' && s.trim().length > 0; }

async function getJwt(): Promise<AppJWTPayload | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !JWT_SECRET) return null;
  const { payload } = await jwtVerify<AppJWTPayload>(token, new TextEncoder().encode(JWT_SECRET));
  return payload;
}

async function getCategoryIdBySlug(slug: string): Promise<number> {
  const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/categories`);
  u.searchParams.set('search', slug);
  u.searchParams.set('per_page', '100');
  const r = await fetch(u.toString(), { cache: 'no-store' });
  if (!r.ok) throw new Error('Falha ao obter categorias');
  const list = (await r.json()) as WpCat[];
  const found = list.find((c) => c.slug === slug) || list[0];
  if (!found?.id) throw new Error('Categoria não encontrada');
  return found.id;
}

async function getWpUserIdByEmail(email: string): Promise<number> {
  const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/users`);
  u.searchParams.set('context', 'edit');
  u.searchParams.set('per_page', '100');
  u.searchParams.set('search', email);
  const r = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${WP_ADMIN_TOKEN}` },
    cache: 'no-store',
  });
  if (!r.ok) throw new Error('Falha ao localizar utilizador no WP');
  const list = (await r.json()) as Array<{ id: number; email?: string }>;
  const f = list.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  if (!f?.id) throw new Error('Utilizador não encontrado no WP');
  return f.id;
}

/** GET: lista publicadas da categoria tips-subscritor */
export async function GET(req: Request) {
  try {
    if (!WP_URL) return NextResponse.json({ error: 'WP_URL ausente' }, { status: 500 });
    const { searchParams } = new URL(req.url);
    const per_page = Math.max(1, Math.min(24, Number(searchParams.get('per_page') ?? 12)));
    const page = Math.max(1, Number(searchParams.get('page') ?? 1));
    const catId = await getCategoryIdBySlug(CAT_SLUG);

    const u = new URL(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/posts`);
    u.searchParams.set('status', 'publish');
    u.searchParams.set('per_page', String(per_page));
    u.searchParams.set('page', String(page));
    u.searchParams.set('categories', String(catId));
    u.searchParams.set('_embed', '1'); // para pegar imagem/autoria

    const r = await fetch(u.toString(), { cache: 'no-store' });
    if (!r.ok) return NextResponse.json({ error: 'Falha no WP' }, { status: r.status });
    const list = (await r.json()) as WpPost[];

    const items = list.map((p) => {
      const img = p._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? null;
      const author = p._embedded?.author?.[0]?.name ?? null;
      const cleanExcerpt = (p.excerpt?.rendered || '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        id: p.id,
        title: p.title?.rendered ?? '(Sem título)',
        excerpt: cleanExcerpt || null,
        imageUrl: img,
        dateISO: p.date,
        link: p.link ?? null,
        author,
      };
    });

    return NextResponse.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST: subscritor envia tip → cria post com status pending/draft na categoria */
export async function POST(req: Request) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) {
      return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });
    }
    const payload = await getJwt();
    if (!payload) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const email = (payload.email ?? payload.sub) as string | undefined;
    if (!nonEmpty(email)) return NextResponse.json({ error: 'Sem email no token' }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as {
      title?: string;
      content?: string;
      featured_media?: number;
      status?: 'draft' | 'pending';
    };

    const title = nonEmpty(body.title) ? body.title : '';
    if (!title.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 });

    const content = nonEmpty(body.content) ? body.content : '';
    const status = body.status === 'draft' ? 'draft' : 'pending'; // mais seguro: pending por padrão
    const featured_media = typeof body.featured_media === 'number' ? body.featured_media : undefined;

    const catId = await getCategoryIdBySlug(CAT_SLUG);
    const authorId = await getWpUserIdByEmail(email);

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
        categories: [catId],
        ...(featured_media ? { featured_media } : {}),
      }),
      cache: 'no-store',
    });

    const json = (await res.json().catch(() => ({}))) as { id?: number; link?: string; message?: string };
    if (!res.ok || !json.id) {
      return NextResponse.json({ error: json?.message ?? 'Falha ao criar tip' }, { status: res.status || 500 });
    }

    return NextResponse.json({ ok: true, post: { id: json.id, link: json.link ?? null } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
