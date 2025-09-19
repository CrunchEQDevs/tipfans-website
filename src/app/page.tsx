// app/page.tsx (Home)
import TipsDia from "@/components/tips/TipsDia";
import { fetchTipsDia } from "@/lib/fetchTipsDia";
import Hero from "@/components/Hero";
import Ultimas from "@/components/Ultimas";
import LoginPanel from "@/components/LoginPanel";
import MestresTips from "@/components/tipsters/MestresTips";
import Comunidade from "@/components/comunidade/Comunidade";
export default async function Home() {
  const tips = await fetchTipsDia(6); // agora vem de /api/wp/tips

  return (
    <div>
      <LoginPanel isOpen={false} />
      <Hero />
      <TipsDia tips={tips} />
      <Ultimas />
      <MestresTips />
      <Comunidade />
    </div>
  );
}
