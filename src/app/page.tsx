import TipsDia from "@/components/tipsdodia/TipsDia";
import { fetchTipsDia } from "@/lib/fetchTipsDia";
import Hero from "@/components/Hero";
import Ultimas from "@/components/Ultimas";
import LoginPanel from "@/components/LoginPanel";
import RankingMestresSection from "@/components/RankingMestresSection";

export default async function Home() {
  const tips = await fetchTipsDia(6); // busca no WP (server-side)

  return (
    <div>
      <LoginPanel isOpen={false} /> {/* ← sem passar função do server */}
      <Hero />
      <TipsDia tips={tips} />
      <Ultimas />
      <RankingMestresSection />
    </div>
  );
}
