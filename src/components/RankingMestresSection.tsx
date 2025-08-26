// src/components/RankingMestresSection.tsx
import Image from 'next/image';

type RankingItem = {
  pos: number;
  nome: string;
  coins: number;
  bannerSrc: string; // ✅ imagem da faixa/chevron
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
  { pos: 1, nome: 'Nome de utilizador', coins: 1000, bannerSrc: '/Rectangle.png' },
  { pos: 2, nome: 'Nome de utilizador', coins: 500,  bannerSrc: '/Rectangle.png' },
  { pos: 3, nome: 'Nome de utilizador', coins: 200,  bannerSrc: '/Rectangle.png' },
];

const mestres: Mestre[] = [
  { nome: 'Amanda Vidigal', modalidade: 'Futebol', acertoPct: 75, ultimas: 20, seguidores: 150 },
  { nome: 'Nuno Cunha', modalidade: 'Ténis', acertoPct: 80, ultimas: 20, seguidores: 180 },
  { nome: 'Domenico Pepe', modalidade: 'Basquetebol', acertoPct: 70, ultimas: 20, seguidores: 160 },
];

export default function RankingMestresSection() {
  return (
    <section className="bg-[#1E1E1E] py-6">
      <div className="container mx-auto grid gap-6 md:grid-cols-2">

        {/* ===== Quadrado 1: Ranking ===== */}
        <div className=" bg-[#3E3E3E] p-6 h-[450px] md:h-[450px] flex flex-col">
          <h3 className="text-2xl font-extrabold text-white mb-3 mt-4">Ranking dos Torneios</h3>

          <div className="flex-1 grid content-center gap-3">
            {rankingTop3.map((item) => (
              <div
                key={item.pos}
                className="relative h-24 rounded-lg bg-gray-600/50 border border-gray-700 pl-[150px] pr-4 flex items-center justify-between overflow-hidden"
              >
                {/* Faixa da esquerda (imagem + número) */}
                <div className="absolute inset-y-0 left-0 w-[150px] h-30">
                  <div className="relative h-full w-full">
                    <Image
                      src={item.bannerSrc}
                      alt={`Faixa posição ${item.pos}`}
                      fill
                      className="object-cover"
                      sizes="150px"
                      priority={item.pos === 1}
                    />
                    <p className="absolute left-10 top-1/2 -translate-y-1/2 font-extrabold text-4xl text-white">
                      {String(item.pos).padStart(2, '0')}
                    </p>
                  </div>
                </div>

                <p className="flex-1 text-sm text-center text-white">{item.nome}</p>
                <p className="text-xs text-gray-200 shrink-0">
                  <span className="font-semibold">{item.coins}</span>{' '}
                  <span className="text-orange-400 font-semibold">Coins</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Quadrado 2: Mestres ===== */}
        <div className="bg-[#3E3E3E] p-6 h-[450px] md:h-[450px] flex flex-col">
          <h3 className="text-2xl font-extrabold text-white mb-3 mt-4">Os Mestres das Tips</h3>

          <div className="flex-1 grid content-center gap-5">
            {mestres.map((m, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="relative w-24 h-24 rounded-md bg-gray-300 text-gray-700 flex items-center justify-center text-[10px] overflow-hidden">
                  {m.avatar ? (
                    <Image src={m.avatar} alt={m.nome} fill className="object-cover" />
                  ) : (
                    'foto'
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-base font-bold text-white">{m.nome}</p>
                  <p className="text-sm text-gray-300">{m.modalidade}</p>
                  <p className="mt-1 text-sm text-gray-200">
                    <span className="text-orange-400 font-semibold">+{m.acertoPct}%</span>{' '}
                    de acerto nas últimas {m.ultimas} Tips
                  </p>
                  <p className="text-sm text-gray-200">
                    <span className="text-orange-400 font-semibold">+{m.seguidores}</span>{' '}
                    seguidores
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
