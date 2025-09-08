import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CROSS = process.env.CROSS_SITE_COOKIES === '1';
const IS_PROD = process.env.NODE_ENV === 'production';

export async function POST(req: Request) {
  const ck = await cookies();

  // inferir https pra flag secure correta em dev/prod
  const proto = req.headers.get('x-forwarded-proto') || new URL(req.url).protocol.replace(':','');
  const isHttps = proto === 'https';
  const sameSite = CROSS ? 'none' : 'lax';
  const secure   = CROSS ? true : isHttps;

  for (const name of ['tf_token','wp_jwt']) {
    ck.set(name, '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite,
      secure,
    });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
