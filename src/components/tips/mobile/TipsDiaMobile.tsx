'use client';

import { useRef, useState } from 'react';
import TipsDiaCard from '../TipsDiaCard';
import type { TipCard } from '../types';

type Props = { tips: TipCard[] };

export default function TipsDiaMobile({ tips }: Props) {
  // 🔧 Hooks sempre no topo
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const items = [...(tips || [])]
    .sort((a: any, b: any) => {
      const da = new Date(a.createdAt || a.date || 0).getTime();
      const db = new Date(b.createdAt || b.date || 0).getTime();
      return db - da;
    })
    .slice(0, 6);

  // Pode retornar depois dos hooks sem problema
  if (!items.length) {
    return <div className="text-gray-300">Sem tips publicadas ainda.</div>;
  }

  const scrollToIdx = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    if (!cards.length) return;
    const idx = Math.max(0, Math.min(i, cards.length - 1));
    cards[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIdx(idx);
  };

  const onPrev = () => scrollToIdx(activeIdx - 1);
  const onNext = () => scrollToIdx(activeIdx + 1);

  // mantém o índice alinhado quando o user arrasta com o dedo
  const onTrackScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>('[data-card]');
    if (!cards.length) return;
    let best = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const dist = Math.abs(c.offsetLeft - el.scrollLeft);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActiveIdx(best);
  };

  return (
    <div className="relative p-4">
      {/* setas fora da faixa */}
      <button
        aria-label="Anterior"
        onClick={onPrev}
        disabled={activeIdx === 0}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 disabled:opacity-40 text-white px-3 py-2 font-bold rounded-full shadow"
      >
        «
      </button>
      <button
        aria-label="Próximo"
        onClick={onNext}
        disabled={activeIdx >= items.length - 1}
        className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 disabled:opacity-40 text-white px-3 py-2 rounded-full shadow font-bold"
      >
        »
      </button>

      {/* faixa com snap */}
      <div
        ref={trackRef}
        onScroll={onTrackScroll}
        className="relative z-10 flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

        {items.map((tip) => (
          <div
            key={tip.id}
            data-card
            className="snap-start shrink-0 w-[300px] xs:w-[320px] sm:w-[340px]"
          >
            <TipsDiaCard tip={tip} />
          </div>
        ))}

        {/* sentinela fininha para estabilidade do snap no fim */}
        <div aria-hidden className="shrink-0 w-px" />
      </div>
    </div>
  );
}
