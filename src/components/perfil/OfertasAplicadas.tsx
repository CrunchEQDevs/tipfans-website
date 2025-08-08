'use client';

type Oferta = {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
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

export default function OfertasAplicadas() {
  return (
    <div className="space-y-4">
      {ofertasSimuladas.map((oferta) => (
        <div
          key={oferta.id}
          className={`p-4 border rounded-lg shadow transition 
          ${oferta.status === 'ativa' ? 'border-green-500 bg-green-50 dark:bg-green-900' : 'border-gray-400 bg-gray-100 dark:bg-gray-700'}`}
        >
          <h3 className="text-xl font-bold">{oferta.titulo}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{oferta.descricao}</p>
          <p className="text-xs mt-2">
            📅 Aplicada em: {new Date(oferta.data).toLocaleDateString()}
          </p>
          <p className="text-xs font-semibold mt-1">
            {oferta.status === 'ativa' ? '🟢 Ativa' : '⚪ Expirada'}
          </p>
        </div>
      ))}
    </div>
  );
}
