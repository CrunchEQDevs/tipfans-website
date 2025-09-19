// src/components/tipsters/MestresTips.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Sport = 'futebol' | 'basquete' | 'tenis' | 'esports';

type ApiItem = {
  author: { id: number; slug: string; name: string; avatar?: string | null };
  window: { last: number };
  counts?: { tips: number; articles: number };
  applied?: { sport?: string; period?: number | 'all' };
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

const SPORT_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'futebol', label: 'Futebol' },
  { value: 'tenis', label: 'Ténis' },
  { value: 'basquete', label: 'Basquete' },
  { value: 'esports', label: 'eSports' },
] as const;

const PERIOD_OPTIONS = [
  { value: 'all', label: 'Geral' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
] as const;

export default function MestresTips() {
  const [items, setItems] = useState<ApiItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // controles
  const [order, setOrder] = useState<'roi' | 'hit'>('roi');
  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]['value']>('all');
  const [sport, setSport] = useState<(typeof SPORT_OPTIONS)[number]['value']>('all');
  const [last, setLast] = useState(20);

  // animação da barra
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setAnimateBars(false); // reseta animação antes do fetch

        const u = new URL('/api/competicao/masters', window.location.origin);
        u.searchParams.set('order', order);
        u.searchParams.set('period', period);
        u.searchParams.set('sport', sport);
        u.searchParams.set('last', String(last));
        u.searchParams.set('limit', '6');
        u.searchParams.set('_', String(Date.now()));

        const r = await fetch(u.toString(), { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as ApiResp;

        if (!cancel) {
          setItems(Array.isArray(json.items) ? json.items : []);
        }
      } catch (e: any) {
        if (!cancel) setErr(String(e?.message ?? e));
      } finally {
        if (!cancel) {
          setLoading(false);
          requestAnimationFrame(() => setAnimateBars(true));
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [order, period, sport, last]); // ✅ deps explícitas

  // ===== helpers estáveis =====
  const metricOf = useCallback(
    (it: ApiItem) => (order === 'hit' ? (it.stats?.hitPct ?? 0) : (it.stats?.roiPct ?? 0)),
    [order]
  );

  const hasMetrics = useCallback(
    (it: ApiItem) => Number(it?.stats?.settledCount ?? 0) > 0,
    []
  );

  // visibilidade: em esporte específico, só quem participa
  const visible = useMemo(() => {
    if (!items) return [] as ApiItem[];
    if (sport === 'all') return items;
    return items.filter((it) => hasMetrics(it) || (it.stats?.sports ?? []).includes(sport as Sport));
  }, [items, sport, hasMetrics]);

  // normalização da barra — só com quem tem métricas
  const { minVal, maxVal } = useMemo(() => {
    const withMetrics = visible.filter(hasMetrics);
    if (!withMetrics.length) return { minVal: 0, maxVal: 0 };
    const vals = withMetrics.map(metricOf);
    return { minVal: Math.min(...vals), maxVal: Math.max(...vals) };
  }, [visible, metricOf, hasMetrics]);

  const round1 = (n: number) => Number((n ?? 0).toFixed(1));

  // líderes (considera empate)
  const leaderSet = useMemo(() => {
    const withMetrics = visible.filter(hasMetrics);
    const set = new Set<string>();
    if (!withMetrics.length) return set;
    const top = Math.max(...withMetrics.map(metricOf));
    const top1 = round1(top);
    for (const it of withMetrics) {
      if (round1(metricOf(it)) === top1) set.add(it.author.slug);
    }
    return set;
  }, [visible, metricOf, hasMetrics]);

  // ===== skeleton =====
  const Sk = ({ className = '' }: { className?: string }) => (
    <span className={`inline-block animate-pulse rounded bg-white/10 ${className}`} />
  );

  const SkeletonRow = () => (
    <li className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white/10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <Sk className="h-5 w-44" />
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

  // troféu (inline SVG)
  const Trophy = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" role="img" focusable="false">
      <path
        d="M6 3h12v2h2a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-1.1A5.002 5.002 0 0 1 12 15a5.002 5.002 0 0 1-2.9-2H8a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1h2V3Zm12 4V6h2v1a3 3 0 0 1-3 3h-1.1c.067-.32.1-.65.1-1V7Zm-12 0v2c0 .35.033.68.1 1H5a3 3 0 0 1-3-3V6h2v1Zm6 10c1.657 0 3 1.343 3 3v1H9v-1c0-1.657 1.343-3 3-3Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 text-center">
      <div className="border-b border-white/10 px-6 py-5">
        <h3 className="text-xl font-bold text-white">Os Mestres das Tips</h3>
        <p className="mt-1 text-sm text-white/60">Ranking dinâmico por período, esporte e ordenação.</p>

        {/* Controles */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
          {/* Ordenação */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-white/60">Ordenar por</span>
            <div className="flex rounded-lg bg-white/10 p-1">
              {(['roi', 'hit'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setOrder(opt)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                    order === opt ? 'bg-white/20 text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {opt === 'roi' ? 'ROI' : 'Hit'}
                </button>
              ))}
            </div>
          </div>

          {/* Período */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-white/60">Período</span>
            <div className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
              {PERIOD_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md ${
                    period === p.value ? 'bg-white/20 text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Esporte */}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-white/60">Esporte</span>
            <div className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSport(s.value)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-md ${
                    sport === s.value ? 'bg-white/20 text-white' : 'text-white/75 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* aviso quando só 1 no filtro */}
        {!loading && !err && sport !== 'all' && visible.length === 1 && (
          <div className="mt-2 text-[11px] text-white/60">Sem concorrentes nesta categoria.</div>
        )}
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

        {!loading && !err && visible.length === 0 && (
          <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-white/70">
            Sem tipsters por enquanto.
          </li>
        )}

        {!loading &&
          !err &&
          visible.map((it) => {
            const { author, stats, counts } = it;

            const settled = Number(stats?.settledCount ?? 0);
            const has = settled > 0;

            const hit = has ? Number((stats.hitPct ?? 0).toFixed(1)) : null;
            const roi = has ? Number((stats.roiPct ?? 0).toFixed(1)) : null;

            const metricRaw = has ? metricOf(it) : null;

            // barra relativa ao líder (cobre casos negativos)
            let barPct = 0;
            if (typeof metricRaw === 'number' && Number.isFinite(maxVal) && Number.isFinite(minVal)) {
              if (maxVal === minVal) {
                barPct = has ? 60 : 0; // se todos iguais, dá 60% para não “zerar” a barra
              } else {
                barPct = ((metricRaw - minVal) / (maxVal - minVal)) * 100;
              }
              barPct = Math.max(0, Math.min(100, Math.round(barPct)));
            }

            const lastStr = stats?.lastDate ? new Date(stats.lastDate).toLocaleString('pt-PT') : '';
            const isLeader = has && leaderSet.has(author.slug);

            return (
              <li
                key={author.slug}
                className={`rounded-xl border border-white/10 bg-white/5 p-4 ${
                  isLeader ? 'ring-1 ring-orange-400/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Foto maior */}
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {author.avatar ? (
                      <Image
                        src={author.avatar}
                        alt={author.name}
                        fill
                        className="object-cover"
                        sizes="112px"
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

                      {/* Troféu apenas para líder(ES) */}
                      {isLeader && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/15 px-2 py-[2px] text-[11px] font-semibold text-orange-300">
                          <Trophy className="h-3.5 w-3.5" />
                          <span className="sr-only">Líder</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-sm text-white/80">
                      {has ? (
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

                    {/* Barra com scaleX para animar sem bug de largura */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
                      <div
                        className={`h-full bg-gradient-to-r from-orange-500 to-orange-400 ${
                          isLeader ? 'shadow-[0_0_12px_rgba(234,88,12,0.5)]' : ''
                        }`}
                        style={{
                          transform: animateBars ? `scaleX(${barPct / 100})` : 'scaleX(0)',
                          transformOrigin: 'left',
                          transition: 'transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                        }}
                        aria-label={
                          has
                            ? `${order === 'hit' ? 'Hit' : 'ROI'} ${barPct}% relativo`
                            : 'Sem métricas'
                        }
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
