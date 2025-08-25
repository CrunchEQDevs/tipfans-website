// src/app/api/wp/tips/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { tipsEndpoint, wpAuthHeader } from '../_lib/wp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // evita cache em dev/prod
export const revalidate = 0;

function readUserFromRequest(req: NextRequest) {
  const c = req.cookies;
  return {
    uid: c.get('tf_uid')?.value || req.headers.get('x-user-id') || null,
    uname: c.get('tf_uname')?.value || req.headers.get('x-user-name') || null,
    uemail: c.get('tf_uemail')?.value || req.headers.get('x-user-email') || null,
    wpUserId: c.get('wp_user_id')?.value || req.headers.get('x-wp-user-id') || null,
  };
}

function normalizeStatus(raw: string | undefined) {
  const allowed = ['publish', 'pending', 'draft', 'future', 'private'];
  const s = (raw || 'pending').trim().toLowerCase();
  return allowed.includes(s) ? s : 'pending';
}

type WpCreatePayload = {
  title: string;
  content?: string;
  status: string;
  meta: Record<string, unknown>;
  featured_media?: number | string;
  categories?: number[];
};

type WpRespLike = {
  id?: number | string;
  ID?: number | string;
  link?: string;
  guid?: { rendered?: string };
};

export async function POST(req: NextRequest) {
  // 1) Body: tenta JSON; se falhar, devolve erro claro
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    const raw = await req.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: 'Body inválido. Envie JSON.', raw: raw?.slice(0, 200) },
      { status: 400 }
    );
  }

  const b = (typeof body === 'object' && body !== null) ? (body as Record<string, unknown>) : {};
  const title = typeof b.title === 'string' ? b.title : undefined;
  const content = typeof b.content === 'string' ? b.content : undefined;
  const featured_media =
    typeof b.featured_media === 'number' || typeof b.featured_media === 'string'
      ? b.featured_media
      : undefined;
  const meta = (typeof b.meta === 'object' && b.meta !== null)
    ? (b.meta as Record<string, unknown>)
    : {};

  if (!title) {
    return NextResponse.json({ ok: false, error: 'Título é obrigatório' }, { status: 400 });
  }

  // 2) Quem submeteu (para meta)
  const { uid, uname, uemail, wpUserId } = readUserFromRequest(req);

  // 3) Status padrão: from ENV (default pending)
  const defaultStatus = normalizeStatus(process.env.WP_TIPS_DEFAULT_STATUS);

  // 4) Payload para o WP
  const payload: WpCreatePayload = {
    title,
    content,
    status: defaultStatus, // força moderação (ou o que estiver no .env)
    meta: {
      ...meta,
      submitted_by_id: uid ?? (meta as Record<string, unknown>)?.submitted_by_id ?? null,
      submitted_by_name: uname ?? (meta as Record<string, unknown>)?.submitted_by_name ?? null,
      submitted_by_email: uemail ?? (meta as Record<string, unknown>)?.submitted_by_email ?? null,
      submitted_by_wp_user: wpUserId ?? (meta as Record<string, unknown>)?.submitted_by_wp_user ?? null,
    },
  };
  if (featured_media != null) payload.featured_media = featured_media;

  const catId = process.env.WP_TIPS_CATEGORY_ID ? Number(process.env.WP_TIPS_CATEGORY_ID) : undefined;
  if (catId && Number.isFinite(catId)) payload.categories = [catId];

  // 5) Endpoint + headers
  const url = typeof tipsEndpoint === 'function' ? tipsEndpoint() : '';
  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'tipsEndpoint() inválido. Verifique WP_BASE_URL e WP_TIPS_CPT_SLUG (ou use posts).' },
      { status: 500 }
    );
  }

  const auth = (typeof wpAuthHeader === 'function' ? wpAuthHeader() : null) as Record<string, string> | null;
  const authHeaders: Record<string, string> = auth ?? {};
  if (!authHeaders.Authorization) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'Sem credenciais para o WordPress. Configure WP_AUTH_MODE e WP_JWT_TOKEN (ou WP_BASIC_USER/WP_BASIC_PASS).',
      },
      { status: 500 }
    );
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authHeaders,
  };

  // 6) Chamada ao WP
  let wpRes: Response;
  try {
    wpRes = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: 'Falha na ligação ao WordPress', details: errMsg, endpoint: url },
      { status: 502 }
    );
  }

  // 7) Parse seguro (evita crash com HTML de erro/redirect)
  const text = await wpRes.text();
  let data: unknown = null;
  try {
    data = JSON.parse(text);
  } catch {
    // não-JSON, provavelmente HTML de erro (ex.: 401/403/301/302)
  }

  if (!wpRes.ok) {
    const dObj = (typeof data === 'object' && data !== null) ? (data as Record<string, unknown>) : {};
    const msg = (typeof dObj.message === 'string' ? dObj.message : undefined) || text?.slice(0, 400) || `WP error ${wpRes.status}`;
    return NextResponse.json({ ok: false, error: msg, status: wpRes.status }, { status: wpRes.status });
  }

  // 8) Normaliza campos
  const d = (typeof data === 'object' && data !== null) ? (data as Partial<WpRespLike>) : {};
  const id: string | number | null =
    (typeof d.id === 'number' || typeof d.id === 'string') ? d.id
      : (typeof d.ID === 'number' || typeof d.ID === 'string') ? d.ID
      : null;

  const link: string | null =
    typeof d.link === 'string' ? d.link
      : (d.guid && typeof d.guid === 'object' && typeof d.guid.rendered === 'string') ? d.guid.rendered
      : null;

  return NextResponse.json({ ok: true, tip: { id, link } });
}
// --- [ADICIONAR NO TOPO, após imports] ------------------
type TipCard = {
  id: string | number;
  dateISO: string;             // ex.: "2025-08-28T20:45:00Z"
  league?: string;
  home: string;
  away: string;
  hotTip?: string;
  pick?: string;
  bothTeamsScore?: "YES" | "NO";
  correctScore?: string;
  ctaUrl?: string;
};

