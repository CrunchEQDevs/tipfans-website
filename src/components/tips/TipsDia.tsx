// src/components/tipsdodia/TipsDia.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import TipsDiaDesktop from './desktop/TipsDiaDesktop';
import TipsDiaMobile from './mobile/TipsDiaMobile';
import type { TipCard } from './types';

/* ====== Navegação por categorias (links reais) ====== */
const TOP_LINKS = [
  { label: 'Futebol',   href: '/tips/futebol' },
  { label: 'Ténis',     href: '/tips/tenis' },
  { label: 'Basquete',  href: '/tips/basquete' },
  { label: 'E-sports',  href: '/tips/esports' },
  { label: 'Ver todas', href: '/tips/todas' },
];

/* ====== Utils ====== */
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
  u.searchParams.set('_', String(Date.now())); // cache-buster
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

/* ====== Skeletons (desktop e mobile) ====== */
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`rounded-lg bg-white/5 overflow-hidden animate-pulse ${wide ? 'h-[280px]' : ''}`}>
      <div className="w-full aspect-[16/9] bg-white/10" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 bg-white/15 rounded" />
        <div className="h-4 w-1/2 bg-white/10 rounded" />
      </div>
    </div>
  );
}
function SkeletonDesktop() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
function SkeletonMobile() {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="min-w-[260px] max-w-[260px]">
          <SkeletonCard wide />
        </div>
      ))}
    </div>
  );
}

/* ====== Componente ====== */
export default function TipsDia() {
  const [items, setItems] = useState<TipCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        // 100% dinâmico: busca do WP (todas as tips, todos os desportos, mais recentes primeiro)
        const json = await fetchJson('/api/wp/tips?per_page=all&sport=all&orderby=date&order=desc');
        const rows: any[] = Array.isArray(json?.items) ? json.items : [];

        const mapped: TipCard[] = rows.map((p: any) => {
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

        const ordered = mapped.sort((a, b) => ts(b) - ts(a));
        if (!cancel) setItems(ordered);
      } catch {
        if (!cancel) setItems([]); // sem dados; continuará sem “fakes”
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // chave para reiniciar carrossel sempre no mais recente
  const firstKey = `first-${items[0]?.id ?? 'none'}`;

  // memo apenas para garantir ordenação (caso futuro)
  const tipsSorted = useMemo(() => {
    const base = items.slice();
    base.sort((a, b) => ts(b) - ts(a));
    // garante href válido
    return base.map((t) => ({
      ...t,
      href: t.href ?? (t as any).hrefPost ?? `/tips/${toSportSlug(t.sport)}/${t.id}`,
    }));
  }, [items]);

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* BG desktop decor (opcional; não é dado fictício) */}
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

      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Tips do Dia</h1>

          <div className="flex flex-wrap items-center gap-2">
            {TOP_LINKS.map((b) => (
              <Link
                key={b.label}
                href={b.href}
                className="inline-flex items-center rounded bg-[#ED4F00] hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          {loading ? (
            <SkeletonDesktop />
          ) : (
            <TipsDiaDesktop key={`desktop-${firstKey}`} tips={tipsSorted} />
          )}
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          {loading ? (
            <SkeletonMobile />
          ) : (
            <TipsDiaMobile key={`mobile-${firstKey}`} tips={tipsSorted} />
          )}
        </div>
      </div>
    </section>
  );
}
