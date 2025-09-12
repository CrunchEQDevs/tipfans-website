'use client';

import { useRef } from 'react';
import TipsDiaCard from '../TipsDiaCard';
import type { TipCard } from '../types';

type Props = { tips: TipCard[] };

export default function TipsDiaMobile({ tips }: Props) {
  // hook vem primeiro
  const trackRef = useRef<HTMLDivElement>(null);

  if (!tips?.length) {
    return <div className="text-gray-300">Sem posts publicados ainda.</div>;
  }

  const scrollByCards = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const gap = 16; // gap-x-4
    const cardWidth = card ? card.offsetWidth : 300;
    el.scrollBy({ left: dir * (cardWidth + gap), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* setas */}
      <button
        aria-label="Anterior"
        onClick={() => scrollByCards(-1)}
        className="absolute -left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white px-2 py-1 rounded"
      >
        «
      </button>
      <button
        aria-label="Próximo"
        onClick={() => scrollByCards(1)}
        className="absolute -right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 text-white px-2 py-1 rounded"
      >
        »
      </button>

      {/* trilho do carrossel */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory px-2 pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ scrollbarWidth: 'none' }}
      >
        {/* esconder scrollbar no WebKit */}
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        {tips.map((tip) => (
          <div
            key={tip.id}
            data-card
            className="snap-center shrink-0 w-[85vw] max-w-[340px]"
          >
            <TipsDiaCard tip={tip} />
          </div>
        ))}
      </div>
    </div>
  );
}
