'use client';

import TipsDiaCard from '../TipsDiaCard';
import type { TipCard } from '../types';

type Props = { tips: TipCard[] };

export default function TipsDiaMobile({ tips }: Props) {
  const items = (tips || []).slice(0, 6);

  if (!items.length) {
    return <div className="text-gray-300">Sem tips publicadas ainda.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((tip) => (
        <TipsDiaCard key={tip.id} tip={tip} />
      ))}
    </div>
  );
}
