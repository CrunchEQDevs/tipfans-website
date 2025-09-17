'use client';

type RankingItem = {
  pos: number;
  nome: string;
  coins: number;
};

const rankingTop3: RankingItem[] = [
  { pos: 1, nome: 'Nome de utilizador', coins: 1000 },
  { pos: 2, nome: 'Nome de utilizador', coins: 500 },
  { pos: 3, nome: 'Nome de utilizador', coins: 200 },
];

export default function RankingTorneios() {
  return (
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

              <div className="shrink-0 rounded-lg border border-white/10 bg-white/10 px-2 py-1 text-[11px] text-white/80">
                TOP
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400 transition-transform duration-300 group-hover:scale-x-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}
