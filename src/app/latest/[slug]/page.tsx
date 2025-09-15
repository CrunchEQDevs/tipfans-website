'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams, useParams } from 'next/navigation';

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
  href?: string; // pode vir pronto da API
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

/* =======================
   Endpoints (Noticias)
======================= */
const WP_TIPS_ENDPOINT = '/api/wp/news';
const WP_TIPS_FALLBACK = '';
const WP_GAMES_ENDPOINT = '';

/* =======================
   Mocks
======================= */
const FALLBACK_TIPS: TipItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: String(i + 1),
  title: `Notícia #${i + 1}`,
  sport: i % 2 === 0 ? 'Futebol' : 'Basquete',
  league: 'Liga PT',
  teams: '—',
  author: `Redação #${i + 1}`,
  image: '/noticia1.jpg',
}));

const FALLBACK_GAMES: GameItem[] = [
  { id: 'g1', home: 'Real',  away: 'Barça',   league: 'LaLiga',         startAt: 'Hoje 21:00',    odds: { H: 2.50, D: 3.50, A: 2.70 } },
  { id: 'g2', home: 'Man City', away: 'Arsenal', league: 'Premier League', startAt: 'Amanhã 16:30', odds: { H: 2.05, D: 3.60, A: 3.40 } },
  { id: 'g3', home: 'PSG',   away: 'Lyon',    league: 'Ligue 1',        startAt: 'Amanhã 20:00',  odds: { H: 1.70, D: 3.90, A: 4.60 } },
  { id: 'g4', home: 'Inter', away: 'Milan',   league: 'Serie A',        startAt: 'Dom 19:45',     odds: { H: 2.30, D: 3.30, A: 3.10 } },
  { id: 'g5', home: 'Benfica', away: 'Porto', league: 'Liga PT',        startAt: 'Hoje 20:45',    odds: { H: 2.10, D: 3.20, A: 3.30 } },
];

/* =======================
   Config + normalização
======================= */
const SPORT_CONFIG: Record<
  'futebol' | 'basquete' | 'tenis' | 'esports',
  {
    name: string;
    bannerTitle: string;
    bannerDesc: string;
    bannerImage: string;
    cardTitleBase: string;
    cardImage: string;
    cardSub: string;
  }
> = {
  futebol: {
    name: 'Futebol',
    bannerTitle: 'Tips de Futebol',
    bannerDesc: 'As melhores dicas e palpites do mundo do futebol.',
    bannerImage: '/B_futebol.png',
    cardTitleBase: 'Notícia de Futebol',
    cardImage: '/futebol.png',
    cardSub: 'Liga PT',
  },
  basquete: {
    name: 'Basquete',
    bannerTitle: 'Tips de Basquete',
    bannerDesc: 'Análises e palpites certeiros para a bola ao cesto.',
    bannerImage: '/B_basquete.png',
    cardTitleBase: 'Notícia de Basquete',
    cardImage: '/basquete.png',
    cardSub: 'Liga ACB / NBA',
  },
  tenis: {
    name: 'Ténis',
    bannerTitle: 'Tips de Ténis',
    bannerDesc: 'Cobertura de torneios e jogos com foco em valor.',
    bannerImage: '/B_tenis.png',
    cardTitleBase: 'Notícia de Ténis',
    cardImage: '/tennis.png',
    cardSub: 'ATP / WTA',
  },
  esports: {
    name: 'eSports',
    bannerTitle: 'Tips de eSports',
    bannerDesc: 'Palpites e leitura de meta para as principais ligas.',
    bannerImage: '/B_esport.png',
    cardTitleBase: 'Notícia de eSports',
    cardImage: '/eSports.png',
    cardSub: 'CS/LoL/Valo',
  },
};

function toSlug(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeSlug(raw?: string): keyof typeof SPORT_CONFIG {
  if (!raw) return 'futebol';
  const s = (Array.isArray(raw) ? raw[0] : raw)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[\s_]+/g, '')
    .replace(/-+/g, '');
  if (s.includes('esport') || s.includes('egames') || s.includes('gaming')) return 'esports';
  if (s.startsWith('fut')) return 'futebol';
  if (s.startsWith('ten')) return 'tenis';
  if (s.startsWith('basquet') || s.includes('basket') || s.includes('nba') || s.includes('acb')) return 'basquete';
  return 'futebol';
}

