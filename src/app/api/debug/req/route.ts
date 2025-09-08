// src/app/api/debug/req/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const proto = (req.headers.get('x-forwarded-proto') || url.protocol.replace(':',''));
  return NextResponse.json(
    {
      url: url.toString(),
      protocol: url.protocol,
      x_forwarded_proto: req.headers.get('x-forwarded-proto') || null,
      inferred_is_https: proto === 'https',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
