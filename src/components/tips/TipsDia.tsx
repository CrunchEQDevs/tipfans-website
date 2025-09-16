'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import TipsDiaDesktop from './desktop/TipsDiaDesktop';
import TipsDiaMobile from './mobile/TipsDiaMobile';
import type { TipCard } from './types';

const MAX_CARDS = 6;

const TOP_LINKS = [
  { label: 'Futebol',  href: '/tips/futebol' },
  { label: 'Ténis',    href: '/tips/tenis' },
  { label: 'Basquete', href: '/tips/basquete' },
  { label: 'E-sports', href: '/tips/esports' },
  { label: 'Ver todas', href: '/tips' },
];

function toSportSlug(s?: string) {
  const x = (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (x.includes('esport')) return 'esports';
  if (x.startsWith('basq') || x.includes('basket')) return 'basquete';
  if (x.startsWith('ten')) return 'tenis';
  return 'futebol';
}
function htmlToText(html = '') {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
function formatPt(dateIso?: string) {
  if (!dateIso) return '';
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
async function fetchJson(url: string) {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  const r = await fetch(u.toString(), { cache: 'no-store' });
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function TipsDia({ tips }: { tips?: TipCard[] }) {
  const [fetched, setFetched] = useState<TipCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        const json = await fetchJson('/api/wp/tips?per_page=6&orderby=date&order=desc');
        const items: any[] = Array.isArray(json?.items) ? json.items : [];

        const mapped: TipCard[] = items.map((p: any) => {
          const sport = toSportSlug(p.sport);
          const text = htmlToText(p.excerpt || '');
          const resumo = text.slice(0, 200);
          return {
            id: p.id,
            title: p.title ?? '',
            sport,
            image: p.cover ?? null,
            author: p.author ?? undefined,
            createdAt: p.createdAt ?? undefined,
            href: p.hrefPost ?? `/tips/${sport}/${p.id}`,
            resumo: resumo || undefined,
            excerpt: resumo || undefined,
            autorLinha: p.author
              ? `${p.author}${p.createdAt ? ' — ' + formatPt(p.createdAt) : ''}`
              : undefined,
            categoria:
              sport === 'esports' ? 'E-sports' :
              sport === 'basquete' ? 'Basquete' :
              sport === 'tenis' ? 'Ténis' : 'Futebol',
          };
        });

        if (!cancel) setFetched(mapped);
      } catch {
        if (!cancel) setFetched([]); // vai cair no fallback (tips prop)
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // prioriza os dados DINÂMICOS; se falhar, usa o prop do server
  const base = useMemo(() => (fetched.length ? fetched : (tips || [])), [fetched, tips]);

  const items: TipCard[] = base
    .slice(0, MAX_CARDS)
    .map((t) => ({
      ...t,
      href: t.href ?? t.hrefPost ?? `/tips/${toSportSlug(t.sport)}/${t.id}`,
    }));

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* BG desktop decor */}
      <div className="pointer-events-none absolute left-0 top-4 hidden md:block opacity-90">
        <Image
          src="/tips/TIPS_menu.png"
          alt=""
          width={1000}
          height={300}
          className="h-auto w-[1200px] object-contain"
          sizes="520px"
          priority
        />
      </div>

      {/* BG mobile */}
      <div className="md:hidden absolute inset-0 -z-10 pointer-events-none select-none">
        <Image
          src="/tips/TIPS_menu.png"
          alt="Tips BG"
          fill
          sizes="100vw"
          className="object-contain object-center opacity-10 scale-[1.35] translate-y-6"
          priority
        />
      </div>

      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Tips do Dia</h2>

          <div className="flex flex-wrap items-center gap-2">
            {TOP_LINKS.map((b) => (
              <Link
                key={b.label}
                href={b.href}
                className="inline-flex items-center rounded-lg bg-[#ED4F00] hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <TipsDiaDesktop tips={items} />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <TipsDiaMobile tips={items} />
        </div>

        {!fetched.length && loading && (
          <div className="mt-4 text-sm text-gray-400">a carregar…</div>
        )}
      </div>
    </section>
  );
}
