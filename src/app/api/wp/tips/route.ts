// app/api/wp/tips/route.ts
import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';

function normalize(raw = '') {
  return raw.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function toSport(raw = ''): 'futebol' | 'basquete' | 'tenis' | 'esports' {
  const s = normalize(raw);
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

async function fetchCategoryIdBySlug(slug: string): Promise<number | null> {
  const url = `${WP_BASE}/wp-json/wp/v2/categories?slug=${encodeURIComponent(slug)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;
  const arr = await r.json();
  const cat = Array.isArray(arr) ? arr[0] : null;
  return cat?.id ?? null;
}

function stripTags(html = '') {
  return html.replace(/<[^>]*>/g, '').trim();
}

function mapPost(p: any) {
  const id = p?.id;
  const title = p?.title?.rendered ?? p?.title ?? '';
  const createdAt = p?.date ?? '';
  const author =
    p?._embedded?.author?.[0]?.name ??
    p?._embedded?.author?.[0]?.slug ??
    '';

  const cover =
    p?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
    p?.yoast_head_json?.og_image?.[0]?.url ??
    p?.jetpack_featured_media_url ??
    null;

  // ✅ agora mandamos excerpt (texto simples)
  const excerptHtml = p?.excerpt?.rendered ?? '';
  const excerpt = stripTags(excerptHtml);

  const termsFlat = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : [];
  const catSlugs: string[] = termsFlat.map((t: any) => t?.slug).filter(Boolean);
  const inferred =
    catSlugs?.find((slug) =>
      ['futebol', 'basquete', 'tenis', 'esports'].includes(toSport(slug))
    ) ?? '';

  const sport = toSport(inferred);

  return {
    id,
    title,
    author,
    createdAt,
    cover,
    sport,
    excerpt,                 // 👈 enviado para os cards
    hrefPost: `/tips/${sport}/${id}`,
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
    const postType = (url.searchParams.get('type') || process.env.WP_POST_TYPE || 'tips').toLowerCase();

    const sport = toSport(sportParam);
    const catId = await fetchCategoryIdBySlug(sport);

    const qs = new URLSearchParams({
      per_page: perPage,
      page,
      _embed: '1',
    });

    let endpoint = `${WP_BASE}/wp-json/wp/v2/${postType}?${qs.toString()}`;
    if (catId) {
      endpoint += `&categories=${catId}`;
    } else {
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
