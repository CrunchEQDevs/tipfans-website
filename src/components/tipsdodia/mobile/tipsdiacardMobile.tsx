'use client';
import Image from "next/image";
import Link from "next/link";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import type { TipCard } from "../types";

export default function TipsDiaCardMobile({ tip }: { tip: TipCard }) {
  return (
    <Card className="overflow-hidden border-white/10 bg-[#3E3E3E] shadow-xl backdrop-blur-sm">
      <CardHeader className="pb-0">
        <div className="flex gap-3">
          <div className="relative h-24 w-32 shrink-0 rounded-md overflow-hidden ring-1 ring-white/15 bg-black/5">
            <Image
              src={tip.image}
              alt={tip.titulo}
              fill
              sizes="(max-width:768px) 40vw, 20vw"
              className="object-cover"
              priority
            />
            <div className="absolute top-1 left-0 flex items-center">
              <span
                aria-hidden
                className="w-0 h-0 border-y-[8px] border-y-transparent border-r-[10px] border-r-orange-500 -ml-2"
              />
              <span className="rounded-sm bg-blue-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
                {tip.categoria}
              </span>
            </div>
          </div>

          <div className="flex-1">
            <CardTitle className="text-white text-[15px] leading-snug">
              {tip.titulo}
            </CardTitle>

          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        <p className="text-sm leading-relaxed text-gray-200">{tip.resumo}</p>
        <p className="text-[12px] text-gray-400 mt-1">{tip.autorLinha}</p>
      </CardContent>

      <CardFooter className="pt-0">
        <Link
          href={tip.href}
          className="inline-flex items-center gap-2 bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/60 rounded"
        >
          Ver Mais
        </Link>
      </CardFooter>
    </Card>
  );
}
