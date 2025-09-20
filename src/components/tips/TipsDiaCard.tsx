'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { TipCard } from './types';

type Props = { tip: TipCard; className?: string };

function toSportSlug(s?: string) {
  const x = (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (x.includes('esport')) return 'esports';
  if (x.startsWith('basq') || x.includes('basket')) return 'basquete';
  if (x.startsWith('ten')) return 'tenis';
  return 'futebol';
}

function prettySportName(slug: string) {
  if (slug === 'esports') return 'E-sports';
  if (slug === 'basquete') return 'Basquete';
  if (slug === 'tenis') return 'Ténis';
  return 'Futebol';
}

export default function TipsDiaCard({ tip, className }: Props) {
  const anyTip = tip as any;

  const sport = toSportSlug(anyTip.sport ?? anyTip.categoria);
  const title = anyTip.titulo ?? tip.title ?? 'Tip';
  const resumo = anyTip.resumo ?? anyTip.excerpt ?? '';
  const categoria = anyTip.categoria ?? prettySportName(sport);
  const image = anyTip.image ?? anyTip.cover ?? '/futebol.png';

  const postHref = tip.href ?? tip.hrefPost ?? (tip.id ? `/tips/${sport}/${tip.id}` : `/tips/${sport}`);

  return (
    <Card className={['overflow-hidden bg-[#3E3E3E] border-white/10 shadow-xl backdrop-blur-sm p-3', className || ''].join(' ')}>
      {/* Imagem + badge */}
      <div className="relative w-full h-44 md:h-60">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width:768px) 90vw, 33vw"
          className="object-cover rounded"
          priority
        />
        <div className="absolute top-2 left-0 flex items-center">
          <span
            aria-hidden
            className="w-0 h-0 border-y-[10px] border-y-transparent border-r-[12px] rounded-lg border-r-orange-500 -ml-2"
          />
          <span className="rounded-sm bg-blue-700 px-3 py-1 text-xs font-semibold text-white shadow">
            {categoria}
          </span>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-white text-[16px] leading-snug line-clamp-2 min-h-[44px]">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm leading-relaxed text-gray-200 line-clamp-3 min-h-[66px]">
          {resumo}
        </p>

        {(anyTip.autorLinha ?? tip.author) && (
          <p className="text-[12px] text-gray-400 mt-2">
            {anyTip.autorLinha ?? tip.author}
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        <Link
          href={postHref}
          className="inline-flex items-center rounded bg-[#ED4F00] hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition"
        >
          Ver mais
        </Link>
      </CardFooter>
    </Card>
  );
}
