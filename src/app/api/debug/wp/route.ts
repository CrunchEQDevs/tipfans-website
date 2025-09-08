// src/app/api/debug/wp/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WP = (process.env.WP_URL || process.env.WP_BASE_URL || '').replace(/\/$/, '');

function noStoreJson(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET() {
  if (!WP) return noStoreJson({ error: 'WP_URL/WP_BASE_URL não configurado' }, 500);

  const ck = await cookies();
  const wpJwt = ck.get('wp_jwt')?.value || '';
  if (!wpJwt) return noStoreJson({ error: 'Sem wp_jwt (não logado ou cookie não salvo)' }, 401);

  const out: any = { base: WP };

  // 1) tentar validar o JWT (se o endpoint existir)
  try {
    const validateRes = await fetch(`${WP}/wp-json/jwt-auth/v1/token/validate`, {
      headers: { Authorization: `Bearer ${wpJwt}` },
      cache: 'no-store',
    });
    const validateJson = await validateRes.json().catch(() => ({}));
    out.validate = { ok: validateRes.ok, status: validateRes.status, body: validateJson };
  } catch (e) {
    out.validate = { ok: false, error: String(e) };
  }

  // 2) pegar /users/me
  try {
    const meRes = await fetch(`${WP}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${wpJwt}` },
      cache: 'no-store',
    });
    const meJson = await meRes.json().catch(() => ({}));
    out.me = {
      ok: meRes.ok,
      status: meRes.status,
      id: meJson?.id,
      email: meJson?.email,
      name: meJson?.name || meJson?.username || meJson?.slug,
      first_name: meJson?.first_name,
      last_name: meJson?.last_name,
      nickname: meJson?.nickname,
      username: meJson?.username,
      slug: meJson?.slug,
      roles: meJson?.roles,
      registered_date: meJson?.registered_date,
      avatar_preview: meJson?.avatar_urls?.['96'] || meJson?.avatar_urls?.['48'] || null,
      raw: meJson,
    };
  } catch (e) {
    out.me = { ok: false, error: String(e) };
  }

  return noStoreJson(out);
}
