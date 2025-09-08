'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HiOutlinePlay } from 'react-icons/hi2';

type TipCard = {
  id: string;
  categoria: string;
  titulo: string;
  data: string;
  resumo: string;
  autorLinha: string;
  image: string;
  href: string;
};

const tips: TipCard[] = [
  {
    id: '1',
    categoria: 'Futebol',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica',
    data: '06/08/2025',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia3.jpg',
    href: '/tips/futebol',
  },
  {
    id: '2',
    categoria: 'Basquetebol',
    titulo: 'Miami Heat vence o Atlanta Hawks e vai enfrentar os Cavaliers nos playoffs da NBA',
    data: '—',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia2.jpg',
    href: '/tips/basquete',
  },
  {
    id: '3',
    categoria: 'Ténis',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica',
    data: '06/08/2025',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Autor – 27 de Setembro de 2023 | 10:30',
    image: '/noticia3.jpg',
    href: '/tips/tenis',
  },
];

export default function TipsDia() {
  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 md:pt-10">
      {/* banner decorativo (não bloqueia cliques) */}
      <div className="pointer-events-none absolute top-0 w-1/2">
        <Image
          src="/TIPS_menu.png"
          alt="News"
          width={1900}
          height={300}
          className="object-cover"
          sizes="(max-width: 1224px) 100vw, 60vw"
          priority
        />
      </div>

      {/* watermark TIPS */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex select-none items-center justify-center opacity-5">
        <span className="text-[22rem] leading-none font-extrabold tracking-tighter text-white">TIPS</span>
      </div>

      <div className="relative container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl md:text-5xl font-semibold text-white">Tips do Dia</h2>

          <Link
            href={tips[0].href}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Ver Mais
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Grid de Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tips.map((tip) => (
            <article
              key={tip.id}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-[#3E3E3E] shadow-xl backdrop-blur-sm p-3"
            >
              {/* WRAPPER DA IMAGEM (dá a margem interna) */}
              <div className="relative w-full h-56 md:h-60 rounded-lg overflow-hidden ring-1 ring-white/15 bg-black/5">
                <Image
                  src={tip.image}
                  alt={tip.titulo}
                  fill
                  sizes="(max-width:1024px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />

                {/* Label sobreposta */}
                <div className="absolute top-2 left-0 flex items-center">
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
              <div className="space-y-3 p-3">
                <h3 className="text-[15px] md:text-base font-semibold text-white leading-snug">
                  {tip.titulo}
                </h3>

                <p className="text-xs text-gray-300">{tip.data}</p>

                <p className="text-sm leading-relaxed text-gray-200">
                  {tip.resumo}
                </p>

                <p className="text-[12px] text-gray-400">{tip.autorLinha}</p>

                <div className="pt-1">
                  <Link
                    href={tip.href}
                    className="inline-flex items-center gap-2  bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
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
