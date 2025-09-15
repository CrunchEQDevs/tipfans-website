/* app/api/wp/tip/route.ts
 *
 * Endpoint: /api/wp/tip?id=123
 *
 * Objetivo:
 *  - Retorna um único post do WordPress por ID, com conteúdo completo (contentHtml),
 *    autor, capa, legenda, data, e o esporte inferido por categorias.
 *  - Compatível com WP padrão (post type "posts") e CPT (defina WP_POST_TYPE=tips).
 */

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

/** Mapeia um post bruto para o formato esperado pelo seu TipDetail */
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

  // legenda/caption (muitos temas não usam caption em posts; se vier vazio, deixamos null)
  const coverCaptionRaw =
    p?._embedded?.['wp:featuredmedia']?.[0]?.caption?.rendered ??
    p?.caption?.rendered ??
    '';
  const coverCaption = coverCaptionRaw || null;

  const contentHtml = p?.content?.rendered ?? '';

  // Inferir sport pelas categorias
  const termsFlat = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : [];
  const catSlugs: string[] = termsFlat.map((t: any) => t?.slug).filter(Boolean);
  const inferred =
    catSlugs?.find((slug) => ['futebol', 'basquete', 'tenis', 'esports'].includes(toSport(slug))) ??
    '';
  const sport = toSport(inferred);

  return {
    id,
    title,
    author,
    createdAt,
    sport,
    cover,
    coverCaption,
    contentHtml,
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
    const id = url.searchParams.get('id');

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: 'Parâmetro "id" obrigatório e numérico' },
        { status: 400 }
      );
    }

    // /wp-json/wp/v2/{post_type}/{id}?_embed=1
    const endpoint = `${WP_BASE}/wp-json/wp/v2/${WP_POST_TYPE}/${id}?_embed=1`;
    const r = await fetch(endpoint, { cache: 'no-store' });

    if (r.status === 404) {
      return NextResponse.json(
        { error: `Post ${id} não encontrado` },
        { status: 404 }
      );
    }

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return NextResponse.json(
        { error: 'Falha ao consultar WP', detail: txt },
        { status: 502 }
      );
    }

    const post = await r.json();
    const data = mapDetail(post);

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
