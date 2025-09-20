// app/api/competicao/masters/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';

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

function withBuster(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set('_', Date.now().toString());
    return u.toString();
  } catch {
    return url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
  }
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

/* ========= Result & numbers (robusto) ========= */

function parseNumber(x: any): number | null {
  if (x == null || x === '') return null;
  if (typeof x === 'boolean') return x ? 1 : 0;
  const n = Number(String(x).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function collectTermStrings(p: any): string[] {
  const out: string[] = [];
  const groups = Array.isArray(p?._embedded?.['wp:term']) ? p._embedded['wp:term'] : [];
  for (const g of groups) {
    for (const t of (Array.isArray(g) ? g : [])) {
      if (t?.slug) out.push(toStr(t.slug));
      if (t?.name) out.push(toStr(t.name));
      if (t?.taxonomy) out.push(toStr(t.taxonomy));
    }
  }
  return out;
}

function parseResult(p: any): Stat | null {
  const acf = p?.acf || {};

  // 1) códigos numéricos comuns
  const numericCandidates = [
    acf.result_code, acf.results_code, acf.status_code, acf.outcome_code,
    acf.resultado_code, acf.estado_code, p?.result_code, p?.status_code,
    acf.win, acf.loss, acf.void, acf.push,
  ].map(parseNumber).filter((n) => n !== null) as number[];

  for (const n of numericCandidates) {
    if (n === 1)  return 'win';
    if (n === -1) return 'loss';
    if (n === 0 || n === 2) return 'void';
  }

  // 2) booleanos explícitos
  if (acf?.win === true)  return 'win';
  if (acf?.loss === true) return 'loss';
  if (acf?.void === true || acf?.push === true) return 'void';

  // 3) strings + termos embarcados
  const stringCandidates = [
    acf.result, acf.results, acf.status, acf.outcome, acf.resultado, acf.estado,
    acf.situacao, acf.situacao_da_aposta, acf.pick_status, acf.status_tip,
    p?.result, p?.status,
    ...collectTermStrings(p),
  ].map((v: any) => (typeof v === 'string' ? normalizeSafe(v) : '')).filter(Boolean);

  for (const s of stringCandidates) {
    if (/(green|win|acert|ganh|vitoria|vit[oó]ria|won|g[ai]n(h)?a?)/.test(s)) return 'win';
    if (/(red|loss|perd|derrot|lost|frac(a)?)/.test(s))                 return 'loss';
    if (/(void|push|cancel|reemb|anul|nula|anulada|cancelada)/.test(s)) return 'void';
  }
  return null;
}

function inferReturn(p: any, res: Stat | null): { profit: number | null, stake: number | null } {
  const acf = p?.acf || {};
  const direct = parseNumber(acf.return) ?? parseNumber(acf.retorno) ?? parseNumber(acf.yield) ?? null;
  const stake = parseNumber(acf.stake) ?? parseNumber(acf.unidade) ?? parseNumber(acf.unidades) ?? 1;
  const odds =
    parseNumber(acf.odds) ?? parseNumber(acf.odd) ?? parseNumber(acf.cotacao) ??
    parseNumber(acf.cota) ?? parseNumber(acf.cuota) ?? null;

  if (direct != null) return { profit: direct, stake: stake ?? 1 };
  if (stake == null || res == null) return { profit: null, stake: null };
  if (res === 'void') return { profit: 0, stake: 0 };
  if (res === 'win' && odds != null) return { profit: (odds - 1) * stake, stake };
  if (res === 'loss') return { profit: -stake, stake };
  return { profit: null, stake: null };
}

/* ========= Avatar & fetch ========= */

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
  const r = await fetch(withBuster(url), { cache: 'no-store', next: { revalidate: 0 }, headers: { Accept: 'application/json' } });
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
  while (true) {
    const u = new URL(`${WP_BASE}/wp-json/wp/v2/users`);
    u.searchParams.set('who', 'authors');
    u.searchParams.set('per_page', '100');
    u.searchParams.set('page', String(page));
    u.searchParams.set('orderby', 'name');
    u.searchParams.set('order', 'asc');
    u.searchParams.set('_fields', 'id,slug,name,avatar_urls,simple_local_avatar');
    u.searchParams.set('_', Date.now().toString());

    const r = await fetch(u.toString(), { cache: 'no-store', next: { revalidate: 0 } });
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
    const u = new URL(`${WP_BASE}/wp-json/wp/v2/${POST_TYPE}`);
    u.searchParams.set('_embed', '1');
    u.searchParams.set('per_page', '100');
    u.searchParams.set('page', String(page));
    u.searchParams.set('orderby', 'date');
    u.searchParams.set('order', 'desc');
    u.searchParams.set('_', Date.now().toString());

    const r = await fetch(u.toString(), { cache: 'no-store', next: { revalidate: 0 } });
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
    const u = new URL(`${WP_BASE}/wp-json/wp/v2/${POST_TYPE}`);
    u.searchParams.set('_embed', '1');
    u.searchParams.set('per_page', '100');
    u.searchParams.set('page', String(page));
    u.searchParams.set('orderby', 'date');
    u.searchParams.set('order', 'desc');
    u.searchParams.set('author', String(authorId));
    if (cutoffISO) u.searchParams.set('after', cutoffISO);
    u.searchParams.set('_', Date.now().toString());

    const r = await fetch(u.toString(), { cache: 'no-store', next: { revalidate: 0 } });
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
  const u = new URL(`${WP_BASE}/wp-json/wp/v2/${typeSlug}`);
  u.searchParams.set('per_page', '1');
  u.searchParams.set('author', String(authorId));
  u.searchParams.set('_', Date.now().toString());

  const r = await fetch(u.toString(), { cache: 'no-store', next: { revalidate: 0 } });
  if (!r.ok) return 0;
  const total = Number(r.headers.get('x-wp-total') || '0');
  return Number.isFinite(total) ? total : 0;
}

export async function GET(req: Request) {
  noStore();

  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
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

    // 1) Autores (sem fantasmas)
    let authors = (await listAuthors()).filter(a => a && a.id && a.slug);
    if (onlySlugs) authors = authors.filter(a => onlySlugs.has(String(a.slug || '').toLowerCase()));
    if (!authors.length) {
      return NextResponse.json(
        { items: [] },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'Surrogate-Control': 'no-store',
            Vary: 'Accept-Encoding, *',
          },
        }
      );
    }

    // 2) Coleta posts (com cutoff se houver período)
    const cutoffISO = periodDays ? new Date(Date.now() - periodDays * 86400_000).toISOString() : undefined;

    const results = await Promise.all(
      authors.map(async (a) => {
        const postsAll = await fetchPostsPaged(a.id, cutoffISO, 10);

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
        let latestTS = 0;

        for (const p of posts) {
          const res = parseResult(p);
          if (res === 'win') win++;
          else if (res === 'loss') loss++;
          else if (res === 'void') vvoid++;

          const { profit, stake } = inferReturn(p, res);
          if (typeof stake === 'number') stakeSum += stake;
          if (typeof profit === 'number') profitSum += profit;

          const sp = detectSport(p);
          if (sp) sportsSet.add(sp);

          const ts = p?.date ? new Date(p.date).getTime() : 0;
          if (ts > latestTS) { latestTS = ts; lastDate = p?.date ?? lastDate; }
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

    // Remove autores “fantasmas”: sem conteúdo/estatística
    const cleaned = results.filter(r =>
      r?.author?.id &&
      r?.author?.slug &&
      (
        (r.counts?.tips ?? 0) > 0 ||
        (r.counts?.articles ?? 0) > 0 ||
        (r.stats?.settledCount ?? 0) > 0
      )
    );

    const ordered = cleaned
      .slice()
      .sort((a, b) => (score(b) ?? -Infinity) - (score(a) ?? -Infinity))
      .slice(0, limit);

    return NextResponse.json(
      { items: ordered },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
          Vary: 'Accept-Encoding, *',
        },
      }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Falha ao calcular ranking', detail: String(e?.message ?? e) },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
        },
      }
    );
  }
}
