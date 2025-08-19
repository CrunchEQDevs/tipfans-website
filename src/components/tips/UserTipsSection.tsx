// src/components/tips/UserTipsSection.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

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
  startAt?: string; // ex: "Hoje 20:45"
  href?: string;    // link para mercado (opcional)
  odds?: { H?: number; D?: number; A?: number }; // 1X2
};

type Props = {
  endpoint?: string;        // WP: "/api/wp/tips/subs"
  gamesEndpoint?: string;   // WP: "/api/wp/jogos" (opcional)
  gridLimit?: number;       // padrão 6
  seeAllHref?: string;      // "/tips/utilizadores"
  adHtml?: string;          // slot HTML de publicidade
  adImageUrl?: string;      // imagem fallback de PUB
  className?: string;
};

/* ---------- Fallbacks ---------- */
const FALLBACK_TIPS: TipItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: String(i + 1),
  title: `Tip exemplo #${i + 1}`,
  sport: 'Futebol',
  league: 'Liga PT',
  teams: 'Casa vs Fora',
  pick: i % 2 ? 'BTTS Sim' : 'Mais de 2.5',
  odds: (1.7 + i * 0.05).toFixed(2),
  author: 'Utilizador',
  image: '/placeholders/tip.jpg',
}));

const FALLBACK_GAMES: GameItem[] = [
  { id: 'g1', home: 'Benfica', away: 'Porto', league: 'Liga PT', startAt: 'Hoje 20:45', odds: { H: 2.10, D: 3.20, A: 3.30 } },
  { id: 'g2', home: 'Sporting', away: 'Braga', league: 'Liga PT', startAt: 'Hoje 18:30', odds: { H: 1.85, D: 3.40, A: 4.10 } },
  { id: 'g3', home: 'Real', away: 'Barça', league: 'LaLiga', startAt: 'Hoje 21:00', odds: { H: 2.50, D: 3.50, A: 2.70 } },
  { id: 'g4', home: 'Man City', away: 'Arsenal', league: 'Premier League', startAt: 'Amanhã 16:30', odds: { H: 2.05, D: 3.60, A: 3.40 } },
  { id: 'g5', home: 'PSG', away: 'Lyon', league: 'Ligue 1', startAt: 'Amanhã 20:00', odds: { H: 1.70, D: 3.90, A: 4.60 } },
  { id: 'g6', home: 'Inter', away: 'Milan', league: 'Serie A', startAt: 'Dom 19:45', odds: { H: 2.30, D: 3.30, A: 3.10 } },
];