// Mapeia a resposta do WP para o formato TipCard
function mapWpToTipCard(item: any): TipCard {
  return {
    id: item?.id ?? item?.ID ?? Math.random().toString(36).slice(2),
    dateISO:
      item?.dateISO ??
      item?.datetime ??
      item?.date_gmt ??
      new Date().toISOString(),
    league: item?.league ?? item?.meta?.league ?? item?.categories?.[0]?.name,
    home: item?.home ?? item?.teams?.home ?? item?.meta?.home ?? "Home",
    away: item?.away ?? item?.teams?.away ?? item?.meta?.away ?? "Away",
    hotTip: item?.hotTip ?? item?.meta?.hotTip,
    pick: item?.pick ?? item?.meta?.pick,
    bothTeamsScore:
      item?.bothTeamsScore ?? item?.meta?.btts ?? undefined,
    correctScore: item?.correctScore ?? item?.meta?.correctScore,
    ctaUrl: item?.ctaUrl ?? item?.link ?? item?.permalink,
  };
}
// ---------------------------------------------------------

// --- [NOVO HANDLER GET] ---------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sport = (searchParams.get("sport") || "futebol").toLowerCase();
  const when = (searchParams.get("when") || "today")
    .toLowerCase() as "today" | "tomorrow" | "soon";

  // monta endpoint do WP (aproveita o teu helper existente)
  const urlBase = typeof tipsEndpoint === "function" ? tipsEndpoint() : "";
  if (!urlBase) {
    return NextResponse.json(
      { ok: false, error: "tipsEndpoint() inválido." },
      { status: 500 }
    );
  }

  // passamos sport/when como query — o teu endpoint WP decide como filtrar
  const sep = urlBase.includes("?") ? "&" : "?";
  const url = `${urlBase}${sep}sport=${encodeURIComponent(
    sport
  )}&when=${encodeURIComponent(when)}&status=publish&per_page=20`;

  const auth = (typeof wpAuthHeader === "function" ? wpAuthHeader() : null) as
    | Record<string, string>
    | null;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(auth ?? {}),
  };

  try {
    const r = await fetch(url, { method: "GET", headers, cache: "no-store" });
    const text = await r.text();

    // tenta JSON com segurança
    let raw: any = [];
    try {
      raw = JSON.parse(text);
    } catch {
      raw = [];
    }

    const arr = Array.isArray(raw) ? raw : [];
    const data: TipCard[] = arr.map(mapWpToTipCard);

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json([], { status: 200 });
  }
}
// ---------------------------------------------------------
