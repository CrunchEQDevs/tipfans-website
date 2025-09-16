// app/page.tsx (Home)
import TipsDia from "@/components/tips/TipsDia";
import { fetchTipsDia } from "@/lib/fetchTipsDia";
import Hero from "@/components/Hero";
import Ultimas from "@/components/Ultimas";
import LoginPanel from "@/components/LoginPanel";
import RankingMestresSection from "@/components/RankingMestresSection";

export default async function Home() {
  const tips = await fetchTipsDia(6); // agora vem de /api/wp/tips

  return (
    <div>
      <LoginPanel isOpen={false} />
      <Hero />
      <TipsDia tips={tips} />
      <Ultimas />
      <RankingMestresSection />
    </div>
  );
}
