'use client';

import Image from 'next/image';

type Props = {
  name: string;
  avatar?: string | null;
  bio?: string;
};

export default function TipsterBanner({ name, avatar, bio }: Props) {
  return (
    <section className="relative rounded-xl ring-1 ring-white/10 shadow-xl overflow-hidden">
      {/* BG */}
      <Image
        src="/B_tipsters.png"
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[#333333]/80" />

      {/* Conteúdo */}
      <div className="relative grid grid-cols-[140px_1fr] gap-4 p-4 md:grid-cols-[200px_1fr] md:p-6">
        {/* Foto */}
        <div className="relative h-[140px] w-[140px] md:h-[160px] md:w-[160px] rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5">
          <Image
            src={avatar || '/user.png'}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Nome + navegação */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold">{name}</h1>
            <span className="text-[#ED4F00]">▸</span>
          </div>

          {/* Métricas placeholder (gamificação futura) */}
          <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#ED4F00]" aria-hidden>
                <path d="M3 3v18h18" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M7 15l4-5 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="opacity-70">Rácio de Acerto</span>
              <span className="font-semibold text-[#ED4F00]">—</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="opacity-70">Retorno Médio</span>
              <span className="font-semibold text-[#ED4F00]">—</span>
            </div>
          </div>

          <div className="mt-2 h-px w-full bg-white/10" />

          <nav className="flex flex-wrap gap-3 text-xs md:text-sm text-white/80">
            <span className="opacity-40">•</span>
            <a className="hover:text-white" href="#futebol">Futebol</a>
            <span className="opacity-40">•</span>
            <a className="hover:text-white" href="#tenis">Ténis</a>
            <span className="opacity-40">•</span>
            <a className="hover:text-white" href="#basquete">Basquete</a>
            <span className="opacity-40">•</span>
            <a className="hover:text-white" href="#esports">eSports</a>
          </nav>

          {bio ? (
            <p className="text-sm md:text-[15px] text-white/85 leading-relaxed">
              {bio}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
