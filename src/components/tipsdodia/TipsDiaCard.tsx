'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import type { TipCard } from './types'

type Props = { tip: TipCard; className?: string }

export default function TipsDiaCard({ tip, className }: Props) {
  return (
    <Card className={['overflow-hidden bg-[#3E3E3E] border-white/10 shadow-xl backdrop-blur-sm p-3', className || ''].join(' ')}>
      {/* Imagem + badge */}
      <div className="relative w-full h-44 md:h-60">
        <Image
          src={tip.image}
          alt={tip.titulo}
          fill
          sizes="(max-width:768px) 90vw, 33vw"
          className="object-cover"
          priority
        />
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

      <CardHeader className="pb-2">
        <CardTitle className="text-white text-[16px] leading-snug line-clamp-2 min-h-[44px]">
          {tip.titulo}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-gray-200 line-clamp-3 min-h-[66px]">
          {tip.resumo}
        </p>

        {tip.autorLinha && (
          <p className="text-[12px] text-gray-400 mt-2">
            {tip.autorLinha}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {/* Ler matéria */}
    

        {/* Ver mais da categoria */}
        <Link
          href={tip.hrefPost}
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 font-semibold transition"
        >
          Ver mais
          <span className="text-2xl leading-none">›</span>
        </Link>

      </CardFooter>
    </Card>
  )
}
