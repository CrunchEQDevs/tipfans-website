'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { HiOutlinePlay } from 'react-icons/hi2';

type NewsItem = {
  title: string;
  date: string;
  tag: string;
  tagColor: string;
  image: string;
  excerpt: string;
  href?: string;
};

/* ---------- Fallback local (idêntico ao teu mock) ---------- */
const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '20 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia1.jpg',
    excerpt:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/futebol',
  },
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '22 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia2.jpg',
    excerpt: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/futebol',
  },
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '27 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia3.jpg',
    excerpt: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/futebol',
  },
];

/* util para fetch local */
async function fetchJson(url: string): Promise<any> {
  const u = new URL(url, window.location.origin);
  u.searchParams.set('_', String(Date.now()));
  const r = await fetch(u.toString(), { cache: 'no-store' });
  const ct = r.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export default function Hero() {
  // por padrão, mostramos FUTEBOL (igual ao teu link /latest/futebol)
  const SPORT_DEFAULT = 'futebol';

  const [items, setItems] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        // pega 3 notícias do WP para o esporte padrão
        const base = new URL('/api/wp/news', window.location.origin);
        base.searchParams.set('sport', SPORT_DEFAULT);
        base.searchParams.set('per_page', '3');
        base.searchParams.set('_', String(Date.now()));

        const json = await fetchJson(base.toString()); // { items: [...] }
        const itemsFromApi = Array.isArray(json?.items) ? (json.items as any[]) : [];

        // mapeia para o teu NewsItem sem alterar layout
        const mapped: NewsItem[] = itemsFromApi.map((p: any): NewsItem => ({
          title: p?.title ?? '',
          date: p?.date ?? '',                       // já vem formatado da API
          tag: p?.tag ?? 'Futebol',                  // "Futebol" default
          tagColor: p?.tagColor ?? 'text-orange-400',
          image: p?.image ?? '/noticia1.jpg',
          excerpt: p?.excerpt ?? '',
          href: p?.href ?? `/latest/${SPORT_DEFAULT}`, // link de leitura
        }));

        if (!cancel && mapped.length >= 1) {
          // garante 3 posições (preenche com fallback se vier menos)
          const filled = [...mapped];
          for (let i = mapped.length; i < 3; i++) filled.push(FALLBACK_NEWS[i]);
          setItems(filled.slice(0, 3));
        }
      } catch {
        // fica no fallback
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // sempre mantém 3 itens para o layout existente
  const news = useMemo<NewsItem[]>(
    () => (Array.isArray(items) && items.length >= 3 ? items.slice(0, 3) : FALLBACK_NEWS),
    [items]
  );

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* NEWS.png decor */}
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
            Ver Mais
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* GRID: esquerda maior, direita com dois cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.12fr_1fr]">
          {/* CARD ESQUERDA (maior) */}
          <article className="overflow-hidden">
            <div className="relative h-[220px] sm:h[360px] md:h-[400px] lg:h-[430px]">
              <Image
                src={news[0].image}
                alt={news[0].title}
                fill
                className="object-cover object-center rounded-xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
                priority
              />
            </div>

            <div className="space-y-3 p-5">
              <p className="text-[11px] sm:text-[12px] text-gray-400">
                <span className={`font-semibold ${news[0].tagColor}`}>{news[0].tag}</span> | {news[0].date}
              </p>
              <h2 className="text-[15px] sm:text-lg md:text-xl font-semibold text-white leading-snug">
                {news[0].title}
              </h2>
              <p className="text-[13px] sm:text-sm text-gray-300">{news[0].excerpt}</p>
              <Link
                href={news[0].href || '/latest/futebol'}
                className="inline-block bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 mb-10"
              >
                Ver mais
              </Link>
            </div>
          </article>

          {/* COLUNA DIREITA: dois cards RESPONSIVOS */}
          <div className="grid grid-rows-2 gap-6">
            {[news[1], news[2]].map((item, idx) => (
              <article key={idx} className="overflow-hidden rounded-xl border border-gray-800/40">
                <div className="flex flex-col md:flex-row h-full">
                  {/* imagem */}
                  <div className="relative w-full md:w-[46%] lg:w-[42%] h-48 sm:h-56 md:h-[240px] lg:h-[260px]">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover object-center rounded-xl"
                      sizes="(max-width: 768px) 100vw, 320px "
                      priority={idx === 0}
                    />
                  </div>

                  {/* conteúdo */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-gray-400">
                        <span className={`font-semibold ${item.tagColor}`}>{item.tag}</span> | {item.date}
                      </p>
                      <h3 className="mt-1 text-[15px] sm:text-base font-semibold text-white leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-300">{item.excerpt}</p>
                    </div>

                    <div className="pt-3">
                      <Link
                        href={item.href || '/latest/futebol'}
                        className="inline-block bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        Ver mais
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
