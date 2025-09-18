import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const POST_TYPE = (process.env.WP_POST_TYPE || 'tips').toLowerCase();

type Tipster = { id: number; slug: string; name: string; avatar: string | null; description?: string };

// ---- helpers ----
async function fetchPage(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${t}`);
  }
  return { data: await r.json(), totalPages: Number(r.headers.get('x-wp-totalpages') || '1') || 1 };
}
const pickAvatar = (u: any) =>
  u?.avatar_urls?.['96'] || u?.avatar_urls?.['48'] || u?.avatar_urls?.['24'] || null;

// Lista TODOS via /users (se o WP permitir listar)
async function listAllUsers(): Promise<Tipster[]> {
  const out: Tipster[] = [];
  let page = 1;
  const cbKey = '_';
  const cbVal = String(Date.now()); // cache-buster

  while (true) {
    const qs = new URLSearchParams({
      who: 'authors',
      per_page: '100',
      page: String(page),
      orderby: 'name',
      order: 'asc',
      _fields: 'id,slug,name,avatar_urls,description',
      [cbKey]: cbVal,
    });
    const { data, totalPages } = await fetchPage(`${WP_BASE}/wp-json/wp/v2/users?${qs}`);
    const arr: any[] = Array.isArray(data) ? data : [];
    for (const u of arr) {
      out.push({
        id: u.id,
        slug: u.slug,
        name: u.name || u.slug,
        avatar: pickAvatar(u),
        description: u?.description || '',
      });
    }
    if (page >= totalPages) break;
    page += 1;
  }
  return out;
}

// Fallback: extrai autores a partir de TODOS os posts
async function listAuthorsFromPosts(): Promise<Tipster[]> {
  const seen = new Map<number, Tipster>();
  let page = 1;
  const cbKey = '_';
  const cbVal = String(Date.now());

  while (true) {
    const qs = new URLSearchParams({
      _embed: '1',
      per_page: '100',
      page: String(page),
      orderby: 'date',
      order: 'desc',
      [cbKey]: cbVal,
    });
    const r = await fetch(`${WP_BASE}/wp-json/wp/v2/${POST_TYPE}?${qs.toString()}`, { cache: 'no-store' });
    if (!r.ok) break;
    const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
    const data = await r.json();
    const arr: any[] = Array.isArray(data) ? data : [];
    for (const p of arr) {
      const a = p?._embedded?.author?.[0];
      if (!a) continue;
      if (!seen.has(a.id)) {
        seen.set(a.id, {
          id: a.id,
          slug: a.slug || String(a.id),
          name: a.name || a.slug || `user-${a.id}`,
          avatar: pickAvatar(a),
          description: a?.description || '',
        });
      }
    }
    if (page >= totalPages) break;
    page += 1;
  }
  return Array.from(seen.values());
}

export async function GET(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 });
    }

    const urlIn = new URL(req.url);
    const q = (urlIn.searchParams.get('q') || '').trim().toLowerCase();

    // Tenta /users (todos) + une com fallback por posts
    let users: Tipster[] = [];
    try {
      users = await listAllUsers();
    } catch {
      // ignoramos: pode estar bloqueado no WP
    }
    const fromPosts = await listAuthorsFromPosts();

    // Une e deduplica (prioriza /users sobre fallback)
    const map = new Map<string, Tipster>();
    for (const u of fromPosts) {
      const key = u?.id ? `id:${u.id}` : `slug:${u.slug}`;
      map.set(key, u); // fallback entra primeiro
    }
    for (const u of users) {
      const key = u?.id ? `id:${u.id}` : `slug:${u.slug}`;
      map.set(key, u); // /users sobrepõe (nome mais recente)
    }

    let items = Array.from(map.values());

    // filtro opcional por q (normaliza acentos)
    if (q) {
      const qq = q.normalize('NFD').replace(/\p{Diacritic}/gu, '');
      items = items.filter((a) => {
        const nameN = (a.name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
        const slugN = (a.slug || '').toLowerCase();
        return nameN.includes(qq) || slugN.includes(qq);
      });
    }

    // ordena por nome
    items.sort((a, b) => a.name.localeCompare(b.name, 'pt'));

    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Falha ao listar autores', detail: String(e?.message ?? e) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
