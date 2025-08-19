'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  ChangeEvent,
} from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';

/* ---------- Tipos ---------- */
type TipItem = {
  id: string | number;
  title: string;
  sport?: string;
  league?: string;
  teams?: string;
  pick?: string;
  odds?: string | number;
  author?: string;
  image?: string;
  createdAt?: string;
};
type GameItem = {
  id: string;
  home: string;
  away: string;
  league?: string;
  startAt?: string;
  href?: string;
  odds?: { H?: number; D?: number; A?: number };
};

/* ---------- Endpoints & Fallbacks ---------- */
const WP_TIPS_ENDPOINT = '/api/wp/tips/subs';
const WP_TIPS_FALLBACK = '/api/wp/posts?type=tip&status=publish';

/* ---------- Cards---------- */
const FALLBACK_TIPS: TipItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  title: `Tip da comunidade #${i + 1}`,
  sport: i % 2 === 0 ? 'Futebol' : 'Basquete',
  league: 'Liga PT',
  teams: 'Casa vs Fora',
  pick: i % 2 ? 'BTTS Sim' : 'Mais de 2.5',
  odds: (1.65 + (i % 5) * 0.1).toFixed(2),
  author: `User #${i + 1}`,
  image: '/tip2.png', // <- NÃO usaremos mais isso para render
}));

/* ---------- Config por desporto ---------- */
const SPORT_CONFIG: Record<
  'futebol' | 'basquete' | 'tenis' | 'esports',
  {
    name: string;
    bannerTitle: string;
    bannerDesc: string;
    cardImage: string;
    cardSub: string;
    cardTitleBase: string;
  }
> = {
  futebol: {
    name: 'Futebol',
    bannerTitle: 'PREVISÕES E DICAS DE APOSTA',
    bannerDesc: 'Estudos e picks dos especialistas e da comunidade.',
    cardImage: '/futebol.png',
    cardSub: 'Liga PT',
    cardTitleBase: 'Dica de Futebol',
  },
  basquete: {
    name: 'Basquetebol',
    bannerTitle: 'PREVISÕES E DICAS DE APOSTA',
    bannerDesc: 'Análises rápidas para ACB e NBA.',
    cardImage: '/basquete.png',
    cardSub: 'ACB / NBA',
    cardTitleBase: 'Dica de Basquete',
  },
  tenis: {
    name: 'Ténis',
    bannerTitle: 'PREVISÕES E DICAS DE APOSTA',
    bannerDesc: 'ATP e WTA com foco em valor.',
    cardImage: '/tennis.png',
    cardSub: 'ATP / WTA',
    cardTitleBase: 'Dica de Ténis',
  },
  esports: {
    name: 'eSports',
    bannerTitle: 'PREVISÕES E DICAS DE APOSTA',
    bannerDesc: 'CS • LoL • Valorant em destaque.',
    cardImage: '/eSports.png',
    cardSub: 'CS • LoL • Valo',
    cardTitleBase: 'Dica de eSports',
  },
};

function normalizeSlug(raw?: string): keyof typeof SPORT_CONFIG {
  if (!raw) return 'futebol';
  const s = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  // aceita variações da navbar
  if (s.includes('esport') || s.includes('e-sport')) return 'esports';
  if (s.startsWith('fut')) return 'futebol';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis'; // 'tenis'/'tennis'
  return 'futebol';
}

async function fetchJson(url: string): Promise<unknown> {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  const res = await fetch(u.toString(), { cache: 'no-store' });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<unknown>;
}

