'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import TipsDiaDesktop from './desktop/TipsDiaDesktop';
import TipsDiaMobile from './mobile/TipsDiaMobile';
import type { TipCard } from './types';

const TOP_LINKS = [
  { label: 'Futebol',   href: '/tips/futebol' },
  { label: 'Ténis',     href: '/tips/tenis' },
  { label: 'Basquete',  href: '/tips/basquete' },
  { label: 'E-sports',  href: '/tips/esports' },
  { label: 'Ver todas', href: '/tips/todas' },
];

// normalização segura
function normSafe(v: unknown) {
  const s = v == null ? '' : String(v);
  try {
    // @ts-ignore
    return (s.normalize ? s.normalize('NFD') : s).replace(/\p{Diacritic}/gu, '').toLowerCase();
  } catch {
    return s.toLowerCase();
  }
}

function toSportSlug(s?: string) {
  const x = normSafe(s || '');
  if (x.replace(/[^a-z0-9]/g, '').includes('esports') || x.includes('e-sport') || x.includes('e sport')) return 'esports';
  if (x.startsWith('basq') || x.includes('basket')) return 'basquete';
  if (x.startsWith('ten')) return 'tenis';
  if (x.startsWith('fut') || x.includes('soccer') || x.includes('foot')) return 'futebol';
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

// timestamp seguro para ordenar DESC
function ts(it?: { createdAt?: string; id?: string | number }) {
  const t = it?.createdAt ? new Date(it.createdAt).getTime() : NaN;
  if (!Number.isNaN(t)) return t;
  const idNum = Number(it?.id);
  return Number.isFinite(idNum) ? idNum : -Infinity;
}

export default function TipsDia({ tips }: { tips?: TipCard[] }) {
  const [fetched, setFetched] = useState<TipCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        // busca todas as tips de todos os desportos (mais recentes primeiro)
        const json = await fetchJson('/api/wp/tips?per_page=all&sport=all&orderby=date&order=desc');
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

        // garante mais recente primeiro
        const ordered = [...mapped].sort((a, b) => ts(b) - ts(a));

        if (!cancel) setFetched(ordered);
      } catch {
        if (!cancel) setFetched([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // prioriza os dados dinâmicos; se falhar, usa o prop do server (também ordenado)
  const items: TipCard[] = useMemo(() => {
    const base: TipCard[] = (fetched.length ? fetched : (tips || [])).slice();
    base.sort((a, b) => ts(b) - ts(a)); // ordena fallback do server também
    return base.map((t) => ({
      ...t,
      href: t.href ?? (t as any).hrefPost ?? `/tips/${toSportSlug(t.sport)}/${t.id}`,
    }));
  }, [fetched, tips]);

  // chave que força o carrossel a reiniciar no slide 0 quando o "mais recente" muda
  const firstKey = `first-${items[0]?.id ?? 'none'}`;

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
                className="inline-flex items-center rounded-lg bg-[#ED4F00] hover:bg白/20 text-white text-sm font-semibold px-3 py-1.5 transition"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <TipsDiaDesktop key={`desktop-${firstKey}`} tips={items} />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <TipsDiaMobile key={`mobile-${firstKey}`} tips={items} />
        </div>

        {!fetched.length && loading && (
          <div className="mt-4 text-sm text-gray-400">a carregar…</div>
        )}
      </div>
    </section>
  );
}
