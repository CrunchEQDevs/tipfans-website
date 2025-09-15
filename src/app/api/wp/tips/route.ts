/* app/api/wp/tips/route.ts
 *
 * Endpoint: /api/wp/tips?sport=futebol&per_page=12&page=1
 *
 * Objetivo:
 *  - Retorna uma lista de posts do WordPress filtrada por categoria (slug do esporte).
 *  - Mantém compatibilidade com WP padrão (post type "posts") OU CPT (defina WP_POST_TYPE=tips).
 *  - Retorna campos normalizados que os seus cards usam: id, title, author, createdAt, cover, excerpt, sport, hrefPost.
 */

import { NextResponse } from 'next/server';

/** Base do WP, vinda do .env.local */
const WP_BASE = process.env.WP_BASE_URL ?? '';
/** Post type (padrão 'posts'; se usar CPT coloque 'tips' no .env) */
const WP_POST_TYPE = (process.env.WP_POST_TYPE ?? 'posts').toLowerCase();

/** Normaliza o texto para comparar slugs de esportes */
function normalize(raw = '') {
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

/** Converte qualquer variação para um dos 4 esportes suportados */
function toSport(raw = ''): 'futebol' | 'basquete' | 'tenis' | 'esports' {
  const s = normalize(raw);
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

/** Busca o ID da categoria por slug */
async function fetchCategoryIdBySlug(slug: string): Promise<number | null> {
  // /wp-json/wp/v2/categories?slug=futebol
  const url = `${WP_BASE}/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;
  const arr = await r.json();
  const cat = Array.isArray(arr) ? arr[0] : null;
  return cat?.id ?? null;
}

/** Mapeia um post bruto do WP para o formato dos seus cards */
function mapPost(p: any): {
  id: number | string;
  title: string;
  author?: string;
  createdAt?: string;
  cover?: string | null;
  excerpt?: string;
  sport: 'futebol' | 'basquete' | 'tenis' | 'esports';
  hrefPost: string;
} {
  const id = p?.id;
  const title = p?.title?.rendered ?? '';
  const createdAt = p?.date ?? '';
  const author =
    p?._embedded?.author?.[0]?.name ??
    p?._embedded?.author?.[0]?.slug ??
    '';
  const cover =
    p?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
    p?.jetpack_featured_media_url ??
    null;
  const excerpt = p?.excerpt?.rendered ?? '';

  // tenta inferir o esporte pelos termos/filtros do próprio post
  const termsFlat = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : [];
  const catSlugs: string[] = termsFlat
    .map((t: any) => t?.slug)
    .filter(Boolean);

  const inferred =
    catSlugs?.find((slug) =>
      ['futebol', 'basquete', 'tenis', 'esports'].includes(toSport(slug))
    ) ?? '';

  const sport = toSport(inferred);

  return {
    id,
    title,
    createdAt,
    author,
    cover,
    excerpt,
    sport,
    hrefPost: `/tips/${sport}/${id}`, // 🔗 link pronto pro botão "Ver mais"
  };
}

export async function GET(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json(
        { error: 'WP_BASE_URL não definido no .env.local' },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const sportParam = url.searchParams.get('sport') || 'futebol';
    const perPage = url.searchParams.get('per_page') || '12';
    const page = url.searchParams.get('page') || '1';

    const sport = toSport(sportParam);

    // 1) Resolve ID da categoria pelo slug do esporte
    const catId = await fetchCategoryIdBySlug(sport);

    // 2) Monta endpoint do WP para lista
    //    - usa _embed=1 para trazer autor e mídia num único request
    //    - se tivermos catId, filtramos via ?categories=ID
    const qs = new URLSearchParams({
      per_page: perPage,
      page,
      _embed: '1',
    });

    let endpoint = `${WP_BASE}/wp-json/wp/v2/${WP_POST_TYPE}?${qs.toString()}`;
    if (catId) {
      endpoint += `&categories=${catId}`;
    } else {
      // fallback: alguns sites aceitam category_name pelo slug (não é oficial em todos)
      endpoint += `&category_name=${encodeURIComponent(sport)}`;
    }

    const r = await fetch(endpoint, { cache: 'no-store' });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return NextResponse.json(
        { error: 'Falha ao consultar WP', detail: txt },
        { status: 502 }
      );
    }

    const posts = await r.json();
    const items = Array.isArray(posts) ? posts.map(mapPost) : [];

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
