import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const WP_POST_TYPE = (process.env.WP_POST_TYPE ?? 'posts').toLowerCase();

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
function formatDatePt(dateIso = ''): string {
  try {
    const d = new Date(dateIso);
    return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return dateIso || '';
  }
}

function mapDetail(p: any) {
  const id = p?.id;
  const title = p?.title?.rendered ?? '';
  const date = formatDatePt(p?.date ?? '');
  const author =
    p?._embedded?.author?.[0]?.name ??
    p?._embedded?.author?.[0]?.slug ?? '';

  const cover =
    p?._embedded?.['wp:featuredmedia']?.[0]?.source_url ??
    p?.jetpack_featured_media_url ?? null;

  const coverCaptionRaw =
    p?._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered ??
    p?.caption?.rendered ?? '';
  const coverCaption = coverCaptionRaw || null;

  const contentHtml = p?.content?.rendered ?? '';

  const termsFlat = Array.isArray(p?._embedded?.['wp:term']) ? p._embedded['wp:term'].flat() : [];
  const catSlugs: string[] = termsFlat.map((t: any) => t?.slug).filter(Boolean);
  const inferred = catSlugs.find((slug) => ['futebol','basquete','tenis','esports'].includes(toSport(slug))) ?? '';
  const sport = toSport(inferred);

  // idem: devolvemos aliases para compatibilidade
  return {
    id,
    title,
    author,
    date,                 // canônico
    createdAt: date,      // alias (se algo ainda espera createdAt)
    sport,
    cover,
    image: cover,         // alias
    coverCaption,
    contentHtml,
  };
}

export async function GET(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido no .env.local' }, { status: 500 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Parâmetro "id" obrigatório e numérico' }, { status: 400 });
    }

    const endpoint = `${WP_BASE}/wp-json/wp/v2/${WP_POST_TYPE}/${id}?_embed=1`;
    const r = await fetch(endpoint, { cache: 'no-store' });

    if (r.status === 404) {
      return NextResponse.json({ error: `Post ${id} não encontrado` }, { status: 404 });
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return NextResponse.json({ error: 'Falha ao consultar WP', detail: txt }, { status: 502 });
    }

    const post = await r.json();
    const data = mapDetail(post);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: 'unexpected', detail: String(err?.message ?? err) }, { status: 500 });
  }
}