/* =======================
        Componente
======================= */
export default function LatestListPage() {
  const [tips, setTips] = useState<TipItem[]>(FALLBACK_TIPS);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [gamesLoading, setGamesLoading] = useState(false);

  const search = useSearchParams();
  const highlightId = (search?.get('highlight') || '').trim();

  const params = useParams<{ slug: string }>();
  const slug = normalizeSlug(params?.slug);
  const cfg = SPORT_CONFIG[slug];

  const bcRef = useRef<BroadcastChannel | null>(null);

  async function fetchJson(url: string): Promise<any> {
    const u = new URL(url, window.location.origin);
    u.searchParams.set('_', String(Date.now()));
    const res = await fetch(u.toString(), { cache: 'no-store' });
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  const loadTips = useCallback(async () => {
    try {
      setTipsLoading(true);

      const base = new URL(WP_TIPS_ENDPOINT, window.location.origin);
      base.searchParams.set('sport', slug);
      base.searchParams.set('per_page', '12');

      let json: any = {};
      try {
        json = await fetchJson(base.toString());
      } catch {
        if (WP_TIPS_FALLBACK) {
          try { json = await fetchJson(WP_TIPS_FALLBACK); } catch { /* ignore */ }
        }
      }

      const rawItems: any[] =
        Array.isArray(json?.items) ? json.items :
        Array.isArray(json?.data) ? json.data :
        Array.isArray(json) ? json : [];

      const list: TipItem[] = (rawItems.length ? rawItems : FALLBACK_TIPS).map((p: any, idx: number) => {
        let id = p?.id;
        if (!id && typeof p?.href === 'string') {
          const m = p.href.match(/\/(\d+)(?:-|$)/);
          if (m) id = m[1];
        }
        if (!id) id = String(idx + 1);

        return {
          id,
          title: p?.title ?? '',
          image: p?.image ?? p?.cover ?? cfg.cardImage, // aceita image OU cover
          createdAt: p?.date ?? p?.createdAt ?? undefined,
          href: p?.href ?? `/latest/${slug}/${id}-${toSlug(p?.title ?? '')}`,
        };
      });

      let finalList = list.slice(0, 12);
      if (highlightId) {
        const idx = finalList.findIndex((it) => String(it.id) === highlightId);
        if (idx > -1) {
          const [h] = finalList.splice(idx, 1);
          finalList = [h, ...finalList];
        }
      }

      setTips(finalList);
    } finally {
      setTipsLoading(false);
    }
  }, [highlightId, slug, cfg.cardImage]);

  useEffect(() => {
    loadTips();
  }, [loadTips, slug]);

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

  useEffect(() => {
    let canceled = false;
    async function loadGames() {
      if (!WP_GAMES_ENDPOINT) { setGames(FALLBACK_GAMES); return; }
      try {
        setGamesLoading(true);
        const json = await fetchJson(WP_GAMES_ENDPOINT);
        const list = (Array.isArray(json?.data) ? (json.data as GameItem[]) : (json as GameItem[]));
        if (!canceled) setGames(list?.length ? list : FALLBACK_GAMES);
      } catch {
        if (!canceled) setGames(FALLBACK_GAMES);
      } finally {
        if (!canceled) setGamesLoading(false);
      }
    }
    loadGames();
    return () => { canceled = true; };
  }, []);

  const visible = useMemo(() => tips.slice(0, 12), [tips]);
  const gamesList = useMemo(() => (games ?? FALLBACK_GAMES).slice(0, 6), [games]);

  const forcedTitle = (i: number) => `${cfg.cardTitleBase} #${i + 1}`;
  const forcedImage = cfg.cardImage;

  return (
    <main key={slug} className="min-h-screen bg-[#1E1E1E] text-white">
      {/* Banner */}
      <section className="relative">
        <div className="relative h-80 md:h-80 max-w-7xl mx-auto py-40 mt-20">
          <Image
            src={cfg.bannerImage}
            alt={cfg.bannerTitle}
            fill
            className="object-cover object-[50%_30%]"
            sizes="100vw"
            priority
          />
          <div className="mb-4 w-full">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-white">
                <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight">
                  {cfg.bannerTitle}
                </h1>
                <p className="mt-1 text-sm md:text-base text-white/90">
                  {cfg.bannerDesc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="mx-auto max-w-7xl px-4 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Grid de cards */}
          <div className="md:col-span-3">
            {tipsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="border border-gray-200 bg-white overflow-hidden animate-pulse">
                    <div className="aspect-[16/10] bg-gray-200" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 w-24 bg-gray-200" />
                      <div className="h-4 w-3/4 bg-gray-200" />
                      <div className="h-3 w-2/3 bg-gray-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visible.map((tip, i) => {
                  const isHighlight = highlightId && String(tip.id) === highlightId;
                  const articleHref = tip.href || `/latest/${params.slug}/${tip.id}-${toSlug(tip.title)}`;

                  return (
                    <Link
                      key={String(tip.id)}
                      href={articleHref}
                      className={[
                        'group block rounded-md overflow-hidden bg-white hover:shadow-md transition relative',
                        isHighlight ? 'border ring-2 ring-indigo-300' : '',
                      ].join(' ')}
                    >
                      <div className="relative aspect-[16/15] overflow-hidden">
                        <Image
                          src={tip.image || forcedImage}
                          alt={tip.title || forcedTitle(i)}
                          fill
                          sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-sm text-white p-2">
                          <h2 className="font-bold text-sm md:text-base line-clamp-2">
                            {tip.title || forcedTitle(i)}
                          </h2>
                          <p className="text-xs md:text-sm">
                            {cfg.cardSub}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="overflow-hidden h-full">
                <div className="px-3 py-2 border-b border-[#ED4F00] text-xl font-bold">TIPS {cfg.name}</div>
                {gamesLoading ? (
                  <div className="p-3 space-y-1 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-[#ED4F00]">
                    {gamesList.slice(0, 3).map((g) => (
                      <div key={g.id} className="p-0">
                        <div className='flex gap-28 mt-4 mb-3'>
                          <p className='ml-3'>.{cfg.name}</p>
                          <p>{g.startAt}</p>
                        </div>
                        <div className="flex items-center gap-14 mb-3 ml-6">
                          <p className="text-[20px] font-semibold text-[#ED4F00]">{g.home}</p>
                          <span className="opacity-70">vs</span>
                          <p className="text-[20px] font-semibold text-[#ED4F00]">{g.away}</p>
                        </div>
                        <div className='flex items-center'>
                          <span className="mr-2">💡 </span>
                          <p className="mr-2">Dica:</p>
                          <p> Vitória do {g.home}</p>
                        </div>
                        <div className='flex items-center'>
                          <span className="mr-2">➕ </span>
                          <p className="mr-2">Odd:</p>
                          <p className='text-[#ED4F00] font-bold'>{g.odds?.H ?? 2.00}</p>
                        </div>
                        <div className='flex items-center mb-9'>
                          <span className="mr-2">🧑‍💼 </span>
                          <p className="mr-2">Hoje! Tipster: Comunidade</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative w-full h-[500px]">
                <Image
                  src="/noticia2.jpg"
                  alt="Publicidade"
                  fill
                  className="object-cover rounded-lg"
                  sizes="300px"
                />
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 border-t border-[#ED4F00] w-[930px]" />
        <div className="mt-6 pb-7 flex items-center justify-between bg-[#1E1E1E]">
          <nav className="flex items-center gap-2 left">
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">1</button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">2</button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">3</button>
            <button className="rounded-md px-3 py-1.5 text-sm ring-1 ring-white/10 hover:bg-white/5">Próxima</button>
          </nav>
        </div>
      </section>
    </main>
  );
}
