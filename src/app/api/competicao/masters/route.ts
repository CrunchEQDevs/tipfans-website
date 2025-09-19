// app/api/competicao/masters/route.ts
import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const POST_TYPE = (process.env.WP_POST_TYPE || 'tips').toLowerCase();

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

function toStr(v: unknown) { return v == null ? '' : String(v); }
function normalizeSafe(v: unknown) {
  const s = toStr(v);
  try {
    // @ts-ignore
    return (s.normalize ? s.normalize('NFD') : s).replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
  } catch { return s.toLowerCase().trim(); }
}

function sportFromString(raw?: unknown): Sport | null {
  const s = normalizeSafe(raw);
  if (!s) return null;
  const slim = s.replace(/[^a-z0-9]/g, '');
  if (slim.includes('esports') || s.includes('e-sport') || s.includes('e sport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  if (s.startsWith('fut') || s.includes('soccer') || s.includes('foot')) return 'futebol';
  return null;
}
function detectSport(p: any): Sport | null {
  const acf = p?.acf || {};
  const cand: string[] = [
    toStr(p?.sport),
    toStr(acf?.sport),
    toStr(acf?.modalidade),
    toStr(acf?.categoria),
    toStr(acf?.desporto),
  ].filter(Boolean);
  const termsFlat = Array.isArray(p?._embedded?.['wp:term']) ? p._embedded['wp:term'].flat() : [];
  for (const t of termsFlat) {
    if (t?.slug != null) cand.push(toStr(t.slug));
    if (t?.name != null) cand.push(toStr(t.name));
  }
  for (const c of cand) {
    const m = sportFromString(c);
    if (m) return m;
  }
  return sportFromString(p?.title?.rendered ?? p?.title ?? '');
}

type Stat = 'win' | 'loss' | 'void';
function parseNumber(x: any): number | null {
  if (x == null) return null;
  const n = Number(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
function parseResult(p: any): Stat | null {
  const acf = p?.acf || {};
  const candidates = [
    acf.result, acf.results, acf.status, acf.outcome, acf.resultado, acf.estado,
    p?.result, p?.status,
  ].map((v: any) => (typeof v === 'string' ? normalizeSafe(v) : ''));
  for (const v of candidates) {
    if (!v) continue;
    if (/(green|win|acert|ganh|vitoria|vit[oó]ria)/.test(v)) return 'win';
    if (/(red|loss|perd|derrot|fraca)/.test(v)) return 'loss';
    if (/(void|push|cancel|reemb|anul)/.test(v)) return 'void';
  }
  return null;
}
function inferReturn(p: any, res: Stat | null): { profit: number | null, stake: number | null } {
  const acf = p?.acf || {};
  const direct = parseNumber(acf.return) ?? parseNumber(acf.retorno) ?? parseNumber(acf.yield) ?? null;
  const stake = parseNumber(acf.stake) ?? parseNumber(acf.unidade) ?? parseNumber(acf.unidades) ?? 1;
  const odds = parseNumber(acf.odds) ?? parseNumber(acf.odd) ?? parseNumber(acf.cotacao) ?? parseNumber(acf.cota) ?? parseNumber(acf.cuota) ?? null;

  if (direct != null) return { profit: direct, stake };
  if (stake == null || res == null) return { profit: null, stake: null };
  if (res === 'void') return { profit: 0, stake: 0 };
  if (res === 'win' && odds != null) return { profit: (odds - 1) * stake, stake };
  if (res === 'loss') return { profit: -stake, stake };
  return { profit: null, stake: null };
}

function toFullAvatar(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (/\/wp-content\/uploads\//.test(u.pathname)) {
      u.pathname = u.pathname.replace(/-\d+x\d+(?=\.[a-z]{3,4}$)/i, '');
      return u.toString();
    }
  } catch {}
  return url || null;
}

async function fetchJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${t}`);
  }
  return r.json();
}

async function fetchUserDetails(id: number) {
  try {
    const u = await fetchJson(
      `${WP_BASE}/wp-json/wp/v2/users/${id}?_fields=id,slug,name,avatar_urls,simple_local_avatar`
    );
    const avatar =
      u?.simple_local_avatar?.full ||
      u?.simple_local_avatar?.url ||
      u?.avatar_urls?.['96'] ||
      u?.avatar_urls?.['48'] ||
      u?.avatar_urls?.['24'] ||
      null;
    return {
      id: u?.id ?? id,
      slug: toStr(u?.slug || ''),
      name: toStr(u?.name || u?.slug || `user-${id}`),
      avatar: toFullAvatar(avatar),
    };
  } catch {
    return { id, slug: '', name: '', avatar: null };
  }
}

async function listAuthorsViaUsers() {
  const out: any[] = [];
  let page = 1;
  const cb = `_=${Date.now()}`;
  while (true) {
    const url = `${WP_BASE}/wp-json/wp/v2/users?who=authors&per_page=100&page=${page}&orderby=name&order=asc&_fields=id,slug,name,avatar_urls,simple_local_avatar&${cb}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) break;
    const arr = await r.json();
    out.push(...(Array.isArray(arr) ? arr : []));
    const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
    if (page >= totalPages) break;
    page += 1;
  }
  const base = out.map((u) => ({
    id: u.id,
    slug: u.slug,
    name: u.name || u.slug,
    avatar: toFullAvatar(
      u?.simple_local_avatar?.full || u?.simple_local_avatar?.url ||
      u?.avatar_urls?.['96'] || u?.avatar_urls?.['48'] || u?.avatar_urls?.['24'] || null
    ),
  }));
  const refreshed = await Promise.all(base.map((a) => fetchUserDetails(a.id)));
  return base.map((a, i) => ({
    id: a.id,
    slug: refreshed[i]?.slug || a.slug,
    name: refreshed[i]?.name || a.name,
    avatar: refreshed[i]?.avatar ?? a.avatar,
  }));
}

