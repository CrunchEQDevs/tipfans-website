// src/components/tipsdodia/TipsDia.tsx
"use client";

import Image from "next/image";
import TipsDiaDesktop from "./desktop/TipsDiaDesktop";
import TipsDiaMobile from "./mobile/TipsDiaMobile";
import type { TipCard } from "./types";
import { HiOutlinePlay } from 'react-icons/hi2';

// mock (troque pelos seus dados)
const mockTips: TipCard[] = [
  {
    id: "1",
    categoria: "Futebol",
    titulo: "Derby de Lisboa — Pré-jogo e valor nas linhas",
    data: "Hoje, 18:30",
    resumo: "Análise rápida das odds e possíveis cenários para o clássico.",
    autorLinha: "por TipFans Team",
    image: "/tips/futebol.png",
    href: "/tips/derby-lisboa",
  },
  {
    id: "2",
    categoria: "Ténis",
    titulo: "ATP 500 — Valor no underdog do 2º set",
    data: "Hoje, 21:00",
    resumo: "Jogador vem de sequência forte no saibro e pode surpreender.",
    autorLinha: "por TipFans Team",
    image: "/tips/tennis.png",
    href: "/tips/dicas/atp-500",
  },
  {
    id: "3",
    categoria: "NBA",
    titulo: "Thunder x Pacers — total de pontos em foco",
    data: "Amanhã, 02:00",
    resumo: "Ritmo alto recente indica linha de total ligeiramente baixa.",
    autorLinha: "por TipFans Team",
    image: "/tips/basquete.png",
    href: "/tips/dicas/thunder-pacers",
  },
];

export default function TipsDia({ tips }: { tips?: TipCard[] }) {
  const items = tips?.length ? tips : mockTips;

  return (

    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
        {/* NEWS.png decor */}
        <div className="pointer-events-none absolute left-0 top-4 hidden md:block opacity-90">
            <Image
              src="/tips/TIPS_menu.png"
              alt=""
              width={1000}
              height={300}
              className="h-auto w-[1200px] object-contain"
              sizes="520px"
              priority
            />
        </div>

      {/* BG MOBILE: centralizado e um pouco maior */}
      <div className="md:hidden absolute inset-0 -z-10 pointer-events-none select-none">
        <Image
          src="/tips/TIPS_menu.png"
          alt="Tips BG"
          fill
          sizes="100vw"
          className="
            object-contain object-center 
            opacity-10 
            scale-[1.35] 
            translate-y-6
          "
          priority
        />
      </div>

      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Tips do Dia</h2>

          <button className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-semibold transition">
             <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Cards Desktop */}
        <div className="hidden md:block">
          <TipsDiaDesktop tips={items} />
        </div>

        {/* Cards Mobile */}
        <div className="md:hidden">
          <TipsDiaMobile tips={items} />
        </div>
      </div>
    </section>
  );
}
