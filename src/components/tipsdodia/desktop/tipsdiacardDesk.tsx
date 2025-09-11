'use client';
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TipCard } from "../types";

export default function TipsDiaCardDesk({ tip }: { tip: TipCard }) {
  return (
    <Card className="overflow-hidden  bg-[#3E3E3E] shadow-xl backdrop-blur-sm border-none ">
      <div className="relative w-full h-80 overflow-hidden  ">
        <Image
          src={tip.image}
          alt={tip.titulo}
          fill
          sizes="(max-width:1024px) 100vw, 33vw"
          className="object-cover p-2 "
          priority
        />

        {/* Categoria */}
        <div className="absolute top-2 left-0 flex items-center">
          <span
            aria-hidden
            className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] border-r-orange-500 -ml-2"
          />
          <span className="rounded-sm bg-blue-700 px-3 py-1 text-xs font-semibold text-white shadow">
            {tip.categoria}
          </span>
        </div>
      </div>

      <CardHeader className="pb-1">
        <CardTitle className="text-white text-base leading-snug">
          {tip.titulo}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        <p className="text-sm leading-relaxed text-gray-200">{tip.resumo}</p>
        <p className="text-[12px] text-gray-400">{tip.autorLinha}</p>
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