async function listAuthorsFromPosts(maxPages = 10) {
  const seen = new Map<number, { id: number; slug: string; name: string; avatar: string | null }>();
  let page = 1;
  while (page <= maxPages) {
    const qs = new URLSearchParams({
      _embed: '1',
      per_page: '100',
      page: String(page),
      orderby: 'date',
      order: 'desc',
    });
    const url = `${WP_BASE}/wp-json/wp/v2/${POST_TYPE}?${qs.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) break;
    const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
    const data = await r.json();
    for (const p of (Array.isArray(data) ? data : [])) {
      const a = p?._embedded?.author?.[0];
      if (!a) continue;
      const id = a.id;
      if (!seen.has(id)) {
        const avatar =
          a?.simple_local_avatar?.full ||
          a?.simple_local_avatar?.url ||
          a?.avatar_urls?.['96'] ||
          a?.avatar_urls?.['48'] ||
          a?.avatar_urls?.['24'] ||
          null;
        seen.set(id, {
          id,
          slug: a.slug || String(id),
          name: a.name || a.slug || `user-${id}`,
          avatar: toFullAvatar(avatar),
        });
      }
    }
    if (page >= totalPages) break;
    page += 1;
  }
  const arr = Array.from(seen.values());
  const refreshed = await Promise.all(arr.map((a) => fetchUserDetails(a.id)));
  return arr.map((a, i) => ({
    id: a.id,
    slug: refreshed[i]?.slug || a.slug,
    name: refreshed[i]?.name || a.name,
    avatar: refreshed[i]?.avatar ?? a.avatar,
  }));
}

async function listAuthors() {
  const viaUsers = await listAuthorsViaUsers().catch(() => [] as any[]);
  if (viaUsers.length) return viaUsers;
  return listAuthorsFromPosts(10);
}

async function fetchPostsPaged(authorId: number, cutoffISO?: string, maxPages = 10) {
  const out: any[] = [];
  let page = 1;
  let keep = true;
  while (keep && page <= maxPages) {
    const qs = new URLSearchParams({
      _embed: '1',
      per_page: '100',
      page: String(page),
      orderby: 'date',
      order: 'desc',
      author: String(authorId),
    });
    const url = `${WP_BASE}/wp-json/wp/v2/${POST_TYPE}?${qs.toString()}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) break;
    const data = (await r.json()) as any[];
    if (!Array.isArray(data) || data.length === 0) break;
    out.push(...data);
    const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
    if (cutoffISO) {
      const cutoff = new Date(cutoffISO).getTime();
      const older = data[data.length - 1]?.date ? new Date(data[data.length - 1].date).getTime() : 0;
      if (older && older < cutoff) keep = false;
    }
    if (page >= totalPages) break;
    page += 1;
  }
  return out;
}

