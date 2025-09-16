// src/lib/fetchTipsDia.ts
import { headers } from 'next/headers';

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports' | 'todos';

function normalizeSport(raw?: string): Exclude<Sport, 'todos'> {
  const s = (raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

function getEnvOrigin(): string | null {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL;
  if (!env) return null;
  const url = env.startsWith('http') ? env : `https://${env}`;
  return url.replace(/\/$/, '');
}

async function getHeaderOrigin(): Promise<string> {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

export async function fetchTipsDia(
  perPage = 6,
  sport: Sport = 'todos'
): Promise<
  Array<{
    id: string | number;
    title: string;
    sport: Exclude<Sport, 'todos'>;
    image?: string | null;
    author?: string;
    createdAt?: string;
    excerpt?: string;       // 👈 agora incluímos
    href: string;
  }>
> {
  const origin = getEnvOrigin() ?? (await getHeaderOrigin());

  const qs = new URLSearchParams({ per_page: String(perPage) });
  if (sport !== 'todos') qs.set('sport', sport);
  const url = `${origin}/api/wp/tips?${qs.toString()}`;

  const res = await fetch(url, { cache: 'no-store', next: { revalidate: 0 } });
  if (!res.ok) return [];

  const json = await res.json();
  const items: any[] = Array.isArray(json?.items) ? json.items : [];

  return items.map((p: any) => {
    const s = normalizeSport(p?.sport);
    return {
      id: p?.id,
      title: p?.title ?? '',
      sport: s,
      image: p?.cover ?? null,
      author: p?.author ?? undefined,
      createdAt: p?.createdAt ?? p?.date ?? undefined,
      excerpt: p?.excerpt ?? undefined,   // 👈 repassado para o card
      href: `/tips/${s}/${p?.id}`,
    };
  });
}
