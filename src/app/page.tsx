import Hero from "@/components/Hero";
import Hero2 from "@/components/Hero2";
import LogoPage from "@/components/Logo";
import UltimasNoticias from "@/components/UltimasNoticias";

export default function Home() {
  return (
    <div className="">
          <Hero2 />
          <UltimasNoticias />
          <LogoPage />
          <Hero />
    </div>
  );
}
