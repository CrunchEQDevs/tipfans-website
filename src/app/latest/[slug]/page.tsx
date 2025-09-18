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
  href?: string;
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
const WP_TIPS_FALLBACK = '';  // sem fallback (cards mostram skeleton)
const WP_GAMES_ENDPOINT = ''; // mock na sidebar por enquanto

/* =======================
   Mock só para GAMES (sidebar)
======================= */
const FALLBACK_GAMES: GameItem[] = [
  { id: 'g1', home: 'Real',    away: 'Barça',   league: 'LaLiga',         startAt: 'Hoje 21:00',    odds: { H: 2.50, D: 3.50, A: 2.70 } },
  { id: 'g2', home: 'Man City', away: 'Arsenal', league: 'Premier League', startAt: 'Amanhã 16:30', odds: { H: 2.05, D: 3.60, A: 3.40 } },
  { id: 'g3', home: 'PSG',     away: 'Lyon',    league: 'Ligue 1',        startAt: 'Amanhã 20:00',  odds: { H: 1.70, D: 3.90, A: 4.60 } },
  { id: 'g4', home: 'Inter',   away: 'Milan',   league: 'Serie A',        startAt: 'Dom 19:45',     odds: { H: 2.30, D: 3.30, A: 3.10 } },
  { id: 'g5', home: 'Benfica', away: 'Porto',   league: 'Liga PT',        startAt: 'Hoje 20:45',    odds: { H: 2.10, D: 3.20, A: 3.30 } },
];

/* =======================
   Helpers (sem SPORT_CONFIG)
======================= */
type SlugKey = 'futebol' | 'basquete' | 'tenis' | 'esports' | 'todos';

function toSlug(s: string) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeSlug(raw?: string): SlugKey {
  if (!raw) return 'futebol';
  const s = (Array.isArray(raw) ? raw[0] : raw)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[\s_]+/g, '').replace(/-+/g, '');
  if (s === 'todos' || s === 'all' || s === 'ultimas' || s === 'ultimos' || s === 'news') return 'todos';
  if (s.includes('esport') || s.includes('egames') || s.includes('gaming')) return 'esports';
  if (s.startsWith('fut')) return 'futebol';
  if (s.startsWith('ten')) return 'tenis';
  if (s.startsWith('basquet') || s.includes('basket') || s.includes('nba') || s.includes('acb')) return 'basquete';
  return 'futebol';
}

function labelFromSlug(s: SlugKey) {
  return s === 'todos' ? 'Últimas' :
         s === 'futebol' ? 'Futebol' :
         s === 'basquete' ? 'Basquete' :
         s === 'tenis' ? 'Ténis' : 'eSports';
}

function bannerTitle(s: SlugKey) {
  return s === 'todos' ? 'Últimas notícias' :
         s === 'futebol' ? 'Tips de Futebol' :
         s === 'basquete' ? 'Tips de Basquete' :
         s === 'tenis' ? 'Tips de Ténis' :
         'Tips de eSports';
}

function bannerDesc(s: SlugKey) {
  return s === 'todos' ? 'Tudo o que saiu nas nossas categorias.' :
         s === 'futebol' ? 'As melhores dicas e palpites do mundo do futebol.' :
         s === 'basquete' ? 'Análises e palpites certeiros para a bola ao cesto.' :
         s === 'tenis' ? 'Cobertura de torneios e jogos com foco em valor.' :
         'Palpites e leitura de meta para as principais ligas.';
}

function bannerImageFromSlug(s: SlugKey) {
  return s === 'futebol' ? '/B_futebol2.png' :
         s === 'basquete' ? '/B_basquete.png' :
         s === 'tenis' ? '/B_tenis.png' :
         s === 'esports' ? '/B_esport.png' :
         '/B_futebol.png'; // todos
}

