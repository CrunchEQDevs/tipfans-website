'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';

/* ========================
   Tipos + dados de exemplo
======================== */
type Card = {
  id: string;
  title: string;
  cover: string;
  href: string; // destino (ex.: /tips/futebol)
  sport: 'futebol' | 'tenis' | 'basquete' | 'esports';
  snippet?: string;
  date?: string;
};

const SAMPLE_CARDS: Card[] = [
  // FUTEBOL
  { id: 'f1', sport: 'futebol',  title: 'Palpite: Nice x Benfica',            cover: '/noticia3.jpg', href: '/tips/futebol',  snippet: 'Linhas e leitura de jogo.', date: 'Hoje' },
  { id: 'f2', sport: 'futebol',  title: 'Valor nas asiáticas (LaLiga)',       cover: '/noticia2.jpg', href: '/tips/futebol',  snippet: 'Quando a odd compensa.',    date: 'Hoje' },
  { id: 'f3', sport: 'futebol',  title: 'BTTS: critérios práticos',           cover: '/noticia3.jpg', href: '/tips/futebol',  snippet: 'Risco x recompensa.',       date: 'Amanhã' },
  { id: 'f4', sport: 'futebol',  title: 'Underdogs com valor',                cover: '/noticia2.jpg', href: '/tips/futebol',  snippet: 'Contexto & mercado.',       date: 'Amanhã' },
  { id: 'f5', sport: 'futebol',  title: 'BTTS: critérios práticos',           cover: '/noticia3.jpg', href: '/tips/futebol',  snippet: 'Risco x recompensa.',       date: 'Amanhã' },
  { id: 'f6', sport: 'futebol',  title: 'Underdogs com valor',                cover: '/noticia2.jpg', href: '/tips/futebol',  snippet: 'Contexto & mercado.',       date: 'Amanhã' },
  
  // TÉNIS
  { id: 't1', sport: 'tenis',    title: 'ATP: ritmo e matchup',               cover: '/noticia2.jpg', href: '/tips/tenis',    snippet: 'Piso e estilo de jogo.',    date: 'Hoje' },
  { id: 't2', sport: 'tenis',    title: 'WTA: quando a zebra vale',           cover: '/noticia3.jpg', href: '/tips/tenis',    snippet: 'Leitura do H2H.',           date: 'Hoje' },
  { id: 't3', sport: 'tenis',    title: 'Tie-break odds: variância',          cover: '/noticia2.jpg', href: '/tips/tenis',    snippet: 'Gestão de risco.',          date: 'Amanhã' },
  { id: 't4', sport: 'tenis',    title: 'Live trading no ATP 250',            cover: '/noticia3.jpg', href: '/tips/tenis',    snippet: 'Momentum e BP.',            date: 'Amanhã' },
  { id: 't5', sport: 'tenis',    title: 'Tie-break odds: variância',          cover: '/noticia2.jpg', href: '/tips/tenis',    snippet: 'Gestão de risco.',          date: 'Amanhã' },
  { id: 't6', sport: 'tenis',    title: 'Live trading no ATP 250',            cover: '/noticia3.jpg', href: '/tips/tenis',    snippet: 'Momentum e BP.',            date: 'Amanhã' },

  // BASQUETE
  { id: 'b1', sport: 'basquete', title: 'NBA: pace & eficiência',             cover: '/noticia3.jpg', href: '/tips/basquete', snippet: 'Over/Under com base.',      date: 'Hoje' },
  { id: 'b2', sport: 'basquete', title: 'ACB: value spots',                   cover: '/noticia2.jpg', href: '/tips/basquete', snippet: 'Back-to-back & viagens.',   date: 'Hoje' },
  { id: 'b3', sport: 'basquete', title: 'Defesa x ataque: ajuste de linha',   cover: '/noticia3.jpg', href: '/tips/basquete', snippet: 'Matchups chave.',           date: 'Amanhã' },
  { id: 'b4', sport: 'basquete', title: 'NBA: pace & eficiência',             cover: '/noticia3.jpg', href: '/tips/basquete', snippet: 'Over/Under com base.',      date: 'Hoje' },
  { id: 'b5', sport: 'basquete', title: 'ACB: value spots',                   cover: '/noticia2.jpg', href: '/tips/basquete', snippet: 'Back-to-back & viagens.',   date: 'Hoje' },
  { id: 'b6', sport: 'basquete', title: 'Defesa x ataque: ajuste de linha',   cover: '/noticia3.jpg', href: '/tips/basquete', snippet: 'Matchups chave.',           date: 'Amanhã' },

  // ESPORTS
  { id: 'e1', sport: 'esports',  title: 'CS: mapa e veto',                     cover: '/noticia2.jpg', href: '/tips/esports',  snippet: 'Como o veto muda tudo.',    date: 'Hoje' },
  { id: 'e2', sport: 'esports',  title: 'LoL: leitura de draft',               cover: '/noticia3.jpg', href: '/tips/esports',  snippet: 'Escala x early game.',      date: 'Hoje' },
  { id: 'e3', sport: 'esports',  title: 'Valo: economia & ultimates',          cover: '/noticia2.jpg', href: '/tips/esports',  snippet: 'Janelas de força.',         date: 'Amanhã' },
  { id: 'e4', sport: 'esports',  title: 'CS: mapa e veto',                     cover: '/noticia2.jpg', href: '/tips/esports',  snippet: 'Como o veto muda tudo.',    date: 'Hoje' },
  { id: 'e5', sport: 'esports',  title: 'LoL: leitura de draft',               cover: '/noticia3.jpg', href: '/tips/esports',  snippet: 'Escala x early game.',      date: 'Hoje' },
  { id: 'e6', sport: 'esports',  title: 'Valo: economia & ultimates',          cover: '/noticia2.jpg', href: '/tips/esports',  snippet: 'Janelas de força.',         date: 'Amanhã' },
];


