'use client'; 

import Hero from "@/components/Hero";
import Hero2 from "@/components/Hero2";
import LogoPage from "@/components/Logo";
import UltimasNoticias from "@/components/UltimasNoticias";
import LoginPainel from "@/components/LoginPanel";

export default function Home() {
  return (
    <div className="">
      <LoginPainel isOpen={false} onClose={() => {}} />
      <Hero2 />
      <UltimasNoticias />
      <LogoPage />
      <Hero />
    </div>
  );
}
