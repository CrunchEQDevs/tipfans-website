'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  image?: string | null;
  createdAt?: string;
};

/* ---------- Endpoints ---------- */
const WP_TIPS_ENDPOINT_BASE = '/api/wp/tips';

/* ---------- SEM fallback fictício ---------- */
const FALLBACK_TIPS: TipItem[] = [];

/* Tipo das chaves de desporto + “todas” */
type SportKey = 'futebol' | 'basquete' | 'tenis' | 'esports' | 'todas';

/* ---------- Config por desporto ---------- */
const SPORT_CONFIG: Record<
  SportKey,
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
    bannerTitle: 'PREVISÕES E DICAS DE APOSTA ',
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
  /* ✅ novo: slug /tips/todas */
  todas: {
    name: 'Todas',
    bannerTitle: 'TODAS AS TIPS',
    bannerDesc: 'Veja todas as previsões publicadas.',
    cardImage: '/DICAS.png',        // imagem genérica
    cardSub: 'Todas as Ligas',
    cardTitleBase: 'Tip',
  },
};

/* normaliza o slug da rota (inclui “todas”) */
function normalizeSlug(raw?: string): SportKey {
  if (!raw) return 'futebol';
  const s = raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (s === 'todas' || s === 'all') return 'todas';
  if (s.includes('esport') || s.includes('e-sport')) return 'esports';
  if (s.startsWith('fut') || s.includes('soccer') || s.includes('foot')) return 'futebol';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

/* normaliza o sport vindo de cada tip */
function normalizeTipSport(raw?: string): Exclude<SportKey, 'todas'> {
  const s = (raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('fut') || s.includes('soccer') || s.includes('foot')) return 'futebol';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
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
  const params = useParams<{ slug: string }>(); // /tips/[slug]
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

      let list: TipItem[] = [];
      try {
        // ✅ quando slug=todas → sport=all e per_page=all
        const base = new URL(WP_TIPS_ENDPOINT_BASE, window.location.origin);
        base.searchParams.set('sport', slug === 'todas' ? 'all' : slug);
        base.searchParams.set('per_page', slug === 'todas' ? 'all' : '12');
        base.searchParams.set('orderby', 'date');
        base.searchParams.set('order', 'desc');
        base.searchParams.set('_', String(Date.now())); // cache-buster

        const json = (await fetchJson(base.toString())) as { items?: any[] } | any[];
        const items: any[] = Array.isArray(json)
          ? json
          : Array.isArray((json as any)?.items)
          ? (json as any).items
          : [];

        // garante só CPT tips
        const onlyTips = items.filter((p: any) => {
          const t = (p?.type || p?.post_type || 'tips').toString().toLowerCase();
          return t.includes('tip');
        });

        // mapeia para TipItem (mantendo compat com API e WP cru)
        list = onlyTips.map((p: any): TipItem => {
          if (p?.hrefPost || p?.cover || p?.sport) {
            return {
              id: p?.id,
              title: p?.title ?? '',
              sport: p?.sport ?? undefined,
              league: p?.league ?? undefined,
              teams: p?.teams ?? undefined,
              pick: p?.pick ?? undefined,
              odds: p?.odds ?? undefined,
              author: p?.author ?? undefined,
              image: p?.cover ?? null,
              createdAt: p?.createdAt ?? undefined,
            };
          }

          const acf = p?.acf || {};
          const embedded = p?._embedded || {};
          const media = embedded['wp:featuredmedia']?.[0];

          const title = p?.title?.rendered ?? p?.title ?? '';
          const cover =
            media?.source_url ??
            p?.yoast_head_json?.og_image?.[0]?.url ??
            p?.jetpack_featured_media_url ??
            null;

          const sportInferred = p?.sport ?? acf?.sport ?? acf?.modalidade ?? undefined;
          const league = p?.league ?? acf?.league ?? acf?.liga ?? undefined;
          const teams =
            p?.teams ??
            acf?.teams ??
            (acf?.home && acf?.away ? `${acf.home} x ${acf.away}` : undefined);
          const odds = p?.odds ?? acf?.odds ?? acf?.odd ?? undefined;
          const author =
            p?.author_name ??
            p?.author ??
            embedded?.author?.[0]?.name ??
            undefined;

          return {
            id: p?.id,
            title,
            sport: sportInferred,
            league,
            teams,
            pick: p?.pick ?? acf?.pick ?? acf?.palpite ?? undefined,
            odds,
            author,
            image: cover,
            createdAt: p?.date ?? p?.date_gmt ?? undefined,
          };
        });
      } catch {
        // sem fallback fictício
      }

      // 🔎 filtro: só aplica quando NÃO é "todas"
      let filtered = (Array.isArray(list) ? list : []);
      if (slug !== 'todas') {
        filtered = filtered.filter(
          (it) => normalizeTipSport(it.sport) === slug
        );
      }

      // highlight para o topo (se houver)
      if (highlightId) {
        const idx = filtered.findIndex((it) => String(it.id) === highlightId);
        if (idx > -1) {
          const [h] = filtered.splice(idx, 1);
          filtered = [h, ...filtered];
        }
      }

      // quando “todas” não cortamos; senão limitamos 12
      setTips(slug === 'todas' ? filtered : filtered.slice(0, 12));
    } finally {
      setTipsLoading(false);
    }
  }, [highlightId, slug]);

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

  // visibilidade: em “todas” mostra tudo; nas demais, 12
  const visible = useMemo(
    () => (slug === 'todas' ? tips : tips.slice(0, 12)),
    [tips, slug]
  );

  // destaques = 2 primeiros (funciona igual para “todas”)
  const featured = useMemo<TipItem[]>(
    () => (Array.isArray(visible) ? visible.slice(0, 2) : []),
    [visible]
  );

  const sportOptions: { value: SportKey; label: string }[] = [
    { value: 'todas', label: 'Todas' },      // ✅ opção nova
    { value: 'futebol', label: 'Futebol' },
    { value: 'tenis', label: 'Ténis' },
    { value: 'basquete', label: 'Basquetebol' },
    { value: 'esports', label: 'eSports' },
  ];

  const routerPushTo = (value: SportKey) => {
    const qs = search?.toString();
    const url = qs ? `/tips/${value}?${qs}` : `/tips/${value}`;
    router.push(url);
  };

  const onChangeSportShadcn = (value: string) => {
    routerPushTo(value as SportKey);
  };

  return (
    <main key={slug} className="bg-[#1E1E1E] text-white">
      {/* HERO */}
      <div className="px-4 mt-14 lg:mt-9">
        <div className="overflow-hidden relative ">
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

              <div className="mt-6 mx-auto w-full max-w-7xl px-4">
                <div className="rounded-xl bg-[#3f3f3f]/70 ring-1 ring-white/10 px-8 py-8 md:px-10 md:py-10 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] md:text-xl font-bold uppercase tracking-wide text-white/90">
                      {slug === 'todas' ? 'Todas as Tips' : 'Top Previsões'}
                    </span>

                    <div className="relative">
                      <label htmlFor="sport-select" className="sr-only">
                        Selecionar desporto
                      </label>
                      <Select defaultValue={slug} onValueChange={onChangeSportShadcn}>
                        <SelectTrigger
                          className="
                            border-0 shadow-none px-0 py-0 text-[20px]
                            text-[#ED4F00] font-bold focus:ring-0 focus:outline-none
                            data-[state=open]:bg-transparent
                          "
                        >
                          <SelectValue placeholder="Escolher desporto" />
                        </SelectTrigger>
                        <SelectContent className="bg-transparent border-0 shadow-none text-[#ED4F00]">
                          {sportOptions.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="
                                bg-transparent text-[#ED4F00]
                                hover:bg-transparent hover:text-[#ED4F00]
                                focus:bg-transparent focus:text-white
                                data-[state=checked]:bg-transparent data-[state=checked]:text-white
                                text-[20px]
                              "
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* /header */}
            </div>
          </div>
        </div>
      </div>

      {/* Destaques */}
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
                const tipSport = normalizeTipSport(tip.sport);
                const tipCfg = SPORT_CONFIG[tipSport];
                const href =
                  tip && typeof tip.id !== 'undefined'
                    ? `/tips/${tipSport}/${tip.id}`
                    : '#';
                return (
                  <Link
                    key={String(tip.id) + '-featured'}
                    href={href}
                    className="group relative overflow-hidden rounded-lg ring-1 ring-white/10"
                  >
                    <div className="relative aspect-[16/8]">
                      <Image
                        src={tip.image ?? tipCfg.cardImage}
                        alt={tip.title || `${tipCfg.cardTitleBase} #${i + 1}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(min-width: 640px) 50vw, 100vw"
                        priority={i === 0}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm p-3">
                        <p className="text-[11px] uppercase tracking-wide text-white/70">
                          {tip.league || tipCfg.cardSub}
                        </p>
                        <h3 className="line-clamp-2 text-sm font-semibold">
                          {tip.title || `${tipCfg.cardTitleBase} #${i + 1}`}
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

      {/* GRID */}
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
        ) : visible.length === 0 ? (
          <div className="rounded-xl bg-[#1B1F2A] p-6 text-center text-white/80 ring-1 ring-white/10">
            {slug === 'todas'
              ? 'Ainda não há tips publicadas.'
              : <>Ainda não há tips de <span className="font-semibold">{cfg.name}</span>.</>}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {visible.map((tip, i) => {
              const tipSport = normalizeTipSport(tip.sport);
              const tipCfg = SPORT_CONFIG[tipSport];
              return (
                <article
                  key={tip.id}
                  onClick={() => {
                    if (typeof tip.id !== 'undefined') {
                      router.push(`/tips/${tipSport}/${tip.id}`);
                    }
                  }}
                  className="group relative overflow-hidden rounded-lg bg-[#1B1F2A] ring-1 ring-white/10 transition hover:ring-white/20 cursor-pointer"
                >
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={tip.image ?? tipCfg.cardImage}
                      alt={tip.title || `${tipCfg.cardTitleBase} #${i + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-black/55 backdrop-blur-sm p-3">
                      <p className="text-[11px] uppercase tracking-wide text-white/70">
                        {tip.league || tipCfg.cardSub}
                      </p>
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {tip.title || `${tipCfg.cardTitleBase} #${i + 1}`}
                      </h3>
                      <p className="text-xs text-white/80">
                        {tip.teams || '—'}
                        {tip.odds ? ` • @${tip.odds}` : ''}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* paginação mock (mantida) */}
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
