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
    excerpt,
    hrefPost: `/tips/${sport}/${id}`,
  };
}

async function fetchWpPage(endpoint: string) {
  const r = await fetch(endpoint, { cache: 'no-store' });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`Falha ao consultar WP: ${r.status} ${txt}`);
  }
  const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
  const data = await r.json();
  return { data, totalPages };
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
    const sportParam = url.searchParams.get('sport') || 'futebol'; // agora aceita 'all'
    const perPageRaw = url.searchParams.get('per_page') || '12';   // aceita 'all'
    const page = url.searchParams.get('page') || '1';
    const postType = (url.searchParams.get('type') || process.env.WP_POST_TYPE || 'tips').toLowerCase();
    const orderby = url.searchParams.get('orderby') || 'date';
    const order = (url.searchParams.get('order') || 'desc').toLowerCase();

    // construímos o QS base
    const qs = new URLSearchParams({
      _embed: '1',
      orderby,
      order,
    });

    // se per_page = all, vamos paginar internamente com 100 por página
    const wantsAll = perPageRaw.toLowerCase() === 'all';
    const perPage = wantsAll ? '100' : perPageRaw;
    if (!wantsAll) {
      qs.set('per_page', perPage);
      qs.set('page', page);
    } else {
      qs.set('per_page', perPage); // 100 por requisição
    }

    // filtro por categoria (a não ser que o sport seja 'all')
    const sport = sportParam.toLowerCase();
    let catId: number | null = null;

    if (sport !== 'all') {
      const sportKey = toSport(sport);
      catId = await fetchCategoryIdBySlug(sportKey);
      if (catId) {
        qs.set('categories', String(catId));
      } else {
        qs.set('category_name', encodeURIComponent(sportKey));
      }
    }

    const baseEndpoint = `${WP_BASE}/wp-json/wp/v2/${postType}`;

    // buscar
    let posts: any[] = [];

    if (!wantsAll) {
      const endpoint = `${baseEndpoint}?${qs.toString()}`;
      const { data } = await fetchWpPage(endpoint);
      posts = Array.isArray(data) ? data : [];
    } else {
      // paginação interna até trazer tudo
      let current = 1;
      let totalPages = 1;
      do {
        const pageQs = new URLSearchParams(qs);
        pageQs.set('page', String(current));
        const endpoint = `${baseEndpoint}?${pageQs.toString()}`;
        const { data, totalPages: tp } = await fetchWpPage(endpoint);
        totalPages = tp || 1;

        if (Array.isArray(data) && data.length) {
          posts.push(...data);
        }

        current += 1;
        // segurança: limite duro de 10 páginas (1000 posts) para não travar
        if (current > Math.max(10, totalPages)) break;
      } while (current <= totalPages);
    }

    const items = Array.isArray(posts) ? posts.map(mapPost) : [];
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
