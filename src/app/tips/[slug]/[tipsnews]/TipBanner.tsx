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
  const s = (raw || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
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
    <div className="relative w-full h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden">
      {/* fundo */}
      <Image
        src={src}
        alt={`Banner ${sport}`}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      {/* overlay escuro */}
      <div className="absolute inset-0 bg-black/50" />

      {/* conteúdo */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4 space-y-6">
        
        {/* Linha 1: escudos + data/hora no meio */}
        <div className="grid grid-cols-[auto,1fr,auto] items-center gap-10">
          <Image src="/B_tips/time-she.png" alt="Sheffield" width={64} height={64} />
          <p className="text-sm md:text-base font-semibold text-center opacity-90">
            24-05-2025 • 17:30
          </p>
          <Image src="/B_tips/time-su.png" alt="Sunderland" width={64} height={64} />
        </div>

        {/* Linha 2: nomes dos times */}
        <div className="grid grid-cols-2 gap-20 text-center w-full max-w-md">
          <span className="text-xs md:text-sm opacity-90">Sheffield United</span>
          <span className="text-xs md:text-sm opacity-90">Sunderland</span>
        </div>

        {/* Linha 3: título e info */}
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold tracking-wide">
            SHEFFIELD UNITED - SUNDERLAND
          </h1>
          <p className="text-xs md:text-sm opacity-80">
            Campeonato Inglês • Bramall Lane
          </p>
          <p className="text-sm font-semibold mt-1">Nossa Previsão</p>
        </div>

        {/* Linha 4: cards de previsão */}
        <div className="grid grid-cols-[auto,auto,auto] gap-4">
        {/* Card 1 */}
        <div className="rounded-md overflow-hidden min-w-[180px] shadow text-center">
            {/* topo */}
            <div className="px-4 py-2 bg-[#1E10C7] flex items-center justify-center gap-2 text-sm font-semibold">
            <FaFireAlt className="text-yellow-300" /> Dica quente
            </div>
            {/* resposta */}
            <div className="px-4 py-8 bg-[#404040]">
            <p className="text-sm">Sheffield United a ganhar</p>
            </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-md overflow-hidden min-w-[180px] shadow text-center">
            <div className="px-4 py-2 bg-[#606060] flex items-center justify-center gap-2 text-sm font-semibold">
            <FaFutbol /> Pontuação correta
            </div>
            <div className="px-4 py-8 bg-[#404040]">
            <p className="text-sm">Sheffield United 3-1 Sunderland</p>
            </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-md overflow-hidden min-w-[180px] shadow text-center">
            <div className="px-4 py-2 bg-[#606060] flex items-center justify-center gap-2 text-sm font-semibold">
            <MdStars className="text-red-400" /> Ambas as equipas marcam
            </div>
            <div className="px-4 py-8 bg-[#404040]">
            <p className="text-sm">SIM</p>
            </div>
        </div>
        </div>

      </div>
    </div>
  );
}
