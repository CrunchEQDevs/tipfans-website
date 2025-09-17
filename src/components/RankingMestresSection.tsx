'use client';

import RankingTorneios from '@/components/tipsters/RankingTorneios';
import MestresTips from '@/components/tipsters/MestresTips';

export default function RankingMestresSection() {
  return (
    <section className="relative w-full bg-[#1E1E1E] py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Ranking & Mestres
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <RankingTorneios />
          <MestresTips />
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-48 max-w-4xl rounded-full bg-gradient-to-r from-orange-500/10 via-white/5 to-orange-500/10 blur-3xl"
      />
    </section>
  );
}
