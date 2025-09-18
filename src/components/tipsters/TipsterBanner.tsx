'use client';

import Image from 'next/image';

type Stats = {
  winRate?: number | null;
  avgReturn?: number | null;
  winRateLast10?: number | null;
  avgReturnLast10?: number | null;
};

type Props = {
  name: string;
  avatar?: string | null;
  bio?: string;
  tipCount?: number;
  articleCount?: number;
  stats?: Stats | null;
};

export default function TipsterBanner({
  name,
  avatar,
  bio,
  tipCount,
  articleCount,
  stats,
}: Props) {
  // helpers de skeleton
  const Sk = ({ className = '' }: { className?: string }) => (
    <span className={`inline-block animate-pulse rounded bg-white/20 ${className}`} />
  );
  const SkLine = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded bg-white/10 ${className}`} />
  );

  const hasWinRate = typeof stats?.winRate === 'number';
  const hasAvgReturn = typeof stats?.avgReturn === 'number';
  const hasWinRate10 = typeof stats?.winRateLast10 === 'number';
  const hasAvgReturn10 = typeof stats?.avgReturnLast10 === 'number';
  const hasTips = typeof tipCount === 'number';
  const hasArticles = typeof articleCount === 'number';
  const hasBio = typeof bio === 'string' && bio.trim().length > 0;

  return (
    <section className="relative rounded-xl ring-1 ring-white/10 shadow-xl overflow-hidden mt-8">
      {/* BG */}
      <Image src="/B_tipsters.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-0 bg-[#333333]/80" />

      {/* Conteúdo */}
      <div className="relative grid grid-cols-[140px_1fr] gap-4 p-6 md:grid-cols-[200px_1fr] md:p-6">
        {/* Foto */}
        <div className="relative h-[180px] w-[140px] md:h-[200px] md:w-[160px] rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5">
          {avatar ? (
            <Image
              src={avatar}
              alt={name}
              fill
              sizes="(max-width: 768px) 140px, 160px"
              unoptimized
              className="object-cover"
              priority
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (img && !img.src.endsWith('/user.png')) img.src = '/user.png';
              }}
            />
          ) : (
            <div className="h-full w-full animate-pulse bg-white/10" />
          )}
        </div>

        {/* Texto */}
        <div className="flex flex-col gap-3">
          {/* Linha superior: Nome + ícone + MÉTRICAS à direita */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold">{name}</h1>
              {/* ícone gráfico ao lado do nome */}
              <svg viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6 text-[#ED4F00] text-xl ml-5 font-bold" aria-hidden>
                <path d="M3 3v18h18" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 15l4-5 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* Métricas */}
            <div className="flex flex-wrap items-center gap-x-16 gap-y-2 text-xs md:text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Rácio de Acerto</span>
                {hasWinRate ? (
                  <span className="font-semibold text-[#ED4F00]">{stats!.winRate!.toFixed(0)}%</span>
                ) : (
                  <Sk className="h-4 w-10 align-middle" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Retorno Médio</span>
                {hasAvgReturn ? (
                  <span className="font-semibold text-[#ED4F00]">{stats!.avgReturn!.toFixed(2)}</span>
                ) : (
                  <Sk className="h-4 w-12 align-middle" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Rácio de Acerto (últimos 10)</span>
                {hasWinRate10 ? (
                  <span className="font-semibold text-[#ED4F00]">{stats!.winRateLast10!.toFixed(0)}%</span>
                ) : (
                  <Sk className="h-4 w-10 align-middle" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Retorno Médio (últimos 10)</span>
                {hasAvgReturn10 ? (
                  <span className="font-semibold text-[#ED4F00]">{stats!.avgReturnLast10!.toFixed(2)}</span>
                ) : (
                  <Sk className="h-4 w-12 align-middle" />
                )}
              </div>
            </div>
          </div>

          {/* Contadores: Tips / Artigos (ainda acima da linha) */}
          <div className="text-xs md:text-sm text-white/80">
            <span className="mr-3">
              <span className="opacity-70">Tips:</span>{' '}
              {hasTips ? (
                <span className="font-semibold">{tipCount}</span>
              ) : (
                <Sk className="h-4 w-8 align-middle" />
              )}
            </span>
            <span>
              <span className="opacity-70">Artigos:</span>{' '}
              {hasArticles ? (
                <span className="font-semibold">{articleCount}</span>
              ) : (
                <Sk className="h-4 w-8 align-middle" />
              )}
            </span>
          </div>

          {/* Linha com gradiente */}
          <div className="h-[2px] w-full rounded-full bg-gradient-to-r from-[#ED4F00]/0 via-white to-[#ED4F00]/0" />

          {/* Título + parágrafo (bio) abaixo da linha */}
          <div className="mt-3">
            <h3 className="text-xs md:text-sm uppercase tracking-wide text-white/70">Biografia</h3>
            {hasBio ? (
              <p className="mt-1 text-sm md:text-[15px] text-white/85 leading-relaxed">{bio}</p>
            ) : (
              <div className="mt-2 space-y-2">
                <SkLine className="h-3 w-11/12" />
                <SkLine className="h-3 w-10/12" />
                <SkLine className="h-3 w-9/12" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
