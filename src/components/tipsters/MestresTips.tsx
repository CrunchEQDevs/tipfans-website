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
    hitPct: number;
    roiPct: number;
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

  // fetch sempre dinâmico (no-store + cache-buster)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setAnimateBars(false);

        const u = new URL('/api/competicao/masters', window.location.origin);
        u.searchParams.set('order', order);
        u.searchParams.set('period', period);
        u.searchParams.set('sport', sport);
        u.searchParams.set('last', String(last));
        u.searchParams.set('limit', '6');
        u.searchParams.set('_', String(Date.now())); // força atualização

        const r = await fetch(u.toString(), { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = (await r.json()) as ApiResp;
        if (!cancel) setItems(Array.isArray(json.items) ? json.items : []);
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
  }, [order, period, sport, last]);

  // helpers estáveis
  const metricOf = useCallback(
    (it: ApiItem) => (order === 'hit' ? (it.stats?.hitPct ?? 0) : (it.stats?.roiPct ?? 0)),
    [order]
  );
  const hasMetrics = useCallback((it: ApiItem) => Number(it?.stats?.settledCount ?? 0) > 0, []);

  // visibilidade por esporte (só quem participa quando filtro != all)
  const visible = useMemo(() => {
    if (!items) return [] as ApiItem[];
    if (sport === 'all') return items;
    return items.filter((it) => hasMetrics(it) || (it.stats?.sports ?? []).includes(sport as Sport));
  }, [items, sport, hasMetrics]);

  // normalização da barra (apenas com quem tem métricas)
  const { minVal, maxVal } = useMemo(() => {
    const withMetrics = visible.filter(hasMetrics);
    if (!withMetrics.length) return { minVal: 0, maxVal: 0 };
    const vals = withMetrics.map(metricOf);
    return { minVal: Math.min(...vals), maxVal: Math.max(...vals) };
  }, [visible, metricOf, hasMetrics]);

  const round1 = (n: number) => Number((n ?? 0).toFixed(1));

  // líderes (empate considerado)
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

  // skeleton
  const Sk = ({ className = '' }: { className?: string }) => (
    <span className={`inline-block animate-pulse rounded bg-white/10 ${className}`} />
  );
  const SkeletonRow = () => (
    <li className="rounded-xl ring-1 ring-white/10 bg-[#1B1F2A]/80 backdrop-blur-sm p-4">
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

  // ícone troféu
  const Trophy = ({ className = '' }: { className?: string }) => (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" role="img" focusable="false">
      <path
        d="M6 3h12v2h2a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-1.1A5.002 5.002 0 0 1 12 15a5.002 5.002 0 0 1-2.9-2H8a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1h2V3Zm12 4V6h2v1a3 3 0 0 1-3 3h-1.1c.067-.32.1-.65.1-1V7Zm-12 0v2c0 .35.033.68.1 1H5a3 3 0 0 1-3-3V6h2v1Zm6 10c1.657 0 3 1.343 3 3v1H9v-1c0-1.657 1.343-3 3-3Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* BACKGROUND 100% DA TELA (por baixo de tudo) */}
       <div className="pointer-events-none absolute left-0  top-4 hidden md:block opacity-90">
              <Image
                src="/MESTRES.png"
                alt=""
                width={1000}
                height={300}
                className="h-auto w-[1800px] object-contain"
                sizes="620px"
                priority
              />
            </div>
      {/* leve véu para legibilidade */}
  

      {/* CONTEÚDO */}
      <div className="relative z-10 w-full py-10">
        <div className="container mx-auto px-4">
          {/* cartão com mesma cor/acabamento das outras seções */}
          <div className="rounded-xl bg-[#1E1E1E]/60 backdrop-blur-sm text-center ring-1 ring-white/10">
            <div className="">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white text-left">Os Mestres Das Tips</h1>
              <p className="mt-14 mb-8 text-xl text-white/90 font-bold">
                Ranking dinâmico por período, esporte e ordenação.
              </p>

              {/* Controles — laranja */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
                {/* Ordenação */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-white/80 font-bold">Ordenar por</span>
                  <div className="flex rounded-md bg-white/10 p-1">
                    {(['roi', 'hit'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setOrder(opt)}
                        className={`px-3 py-2 text-xs font-bold ${
                          order === opt
                            ? 'bg-[#ED4F00] text-white'
                            : 'text-white/85 hover:text-white hover:bg-[#ED4F00]/20'
                        }`}
                      >
                        {opt === 'roi' ? 'ROI' : 'Hit'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Período */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-white/80 font-bold">Período</span>
                  <div className="flex flex-wrap gap-1 rounded-md bg-white/10 p-1">
                    {PERIOD_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`px-3 py-2 text-xs font-bold ${
                          period === p.value
                            ? 'bg-[#ED4F00] text-white'
                            : 'text-white/85 hover:text-white hover:bg-[#ED4F00]/20'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Esporte */}
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wide text-white/80 font-bold">Esporte</span>
                  <div className="flex flex-wrap gap-1 rounded-md bg-white/10 p-1">
                    {SPORT_OPTIONS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSport(s.value)}
                        className={`px-3 py-2 text-xs font-bold ${
                          sport === s.value
                            ? 'bg-[#ED4F00] text-white'
                            : 'text-white/85 hover:text-white hover:bg-[#ED4F00]/20'
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
                <div className="mt-2 text-[11px] text-white/70">Sem concorrentes nesta categoria.</div>
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
                <li className="ring-1 ring-white/10 bg-[#1B1F2A]/80 backdrop-blur-sm p-4 text-left text-red-300">
                  {err}
                </li>
              )}

              {!loading && !err && visible.length === 0 && (
                <li className="ring-1 ring-white/10 bg-[#1B1F2A]/80 backdrop-blur-sm p-4 text-left text-white/80">
                  Sem participantes no momento.
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

                  // barra relativa ao líder
                  let barPct = 0;
                  if (typeof metricRaw === 'number' && Number.isFinite(maxVal) && Number.isFinite(minVal)) {
                    if (maxVal === minVal) barPct = has ? 60 : 0;
                    else barPct = ((metricRaw - minVal) / (maxVal - minVal)) * 100;
                    barPct = Math.max(0, Math.min(100, Math.round(barPct)));
                  }

                  const lastStr = stats?.lastDate ? new Date(stats.lastDate).toLocaleString('pt-PT') : '';
                  const isLeader = has && leaderSet.has(author.slug);

                  return (
                    <li
                      key={author.slug}
                      className={`ring-1 ring-white/10 bg-[#1B1F2A]/80 backdrop-blur-sm p-4 ${
                        isLeader ? 'ring-[#ED4F00]/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Foto */}
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

                            <span className="border border-white/10 bg-white/10 px-2 py-[2px] text-[11px] text-white/85">
                              {stats?.sports?.length ? stats.sports.map((s) => SPORT_LABEL[s]).join(' • ') : '—'}
                            </span>

                            {/* Troféu apenas p/ líder(ES) */}
                            {isLeader && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-[#ED4F00]/20 px-2 py-[2px] text-[11px] font-semibold text-[#FFB490]">
                                <Trophy className="h-3.5 w-3.5" />
                                <span className="sr-only">Líder</span>
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-sm text-white/85">
                            {has ? (
                              <>
                                <span className="text-[#FFB490] font-semibold">Hit {hit}%</span>
                                {' • '}
                                <span className="text-[#FFB490] font-semibold">ROI {roi}%</span>
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

                          {/* Barra */}
                          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
                            <div
                              className={`h-full bg-gradient-to-r from-[#ED4F00] to-[#FF944D] ${
                                isLeader ? 'shadow-[0_0_12px_rgba(237,79,0,0.5)]' : ''
                              }`}
                              style={{
                                transform: animateBars ? `scaleX(${barPct / 100})` : 'scaleX(0)',
                                transformOrigin: 'left',
                                transition: 'transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                              }}
                              aria-label={has ? `${order === 'hit' ? 'Hit' : 'ROI'} ${barPct}% relativo` : 'Sem métricas'}
                            />
                          </div>

                          <div className="mt-3">
                            {/* Se você removeu a página /tipsters, comente o Link abaixo */}
                            <Link
                              href={`/tipsters/${author.slug}`}
                              className="inline-flex items-center gap-2 bg-[#ED4F00] px-3 py-1.5 text-xs font-semibold text-white/90 hover:bg-white/15"
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
        </div>
      </div>
    </section>
  );
}
