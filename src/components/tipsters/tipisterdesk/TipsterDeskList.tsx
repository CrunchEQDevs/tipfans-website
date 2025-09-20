'use client';
import type { ApiItem, Sport } from '@/components/tipsters/tipisterdesk/types';
import type { JSX } from 'react';

import Image from 'next/image';
import Link from 'next/link';

const SPORT_LABEL: Record<Sport, string> = {
  futebol: 'Futebol',
  tenis: 'Ténis',
  basquete: 'Basquetebol',
  esports: 'eSports',
};

function Trophy({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" role="img" focusable="false">
      <path d="M6 3h12v2h2a1 1 0 0 1 1 1v1a5 5 0 0 1-5 5h-1.1A5.002 5.002 0 0 1 12 15a5.002 5.002 0 0 1-2.9-2H8a5 5 0 0 1-5-5V6a1 1 0 0 1 1-1h2V3Zm12 4V6h2v1a3 3 0 0 1-3 3h-1.1c.067-.32.1-.65.1-1V7Zm-12 0v2c0 .35.033.68.1 1H5a3 3 0 0 1-3-3V6h2v1Zm6 10c1.657 0 3 1.343 3 3v1H9v-1c0-1.657 1.343-3 3-3Z" fill="currentColor" />
    </svg>
  );
}

function Sk({ className = '' }: { className?: string }) {
  return <span className={`inline-block animate-pulse rounded bg-white/10 ${className}`} />;
}
function SkeletonRow() {
  return (
    <li className="rounded-2xl backdrop-blur-md ">
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
}

/* ===== ÍCONES LARANJA POR ESPORTE ===== */
function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}
function SoccerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-3.5 w-3.5 text-[#ED4F00]', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l3 2-1 3-4 0-1-3 3-2Z" />
      <path d="M7 12l2 3M17 12l-2 3M9 18l3-1 3 1M9 6l3 1 3-1" />
    </svg>
  );
}
function TennisIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-3.5 w-3.5 text-[#ED4F00]', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" />
      <path d="M13 13l7 7" />
      <path d="M3 9c3.5 0 5.5-2 6-6" />
      <path d="M15 9c-3.5 0-5.5 2-6 6" />
    </svg>
  );
}
function BasketIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-3.5 w-3.5 text-[#ED4F00]', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M7 5c3 3 7 11 10 14" />
      <path d="M17 5C14 8 10 16 7 19" />
    </svg>
  );
}
function EsportsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-3.5 w-3.5 text-[#ED4F00]', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 17l-2 2M16 17l2 2" />
      <path d="M9.5 11h1M13.5 11h1M12 9v2" />
    </svg>
  );
}
const SPORT_ICON: Record<Sport, (p: { className?: string }) => JSX.Element> = {
  futebol: SoccerIcon,
  tenis: TennisIcon,
  basquete: BasketIcon,
  esports: EsportsIcon,
};

/* Ícone de feedback quando não há liquidação */
function HourglassIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-3.5 w-3.5', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 3h10M7 21h10M8 3v4a4 4 0 0 0 8 0V3M16 21v-4a4 4 0 0 0-8 0v4" />
    </svg>
  );
}