/* ========================
   Página Tipster
======================== */
export default function TipsterProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  // Nome do tipster a partir do slug
  const tipsterName =
    decodeURIComponent(params.slug)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase()) || 'Tipster';

  const futebol  = SAMPLE_CARDS.filter((c) => c.sport === 'futebol');
  const tenis    = SAMPLE_CARDS.filter((c) => c.sport === 'tenis');
  const basquete = SAMPLE_CARDS.filter((c) => c.sport === 'basquete');
  const esports  = SAMPLE_CARDS.filter((c) => c.sport === 'esports');

  return (
    <main className="relative min-h-screen bg-[#1E1E1E] text-white">
      {/* marca d'água */}
      <div aria-hidden className="pointer-events-none absolute inset-0 select-none opacity-[0.06]">
        <div className="mx-auto max-w-7xl h-full px-4 grid grid-rows-3 items-center">
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
          <span className="text-[12rem] lg:text-[18rem] font-extrabold tracking-tighter">TIP</span>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-10 pb-14 ">
        {/* Cabeçalho do tipster */}
        <section className="relative rounded-xl ring-1 ring-white/10 shadow-xl overflow-hidden">
          {/* BG do cabeçalho (só aqui) */}
          <Image
            src="/B_tipsters.png"   // coloque o arquivo em /public/B_tipsters.png
            alt=""
            fill
            priority
            className="object-cover"
          />
          {/* overlay para leitura */}
          <div className="absolute inset-0 bg-[#333333]/80" />

          {/* Conteúdo do cabeçalho */}
          <div className="relative grid grid-cols-[140px_1fr] gap-4 p-4 md:grid-cols-[200px_1fr] md:p-6">
            {/* Foto do tipster (ajustada) */}
            <div className="relative h-[140px] w-[140px] md:h-[160px] md:w-[160px] rounded-lg overflow-hidden ring-1 ring-white/10 bg-white/5">
              <Image
                src="/user.png"
                alt={tipsterName}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Nome + atalhos + bio */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold">{tipsterName}</h1>
                <span className="text-[#ED4F00]">▸</span>
              </div>

              {/* Métricas com ícone de gráfico */}
              <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#ED4F00]" aria-hidden>
                    <path d="M3 3v18h18" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M7 15l4-5 3 3 5-7" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span className="opacity-70">Rácio de Acerto</span>
                  <span className="font-semibold text-[#ED4F00]">72%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="opacity-70">Retorno Médio</span>
                  <span className="font-semibold text-[#ED4F00]">40.37</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="opacity-70">Rácio de Acerto (últimos 10)</span>
                  <span className="font-semibold text-[#ED4F00]">70%</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="opacity-70">Retorno Médio (últimos 10)</span>
                  <span className="font-semibold text-[#ED4F00]">16.01</span>
                </div>
              </div>

              {/* divisor suave */}
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

              <p className="text-sm md:text-[15px] text-white/85 leading-relaxed">
                {tipsterName} compartilha palpites em quatro categorias. Arraste os cards
                no celular ou use as setas no desktop para navegar pelos carrosséis.
              </p>
            </div>
          </div>
        </section>

        {/* 4 carrosséis */}
        <TipsSection id="futebol"  title="Futebol"  items={futebol}  viewAllHref="/tips/futebol" />
        <TipsSection id="tenis"    title="Ténis"    items={tenis}    viewAllHref="/tips/tenis" />
        <TipsSection id="basquete" title="Basquete" items={basquete} viewAllHref="/tips/basquete" />
        <TipsSection id="esports"  title="eSports"  items={esports}  viewAllHref="/tips/esports" />
      </div>
    </main>
  );
}

