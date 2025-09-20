'use client';

import Image from 'next/image';
import type { Sport } from '@/components/tipsters/tipisterdesk/types';

// opções de esporte (mesmas de antes)
const SPORT_OPTIONS = [
  { value: 'all',      label: 'Todos',     icon: AllIcon },
  { value: 'futebol',  label: 'Futebol',   icon: SoccerIcon },
  { value: 'tenis',    label: 'Ténis',     icon: TennisIcon },
  { value: 'basquete', label: 'Basquete',  icon: BasketIcon },
  { value: 'esports',  label: 'eSports',   icon: EsportsIcon },
] as const;

// classe utilitária
function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

export default function TipsterDeskHeader(props: {
  order: 'roi' | 'hit';
  setOrder: (v: 'roi' | 'hit') => void;
  sport: 'all' | Sport;
  setSport: (v: 'all' | Sport) => void;
  loading: boolean;
  err: string | null;
  visibleCount: number;
}) {
  const { order, setOrder, sport, setSport, loading, err, visibleCount } = props;

  return (
    <header className="relative overflow-hidden px-4 md:px-6 py-6 text-left">
      {/* BG local apenas neste header */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <Image
          src="/tipster.png"      
          alt=""
          fill
          priority
          className="object-cover object-center rounded "
        />  
      </div>

      {/* título + subtítulo */}
      <div className="flex flex-col gap-4">
        <h1 className="text-white font-extrabold tracking-tight text-3xl md:text-4xl">
            Mestres Das Tips
        </h1>

        <p className="text-white text-center font-semibold md:text-lg">
          Ranking dinâmico por período, esporte e ordenação.
        </p>

        {/* estado compacto */}
        <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner />
              Atualizando…
            </span>
          ) : err ? (
            <span className="inline-flex items-center gap-2 text-red-300">
              <AlertIcon className="h-3.5 w-3.5" /> {err}
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Dot className="text-[#ED4F00]" /> {visibleCount} {visibleCount === 1 ? 'participante' : 'participantes'}
            </span>
          )}
        </div>
      </div>

      {/* controles */}
      <div className=" grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Ordenação — segmented premium */}
        <div className="min-w-0">
          <span className="block mb-2 text-[11px] uppercase tracking-wide text-white font-semibold">
            Ordenar por
          </span>

          <div
            role="tablist"
            aria-label="Ordenar por"
            className="relative inline-flex rounded bg-white/10 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            {/* indicador deslizante */}
            <span
              aria-hidden
              className={cx(
                'absolute inset-y-1 w-1/2 rounded bg-[#ED4F00] transition-transform duration-300',
                order === 'roi' ? 'translate-x-0' : 'translate-x-full'
              )}
            />

            {(['roi', 'hit'] as const).map((opt) => {
              const active = order === opt;
              return (
                <button
                  key={opt}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setOrder(opt)}
                  className={cx(
                    'relative z-10 px-4 md:px-6 py-2 text-xs md:text-sm font-bold transition-colors',
                    active ? 'text-white' : 'text-white hover:text-white'
                  )}
                >
                  {opt === 'roi' ? 'ROI' : 'Hit'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Esporte — chips com ícones e micro-efeitos */}
        <div className="min-w-0">
          <span className="block mb-2 text-[11px] uppercase tracking-wide text-white font-semibold">
            Esporte
          </span>

          <div role="radiogroup" aria-label="Filtrar por esporte" className="flex flex-wrap gap-2">
            {SPORT_OPTIONS.map((s) => {
              const ActiveIcon = s.icon;
              const active = sport === s.value;
              return (
                <button
                  key={s.value}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSport(s.value)}
                  className={cx(
                    'group inline-flex items-center gap-2 rounded px-3.5 py-2 text-xs font-semibold ring-1 transition-all',
                    active
                      ? 'bg-[#ED4F00] text-white ring-[#ED4F00]/60 shadow-[0_0_0_3px_rgba(237,79,0,0.15)]'
                      : 'bg-white/8 text-white ring-[#ED4F00] hover:bg-white/12 hover:text-white'
                  )}
                >
                  <ActiveIcon className={cx('h-4 w-4', active ? 'opacity-100' : 'opacity-90 group-hover:opacity-100')} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* aviso de pouca concorrência */}
      {!loading && !err && sport !== 'all' && visibleCount === 1 && (
        <div className="mt-3 text-[11px] text-white">Sem concorrentes nesta categoria.</div>
      )}
    </header>
  );
}

/* ===================== */
/* ÍCONES MINIMAL/INLINE */
/* ===================== */

function Dot({ className = '' }) {
  return <span className={cx('inline-block h-2 w-2 rounded-full', className)} />;
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 animate-spin rounded"
    />
  );
}

function AlertIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none">
      <circle cx="12" cy="12" r="10" className="stroke-current" strokeOpacity="0.5" strokeWidth="1.5" />
      <path d="M12 7v6" className="stroke-current" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="1" className="fill-current" />
    </svg>
  );
}

function AllIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function SoccerIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7l3 2-1 3-4 0-1-3 3-2Z" />
      <path d="M7 12l2 3M17 12l-2 3M9 18l3-1 3 1M9 6l3 1 3-1" />
    </svg>
  );
}
function TennisIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" />
      <path d="M13 13l7 7" />
      <path d="M3 9c3.5 0 5.5-2 6-6" />
      <path d="M15 9c-3.5 0-5.5 2-6 6" />
    </svg>
  );
}
function BasketIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M7 5c3 3 7 11 10 14" />
      <path d="M17 5C14 8 10 16 7 19" />
    </svg>
  );
}
function EsportsIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('h-4 w-4', className)} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M8 17l-2 2M16 17l2 2" />
      <path d="M9.5 11h1M13.5 11h1M12 9v2" />
    </svg>
  );
}
