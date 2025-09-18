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
    return (s.normalize ? s.normalize('NFD') : s)
      // @ts-ignore
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim();
  } catch {
    return s.toLowerCase().trim();
  }
}

function sportFromString(raw?: unknown): 'futebol' | 'basquete' | 'tenis' | 'esports' | null {
  const s = normalizeSafe(raw);
  if (!s) return null;
  const slim = s.replace(/[^a-z0-9]/g, '');
  if (slim.includes('esports') || s.includes('e-sport') || s.includes('e sport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  if (s.startsWith('fut') || s.includes('soccer') || s.includes('foot')) return 'futebol';
  return null;
}

function detectSport(p: any): 'futebol' | 'basquete' | 'tenis' | 'esports' | null {
  const acf = p?.acf || {};
  const candidates: string[] = [
    toStr(p?.sport),
    toStr(acf?.sport),
    toStr(acf?.modalidade),
    toStr(acf?.categoria),
    toStr(acf?.desporto),
  ].filter(Boolean);

  const termsFlat = Array.isArray(p?._embedded?.['wp:term']) ? p._embedded['wp:term'].flat() : [];
  for (const t of termsFlat) {
    if (t?.slug != null) candidates.push(toStr(t.slug));
    if (t?.name != null) candidates.push(toStr(t.name));
  }
  for (const c of candidates) {
    const m = sportFromString(c);
    if (m) return m;
  }
  const title = p?.title?.rendered ?? p?.title ?? '';
  const m2 = sportFromString(title);
  if (m2) return m2;
  return null;
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

  const sportDetected = detectSport(p) ?? 'futebol';

  return {
    id,
    title,
    author,
    createdAt,
    cover,
    sport: sportDetected,
    excerpt: stripTags(p?.excerpt?.rendered ?? ''),
    hrefPost: `/tips/${sportDetected}/${id}`,
  };
}

/* --------- métricas --------- */
function parseNumber(x: any): number | null {
  if (x == null) return null;
  const n = Number(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
type Stat = 'win' | 'loss' | 'void';

function parseResult(p: any): Stat | null {
  const acf = p?.acf || {};
  const candidates = [
    acf.result, acf.results, acf.status, acf.outcome, acf.resultado, acf.estado,
    p?.result, p?.status,
  ].map((v) => (typeof v === 'string' ? normalizeSafe(v) : ''));

  for (const v of candidates) {
    if (!v) continue;
    if (/(green|win|acert|ganh|vitoria|vit[oó]ria)/.test(v)) return 'win';
    if (/(red|loss|perd|derrot|fraca)/.test(v)) return 'loss';
    if (/(void|push|cancel|reemb|anul)/.test(v)) return 'void';
  }
  return null;
}

function inferReturn(p: any, res: Stat | null): number | null {
  const acf = p?.acf || {};
  const direct =
    parseNumber(acf.return) ??
    parseNumber(acf.retorno) ??
    parseNumber(acf.yield) ??
    null;
  if (direct != null) return direct;

  const stake =
    parseNumber(acf.stake) ??
    parseNumber(acf.unidade) ??
    parseNumber(acf.unidades) ??
    1;

  const odds =
    parseNumber(acf.odds) ??
    parseNumber(acf.odd) ??
    parseNumber(acf.cotacao) ??
    parseNumber(acf.cota) ??
    parseNumber(acf.cuota) ??
    null;

  if (stake == null || res == null) return null;
  if (res === 'void') return 0;
  if (res === 'win' && odds != null) return (odds - 1) * stake;
  if (res === 'loss') return -stake;
  return null;
}

function computeStats(raw: any[]) {
  let win = 0, loss = 0, vvoid = 0;
  let retSum = 0, retCount = 0;

  for (const p of raw) {
    const res = parseResult(p);
    if (res === 'win') win++;
    else if (res === 'loss') loss++;
    else if (res === 'void') vvoid++;

    const r = inferReturn(p, res);
    if (r != null) {
      retSum += r;
      retCount++;
    }
  }

  const totalKnown = win + loss + vvoid;
  const winRatePct = totalKnown > 0 ? (win / totalKnown) * 100 : null;
  const avgReturn = retCount > 0 ? retSum / retCount : null;

  const last10 = raw.slice(0, 10);
  let w10 = 0, l10 = 0, v10 = 0, ret10 = 0, c10 = 0;
  for (const p of last10) {
    const res = parseResult(p);
    if (res === 'win') w10++;
    else if (res === 'loss') l10++;
    else if (res === 'void') v10++;
    const r = inferReturn(p, res);
    if (r != null) { ret10 += r; c10++; }
  }
  const t10 = w10 + l10 + v10;
  const winRateLast10 = t10 > 0 ? (w10 / t10) * 100 : null;
  const avgReturnLast10 = c10 > 0 ? ret10 / c10 : null;

  return { winRate: winRatePct, avgReturn, winRateLast10, avgReturnLast10 };
}

async function fetchTotalByAuthor(typeSlug: string, authorId: number) {
  const qs = new URLSearchParams({ per_page: '1', author: String(authorId) });
  const r = await fetch(`${WP_BASE}/wp-json/wp/v2/${typeSlug}?${qs}`, { cache: 'no-store' });
  if (!r.ok) return 0;
  const total = Number(r.headers.get('x-wp-total') || '0');
  return Number.isFinite(total) ? total : 0;
}

/** força https no domínio do WP (evita mixed content) */
function forceHttpsIfWp(url?: string | null) {
  if (!url) return url ?? null;
  try {
    const u = new URL(url);
    if (u.protocol === 'http:' && u.hostname.endsWith('wp.tipfans.com')) {
      u.protocol = 'https:';
      return u.toString();
    }
  } catch {}
  return url;
}

/** tenta usar a versão "full" do upload; se não existir, mantém a original */
async function resolveAvatarUrl(url?: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/\/wp-content\/uploads\//.test(u.pathname)) {
      const strippedPath = u.pathname.replace(/-\d+x\d+(?=\.[a-z]{3,4}$)/i, '');
      if (strippedPath !== u.pathname) {
        const testUrl = `${u.origin}${strippedPath}${u.search}`;
        const head = await fetch(testUrl, { method: 'HEAD', cache: 'no-store' });
        if (head.ok) return testUrl; // full existe
      }
    }
  } catch { /* noop */ }
  return url;
}

/* ---------------- handler ---------------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 });
    }

    const { slug: slugRaw } = await params;
    const slug = toStr(slugRaw).trim().toLowerCase();
    if (!slug) return NextResponse.json({ error: 'slug inválido' }, { status: 400 });

    // cache-buster pra fugir de cache do WP/CDN
    const CB = `&_=${Date.now()}`;

    // 1) Autor (usa _fields e tenta pegar simple_local_avatar)
    const usersUrl =
      `${WP_BASE}/wp-json/wp/v2/users?slug=${encodeURIComponent(slug)}` +
      `&_fields=id,slug,name,avatar_urls,description,simple_local_avatar${CB}`;
    const users = await fetchJson(usersUrl);
    const author = Array.isArray(users) && users[0] ? users[0] : null;
    if (!author) return NextResponse.json({ error: 'Autor não encontrado' }, { status: 404 });

    // bio primária
    let bio: string = author?.description || '';

    // fallback bio: users/{id}
    if (!bio) {
      try {
        const r = await fetch(
          `${WP_BASE}/wp-json/wp/v2/users/${author.id}?_fields=description${CB}`,
          { cache: 'no-store' }
        );
        if (r.ok) {
          const uj = await r.json().catch(() => null as any);
          if (uj?.description) bio = String(uj.description);
        }
      } catch { /* noop */ }
    }

    // 2) Posts do autor (para stats)
    const raw: any[] = [];
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
      if (Array.isArray(data) && data.length) raw.push(...data);
      if (page >= totalPages || page >= 10) break;
      page += 1;
    }

    // fallback bio 2: autor embutido
    if (!bio && raw.length) {
      const emb = raw[0]?._embedded?.author?.[0];
      if (emb?.description) bio = String(emb.description);
    }

    // 3) Avatar: busca detalhes do user {id} p/ garantir simple_local_avatar.full
    let userDetails: any = null;
    try {
      userDetails = await fetchJson(
        `${WP_BASE}/wp-json/wp/v2/users/${author.id}?_fields=avatar_urls,simple_local_avatar${CB}`
      );
    } catch { /* noop */ }

    const rawAvatar: string | null =
      (userDetails?.simple_local_avatar?.full as string | undefined) ??
      (userDetails?.simple_local_avatar?.url as string | undefined) ??
      (author?.simple_local_avatar?.full as string | undefined) ??
      (author?.simple_local_avatar?.url as string | undefined) ??
      userDetails?.avatar_urls?.['96'] ??
      author?.avatar_urls?.['96'] ??
      author?.avatar_urls?.['48'] ??
      author?.avatar_urls?.['24'] ??
      null;

    // 👇 só “limpa” -96x96 se a full realmente existir; senão mantém original
    const avatarResolved = await resolveAvatarUrl(rawAvatar);
    const avatarFinal = forceHttpsIfWp(avatarResolved);

    const authorOut = {
      id: author.id,
      name: author.name || author.slug || 'Tipster',
      slug: author.slug,
      avatar: avatarFinal,
      description: bio || '',
    };

    // 4) Contagens
    const [tipsTotal, articlesTotal] = await Promise.all([
      fetchTotalByAuthor(POST_TYPE, author.id),
      fetchTotalByAuthor('posts', author.id),
    ]);

    // 5) Stats
    const stats = computeStats(raw);

    return NextResponse.json({
      author: authorOut,
      items: raw.map(mapPost),
      counts: { tips: tipsTotal, articles: articlesTotal },
      stats,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'unexpected', detail: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
