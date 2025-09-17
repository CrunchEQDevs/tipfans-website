// src/components/tipsters/MestresTips.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

type TipsterConfig = {
  name: string;
  slug: string;     // slug do autor no WP
  avatar?: string;
};

type StatsResponse = {
  author: { id: number; slug: string; name: string };
  window: { last: number };
  stats: {
    sports: Sport[];
    settledCount: number;
    pushes: number;
    stakeTotal: number;
    units: number;
    hitPct: number;    // %
    roiPct: number;    // %
    lastDate?: string;
  };
};

const TIPSTERS: TipsterConfig[] = [
  { name: 'Tipsters 1', slug: 'tipsters1', avatar: '/user.png' },
  { name: 'Tipsters 2', slug: 'tipsters2', avatar: '/user.png' },
  { name: 'Tipsters 3', slug: 'tipsters3', avatar: '/user.png' },
];

const SPORT_LABEL: Record<Sport, string> = {
  futebol: 'Futebol',
  tenis: 'Ténis',
  basquete: 'Basquetebol',
  esports: 'eSports',
};

export default function MestresTips() {
  const [data, setData] = useState<Record<string, { loading: boolean; res?: StatsResponse; err?: string }>>(
    () => Object.fromEntries(TIPSTERS.map(t => [t.slug, { loading: true }]))
  );

  useEffect(() => {
    let canceled = false;
    (async () => {
      for (const t of TIPSTERS) {
        try {
          const u = new URL(`/api/tipsters/${t.slug}/stats`, window.location.origin);
          u.searchParams.set('last', '20');
          const r = await fetch(u.toString(), { cache: 'no-store' });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          const json = (await r.json()) as StatsResponse;
          if (!canceled) {
            setData(prev => ({ ...prev, [t.slug]: { loading: false, res: json } }));
          }
        } catch (e: any) {
          if (!canceled) {
            setData(prev => ({ ...prev, [t.slug]: { loading: false, err: String(e.message || e) } }));
          }
        }
      }
    })();
    return () => { canceled = true; };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 text-center">
      <div className="border-b border-white/10 px-6 py-5">
        <h3 className="text-xl font-bold text-white">Os Mestres das Tips</h3>
        <p className="mt-1 text-sm text-white/60">
          Métricas reais nas últimas 20 tips por autor.
        </p>
      </div>

      <ul className="p-4 sm:p-6 space-y-5">
        {TIPSTERS.map((m) => {
          const entry = data[m.slug];
          const loading = entry?.loading;
          const stats = entry?.res?.stats;
          const sports = stats?.sports ?? [];
          const hit = Math.max(0, Math.min(100, Math.round((stats?.hitPct ?? 0) * 10) / 10));  // 1 casa
          const roi = Math.round((stats?.roiPct ?? 0) * 10) / 10;
          const bar = hit; // usa acerto% como barra
          const lastStr = stats?.lastDate ? new Date(stats.lastDate).toLocaleString('pt-PT') : '—';

          return (
            <li key={m.slug} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
                  <Image
                    src={m.avatar ?? '/user.png'}
                    alt={m.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <p className="truncate text-white font-semibold">{m.name}</p>
                    <span className="rounded-md border border-white/10 bg-white/10 px-2 py-[2px] text-[11px] text-white/80">
                      {sports.length ? sports.map(s => SPORT_LABEL[s]).join(' • ') : '—'}
                    </span>
                  </div>

                  {loading ? (
                    <div className="mt-2 text-sm text-white/70">Carregando…</div>
                  ) : entry?.err ? (
                    <div className="mt-2 text-sm text-red-300">{entry.err}</div>
                  ) : (
                    <>
                      <div className="mt-2 text-sm text-white/80">
                        <span className="text-orange-400 font-semibold">Hit {hit}%</span>
                        {' • '}
                        <span className="text-orange-400 font-semibold">ROI {roi}%</span>
                        {' • '}
                        {stats?.settledCount ?? 0} tips liquidadas
                        {' • '}
                        última: {lastStr}
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                          style={{ width: `${Math.min(100, bar)}%` }}
                        />
                      </div>

                      <div className="mt-3">
                        <Link
                          href={`/tipster/${m.slug}`}
                          className="inline-flex items-center gap-2 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
                        >
                          Ver perfil
                          <span className="text-xl leading-none">›</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
