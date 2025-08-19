'use client';

import Image from 'next/image';
import Link from 'next/link';

type TipCard = {
  id: string;
  categoria: string;
  titulo: string;
  data: string;
  resumo: string;
  autorLinha: string; // ex.: "Por Autor – 27 de Setembro de 2023 | 10:30"
  image: string;
  href: string;
};

const tips: TipCard[] = [
  {
    id: '1',
    categoria: 'Futebol',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica',
    data: '06/08/2025',
    resumo:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia3.jpg',
    href: '/tips/1',
  },
  {
    id: '2',
    categoria: 'Basquetebol',
    titulo:
      'Miami Heat vence o Atlanta Hawks e vai enfrentar os Cavaliers nos playoffs da NBA',
    data: '—',
    resumo:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia2.jpg',
    href: '/tips/2',
  },
  {
    id: '3',
    categoria: 'Ténis',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica',
    data: '06/08/2025',
    resumo:
      'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia3.jpg',
    href: '/tips/3',
  },
];

export default function Hero2() {
  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 md:pt-10 ">
        <div className=' w-1/2 top-[10%] absolute'>
            <Image
            src={'/NEWS.png'}
            alt={''}
            width={1000}
            height={300}
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 33vw"
            priority
        />
        </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-5"
      >
        <span className="text-[22rem] leading-none font-extrabold tracking-tighter text-white ">
          TIPS
        </span>
      </div>

      <div className="relative container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Tips do Dia
          </h2>

          <Link
            href="/"
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

        {/* Grid de Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <article
              key={tip.id}
              className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-800/60 shadow-xl backdrop-blur-sm"
            >
              {/* Imagem + etiqueta */}
              <div className="relative h-64 w-full">
                <Image
                  src={tip.image}
                  alt={tip.titulo}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />

                {/* Triângulo laranja + label azul (como na imagem) */}
                <div className="absolute top-4 left-0 flex items-center">
                  <span
                    aria-hidden
                    className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-orange-500 -ml-2"
                  />
                  <span className="rounded-sm bg-blue-700 px-3 py-1 text-xs font-semibold text-white shadow">
                    {tip.categoria}
                  </span>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="space-y-3 p-5">
                <h3 className="text-lg font-semibold text-white">
                  {tip.titulo}
                </h3>
                <p className="text-sm text-gray-400">{tip.data}</p>

                <p className="text-sm leading-relaxed text-gray-300">
                  {tip.resumo}
                </p>

                <p className="text-[12px] text-gray-400">{tip.autorLinha}</p>

                <div className="pt-1">
                  <Link
                    href={'/'}
                    className="inline-block rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
                  >
                    Ver Mais
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
