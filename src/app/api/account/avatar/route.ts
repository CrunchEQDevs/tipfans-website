// src/app/api/account/avatar/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, decodeJwt, type JWTPayload, SignJWT } from 'jose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const APP_COOKIE = 'tf_token';

// ===== ENV =====
const WP_BASE = (process.env.WP_BASE_URL || process.env.WP_URL || '').replace(/\/$/, '');
const APP_USER = process.env.WP_APP_USER || '';
const RAW_PASS = process.env.WP_APP_PASS || '';
const APP_PASS = RAW_PASS.replace(/^"(.*)"$/, '$1').replace(/\s+/g, '');
const JWT_SECRET = process.env.JWT_SECRET || '';
const SKIP_JWT_VERIFY =
  process.env.SKIP_JWT_VERIFY === '1' || String(process.env.SKIP_JWT_VERIFY).toLowerCase() === 'true';
const CROSS = process.env.CROSS_SITE_COOKIES === '1';

// Campo ACF (opcional)
const ENV_AVATAR_KEY = (process.env.WP_AVATAR_META_KEY || '').trim();
const ACF_KEYS = { avatar: [ENV_AVATAR_KEY, 'avatar', 'avatar_url', 'avatarUrl'].filter(Boolean) } as const;

/* ========== utils ========== */
const safe = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
function authHeaderBasic(): string | null {
  if (!APP_USER || !APP_PASS) return null;
  return `Basic ${Buffer.from(`${APP_USER}:${APP_PASS}`).toString('base64')}`;
}
async function verifySessionToken(token: string): Promise<JWTPayload | null> {
  if (!token) return null;
  if (SKIP_JWT_VERIFY) { try { return decodeJwt(token); } catch { return null; } }
  if (!JWT_SECRET) return null;
  try { return (await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))).payload; } catch { return null; }
}
async function getSessionPayload(): Promise<JWTPayload | null> {
  const token = (await cookies()).get(APP_COOKIE)?.value || '';
  return verifySessionToken(token);
}
async function getSessionEmail(): Promise<string | null> {
  const p = await getSessionPayload(); if (!p) return null;
  return (p as any).email || (p as any).user_email || (typeof p.sub === 'string' ? p.sub : '') || null;
}
function getSelfBaseUrl(req: Request): string {
  const xfProto = req.headers.get('x-forwarded-proto');
  const xfHost  = req.headers.get('x-forwarded-host');
  if (xfProto && xfHost) return `${xfProto}://${xfHost}`;
  const url = new URL(req.url);
  const proto = url.protocol.replace(':', '') || 'http';
  const host = req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}
function guessExtFromMime(m: string | null) {
  if (!m) return 'bin';
  const mm = m.toLowerCase();
  if (mm.includes('jpeg') || mm.includes('jpg')) return 'jpg';
  if (mm.includes('png')) return 'png';
  if (mm.includes('gif')) return 'gif';
  if (mm.includes('webp')) return 'webp';
  return 'bin';
}
async function readUploadFromRequest(req: Request): Promise<
  | { buffer: Buffer; contentType: string; filename: string }
  | { avatarUrl: string }
  | null
> {
  const ct = (req.headers.get('content-type') || '').toLowerCase();

  // multipart/form-data
  if (ct.includes('multipart/form-data')) {
    const fd = await req.formData();
    const f = fd.get('file');
    if (f && typeof f === 'object' && 'arrayBuffer' in f) {
      const file = f as File;
      const buffer = Buffer.from(await file.arrayBuffer());
      const contentType = file.type || 'application/octet-stream';
      const ext = guessExtFromMime(contentType);
      const filename = file.name || `avatar.${ext}`;
      return { buffer, contentType, filename };
    }
    const viaUrl = fd.get('url');
    if (typeof viaUrl === 'string' && viaUrl) {
      const r = await fetch(viaUrl);
      if (!r.ok) throw new Error(`Falha ao baixar URL (${r.status})`);
      const ab = await r.arrayBuffer();
      const buffer = Buffer.from(ab);
      const contentType = r.headers.get('content-type') || 'application/octet-stream';
      const ext = guessExtFromMime(contentType);
      const filename = viaUrl.split('/').pop() || `avatar.${ext}`;
      return { buffer, contentType, filename };
    }
    const avatarUrl = fd.get('avatarUrl');
    if (typeof avatarUrl === 'string' && avatarUrl) return { avatarUrl };
    return null;
  }

  // JSON: { url } ou { avatarUrl }
  const body = await req.json().catch(() => null) as any;
  if (body && typeof body === 'object') {
    if (typeof body.url === 'string' && body.url) {
      const r = await fetch(body.url);
      if (!r.ok) throw new Error(`Falha ao baixar URL (${r.status})`);
      const ab = await r.arrayBuffer();
      const buffer = Buffer.from(ab);
      const contentType = r.headers.get('content-type') || 'application/octet-stream';
      const ext = guessExtFromMime(contentType);
      const filename = body.url.split('/').pop() || `avatar.${ext}`;
      return { buffer, contentType, filename };
    }
    if (typeof body.avatarUrl === 'string' && body.avatarUrl) {
      return { avatarUrl: body.avatarUrl };
    }
  }
  return null;
}

