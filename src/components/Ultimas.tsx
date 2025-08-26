'use client';

import Image from 'next/image';
import Link from 'next/link';
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
    excerpt: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/',
  },
  {
    title: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    date: '27 Maio 2025',
    tag: 'Futebol',
    tagColor: 'text-orange-400',
    image: '/noticia3.jpg',
    excerpt: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    href: '/latest/',
  },
];

export default function Hero() {
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
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white">
            Ver Mais
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* GRID: esquerda maior, direita normal */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.12fr_1fr]">
          {/* CARD ESQUERDA (maior) */}
          <article className="overflow-hidden ">
            <div className="relative h-[220px] sm:h-[360px] md:h-[400px] lg:h-[320px]">
              <Image
                src={news[0].image}
                alt={news[0].title}
                fill
                className="object-cover object-center"
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
                href="/latest/futebol"
                className="inline-block  bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                Ver mais
              </Link>
            </div>
          </article>

          {/* COLUNA DIREITA: dois cards horizontais com imagens iguais */}
          <div className="grid grid-rows-2 gap-6">
            {[news[1], news[2]].map((item, idx) => (
              <article
                key={idx}
                className="flex h-full overflow-hidden"
              >
                {/* imagem com medidas consistentes */}
                <div className="relative h-[150px] sm:h-[260px] md:h-[270px] lg:h-[240px] w-[46%] min-w-[240px] max-w-[320px]">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 320px, 360px"
                    priority={idx === 0}
                  />
                </div>

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
                      href="/latest/futebol"
                      className="inline-block bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
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
