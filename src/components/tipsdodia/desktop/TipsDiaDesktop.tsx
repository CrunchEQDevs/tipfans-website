'use client';

import { useRef } from 'react';
import TipsDiaCard from '../TipsDiaCard';
import type { TipCard } from '../types';

type Props = { tips: TipCard[] };

export default function TipsDiaDesktop({ tips }: Props) {
  // hook deve vir antes de qualquer return condicional
  const trackRef = useRef<HTMLDivElement>(null);

  // garante no máximo 6 itens
  const limitedTips = (tips || []).slice(0, 6);

  if (!limitedTips.length) {
    return <div className="text-gray-300">Sem posts publicados ainda.</div>;
  }

  const scrollByCards = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const gap = 24; // gap-6
    const cardW = card ? card.offsetWidth : 360;
    el.scrollBy({ left: dir * (cardW * 2 + gap * 2), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* setas grandes */}
      <button
        aria-label="Anterior"
        onClick={() => scrollByCards(-1)}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded"
      >
        «
      </button>
      <button
        aria-label="Próximo"
        onClick={() => scrollByCards(1)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white px-3 py-2 rounded"
      >
        »
      </button>

      {/* trilho do carrossel */}
      <div
        ref={trackRef}
        className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 px-1 [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

        {limitedTips.map((tip) => (
          <div
            key={tip.id}
            data-card
            className="snap-start shrink-0 w-[340px] md:w-[360px] lg:w-[380px] xl:w-[400px]"
          >
            <TipsDiaCard tip={tip} />
          </div>
        ))}
      </div>
    </div>
  );
}