/** upload para /wp/v2/media */
async function uploadToWpMedia(file: {
  buffer: Buffer;
  contentType: string;
  filename: string;
}): Promise<{ id: number; source_url: string } | null> {
  const auth = authHeaderBasic(); if (!auth) return null;

  const boundary = `----tfBoundary${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const CRLF = '\r\n';

  const preamble =
    `--${boundary}${CRLF}` +
    `Content-Disposition: form-data; name="file"; filename="${file.filename}"${CRLF}` +
    `Content-Type: ${file.contentType || 'application/octet-stream'}${CRLF}${CRLF}`;

  const closing = `${CRLF}--${boundary}--${CRLF}`;

  const bodyBuffer = Buffer.concat([
    Buffer.from(preamble, 'utf8'),
    file.buffer,
    Buffer.from(closing, 'utf8'),
  ]);

  const res = await fetch(`${WP_BASE}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Accept: 'application/json',
    },
    body: bodyBuffer as any,
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn('Upload WP media falhou:', res.status, txt);
    return null;
  }

  const j = await res.json().catch(() => null) as { id?: number | string; source_url?: string } | null;
  if (!j || j.id == null || !j.source_url) return null;
  return { id: Number(j.id), source_url: String(j.source_url) };
}

/** Reatribui a mídia ao usuário dono (author = userId) */
async function reassignMediaToUser(mediaId: number, userId: number) {
  const auth = authHeaderBasic(); if (!auth) return;
  try {
    await fetch(`${WP_BASE}/wp-json/wp/v2/media/${mediaId}`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ author: userId }),
      cache: 'no-store',
    });
  } catch {}
}

/** WP 6.6+ — tenta setar avatar nativo via avatar_media */
async function trySetCoreLocalAvatar(userId: number, mediaId: number): Promise<boolean> {
  const auth = authHeaderBasic(); if (!auth) return false;
  try {
    const r = await fetch(`${WP_BASE}/wp-json/wp/v2/users/${userId}`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ avatar_media: mediaId }),
      cache: 'no-store',
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Atualiza ACF do usuário (campo avatar) */
async function updateWpUserAcf(userId: number, fields: Record<string, unknown>) {
  const auth = authHeaderBasic(); if (!auth) return;
  const res = await fetch(`${WP_BASE}/wp-json/acf/v3/users/${userId}`, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  }).catch(() => null);
  if (res && !res.ok) {
    const txt = await res.text().catch(() => '');
    console.warn('ACF update falhou:', res.status, txt);
  }
}