async function fetchJson(url: string): Promise<any> {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  const res = await fetch(u.toString(), { cache: 'no-store' });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/* =======================
        Componente
======================= */
export default function LatestListPage() {
  const [tips, setTips] = useState<TipItem[]>([]);
  const [tipsLoading, setTipsLoading] = useState(true); // começa em loading → só SKELETON
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [gamesLoading, setGamesLoading] = useState(false);

  const search = useSearchParams();
  const highlightId = (search?.get('highlight') || '').trim();

  const params = useParams<{ slug: string }>();
  const slug = normalizeSlug(params?.slug);
  const name = labelFromSlug(slug);
  const bTitle = bannerTitle(slug);
  const bDesc = bannerDesc(slug);
  const bImage = bannerImageFromSlug(slug);

  const bcRef = useRef<BroadcastChannel | null>(null);

  const loadTips = useCallback(async () => {
    try {
      setTipsLoading(true);

      const base = new URL(WP_TIPS_ENDPOINT, window.location.origin);
      if (slug !== 'todos') base.searchParams.set('sport', slug); // filtra só quando não for "todos"
      base.searchParams.set('per_page', '12');
      base.searchParams.set('orderby', 'date');
      base.searchParams.set('order', 'desc');

      let json: any = {};
      try {
        json = await fetchJson(base.toString());
      } catch {
        json = { items: [] };
      }

      const rawItems: any[] =
        Array.isArray(json?.items) ? json.items :
        Array.isArray(json?.data) ? json.data :
        Array.isArray(json) ? json : [];

      const list: TipItem[] = rawItems.map((p: any, idx: number) => {
        let id = p?.id;
        if (!id && typeof p?.href === 'string') {
          const m = p.href.match(/\/(\d+)(?:-|$)/);
          if (m) id = m[1];
        }
        if (!id) id = String(idx + 1);

        const title = p?.titulo ?? p?.title ?? '';
        const sportFromItem = p?.categorySlug ?? p?.sport ?? slug;
        const computedSlug = slug === 'todos' ? (sportFromItem || 'futebol') : slug;

        return {
          id,
          title,
          image: p?.image ?? p?.cover ?? undefined, // NENHUM placeholder automático
          createdAt: p?.data ?? p?.date ?? undefined,
          href: p?.hrefPost ?? p?.href ?? `/latest/${computedSlug}/${id}-${toSlug(title)}`,
        };
      });

      // 12 mais recentes
      let finalList = list.slice(0, 12);

      // highlight sobe pro topo (se houver)
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
  }, [highlightId, slug]);

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

  /* Skeleton card para grid */
  const CardSkeleton = () => (
    <div className="border border-white/10 bg-white/5 overflow-hidden animate-pulse rounded-md">
      <div className="aspect-[16/15] bg-white/10" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-24 bg-white/10 rounded" />
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-2/3 bg-white/10 rounded" />
      </div>
    </div>
  );

  return (
    <main key={slug} className="min-h-screen bg-[#1E1E1E] text-white">
     {/* Banner (responsivo sem faixa branca no mobile) */}
<section aria-label="Banner" className="relative">
  <div className="relative mx-auto max-w-7xl ">
    <div className="relative h-40 sm:h-44 md:h-72 lg:h-60 xl:h-96 bg-black"> {/* add bg-black opcional */}
      <Image
        src={bImage}
        alt={bTitle}
        fill
        sizes="100vw"
        className="object-cover object-top"   // ← antes era "object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6 md:inset-x-8">
        <h1 className="text-white font-extrabold tracking-tight text-xl sm:text-2xl md:text-3xl">
          {bTitle}
        </h1>
        <p className="mt-1 text-white/90 text-xs sm:text-sm md:text-base max-w-[65ch]">
          {bDesc}
        </p>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="rounded-md border border-white/10 p-6 text-white/80">
                Nada por aqui ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {visible.map((tip) => {
                  const computedSlug = slug === 'todos' ? 'futebol' : params.slug; // fallback neutro para "todos"
                  const articleHref = tip.href || `/latest/${computedSlug}/${tip.id}-${toSlug(tip.title)}`;

                  return (
                    <Link
                      key={String(tip.id)}
                      href={articleHref}
                      className="group block rounded-md overflow-hidden bg-white hover:shadow-md transition relative"
                    >
                      <div className="relative aspect-[16/15] overflow-hidden">
                        {tip.image ? (
                          <Image
                            src={tip.image}
                            alt={tip.title || ''}
                            fill
                            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full bg-black/20" />
                        )}
                        <div className="pointer-events-none absolute bottom-0 left-0 w-full bg-black/70 backdrop-blur-sm text-white p-2">
                          {tip.title && (
                            <h2 className="font-bold text-sm md:text-base line-clamp-2">
                              {tip.title}
                            </h2>
                          )}
                          {tip.createdAt && (
                            <p className="text-[11px] opacity-80 mt-0.5">
                              {tip.createdAt}
                            </p>
                          )}
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
                <div className="px-3 py-2 border-b border-[#ED4F00] text-xl font-bold">TIPS {name}</div>
                {gamesLoading ? (
                  <div className="p-3 space-y-1 animate-pulse">
                    {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white/10 rounded" />)}
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-[#ED4F00]">
                    {gamesList.slice(0, 3).map((g) => (
                      <div key={g.id} className="p-0">
                        <div className="flex gap-28 mt-4 mb-3">
                          <p className="ml-3">.{name}</p>
                          <p>{g.startAt}</p>
                        </div>
                        <div className="flex items-center gap-14 mb-3 ml-6">
                          <p className="text-[20px] font-semibold text-[#ED4F00]">{g.home}</p>
                          <span className="opacity-70">vs</span>
                          <p className="text-[20px] font-semibold text-[#ED4F00]">{g.away}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">💡 </span>
                          <p className="mr-2">Dica:</p>
                          <p>Vitória do {g.home}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-2">➕ </span>
                          <p className="mr-2">Odd:</p>
                          <p className="text-[#ED4F00] font-bold">{g.odds?.H ?? 2.00}</p>
                        </div>
                        <div className="flex items-center mb-9">
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
