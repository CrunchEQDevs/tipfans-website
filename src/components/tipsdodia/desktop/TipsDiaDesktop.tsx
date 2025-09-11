'use client';
import TipsDiaCardDesk from "./tipsdiacardDesk";
import type { TipCard } from "../types";

export default function TipsDiaDesktop({ tips }: { tips: TipCard[] }) {
  if (!tips?.length) {
    return <div className="text-gray-300">Sem posts publicados ainda.</div>;
  }

  return (
    <div className="w-full grid gap-6 md:grid-cols-2 lg:grid-cols-3 ">
      {tips.map((tip) => (
        <TipsDiaCardDesk key={tip.id} tip={tip} />
      ))}
    </div>
  );
}