/** Tenta gravar metas de plugins (precisa show_in_rest=true no WP) */
async function updatePluginAvatarMeta(userId: number, mediaId: number | null, url: string) {
  const auth = authHeaderBasic(); if (!auth) return { ok: false, status: 0 };
  // formatos aceitos por plugins comuns
  const meta: Record<string, unknown> = {};
  if (mediaId) {
    meta['simple_local_avatar'] = { media_id: mediaId, full: url || undefined };
    meta['wp_user_avatar'] = mediaId;
  } else if (url) {
    meta['simple_local_avatar'] = { full: url };
    meta['wp_user_avatar'] = url;
  } else {
    return { ok: false, status: 0 };
  }

  try {
    const r = await fetch(`${WP_BASE}/wp-json/wp/v2/users/${userId}`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ meta }),
      cache: 'no-store',
    });
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/* ========== handler ========== */
export async function POST(req: Request) {
  try {
    if (!WP_BASE) return NextResponse.json({ error: 'WP_BASE_URL/WP_URL ausente no .env' }, { status: 500 });
    if (!authHeaderBasic()) {
      return NextResponse.json({ error: 'WP_APP_USER/WP_APP_PASS não configurados (Application Password)' }, { status: 501 });
    }

    const email = await getSessionEmail();
    if (!email) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // resolve userId via APP (context=edit para ver e-mail)
    const auth = authHeaderBasic()!;
    const url = new URL(`${WP_BASE}/wp-json/wp/v2/users`);
    url.searchParams.set('context', 'edit');
    url.searchParams.set('per_page', '100');
    url.searchParams.set('search', email);

    const res = await fetch(url.toString(), {
      headers: { Authorization: auth, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: 'Falha ao localizar utilizador no WP' }, { status: 502 });

    const arr = await res.json().catch(() => null);
    if (!Array.isArray(arr)) return NextResponse.json({ error: 'Resposta inválida do WP' }, { status: 502 });

    const u = arr.find((x: any) => String(x?.email || '').toLowerCase() === email.toLowerCase());
    const userId = u?.id ? Number(u.id) : null;
    if (!userId) return NextResponse.json({ error: 'Utilizador não encontrado no WP' }, { status: 404 });

    const upload = await readUploadFromRequest(req);
    if (!upload) {
      return NextResponse.json(
        { error: 'Envie multipart/form-data com "file", ou JSON com { url } ou { avatarUrl }' },
        { status: 400 }
      );
    }

    let finalUrl = '';
    let mediaId: number | null = null;

    if ('buffer' in upload) {
      const up = await uploadToWpMedia({
        buffer: upload.buffer,
        contentType: upload.contentType,
        filename: `avatar-${userId}-${Date.now()}-${upload.filename}`,
      });
      if (!up) return NextResponse.json({ error: 'Falha no upload para o WordPress' }, { status: 502 });
      mediaId = up.id;
      finalUrl = up.source_url;

      // Garante que a mídia é "do usuário"
      await reassignMediaToUser(mediaId, userId);
    } else if ('avatarUrl' in upload) {
      finalUrl = upload.avatarUrl;
    }

    // 1) Tenta avatar nativo (WP 6.6+) UMA VEZ
    let coreTried = Boolean(mediaId);
    let coreApplied = false;
    if (mediaId) {
      coreApplied = await trySetCoreLocalAvatar(userId, mediaId);
    }

    // 2) Metas de plugins (requer show_in_rest no WP)
    const metaRes = await updatePluginAvatarMeta(userId, mediaId, finalUrl);

    // 3) ACF (se configurado)
    if (ACF_KEYS.avatar.length) {
      const fields: Record<string, unknown> = {};
      for (const k of ACF_KEYS.avatar) fields[k] = mediaId ?? finalUrl;
      await updateWpUserAcf(userId, fields);
    }

    // ===== Reemitir tf_token com avatar novo =====
    const ck = await cookies();
    const currentToken = ck.get(APP_COOKIE)?.value || '';
    let payload: any = null;
    if (currentToken) {
      try {
        const { payload: p } = await jwtVerify(currentToken, new TextEncoder().encode(JWT_SECRET));
        payload = p;
      } catch {
        if (SKIP_JWT_VERIFY) {
          try { payload = decodeJwt(currentToken); } catch { payload = null; }
        }
      }
    }

    if (payload && JWT_SECRET) {
      const refreshed = { ...payload, avatarUrl: finalUrl || payload.avatarUrl || '' };
      const newToken = await new SignJWT(refreshed)
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(String(refreshed.email || refreshed.sub || ''))
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(new TextEncoder().encode(JWT_SECRET));

      const proto = (req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':', ''));
      const isHttps = proto === 'https';
      const sameSite = CROSS ? 'none' : 'lax';
      const secure = CROSS ? true : isHttps;

      await ck.set({
        name: APP_COOKIE,
        value: newToken,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite,
        secure,
      });
    }

    // Devolve também o user atual (via /api/me)
    const base = getSelfBaseUrl(req);
    const newCookie = (await cookies()).get(APP_COOKIE)?.value || '';
    const meResp = await fetch(`${base}/api/me`, {
      headers: { cookie: `${APP_COOKIE}=${newCookie}` },
      cache: 'no-store',
    }).catch(() => null);
    const meData = meResp && meResp.ok ? await meResp.json().catch(() => ({})) : {};

    return NextResponse.json({
      ok: true,
      avatarUrl: finalUrl || undefined,
      user: meData?.user ?? null,
      debug: {
        coreTried,
        coreApplied,
        pluginMetaOK: metaRes.ok,
        pluginMetaStatus: metaRes.status || 0,
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Erro ao atualizar avatar', details: msg }, { status: 500 });
  }
}