/* ---------- Componente ---------- */
export default function UserTipsSection({
  endpoint,
  gamesEndpoint,
  gridLimit = 6,
  seeAllHref = '/tips/utilizadores',
  adHtml,
  adImageUrl,
  className = '',
}: Props) {
  const [tips, setTips] = useState<TipItem[] | null>(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [games, setGames] = useState<GameItem[] | null>(null);
  const [gamesLoading, setGamesLoading] = useState(false);

  const search = useSearchParams();
  const highlightId = (search?.get('highlight') || '').trim();

  /* Tips do WordPress */
  useEffect(() => {
    let canceled = false;

    async function load() {
      // compat: ordena fallback se não houver endpoint
      if (!endpoint) {
        let items = [...FALLBACK_TIPS];
        if (highlightId) {
          const idx = items.findIndex((it) => String(it.id) === highlightId);
          if (idx > -1) {
            const [h] = items.splice(idx, 1);
            items = [h, ...items];
          }
        }
        setTips(items);
        return;
      }

      try {
        setTipsLoading(true);

        // compat: suporta endpoint relativo OU absoluto com cache-bust
        let urlStr = endpoint;
        try {
          const u = new URL(endpoint, window.location.origin);
          u.searchParams.set('_', String(Date.now())); // cache-bust
          urlStr = u.toString();
        } catch {
          // se der erro a construir URL (não deve no client), fica como veio
        }

        const res = await fetch(urlStr, {
          cache: 'no-store',
          credentials: 'include', // compat: se a API depender de cookies
        });
        if (!res.ok) throw new Error('Erro a carregar tips');
        const json: unknown = await res.json();

        let items: TipItem[] =
          Array.isArray((json as { data?: unknown })?.data)
            ? ((json as { data: unknown[] }).data as TipItem[])
            : ((json as TipItem[]) ?? []);

        // move a tip destacada para o topo
        if (highlightId && Array.isArray(items)) {
          const idx = items.findIndex((it) => String(it.id) === highlightId);
          if (idx > -1) {
            const [h] = items.splice(idx, 1);
            items = [h, ...items];
          }
        }

        if (!canceled) setTips(items?.length ? items : FALLBACK_TIPS);
      } catch {
        if (!canceled) {
          // compat: também aplica destaque no fallback ao falhar
          let items = [...FALLBACK_TIPS];
          if (highlightId) {
            const idx = items.findIndex((it) => String(it.id) === highlightId);
            if (idx > -1) {
              const [h] = items.splice(idx, 1);
              items = [h, ...items];
            }
          }
          setTips(items);
        }
      } finally {
        if (!canceled) setTipsLoading(false);
      }
    }

    load();
    return () => { canceled = true; };
  }, [endpoint, highlightId]);

  /* Jogos do WordPress (ou fallback) */
  useEffect(() => {
    let canceled = false;

    async function load() {
      if (!gamesEndpoint) { setGames(FALLBACK_GAMES); return; }
      try {
        setGamesLoading(true);
        const res = await fetch(gamesEndpoint, { cache: 'no-store', credentials: 'include' });
        if (!res.ok) throw new Error('Erro a carregar jogos');
        const json: unknown = await res.json();

        const items: GameItem[] =
          Array.isArray((json as { data?: unknown })?.data)
            ? ((json as { data: unknown[] }).data as GameItem[])
            : ((json as GameItem[]) ?? []);

        if (!canceled) setGames(items?.length ? items : FALLBACK_GAMES);
      } catch {
        if (!canceled) setGames(FALLBACK_GAMES);
      } finally {
        if (!canceled) setGamesLoading(false);
      }
    }

    load();
    return () => { canceled = true; };
  }, [gamesEndpoint]);

  const tipsList = useMemo(() => (tips ?? FALLBACK_TIPS).slice(0, gridLimit), [tips, gridLimit]);
  const gamesList = useMemo(() => (games ?? FALLBACK_GAMES).slice(0, 6), [games]);

  return (
    <section className={`mx-auto max-w-7xl px-4  ${className}`}>
      {/* Cabeçalho destacado */}
      <div className="mb-6 rounded-2xl border bg-gradient-to-r from-gray-800 to-gray-900 text-white bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Título + eyebrow */}
          <div>
            <span className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">
              Comunidade
            </span>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Tips dos Utilizadores
            </h2>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <Link
              href={{ pathname: '/LoginPanel' }}
              prefetch={false}
              className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm font-semibold hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              aria-label="Ir ao perfil para criar uma tip"
            >
              Criar minha tip
            </Link>
            <Link
              href={{ pathname: seeAllHref ?? '/tips/utilizadores' }}
              prefetch={false}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
              aria-label="Ver todas as tips dos utilizadores"
            >
              Ver todas
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* GRID DE TIPS (3 colunas) */}
        <div className="md:col-span-3">
          {tipsLoading ? (
            /* Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: gridLimit }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse">
                  <div className="aspect-[16/10] bg-gray-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tipsList.map((tip) => {
                const isHighlight = highlightId && String(tip.id) === highlightId;
                return (
                  <Link
                    key={String(tip.id)}
                    href={{ pathname: seeAllHref ?? '/tips/utilizadores' }}
                    prefetch={false}
                    aria-label="Abrir página Tips dos Utilizadores"
                    className={[
                      'group rounded-xl overflow-hidden border bg-white hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300',
                      isHighlight ? 'border-indigo-400 ring-2 ring-indigo-300 shadow-md' : 'border-gray-200',
                    ].join(' ')}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={tip.image || '/placeholders/tip.jpg'}
                        alt={tip.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      {tip.pick ? (
                        <span className="absolute top-2 left-2 rounded-md bg-black/60 text-white text-[11px] px-2 py-0.5 backdrop-blur">
                          {tip.pick}
                        </span>
                      ) : null}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] text-gray-500 mb-0.5">
                        {tip.sport} {tip.league ? `• ${tip.league}` : ''}
                      </p>
                      <h3 className="text-sm font-semibold line-clamp-2 group-hover:underline">
                        {tip.title}
                      </h3>
                      <p className="mt-0.5 text-[12px] text-gray-700">
                        {tip.teams || '—'} {tip.odds ? `• @${tip.odds}` : ''}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        por {tip.author || 'Utilizador'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* SIDEBAR: Jogos + Publicidade (clean e compacto) */}
        <aside className="md:col-span-1">
          <div className="sticky top-24 space-y-3">
            {/* Jogos de Hoje */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 text-sm font-semibold">
                Jogos de Hoje
              </div>

              {gamesLoading ? (
                <div className="p-3 space-y-2 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded" />
                  ))}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-200">
                  {gamesList.map((g) => (
                    <div key={g.id} className="p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="leading-tight">
                          <p className="text-[13px] font-semibold">
                            {g.home} <span className="opacity-70">vs</span> {g.away}
                          </p>
                          <p className="text-[11px] text-gray-600">
                            {g.league || '—'} {g.startAt ? `• ${g.startAt}` : ''}
                          </p>
                        </div>
                        {g.href ? (
                          <a
                            href={g.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] underline hover:no-underline whitespace-nowrap"
                            aria-label="Abrir mercado do jogo"
                          >
                            Apostar
                          </a>
                        ) : null}
                      </div>

                      {g.odds ? (
                        <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
                          <div className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px]">
                            1 <span className="font-semibold">{g.odds.H?.toFixed?.(2) ?? g.odds.H}</span>
                          </div>
                          <div className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px]">
                            X <span className="font-semibold">{g.odds.D?.toFixed?.(2) ?? g.odds.D}</span>
                          </div>
                          <div className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px]">
                            2 <span className="font-semibold">{g.odds.A?.toFixed?.(2) ?? g.odds.A}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Publicidade */}
            <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-200 text-sm font-semibold">
                Publicidade
              </div>
              <div className="p-2.5">
                {adHtml ? (
                  <div className="min-h-[10rem]" dangerouslySetInnerHTML={{ __html: adHtml }} />
                ) : (
                  <div className="relative w-full h-48">
                    <Image
                      src={adImageUrl || '/noticia1.jpg'}
                      alt="Publicidade"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Nota */}
      <p className="mt-3 text-[11px] text-gray-600">
        As tips são palpites da comunidade; os jogos na lateral são listagem informativa.
      </p>
    </section>
  );
}
