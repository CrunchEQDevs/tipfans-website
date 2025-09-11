'use client';
import TipsDiaCardMobile from "./tipsdiacardMobile";
import type { TipCard } from "../types";

export default function TipsDiaMobile({ tips }: { tips: TipCard[] }) {
  if (!tips?.length) {
    return <div className="text-gray-300">Sem posts publicados ainda.</div>;
  }

  return (
    <div className="grid gap-4">
      {tips.map((tip) => (
        <TipsDiaCardMobile key={tip.id} tip={tip} />
      ))}
    </div>
  );
}
