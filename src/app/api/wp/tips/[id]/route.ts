/* app/api/wp/tips/[id]/route.ts
 * Detalhe de uma tip (CPT "tips")
 * Ex.: GET /api/wp/tips/52
 */
import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const WP_POST_TYPE = 'tips' as const; // travado no CPT tips

function normalize(s = '') {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}
function toSport(s = ''): 'futebol' | 'basquete' | 'tenis' | 'esports' {
  const x = normalize(s);
  if (x.includes('esport')) return 'esports';
  if (x.startsWith('basq') || x.includes('basket')) return 'basquete';
  if (x.startsWith('ten')) return 'tenis';
  return 'futebol';
}

function mapDetail(p: any) {
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

  const coverCaptionRaw =
    p?._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered ??
    p?.caption?.rendered ??
    '';
  const contentHtml = p?.content?.rendered ?? '';

  const terms = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : [];
  const slugs: string[] = terms.map((t: any) => t?.slug).filter(Boolean);
  const inferred =
    slugs.find((s) =>
      ['futebol', 'basquete', 'tenis', 'esports'].includes(toSport(s))
    ) ?? '';
  const sport = toSport(inferred);

  return {
    id,
    title,
    author,
    createdAt,
    sport,
    cover,
    coverCaption: coverCaptionRaw || null,
    contentHtml,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!WP_BASE) {
      return NextResponse.json(
        { error: 'WP_BASE_URL não definido' },
        { status: 500 }
      );
    }

    const id = params.id;
    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const endpoint = `${WP_BASE}/wp-json/wp/v2/${WP_POST_TYPE}/${id}?_embed=1`;
    const r = await fetch(endpoint, { cache: 'no-store' });

    if (r.status === 404) {
      return NextResponse.json(
        { error: `Tip ${id} não encontrada` },
        { status: 404 }
      );
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return NextResponse.json(
        { error: 'Falha ao consultar WP', detail: txt, endpoint },
        { status: 502 }
      );
    }

    const post = await r.json();

    // segurança extra: recusa se não for do tipo tips
    if (!String(post?.type || '').toLowerCase().includes('tip')) {
      return NextResponse.json(
        { error: 'Recurso não é do tipo tips' },
        { status: 400 }
      );
    }

    return NextResponse.json(mapDetail(post));
  } catch (e: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
