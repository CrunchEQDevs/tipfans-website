'use client';

import { useMemo, useState } from 'react';
import { FaGift, FaClock, FaCheckCircle, FaHistory } from 'react-icons/fa';

type Oferta = {
  id: number;
  titulo: string;
  descricao: string;
  data: string; // ISO
  status: 'ativa' | 'expirada';
};

const ofertasSimuladas: Oferta[] = [
  {
    id: 1,
    titulo: 'Desafio Premier League',
    descricao: 'Aposte com os melhores resultados da rodada.',
    data: '2025-08-01',
    status: 'ativa',
  },
  {
    id: 2,
    titulo: 'Bônus de Boas-Vindas',
    descricao: 'Receba 50 tokens na sua primeira participação.',
    data: '2025-07-28',
    status: 'expirada',
  },
];

type Filtro = 'todas' | 'ativas' | 'expiradas';

const statusStyles: Record<
  Oferta['status'],
  { badge: string; dot: string; chip: string; button: string; buttonDisabled?: string }
> = {
  ativa: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30',
    dot: 'bg-emerald-500',
    chip: 'text-emerald-600 dark:text-emerald-300',
    button:
      'bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-emerald-400',
  },
  expirada: {
    badge: 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-white/10 dark:text-gray-300 dark:ring-white/15',
    dot: 'bg-gray-400',
    chip: 'text-gray-500 dark:text-gray-400',
    button:
      'bg-gray-200 text-gray-700 hover:bg-gray-200 cursor-not-allowed dark:bg-white/10 dark:text-gray-300',
    buttonDisabled: 'opacity-80',
  },
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

export default function OfertasAplicadas() {
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const { ativas, expiradas } = useMemo(() => {
    const a = ofertasSimuladas.filter((o) => o.status === 'ativa');
    const e = ofertasSimuladas.filter((o) => o.status === 'expirada');
    return { ativas: a, expiradas: e };
  }, []);

  const listagem = useMemo(() => {
    if (filtro === 'ativas') return ativas;
    if (filtro === 'expiradas') return expiradas;
    return ofertasSimuladas;
  }, [filtro, ativas, expiradas]);

  return (
    <div className="w-full">
      {/* Barra de topo com filtros e contagem */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow">
            <FaGift />
          </span>
          <div>
            <h3 className="text-base font-semibold">Minhas ofertas</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {ativas.length} ativas • {expiradas.length} expiradas
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10">
          {([
            { id: 'todas', label: 'Todas', icon: <FaHistory className="text-xs" /> },
            { id: 'ativas', label: 'Ativas', icon: <FaCheckCircle className="text-xs" /> },
            { id: 'expiradas', label: 'Expiradas', icon: <FaClock className="text-xs" /> },
          ] as const).map((opt) => {
            const active = filtro === (opt.id as Filtro);
            return (
              <button
                key={opt.id}
                onClick={() => setFiltro(opt.id as Filtro)}
                className={[
                  'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10',
                ].join(' ')}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista / Grid */}
      {listagem.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-600 dark:border-white/20 dark:bg-white/5 dark:text-gray-300">
          Não há ofertas neste filtro.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {listagem.map((oferta) => {
            const s = statusStyles[oferta.status];
            return (
              <article
                key={oferta.id}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-white/5"
              >
                {/* badge de status */}
                <span
                  className={[
                    'absolute right-3 top-3 inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs ring-1',
                    s.badge,
                  ].join(' ')}
                >
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {oferta.status === 'ativa' ? 'Ativa' : 'Expirada'}
                </span>

                <h4 className="mb-1 line-clamp-1 text-lg font-semibold">
                  {oferta.titulo}
                </h4>
                <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                  {oferta.descricao}
                </p>

                <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <FaClock />
                  Aplicada em {formatDate(oferta.data)}
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${s.chip}`}>
                    {oferta.status === 'ativa'
                      ? 'Benefícios ativos'
                      : 'Período encerrado'}
                  </span>

                  <button
                    disabled={oferta.status === 'expirada'}
                    className={[
                      'rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2',
                      s.button,
                      oferta.status === 'expirada' ? s.buttonDisabled : '',
                    ].join(' ')}
                    onClick={() => alert(`Detalhes da oferta #${oferta.id}`)}
                  >
                    {oferta.status === 'ativa' ? 'Ver detalhes' : 'Indisponível'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
