import { NextResponse } from 'next/server';

const WP_URL = process.env.WP_URL!;
const WP_ADMIN_TOKEN = process.env.WP_ADMIN_TOKEN || '';

export async function POST(req: Request) {
  try {
    if (!WP_URL || !WP_ADMIN_TOKEN) {
      return NextResponse.json({ error: 'WP_URL/WP_ADMIN_TOKEN ausentes' }, { status: 500 });
    }
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
    }

    const upload = await fetch(`${WP_URL.replace(/\/$/, '')}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WP_ADMIN_TOKEN}`,
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
      cache: 'no-store',
    });

    const j = (await upload.json().catch(() => ({}))) as { id?: number; source_url?: string; message?: string };
    if (!upload.ok || !j.id) {
      return NextResponse.json({ error: j?.message ?? 'Falha no upload' }, { status: upload.status || 500 });
    }

    return NextResponse.json({ ok: true, media: { id: j.id, url: j.source_url ?? null } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
