'use client';

import Image from 'next/image';
import Link from 'next/link';

type NewsItem = {
  title: string;
  date: string;
  tag: string;
  tagColor: string; // só para cor do tag (texto)
  image: string;
  excerpt: string;
  href?: string;
};

const news: NewsItem[] = [
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '20 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia1.jpg',
    excerpt:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/',
  },
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '22 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia2.jpg',
    excerpt:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/',
  },
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '27 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia3.jpg',
    excerpt:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/',
  },
];

export default function Hero() {
  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* NEWS.png – responsivo e centralizado */}
      <div className="absolute top-4 sm:top-6 md:top-10 left-1/2 -translate-x-1/2 z-10 w-[92%] sm:w-[86%] md:w-[80%] lg:w-[72%]">
        <Image
          src="/NEWS.png"
          alt=""
          width={1300}
          height={300}
          className="w-full h-auto object-contain"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 86vw, 72vw"
          priority
        />
      </div>

      {/* Texto NEWS de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-[0.06] z-0"
      >
        <span className="text-[7rem] sm:text-[12rem] md:text-[16rem] lg:text-[20rem] leading-none font-extrabold tracking-tighter text-white">
          NEWS
        </span>
      </div>

      {/* Conteúdo */}
      <div className="relative z-20 container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Últimas</h1>
          <Link
            href="/latest/futebol"
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Ver Mais
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD MAIOR */}
          <article className="overflow-hidden rounded-xl border border-gray-800 bg-gray-800/50 shadow-xl backdrop-blur-sm">
            <div className="relative h-56 sm:h-64 md:h-[320px]">
              <Image
                src={news[0].image}
                alt={news[0].title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 66vw"
                priority
              />
            </div>

            <div className="p-4 sm:p-5 space-y-3">
              <p className="text-[11px] sm:text-[12px] text-gray-400">
                <span className={`font-semibold ${news[0].tagColor}`}>
                  {news[0].tag}
                </span>{' '}
                | {news[0].date}
              </p>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white">
                {news[0].title}
              </h2>
              <p className="text-[13px] sm:text-sm text-gray-300">{news[0].excerpt}</p>
              <div>
                <Link
                  href="/latest/futebol"
                  className="inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
                >
                  Ver mais
                </Link>
              </div>
            </div>
          </article>

          {/* COLUNA DIREITA: 2 cards horizontais */}
          <div className="flex flex-col gap-6">
            {[news[1], news[2]].map((item, idx) => (
              <article
                key={idx}
                className="flex flex-col sm:flex-row gap-4 overflow-hidden rounded-xl border border-gray-800 bg-gray-800/50 shadow-lg"
              >
                {/* wrapper da imagem */}
                <div className="relative w-full sm:w-48 md:w-56 lg:w-64 h-40 sm:h-32 md:h-36 lg:h-40 shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="h-full w-full object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 320px"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className="text-[11px] sm:text-[12px] text-gray-400">
                      <span className={`font-semibold ${item.tagColor}`}>
                        {item.tag}
                      </span>{' '}
                      | {item.date}
                    </p>
                    <h3 className="mt-1 text-sm sm:text-base font-semibold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-gray-300 line-clamp-3">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="mt-3">
                    <Link
                      href="/latest/futebol"
                      className="inline-block rounded-md bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
                    >
                      Ver mais
                    </Link>
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