export default function TipsterDeskList(props: {
  items: ApiItem[];
  loading: boolean;
  err: string | null;
  order: 'roi' | 'hit';
  minVal: number;
  maxVal: number;
  leaderSlugs: string[];
  animateBars: boolean;
}) {
  const { items, loading, err, order, minVal, maxVal, leaderSlugs, animateBars } = props;

  return (
    <ul className="p-4 sm:p-6 space-y-2">
      {loading && (<><SkeletonRow /><SkeletonRow /><SkeletonRow /></>)}

      {!loading && err && (
        <li className="rounded-2xl  backdrop-blur-sm p-4 text-left text-red-300">
          {err}
        </li>
      )}

      {!loading && !err && items.length === 0 && (
        <li className="rounded backdrop-blur-sm p-4 text-left text-white/80">
          Sem participantes no momento.
        </li>
      )}

      {!loading && !err && items.map((it) => {
        const { author, stats, counts } = it;
        const settled = Number(stats?.settledCount ?? 0);
        const has = settled > 0;
        const hit = has ? Number((stats.hitPct ?? 0).toFixed(1)) : null;
        const roi = has ? Number((stats.roiPct ?? 0).toFixed(1)) : null;

        const metricRaw = has ? (order === 'hit' ? (it.stats?.hitPct ?? 0) : (it.stats?.roiPct ?? 0)) : null;

        let barPct = 0;
        if (typeof metricRaw === 'number' && Number.isFinite(maxVal) && Number.isFinite(minVal)) {
          if (maxVal === minVal) barPct = has ? 60 : 0;
          else barPct = ((metricRaw - minVal) / (maxVal - minVal)) * 100;
          barPct = Math.max(0, Math.min(100, Math.round(barPct)));
        }

        const lastStr = stats?.lastDate ? new Date(stats.lastDate).toLocaleString('pt-PT') : '';
        const isLeader = has && leaderSlugs.includes(author.slug);

        return (
          <li
            key={author.slug}
            className={`group relative rounded p-4 transition-all duration-300 hover:ring-[#ED4F00]/40 hover:shadow-[0_4px_30px_rgba(237,79,0,0.15)] ${isLeader ? 'ring-[#ED4F00]/40' : ''}`}
          >
            <span
              aria-hidden
              className={`absolute left-0 top-0 h-full w-[3px] rounded-l-2xl transition-opacity ${isLeader ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} bg-gradient-to-b from-[#ED4F00] to-[#FF944D]`}
            />

            <div className="flex items-start gap-4">
              {/* avatar */}
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
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
                ) : <div className="h-full w-full animate-pulse bg-white/10" />}
              </div>

              {/* content */}
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="truncate text-white font-semibold text-base md:text-lg">{author.name}</p>

                  {isLeader && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#ED4F00]/20 px-2 py-[2px] text-[11px] font-semibold text-[#FFB490]">
                      <Trophy className="h-3.5 w-3.5 text-[#ED4F00]" />
                      <span className="sr-only">Líder</span>
                    </span>
                  )}
                </div>

                {/* chips de categorias */}
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {stats?.sports?.length ? (
                    stats.sports.map((s) => {
                      const Icon = SPORT_ICON[s];
                      return (
                        <span
                          key={s}
                          className="inline-flex items-center gap-1 rounded-md bg-white/10 ring-1 ring-white/10 px-2 py-[2px] text-[11px] text-white/85"
                        >
                          <Icon />
                          {SPORT_LABEL[s]}
                        </span>
                      );
                    })
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-white/10 ring-1 ring-white/10 px-2 py-[2px] text-[11px] text-white/60">
                      —
                    </span>
                  )}
                </div>

                {/* métricas + CTA na mesma linha */}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/85">
                  {has ? (
                    <>
                      <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5">
                        <span className="text-[#FFB490] font-semibold">Hit {hit}%</span>
                      </span>
                      <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5">
                        <span className="text-[#FFB490] font-semibold">ROI {roi}%</span>
                      </span>
                      <span className="opacity-80">• {settled} tips liquidadas</span>
                      {lastStr ? <span className="opacity-80">• última: {lastStr}</span> : null}
                    </>
                  ) : (
                    <>
                      {/* FEEDBACK QUANDO NÃO HÁ LIQUIDAÇÃO */}
                      <span className="inline-flex items-center gap-1 rounded bg-white/10 px-2 py-0.5 text-white/80" title="Ainda sem resultados finalizados">
                        <HourglassIcon className="text-[#ED4F00]" />
                        Aguardando liquidação
                      </span>
                      {counts ? (
                        <>
                          <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5">
                            {counts.tips} tips
                          </span>
                          <span className="inline-flex items-center rounded bg-white/10 px-2 py-0.5">
                            {counts.articles} artigos
                          </span>
                        </>
                      ) : null}
                    </>
                  )}

                  <Link
                    href={`/tipsters/${author.slug}`}
                    className="ml-auto inline-flex items-center gap-2 rounded bg-[#ED4F00] px-3 py-1.5 text-xs font-semibold text-white/90 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ED4F00] focus:ring-offset-transparent transition"
                  >
                    Ver perfil
                    <span className="text-xl leading-none">›</span>
                  </Link>
                </div>

                {/* barra progresso (abaixo) */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10" title={has ? undefined : 'Sem métricas ainda'}>
                  <div
                    className={`h-full bg-gradient-to-r from-[#ED4F00] to-[#FF944D] ${isLeader ? 'shadow-[0_0_12px_rgba(237,79,0,0.5)]' : ''}`}
                    style={{
                      transform: animateBars ? `scaleX(${barPct / 100})` : 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                    }}
                    aria-label={has ? `${order === 'hit' ? 'Hit' : 'ROI'} ${barPct}% relativo` : 'Sem métricas'}
                  />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
