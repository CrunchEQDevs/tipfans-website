'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { HiOutlinePlay } from 'react-icons/hi2';

type NewsItem = {
  title: string;
  date?: string;
  tag?: string;
  tagColor?: string;
  image?: string | null;
  excerpt?: string;
  href?: string;
  sport?: 'futebol' | 'basquete' | 'tenis' | 'esports';
};

const SPORT_DEFAULT = 'futebol' as const;

const SPORT_LABELS: Record<string, string> = {
  futebol: 'Futebol',
  basquete: 'Basquete',
  tenis: 'Ténis',
  esports: 'E-sports',
};

const SPORT_COLORS: Record<string, string> = {
  futebol: 'text-orange-400',
  basquete: 'text-blue-400',
  tenis: 'text-green-400',
  esports: 'text-pink-400',
};

/* fetch util */
async function fetchJson(url: string): Promise<any> {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  const r = await fetch(u.toString(), { cache: 'no-store' });
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

/* Skeletons */
function BigCardSkeleton() {
  return (
    <article className="overflow-hidden">
      <div className="relative h-[220px] sm:h-[320px] md:h-auto md:aspect-[16/9] bg-white/10 animate-pulse rounded-xl" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-40 bg-white/10 rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
        <div className="h-9 w-24 bg-white/10 rounded animate-pulse" />
      </div>
    </article>
  );
}
function SideCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl">
      <div className="flex flex-col md:flex-row h-full">
        <div className="relative w-full md:w-[50%] h-48 sm:h-56 md:h-auto md:aspect-[4/3] bg-white/10 animate-pulse rounded-xl" />
        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="space-y-2">
            <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="h-8 w-20 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    </article>
  );
}