/* ---------- Componente ---------- */
export default function SportContent() {
  const params = useParams<{ slug: string }>(); // sua rota /tips/[slug]
  const router = useRouter();
  const search = useSearchParams();

  const slug = normalizeSlug(params?.slug);
  const cfg = SPORT_CONFIG[slug];

  const [tips, setTips] = useState<TipItem[]>(FALLBACK_TIPS);
  const [tipsLoading, setTipsLoading] = useState(false);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const highlightId = (search?.get('highlight') || '').trim();

  const loadTips = useCallback(async () => {
    try {
      setTipsLoading(true);
      let json: unknown;
      try {
        json = await fetchJson(WP_TIPS_ENDPOINT);
      } catch {
        json = await fetchJson(WP_TIPS_FALLBACK);
      }

      const j = json as { data?: unknown } | TipItem[] | undefined;
      let list: TipItem[] = Array.isArray(j && (j as { data?: unknown }).data)
        ? ((j as { data: unknown[] }).data as TipItem[])
        : ((j as TipItem[]) ?? []);

      list = Array.isArray(list) && list.length ? list : FALLBACK_TIPS;

      if (highlightId) {
        const idx = list.findIndex((it) => String(it.id) === highlightId);
        if (idx > -1) {
          const [h] = list.splice(idx, 1);
          list = [h, ...list];
        }
      }
      setTips(list.slice(0, 12));
    } finally {
      setTipsLoading(false);
    }
  }, [highlightId]);

  useEffect(() => {
    loadTips();
  }, [loadTips]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'tips_refresh_at') loadTips();
    }
    window.addEventListener('storage', onStorage);
    if ('BroadcastChannel' in window) {
      bcRef.current = new BroadcastChannel('tips');
      bcRef.current.onmessage = () => loadTips();
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      bcRef.current?.close();
    };
  }, [loadTips]);

  // lista “visível” (sem filtrar por esporte, igual ao exemplo que funciona)
  const visible = useMemo(() => tips.slice(0, 12), [tips]);

  // 2 destaques
  const featured = useMemo<TipItem[]>(
    () => (Array.isArray(visible) ? visible.slice(0, 2) : []),
    [visible]
  );

  // helpers que SEMPRE usam o cfg do slug (forçam imagem/título/sub mudar por página)
  const forcedImage = cfg.cardImage;
  const forcedTitle = (i: number) => `${cfg.cardTitleBase} #${i + 1}`;
  const forcedSub = cfg.cardSub;

  // (opcional) select para navegar entre slugs
  const sportOptions: { value: keyof typeof SPORT_CONFIG; label: string }[] = [
    { value: 'futebol', label: 'Futebol' },
    { value: 'tenis', label: 'Ténis' },
    { value: 'basquete', label: 'Basquetebol' },
    { value: 'esports', label: 'eSports' },
  ];
  function onChangeSport(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as keyof typeof SPORT_CONFIG;
    const qs = search?.toString();
    router.push(qs ? `/tips/${next}?${qs}` : `/tips/${next}`);
  }

  return (
    <main key={slug} className="bg-[#1E1E1E] text-white">
      {/* HERO: NÃO alterado */}
      <div className="px-4">
        <div className="overflow-hidden relative">
          <Image
            src="/DICAS.png"
            alt="Banner"
            width={1100}
            height={100}
            className="object-contain"
            priority
          />

          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-10">
                {cfg.bannerTitle}
              </h1>

              {/* header com select (pode remover se usa só a Navbar) */}
              <div className="mt-6 mx-auto w-full max-w-7xl px-4">
                <div className="rounded-xl bg-[#3f3f3f]/70 ring-1 ring-white/10 px-4 py-3 md:px-5 md:py-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] md:text-xl font-bold uppercase tracking-wide text-white/90">
                      Top Previsões
                    </span>

                    <div className="relative">
                      <label htmlFor="sport-select" className="sr-only">
                        Selecionar desporto
                      </label>
                      <select
                        id="sport-select"
                        value={slug}
                        onChange={onChangeSport}
                        className="
                          appearance-none bg-transparent border-0
                          text-[#ED4F00] font-semibold text-sm md:text-base
                          pr-6 pl-1 py-1 cursor-pointer
                          focus:outline-none focus:ring-0
                        "
                      >
                        {sportOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {/* chevron */}
                      <svg
                        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/90"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" />
                      </svg>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-white/10 px-3 py-2 text-sm text-white/80 flex gap-8">
                    <span className="relative pl-4">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[#ED4F00]" />
                      Hoje
                    </span>
                    <span>Amanhã</span>
                    <span>Em breve</span>
                  </div>
                </div>
              </div>
              {/* /header */}
            </div>
          </div>
        </div>
      </div>

      {/* Destaques (2) — usa SEMPRE cfg.cardImage + títulos do cfg */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-6 rounded-xl bg-[#1d2029] p-3">
          {tipsLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-lg bg-[#1B1F2A] ring-1 ring-white/10"
                >
                  <div className="aspect-[16/9] animate-pulse bg-white/10" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                    <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {featured.map((tip, i) => {
                const href =
                  tip && typeof tip.id !== 'undefined'
                    ? `/tips/${tip.id}`
                    : '#';
                return (
                  <Link
                    key={String(tip.id) + '-featured'}
                    href={href}
                    className="group relative overflow-hidden rounded-lg ring-1 ring-white/10"
                  >
                    <div className="relative aspect-[16/8]">
                      <Image
                        src={forcedImage}                // ← força imagem do desporto
                        alt={forcedTitle(i)}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(min-width: 640px) 50vw, 100vw"
                        priority={i === 0}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm p-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/70">
                          {forcedSub}
                        </p>
                        <h3 className="line-clamp-2 text-sm font-semibold">
                          {forcedTitle(i)}
                        </h3>
                        {tip.odds ? (
                          <p className="mt-1 text-xs text-white/80">
                            Odds: @{tip.odds}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* GRID (3 colunas) — também força imagem/título/sub por cfg */}
      <section className="mx-auto max-w-7xl px-3 py-6">
        {tipsLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg bg-[#1B1F2A] ring-1 ring-white/10"
              >
                <div className="aspect-[16/10] animate-pulse bg-white/10" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {visible.map((tip, i) => (
              <article
                key={tip.id}
                className="group relative overflow-hidden rounded-lg bg-[#1B1F2A] ring-1 ring-white/10 transition hover:ring-white/20"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={forcedImage}                  // ← SEMPRE cfg.cardImage
                    alt={forcedTitle(i)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm p-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">
                      {forcedSub}
                    </p>
                    <h3 className="line-clamp-2 text-sm font-semibold">
                      {forcedTitle(i)}
                    </h3>
                    <p className="text-xs text-white/80">
                      {(tip.teams || '—')}
                      {tip.odds ? ` • @${tip.odds}` : ''}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* paginação */}
        <div className="mt-6 flex items-center justify-between">
          <nav className="flex items-center gap-2 left">
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">
              1
            </button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">
              2
            </button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">
              3
            </button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">
              Próxima
            </button>
          </nav>
        </div>
      </section>
    </main>
  );
}
