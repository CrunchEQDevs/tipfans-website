import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const POST_TYPE = (process.env.WP_POST_TYPE || 'tips').toLowerCase();

/* ---------------- helpers seguros ---------------- */
function toStr(v: unknown): string {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}
function normalizeSafe(v: unknown): string {
  const s = toStr(v);
  try {
    // em alguns ambientes .normalize pode não existir no proto – por garantia
    return (s.normalize ? s.normalize('NFD') : s)
      // @ts-ignore - \p{Diacritic} precisa de flag u
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

// mapeia string livre para um dos 4 esportes (tolerante a hífen/espacos)
function sportFromString(raw?: unknown):
  | 'futebol'
  | 'basquete'
  | 'tenis'
  | 'esports'
  | null {
  const s = normalizeSafe(raw);
  if (!s) return null;

  // versão sem caracteres não alfanuméricos para pegar "e-sports", "e sports", etc
  const slim = s.replace(/[^a-z0-9]/g, '');

  if (slim.includes('esports') || s.includes('e-sport') || s.includes('e sport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  if (s.startsWith('fut') || s.includes('soccer') || s.includes('foot')) return 'futebol';
  return null;
}

// NÃO força futebol por falta de sinal: só retorna futebol se achar
function detectSport(p: any):
  | 'futebol'
  | 'basquete'
  | 'tenis'
  | 'esports'
  | null {
  const acf = p?.acf || {};

  const candidates: string[] = [
    toStr(p?.sport),
    toStr(acf?.sport),
    toStr(acf?.modalidade),
    toStr(acf?.categoria),
    toStr(acf?.desporto),
  ].filter(Boolean);

  // termos embutidos (qualquer taxonomia)
  const termsFlat = Array.isArray(p?._embedded?.['wp:term'])
    ? p._embedded['wp:term'].flat()
    : [];
  for (const t of termsFlat) {
    if (t?.slug != null) candidates.push(toStr(t.slug));
    if (t?.name != null) candidates.push(toStr(t.name));
  }

  // 1) tenta match para esports/basquete/tenis/futebol
  for (const c of candidates) {
    const m = sportFromString(c);
    if (m) return m;
  }

  // 2) última tentativa: título/conteúdo
  const title = p?.title?.rendered ?? p?.title ?? '';
  const m2 = sportFromString(title);
  if (m2) return m2;

  return null; // deixa null se não conseguiu inferir
}

function stripTags(html = '') {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${txt}`);
  }
  return r.json();
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

  const sportDetected = detectSport(p) ?? 'futebol'; // fallback só aqui, para não quebrar o front

  return {
    id,
    title,
    author,
    createdAt,
    cover,
    sport: sportDetected,                      // ✅ pega "esports" mesmo com slug "e-sports"
    excerpt: stripTags(p?.excerpt?.rendered ?? ''),
    hrefPost: `/tips/${sportDetected}/${id}`,
  };
}

/* ---------------- handler ---------------- */
// params é assíncrono nas versões recentes do Next
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 });
    }

    const { slug: slugRaw } = await params; // ⬅️ aguarda params
    const slug = toStr(slugRaw).trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: 'slug inválido' }, { status: 400 });

    // 1) Autor
    const usersUrl = `${WP_BASE}/wp-json/wp/v2/users?slug=${encodeURIComponent(slug)}`;
    const users = await fetchJson(usersUrl);
    const author = Array.isArray(users) && users[0] ? users[0] : null;
    if (!author) return NextResponse.json({ error: 'Autor não encontrado' }, { status: 404 });

    const authorOut = {
      id: author.id,
      name: author.name || author.slug || 'Tipster',
      slug: author.slug,
      avatar:
        author.avatar_urls?.['96'] ||
        author.avatar_urls?.['48'] ||
        author.avatar_urls?.['24'] ||
        null,
      description: author.description || '',
    };

    // 2) Posts do autor (pagina tudo com limite de segurança)
    const items: any[] = [];
    let page = 1;
    while (true) {
      const qs = new URLSearchParams({
        _embed: '1',
        per_page: '100',
        page: String(page),
        author: String(author.id),
        orderby: 'date',
        order: 'desc',
      });
      const url = `${WP_BASE}/wp-json/wp/v2/${POST_TYPE}?${qs.toString()}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        if (r.status === 400 || r.status === 404) break;
        const txt = await r.text().catch(() => '');
        return NextResponse.json({ error: 'Falha ao consultar WP', detail: txt }, { status: 502 });
      }
      const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
      const data = await r.json();
      if (Array.isArray(data) && data.length) items.push(...data);
      if (page >= totalPages || page >= 10) break; // hard limit
      page += 1;
    }

    return NextResponse.json({ author: authorOut, items: items.map(mapPost) });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
