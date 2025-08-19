'use client';

import Hero from '@/components/Hero';
import TipsDia from '@/components/TipsDia'
import Ultimas from '@/components/Ultimas';
import LoginPanel from '@/components/LoginPanel';
import RankingMestresSection from '@/components/RankingMestresSection';

export default function Home() {
  return (
    <div>
      <LoginPanel isOpen={false} onClose={() => {}} />
      <Hero />
      <TipsDia />
      <Ultimas />
      <RankingMestresSection />

    </div>
  );
}
