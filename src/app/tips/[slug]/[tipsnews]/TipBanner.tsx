'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FaFireAlt, FaFutbol } from 'react-icons/fa';
import { MdStars } from 'react-icons/md';

const BANNERS: Record<'futebol'|'basquete'|'tenis'|'esports', string> = {
  futebol:  '/B_tips/futebol.jpg',
  basquete: '/B_tips/basquete.png',
  tenis:    '/B_tips/tennis.png',
  esports:  '/B_tips/e-sporte.jpg',
};

function normalizeSport(raw?: string): 'futebol'|'basquete'|'tenis'|'esports' {
  const s = (raw || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (s.includes('esport')) return 'esports';
  if (s.startsWith('basq') || s.includes('basket')) return 'basquete';
  if (s.startsWith('ten')) return 'tenis';
  return 'futebol';
}

export default function TipBanner() {
  const params = useParams<{ slug: string }>();
  const sport = normalizeSport(params?.slug);
  const src = BANNERS[sport];

  return (
    <section className="relative w-full text-center md:pt-[100px] lg:pt-[28px]">
      {/* FULL-BLEED wrapper (100vw) */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[300px] xs:h-[360px] sm:h-[360px] md:h-[300px] lg:h-[360px] xl:h-[420px] bg-black  ">
        {/* Imagem responsiva: mobile não corta texto; md+ usa cover */}
        <Image
          src={src}
          alt={`Banner ${sport}`}
          fill
          sizes="100vw"
          className="object-contain md:object-cover object-left"
          priority
        />

        {/* overlay */}
        <div className="absolute inset-0 bg-black/40 md:bg-black/50" />

        {/* CONTEÚDO CENTRALIZADO */}
        <div className="absolute inset-0 flex items-center justify-center text-white px-4">
          <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-5">

            {/* Linha 1: escudos + data/hora */}
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-4 sm:gap-6 md:gap-10">
              <Image src="/B_tips/time-she.png" alt="Sheffield" width={64} height={64} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain" />
              <p className="text-[11px] sm:text-sm md:text-base font-semibold opacity-90">24-05-2025 • 17:30</p>
              <Image src="/B_tips/time-su.png" alt="Sunderland" width={64} height={64} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 object-contain" />
            </div>

            {/* Linha 2: nomes */}
            <div className="grid grid-cols-2 gap-6 sm:gap-12 md:gap-20 w-full max-w-md">
              <span className="text-[10px] sm:text-xs md:text-sm opacity-90">Sheffield United</span>
              <span className="text-[10px] sm:text-xs md:text-sm opacity-90">Sunderland</span>
            </div>

            {/* Linha 3: título e info */}
            <div>
              <h1 className="text-sm sm:text-base md:text-2xl font-extrabold tracking-wide">SHEFFIELD UNITED - SUNDERLAND</h1>
              <p className="text-[10px] sm:text-xs md:text-sm opacity-80">Campeonato Inglês • Bramall Lane</p>
              <p className="text-xs sm:text-sm font-semibold mt-1">Nossa Previsão</p>
            </div>

            {/* Linha 4: cards — carrossel no mobile, grid no desktop */}
            <div className="w-full">
              <div className="mx-auto flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:overflow-visible md:grid md:grid-cols-3 md:gap-4 md:max-w-4xl">
                {/* Card 1 */}
                <div className="snap-start shrink-0 min-w-[160px] sm:min-w-[180px] md:min-w-0 rounded-md overflow-hidden shadow text-center">
                  <div className="px-3 sm:px-4 py-2 bg-[#1E10C7] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
                    <FaFireAlt className="text-yellow-300" /> Dica quente
                  </div>
                  <div className="px-3 sm:px-4 py-6 sm:py-8 bg-[#404040]">
                    <p className="text-xs sm:text-sm">Sheffield United a ganhar</p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="snap-start shrink-0 min-w-[160px] sm:min-w-[180px] md:min-w-0 rounded-md overflow-hidden shadow text-center">
                  <div className="px-3 sm:px-4 py-2 bg-[#606060] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
                    <FaFutbol /> Pontuação correta
                  </div>
                  <div className="px-3 sm:px-4 py-6 sm:py-8 bg-[#404040]">
                    <p className="text-xs sm:text-sm">Sheffield United 3-1 Sunderland</p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="snap-start shrink-0 min-w-[160px] sm:min-w-[180px] md:min-w-0 rounded-md overflow-hidden shadow text-center">
                  <div className="px-3 sm:px-4 py-2 bg-[#606060] flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold">
                    <MdStars className="text-red-400" /> Ambas as equipas marcam
                  </div>
                  <div className="px-3 sm:px-4 py-6 sm:py-8 bg-[#404040]">
                    <p className="text-xs sm:text-sm">SIM</p>
                  </div>
                </div>
              </div>
              <style jsx>{`div::-webkit-scrollbar{display:none}`}</style>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