/* ========================
   Seções + Carrossel
======================== */
function TipsSection({
  id,
  title,
  items,
  viewAllHref,
}: {
  id: string;
  title: string;
  items: Card[];
  viewAllHref: string;
}) {
  return (
    <section id={id} className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[15px] font-bold uppercase tracking-wide">{title}</h2>
          <span className="h-px w-24 bg-white/20" />
        </div>
        <Link href={viewAllHref} className="text-sm text-white/80 hover:text-white">
          Ver mais {title} →
        </Link>
      </div>

      <TipsCarouselRow
        items={items.map((c) => ({
          id: c.id,
          title: c.title,
          cover: c.cover,
          href: c.href,
          snippet: c.snippet,
          date: c.date,
          sport: c.sport,
        }))}
      />
    </section>
  );
}

function TipsCarouselRow({
  items,
}: {
  items: Array<Card>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  const scrollByCards = (dir: 'prev' | 'next') => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-card]');
    const step = card ? card.offsetWidth + 16 : 320; // 16px ≈ gap
    el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
  };

  // Atualiza o progresso ao rolar
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handle = () => {
      const total = el.scrollWidth - el.clientWidth;
      const pct = total > 0 ? (el.scrollLeft / total) * 100 : 0;
      setProgress(pct);
    };

    handle(); // calcula ao montar
    el.addEventListener('scroll', handle, { passive: true });
    return () => el.removeEventListener('scroll', handle);
  }, []);

  const SPORT_LABEL: Record<Card['sport'], string> = {
    futebol: 'Futebol',
    tenis: 'Ténis',
    basquete: 'Basquete',
    esports: 'eSports',
  };

  return (
    <div className="relative">
      {/* setas (desktop) */}
      <button
        type="button"
        onClick={() => scrollByCards('prev')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden md:grid place-items-center rounded-full bg-black/50 hover:bg-black/70 w-9 h-9 ring-1 ring-white/20 shadow-md transition
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED4F00]/70"
        aria-label="Anterior"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scrollByCards('next')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:grid place-items-center rounded-full bg-black/50 hover:bg-black/70 w-9 h-9 ring-1 ring-white/20 shadow-md transition
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ED4F00]/70"
        aria-label="Próximo"
      >
        ›
      </button>

      {/* faixa rolável */}
      <div
        ref={ref}
        className="relative scroll-smooth snap-x snap-mandatory overflow-x-auto
                   -mx-4 pl-4 pr-6 md:mx-0 md:px-0
                   touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex gap-3 sm:gap-4">
          {items.map((card) => (
            <article
              key={card.id}
              data-card
              className="group snap-center
                         min-w-[82%] max-w-[82%] sm:min-w-[60%] sm:max-w-[60%] md:min-w-[300px] md:max-w-[300px]
                         overflow-hidden rounded-xl bg-[#1B1F2A] ring-1 ring-white/10
                         hover:ring-white/20 hover:shadow-lg hover:-translate-y-0.5 transition
                         focus-within:ring-white/30 focus-within:shadow-lg"
            >
              {/* imagem */}
              <div className="relative aspect-[16/10] will-change-transform">
                <Image
                  src={card.cover}
                  alt={card.title}
                  fill
                  sizes="(min-width:1024px) 300px, 260px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105 select-none will-change-transform"
                  priority
                />
                {/* etiqueta: triângulo + pill */}
                <div className="absolute top-3 left-0 flex items-center drop-shadow">
                  <span
                    aria-hidden
                    className="-ml-2 h-0 w-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-[#ED4F00]"
                  />
                  <span className="rounded-sm bg-blue-700/90 backdrop-blur px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold">
                    {SPORT_LABEL[card.sport]}
                  </span>
                </div>
              </div>

              {/* texto */}
              <div className="p-3">
                <h3 className="line-clamp-2 text-[15px] sm:text-sm font-semibold">{card.title}</h3>
                <p className="mt-1 text-xs text-white/60">
                  {(card.date ?? '—') + (card.snippet ? ' • ' + card.snippet : '')}
                </p>

                <div className="mt-3">
                  <Link
                    href={card.href}
                    className="inline-block rounded bg-[#ED4F00] px-3 py-1.5 text-xs font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ED4F00] focus-visible:ring-offset-[#1E1E1E] transition"
                  >
                    Ver Mais
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Barra de feedback (mobile) */}
      <div className="mt-3 h-1 w-full bg-white/10 rounded-full overflow-hidden sm:hidden">
        <div
          className="h-full bg-[#ED4F00] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
