// src/components/dicasPage/TitleBanner.tsx
import type { WhenKey } from "@/components/dicasPage/types";

// mapa de textos exibidos no banner
const WHEN_TEXT: Record<WhenKey, string> = {
  today: "HOJE",
  tomorrow: "AMANHÃ",
  soon: "EM BREVE",
};

// Server Component
export default function TitleBanner({
  right,
  when,
}: {
  right?: string;
  when: WhenKey;
}) {
  const whenText = WHEN_TEXT[when] ?? "HOJE";

  return (
    <div className="relative overflow-hidden border-b border-neutral-800 h-[250px]">
      {/* imagem fixa do banner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/banner_dicas.jpg"
        alt="Banner de Dicas"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* overlay escuro */}
      <div className="absolute inset-0 bg-neutral-950/60" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-10">
        <div className="flex items-end justify-between gap-6 mt-10">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
            <span className="text-orange-500">DICAS</span>{" "}
            <span className="text-neutral-100">DE APOSTAS</span>
            <br />
            <span className="text-neutral-100">DE </span>
            <span className="text-orange-500">FUTEBOL</span>{" "}
            <span className="text-orange-500">{whenText}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <p className="text-xs text-neutral-400">
            PREVISÕES GRATUITAS DE ESPECIALISTAS PARA
          </p>
          {right ? (
            <div className="text-[11px] md:text-xs uppercase text-orange-400 pb-1">
              {right}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