async function fetchTotalByAuthor(typeSlug: string, authorId: number) {
  const qs = new URLSearchParams({ per_page: '1', author: String(authorId) });
  const r = await fetch(`${WP_BASE}/wp-json/wp/v2/${typeSlug}?${qs}`, { cache: 'no-store' });
  if (!r.ok) return 0;
  const total = Number(r.headers.get('x-wp-total') || '0');
  return Number.isFinite(total) ? total : 0;
}

export async function GET(req: Request) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 });
    }

    const url = new URL(req.url);
    const last = Math.max(1, Math.min(500, Number(url.searchParams.get('last') || '20')));
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '6')));
    const order = (url.searchParams.get('order') || 'roi').toLowerCase(); // 'roi' | 'hit'
    const sportF = (url.searchParams.get('sport') || 'all').toLowerCase(); // 'all' | 'futebol' | 'tenis' | 'basquete' | 'esports'
    const period = (url.searchParams.get('period') || 'all').toLowerCase(); // 'all' | '7d' | '30d' | '90d'
    const slugsCsv = (url.searchParams.get('slugs') || '').trim();
    const onlySlugs = slugsCsv ? new Set(slugsCsv.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)) : null;

    let periodDays: number | null = null;
    if (period.endsWith('d')) {
      const n = Number(period.replace('d', ''));
      if (Number.isFinite(n) && n > 0) periodDays = n;
    }

    // 1) Autores
    let authors = await listAuthors();
    if (onlySlugs) {
      authors = authors.filter(a => onlySlugs.has(String(a.slug || '').toLowerCase()));
    }
    if (!authors.length) {
      return NextResponse.json({ items: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    // 2) Coleta posts (com cutoff se houver período)
    const cutoffISO = periodDays ? new Date(Date.now() - periodDays * 86400_000).toISOString() : undefined;

    const results = await Promise.all(
      authors.map(async (a) => {
        const postsAll = await fetchPostsPaged(a.id, cutoffISO, 10);
        // filtra por período (se houver) e esporte (se tiver)
        const postsByPeriod = cutoffISO
          ? postsAll.filter(p => new Date(p?.date ?? 0).getTime() >= new Date(cutoffISO).getTime())
          : postsAll;

        const postsFiltered = postsByPeriod.filter(p => {
          if (sportF === 'all') return true;
          const sp = detectSport(p);
          return sp === sportF;
        });

        const posts = postsFiltered.slice(0, last);

        let win = 0, loss = 0, vvoid = 0;
        let stakeSum = 0, profitSum = 0;
        const sportsSet = new Set<Sport>();
        let lastDate: string | undefined;

        for (const p of posts) {
          const res = parseResult(p);
          if (res === 'win') win++; else if (res === 'loss') loss++; else if (res === 'void') vvoid++;
          const { profit, stake } = inferReturn(p, res);
          if (typeof stake === 'number') stakeSum += stake;
          if (typeof profit === 'number') profitSum += profit;
          const sp = detectSport(p);
          if (sp) sportsSet.add(sp);
          if (!lastDate) lastDate = p?.date ?? undefined;
        }

        const settled = win + loss + vvoid;
        const hitPct = settled > 0 ? (win / settled) * 100 : 0;
        const roiPct = stakeSum > 0 ? (profitSum / stakeSum) * 100 : 0;

        const [tipsTotal, articlesTotal] = await Promise.all([
          fetchTotalByAuthor(POST_TYPE, a.id),
          fetchTotalByAuthor('posts', a.id),
        ]);

        return {
          author: { id: a.id, slug: a.slug, name: a.name, avatar: a.avatar },
          window: { last },
          counts: { tips: tipsTotal, articles: articlesTotal },
          applied: { sport: sportF, period: periodDays ?? 'all' },
          stats: {
            sports: Array.from(sportsSet),
            settledCount: settled,
            pushes: vvoid,
            stakeTotal: stakeSum,
            units: profitSum,
            hitPct,
            roiPct,
            lastDate,
          },
        };
      })
    );

    const score = (r: any) => (order === 'hit' ? r.stats.hitPct : r.stats.roiPct);
    const ordered = results
      .slice()
      .sort((a, b) => (score(b) ?? -Infinity) - (score(a) ?? -Infinity))
      .slice(0, limit);

    return NextResponse.json(
      { items: ordered },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Falha ao calcular ranking', detail: String(e?.message ?? e) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
