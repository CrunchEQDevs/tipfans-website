import { NextResponse } from 'next/server';

const WP_BASE = process.env.WP_BASE_URL ?? '';
const POST_TYPE = (process.env.WP_POST_TYPE || 'tips').toLowerCase();

type Stat = 'win' | 'loss' | 'void';

function norm(s = '') {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

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
  ].map((v) => (typeof v === 'string' ? norm(v) : ''));

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

async function fetchJson(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${t}`);
  }
  return r.json();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    if (!WP_BASE) {
      return NextResponse.json({ error: 'WP_BASE_URL não definido' }, { status: 500 });
    }

    const url = new URL(req.url);
    const lastRaw = url.searchParams.get('last') || '20';
    const last = Math.max(1, Math.min(500, Number(lastRaw) || 20));

    const { slug: slugRaw } = await params;     // ⬅️ aguarda params
    const slug = String(slugRaw || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ error: 'slug inválido' }, { status: 400 });
    }

    // 1) Autor pelo slug
    const users = await fetchJson(`${WP_BASE}/wp-json/wp/v2/users?slug=${encodeURIComponent(slug)}`);
    const author = Array.isArray(users) && users[0] ? users[0] : null;
    if (!author) {
      return NextResponse.json({ error: 'Autor não encontrado' }, { status: 404 });
    }
    const authorOut = {
      id: author.id,
      slug: author.slug,
      name: author.name || author.slug,
      avatar:
        author.avatar_urls?.['96'] ||
        author.avatar_urls?.['48'] ||
        author.avatar_urls?.['24'] ||
        null,
    };

    // 2) Buscar posts do autor até juntar "last"
    const collected: any[] = [];
    let page = 1;
    while (collected.length < last) {
      const perPage = Math.min(100, last - collected.length);
      const qs = new URLSearchParams({
        _embed: '1',
        author: String(authorOut.id),
        per_page: String(perPage),
        page: String(page),
        orderby: 'date',
        order: 'desc',
      });
      const r = await fetch(`${WP_BASE}/wp-json/wp/v2/${POST_TYPE}?${qs.toString()}`, { cache: 'no-store' });
      if (!r.ok) break;
      const arr = await r.json();
      if (!Array.isArray(arr) || !arr.length) break;
      collected.push(...arr);
      const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
      if (page >= totalPages) break;
      page += 1;
    }

    const sample = collected.slice(0, last);

    // 3) Agregar estatísticas
    let win = 0, loss = 0, vvoid = 0, unknown = 0;
    let retSum = 0;
    let retCount = 0;

    for (const p of sample) {
      const res = parseResult(p);
      if (res === 'win') win++;
      else if (res === 'loss') loss++;
      else if (res === 'void') vvoid++;
      else unknown++;

      const r = inferReturn(p, res);
      if (r != null) {
        retSum += r;
        retCount++;
      }
    }

    const totalWithKnown = win + loss + vvoid;
    const winrate = totalWithKnown > 0 ? (win / totalWithKnown) : 0;
    const retAvg = retCount > 0 ? retSum / retCount : null;

    return NextResponse.json({
      author: authorOut,
      sample: sample.length,
      counts: { win, loss, void: vvoid, unknown },
      winrate, // 0..1
      return: { total: retCount > 0 ? retSum : null, avg: retAvg },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Falha ao calcular estatísticas', detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
