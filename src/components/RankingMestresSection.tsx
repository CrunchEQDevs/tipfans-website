// src/components/RankingMestresSection.tsx
'use client';

import Image from 'next/image';

type RankingItem = {
  pos: number;
  nome: string;
  coins: number;
  bannerSrc?: string;
};

type Mestre = {
  nome: string;
  modalidade: string;
  acertoPct: number;
  ultimas: number;
  seguidores: number;
  avatar?: string;
};

const rankingTop3: RankingItem[] = [
  { pos: 1, nome: 'Nome de utilizador', coins: 1000 },
  { pos: 2, nome: 'Nome de utilizador', coins: 500 },
  { pos: 3, nome: 'Nome de utilizador', coins: 200 },
];

const mestres: Mestre[] = [
  { nome: 'Amanda Vidigal', modalidade: 'Futebol', acertoPct: 75, ultimas: 20, seguidores: 150 },
  { nome: 'Nuno Cunha', modalidade: 'Ténis', acertoPct: 80, ultimas: 20, seguidores: 180 },
  { nome: 'Domenico Pepe', modalidade: 'Basquetebol', acertoPct: 70, ultimas: 20, seguidores: 160 },
];

export default function RankingMestresSection() {
  return (
    <section className="relative w-full bg-[#1E1E1E] py-10">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Ranking & Mestres
          </h2>
        </div>

        {/* Cartões */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ===== Ranking dos Torneios ===== */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 text-center">
            <div className="border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-bold text-white">Ranking dos Torneios</h3>
              <p className="mt-1 text-sm text-white/60">
                Top 3 jogadores por moedas acumuladas.
              </p>
            </div>

            <ul className="p-4 sm:p-6 space-y-4">
              {rankingTop3.map((item) => (
                <li
                  key={item.pos}
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5"
                >
                  <div className="flex items-center gap-4 p-4">
                    {/* faixa/número */}
                    <div className="relative shrink-0">
                      <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white font-extrabold text-2xl leading-none shadow-lg">
                        {String(item.pos).padStart(2, '0')}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-white font-semibold">{item.nome}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="font-semibold text-white">
                          {item.coins.toLocaleString('pt-PT')}
                        </span>
                        <span className="text-orange-400 font-semibold">Coins</span>
                      </div>
                    </div>

                    {/* selo premium */}
                    <div className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/80">
                      TOP
                    </div>
                  </div>

                  {/* linha brilho ao hover */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 transition-transform duration-300 group-hover:scale-x-100" />
                </li>
              ))}
            </ul>
          </div>

          {/* ===== Os Mestres das Tips ===== */}
          <div className="rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl shadow-2xl shadow-black/30 text-center">
            <div className="border-b border-white/10 px-6 py-5">
              <h3 className="text-xl font-bold text-white">Os Mestres das Tips</h3>
              <p className="mt-1 text-sm text-white/60">
                Performance nas últimas {mestres[0].ultimas} tips.
              </p>
            </div>

            <ul className="p-4 sm:p-6 space-y-5">
              {mestres.map((m, i) => (
                <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start gap-4">
                    {/* avatar */}
<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white/10">
  <Image
    src={m.avatar ?? '/user.png'}   // ← usa o avatar, senão cai no /user.png
    alt={m.nome}
    fill
    className="object-cover"
    sizes="64px"
  />
</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="truncate text-white font-semibold">{m.nome}</p>
                        <span className="rounded-md border border-white/10 bg-white/10 px-2 py-[2px] text-[11px] text-white/80">
                          {m.modalidade}
                        </span>
                      </div>

                      {/* métrica + barra */}
                      <div className="mt-2 text-sm text-white/80">
                        <span className="text-orange-400 font-semibold">+{m.acertoPct}%</span>{' '}
                        de acerto nas últimas {m.ultimas} Tips
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded bg-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                          style={{ width: `${Math.min(100, m.acertoPct)}%` }}
                        />
                      </div>

                      <div className="mt-2 text-[13px] text-white/70">
                        <span className="text-orange-400 font-semibold">+{m.seguidores}</span>{' '}
                        seguidores
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Ornamento leve */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-24 mx-auto h-48 max-w-4xl rounded-full bg-gradient-to-r from-orange-500/10 via-white/5 to-orange-500/10 blur-3xl"
      />
    </section>
  );
}