export default function Hero() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        // 3 últimos do desporto padrão
        const base = new URL('/api/wp/news', window.location.origin);
        base.searchParams.set('sport', SPORT_DEFAULT);
        base.searchParams.set('per_page', '3');
        base.searchParams.set('orderby', 'date');
        base.searchParams.set('order', 'desc');

        const json = await fetchJson(base.toString());
        const arr: any[] = Array.isArray(json?.items) ? json.items : [];

        const mapped: NewsItem[] = arr.map((p: any): NewsItem => {
          const sport = (p?.categorySlug || p?.sport || SPORT_DEFAULT) as NewsItem['sport'];
          return {
            title: p?.titulo ?? p?.title ?? '',
            date: p?.data ?? p?.date ?? '',
            tag: p?.categoria ?? SPORT_LABELS[sport || 'futebol'],
            tagColor: SPORT_COLORS[sport || 'futebol'],
            image: p?.image ?? p?.cover ?? null,
            excerpt: p?.resumo ?? p?.excerpt ?? '',
            href: p?.hrefPost ?? p?.href ?? `/latest/${sport}/${p?.id ?? ''}`,
            sport,
          };
        });

        if (!cancel) setItems(mapped.slice(0, 3));
      } catch {
        if (!cancel) setItems([]); // sem fallback
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const news = useMemo(() => items.slice(0, 3), [items]);
  const rightCol = useMemo(() => news.slice(1, 3), [news]);

  /* ======== MOBILE: carrossel robusto (inline CSS) ======== */
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const scrollToSlide = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>('[data-slide]');
    if (!slides.length) return;
    const idx = Math.max(0, Math.min(i, slides.length - 1));
    slides[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIdx(idx);
  };
  const onPrev = () => scrollToSlide(activeIdx - 1);
  const onNext = () => {
    const last = (loading ? 2 : news.length - 1);
    if (activeIdx >= last) return; // quer loop? troco pra módulo
    scrollToSlide(activeIdx + 1);
  };

  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>('[data-slide]');
    if (!slides.length) return;
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const dist = Math.abs(s.offsetLeft - el.scrollLeft);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActiveIdx(best);
  };

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* BG decor (desktop) */}
      <div className="pointer-events-none absolute left-0 top-4 hidden md:block opacity-90">
        <Image
          src="/NEWS.png"
          alt=""
          width={1000}
          height={300}
          className="h-auto w-[1200px] object-contain"
          sizes="520px"
          priority
        />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Últimas</h1>
          <Link
            href="/latest/futebol"
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Ver todos
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* ===== DESKTOP (inalterado) — escondido no mobile ===== */}
        <div className="hidden md:grid grid-cols-2 gap-8">
          {/* ESQUERDA */}
          {loading ? (
            <BigCardSkeleton />
          ) : news[0] ? (
            <article className="overflow-hidden">
              <div className="relative h-[220px] sm:h-[320px] md:h-auto md:aspect-[16/9]">
                {news[0].image ? (
                  <Image
                    src={news[0].image}
                    alt={news[0].title || ''}
                    fill
                    className="object-cover object-center rounded-xl"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 rounded-xl" />
                )}
              </div>

              <div className="p-5 flex flex-col gap-3 min-h-[200px]">
                {(news[0].tag || news[0].date) && (
                  <p className="text-[11px] sm:text-[12px] text-gray-400">
                    {news[0].tag && (
                      <span className={`font-semibold ${news[0].tagColor || 'text-orange-400'}`}>
                        {news[0].tag}
                      </span>
                    )}
                    {news[0].tag && news[0].date ? ' | ' : ''}
                    {news[0].date}
                  </p>
                )}

                {news[0].title && (
                  <h2 className="text-[15px] sm:text-lg md:text-xl font-semibold text-white leading-snug line-clamp-2">
                    {news[0].title}
                  </h2>
                )}

                {news[0].excerpt && (
                  <p className="text-[13px] sm:text-sm text-gray-300 line-clamp-4">
                    {news[0].excerpt}
                  </p>
                )}

                <div className="mt-2">
                  <Link
                    href={news[0].href || '/latest/futebol'}
                    className="inline-block px-4 py-2 text-sm font-semibold text-white transition rounded bg-[#ED4F00] hover:bg-white/20"
                  >
                    Ver mais
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <div className="rounded-md p-6 text-white/80">Nada por aqui ainda.</div>
          )}

          {/* DIREITA */}
          <div className="grid grid-rows-2 gap-6">
            {loading ? (
              <>
                <SideCardSkeleton />
                <SideCardSkeleton />
              </>
            ) : (
              rightCol.map((item, idx) => (
                <article key={idx} className="overflow-hidden rounded-xl">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="relative w-full md:w-[50%] h-48 sm:h-56 md:h-auto md:aspect-[4/3]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title || ''}
                          fill
                          className="object-cover object-center rounded-xl"
                          sizes="(min-width: 768px) 25vw, 100vw"
                          priority={idx === 0}
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-xl" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        {(item.tag || item.date) && (
                          <p className="text-[11px] sm:text-[12px] text-gray-400">
                            {item.tag && (
                              <span className={`font-semibold ${item.tagColor || 'text-orange-400'}`}>
                                {item.tag}
                              </span>
                            )}
                            {item.tag && item.date ? ' | ' : ''}
                            {item.date}
                          </p>
                        )}
                        {item.title && (
                          <h3 className="mt-1 text-[15px] sm:text-base font-semibold text-white leading-snug line-clamp-2">
                            {item.title}
                          </h3>
                        )}
                        {item.excerpt && (
                          <p className="mt-2 text-[13px] leading-relaxed text-gray-300 line-clamp-4">
                            {item.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-3">
                        <Link
                          href={item.href || '/latest/futebol'}
                          className="inline-block px-4 py-2 text-xs sm:text-sm font-semibold text-white transition rounded bg-[#ED4F00] hover:bg-white/20"
                        >
                          Ver mais
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* ===== MOBILE (carrossel) — só no < md ===== */}
        <div className="block md:hidden relative mt-8">
          {/* setas */}
          <button
            aria-label="Anterior"
            onClick={onPrev}
            disabled={activeIdx === 0}
            className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 bg-black/50 disabled:opacity-40 hover:bg-black/70 text-white px-3 py-2 rounded-full font-bold shadow"
          >
            «
          </button>
          <button
            aria-label="Próximo"
            onClick={onNext}
            disabled={activeIdx >= (loading ? 2 : news.length - 1)}
            className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-black/50 disabled:opacity-40 hover:bg-black/70 text-white px-3 py-2 rounded-full font-bold shadow"
          >
            »
          </button>

          <div
            ref={trackRef}
            onScroll={onTrackScroll}
            className="pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridAutoColumns: '88vw',   // largura de cada slide
              gap: 16,                    // mesmo do tailwind gap-4
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
            }}
          >
            <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

            {(loading ? [0, 1, 2] : news).map((it: any, idx: number) => (
              <div
                key={idx}
                data-slide
                style={{ scrollSnapAlign: 'start' }}
              >
                {loading ? (
                  idx === 0 ? <BigCardSkeleton /> : <SideCardSkeleton />
                ) : (
                  <article className="overflow-hidden">
                    <div className={`relative ${idx === 0 ? 'h-[220px]' : 'h-56'}`}>
                      {it.image ? (
                        <Image
                          src={it.image}
                          alt={it.title || ''}
                          fill
                          className="object-cover object-center rounded-xl"
                          sizes="100vw"
                          priority={idx === 0}
                        />
                      ) : (
                        <div className="w-full h-full bg-white/10 rounded-xl" />
                      )}
                    </div>

                    <div className="p-5">
                      {(it.tag || it.date) && (
                        <p className="text-[11px] text-gray-400">
                          {it.tag && (
                            <span className={`font-semibold ${it.tagColor || 'text-orange-400'}`}>
                              {it.tag}
                            </span>
                          )}
                          {it.tag && it.date ? ' | ' : ''}
                          {it.date}
                        </p>
                      )}

                      {it.title && (
                        <h3 className={`mt-1 font-semibold text-white leading-snug ${idx === 0 ? 'text-[16px]' : 'text-[15px]'} line-clamp-2`}>
                          {it.title}
                        </h3>
                      )}

                      {it.excerpt && (
                        <p className="mt-2 text-[13px] leading-relaxed text-gray-300 line-clamp-4">
                          {it.excerpt}
                        </p>
                      )}

                      <div className="pt-3">
                        <Link
                          href={it.href || '/latest/futebol'}
                          className={`inline-block bg-orange-600 px-4 py-2 text-white font-semibold transition hover:bg-orange-700 ${idx === 0 ? 'text-sm' : 'text-xs'}`}
                        >
                          Ver mais
                        </Link>
                      </div>
                    </div>
                  </article>
                )}
              </div>
            ))}

            {/* sentinela fininha para estabilidade do snap no fim */}
            <div aria-hidden style={{ width: 1, flex: '0 0 auto' }} />
          </div>
        </div>
        {/* ===== /MOBILE ===== */}
      </div>
    </section>
  );
}
