'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// ---------- Tipos ----------
type TipItem = {
  id: string;
  title: string;
  sport?: string;
  league?: string;
  teams?: string;
  pick?: string;
  odds?: string | number;
  author?: string;
  image?: string;
  createdAt?: string;
};

// ---------- Config ----------
const WP_TIPS_ENDPOINT = '/api/wp/tips/subs';

// ---------- Fallback ----------
const FALLBACK_TIPS: TipItem[] = Array.from({ length: 16 }, (_, i) => ({
  id: String(i + 1),
  title: `Tip da comunidade #${i + 1}`,
  author: 'Utilizador',
  sport: ['Futebol', 'Ténis', 'Basquete'][i % 3],
  league: 'Liga Exemplo',
  teams: 'Time A vs Time B',
  pick: 'Vitória Time A',
  odds: (1.5 + i * 0.1).toFixed(2),
  createdAt: '2025-08-19',
}));

export default function TipsUtilizadoresContent() {
  const searchParams = useSearchParams();
  const [tips, setTips] = useState<TipItem[]>([]);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const res = await fetch(WP_TIPS_ENDPOINT);
        if (!res.ok) throw new Error('Erro ao buscar tips');
        const data = await res.json();
        setTips(data || FALLBACK_TIPS);
      } catch (e) {
        console.error('⚠️ Fallback para tips locais', e);
        setTips(FALLBACK_TIPS);
      }
    };

    fetchTips();
  }, []);

  const filteredTips = useMemo(() => {
    const sport = searchParams.get('sport');
    if (!sport) return tips;
    return tips.filter((tip) => tip.sport?.toLowerCase() === sport.toLowerCase());
  }, [tips, searchParams]);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Tips dos Utilizadores</h1>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTips.map((tip) => (
          <article
            key={tip.id}
            className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow hover:shadow-md transition"
          >
            <h2 className="font-semibold text-lg">{tip.title}</h2>
            <p className="text-sm opacity-70">
              {tip.teams} — {tip.league}
            </p>
            <p className="mt-2">
              <span className="font-medium">Pick:</span> {tip.pick} ({tip.odds})
            </p>
            <p className="text-xs opacity-60 mt-1">
              Por {tip.author} em {tip.createdAt}
            </p>
            <Link
              href={`/tips/${tip.id}`}
              className="inline-block mt-3 text-indigo-600 hover:underline"
            >
              Ver mais →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
