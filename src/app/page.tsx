// app/page.tsx (Home)
import Hero from "@/components/Hero";
import Ultimas from "@/components/Ultimas";
import LoginPanel from "@/components/LoginPanel";
import TipsDia from "@/components/tips/TipsDia"; // ✅ não recebe props
import TipsterDeskClient from "@/components/tipsters/tipisterdesk/TipsterDeskClient";
import Community from "@/components/community/Community"; // ⬅️ aqui!


export default async function Home() {
  return (
    <div>
      <LoginPanel isOpen={false} />
      <Hero />
      <TipsDia />       
      <Ultimas />
      <TipsterDeskClient />
      <Community />  {/* ⬅️ render */}
    </div>
  );
}
