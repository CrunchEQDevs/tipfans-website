// src/components/tipsters/MestresTips.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

type ApiItem = {
  author: { id: number; slug: string; name: string; avatar?: string | null };
  window: { last: number };
  counts?: { tips: number; articles: number };
  stats: {
    sports: Sport[];
    settledCount: number;
    pushes: number;
    stakeTotal: number;
    units: number;
    hitPct: number; // %
    roiPct: number; // %
    lastDate?: string;
  };
};

type ApiResp = { items: ApiItem[] };

const SPORT_LABEL: Record<Sport, string> = {
  futebol: 'Futebol',
  tenis: 'Ténis',
  basquete: 'Basquetebol',
  esports: 'eSports',
};

export default function MestresTips() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const u = new URL('/api/competicao/masters', window.location.origin);
        u.searchParams.set('last', '20');
        u.searchParams.set('limit', '6');
        u.searchParams.set('order', 'roi');
        u.searchParams.set('_', String(Date.now()));
        const r = await fetch(u.toString(), { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as ApiResp;
        if (!cancel) setItems(Array.isArray(json.items) ? json.items : []);
      } catch (e: any) {
        if (!cancel) setErr(String(e?.message ?? e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // skeleton helpers
  const Sk = ({ className = '' }: { className?: string }) => (
    <span className={`inline-block animate-pulse rounded bg-white/10 ${className}`} />
  );

  const SkeletonRow = () => (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <Sk className="h-5 w-40" />
            <Sk className="h-4 w-24" />
          </div>
          <Sk className="mt-2 h-4 w-2/3" />
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
            <div className="h-full animate-pulse bg-white/20 w-1/2" />
          </div>
          <Sk className="mt-3 h-8 w-28" />
        </div>
      </div>
    </li>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 text-center">
      <div className="border-b border-white/10 px-6 py-5">
        <h3 className="text-xl font-bold text-white">Os Mestres das Tips</h3>
        <p className="mt-1 text-sm text-white/60">Métricas reais nas últimas 20 tips por autor!</p>
      </div>

      <ul className="p-4 sm:p-6 space-y-5">
        {loading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {!loading && err && (
          <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-red-300">
            {err}
          </li>
        )}

        {!loading && !err && items && items.length === 0 && (
          <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-white/70">
            Sem tipsters por enquanto.
          </li>
        )}

        {!loading &&
          !err &&
          items &&
          items.length > 0 &&
          items.map((it) => {
            const { author, stats, counts } = it;
            const settled = stats?.settledCount ?? 0;
            const hasMetrics = settled > 0;
            const hit = hasMetrics
              ? Math.max(0, Math.min(100, Math.round((stats.hitPct ?? 0) * 10) / 10))
              : null;
            const roi = hasMetrics ? Math.round((stats.roiPct ?? 0) * 10) / 10 : null;
            const bar = hasMetrics ? Math.min(100, Math.max(0, hit!)) : 0;
            const lastStr = stats?.lastDate ? new Date(stats.lastDate).toLocaleString('pt-PT') : '';

            return (
              <li key={author.slug} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                    {author.avatar ? (
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                        unoptimized
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img && !img.src.endsWith('/user.png')) img.src = '/user.png';
                        }}
                      />
                    ) : (
                      <div className="h-full w-full animate-pulse bg-white/10" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="truncate text-white font-semibold">{author.name}</p>
                      <span className="rounded-md border border-white/10 bg-white/10 px-2 py-[2px] text-[11px] text-white/80">
                        {stats?.sports?.length
                          ? stats.sports.map((s) => SPORT_LABEL[s]).join(' • ')
                          : '—'}
                      </span>
                    </div>

                    <div className="mt-2 text-sm text-white/80">
                      {hasMetrics ? (
                        <>
                          <span className="text-orange-400 font-semibold">Hit {hit}%</span>
                          {' • '}
                          <span className="text-orange-400 font-semibold">ROI {roi}%</span>
                          {' • '}
                          {settled} tips liquidadas
                          {lastStr ? <> {' • '} última: {lastStr}</> : null}
                        </>
                      ) : counts ? (
                        <>
                          {counts.tips} tips • {counts.articles} artigos
                        </>
                      ) : (
                        <>—</>
                      )}
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                        style={{ width: hasMetrics ? `${bar}%` : '0%' }}
                      />
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/tipsters/${author.slug}`}
                        className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
                      >
                        Ver perfil
                        <span className="text-xl leading-none">›</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
