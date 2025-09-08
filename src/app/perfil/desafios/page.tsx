export const metadata = {
  title: 'Meus desafios',
};

export default function DesafiosPage() {
  return (
    <div className="px-4">
      <div className="mx-auto w-full md:w-4/6 max-w-6xl rounded-xl border border-white/10 bg-[#1E1E1E] p-6 text-gray-200 text-center">
        <h2 className="text-sm font-semibold text-gray-100 mb-2">Meus desafios</h2>
        <p className="text-xs text-gray-400 mb-4">
          Aqui você verá seus desafios ativos, concluídos e o progresso.
        </p>

        {/* TODO: plugue sua lista real de desafios aqui */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <h3 className="text-sm font-semibold">Desafio semanal</h3>
            <p className="text-xs text-gray-400 mt-1">Conclua 5 tips nesta semana.</p>
            <div className="mt-3 h-2 bg-gray-700 rounded">
              <div className="h-full bg-orange-600 rounded" style={{ width: '40%' }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-300">2/5 concluídas</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <h3 className="text-sm font-semibold">Maratona de posts</h3>
            <p className="text-xs text-gray-400 mt-1">Publique 10 conteúdos no mês.</p>
            <div className="mt-3 h-2 bg-gray-700 rounded">
              <div className="h-full bg-orange-600 rounded" style={{ width: '70%' }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-300">7/10 concluídos</p>
          </div>

          <div className="rounded-lg border border-white/10 bg-gray-800/60 p-4">
            <h3 className="text-sm font-semibold">Meta de interação</h3>
            <p className="text-xs text-gray-400 mt-1">Receba 50 reações em uma semana.</p>
            <div className="mt-3 h-2 bg-gray-700 rounded">
              <div className="h-full bg-orange-600 rounded" style={{ width: '15%' }} />
            </div>
            <p className="mt-2 text-[11px] text-gray-300">7/50 reações</p>
          </div>
        </div>
      </div>
    </div>
  );
}
