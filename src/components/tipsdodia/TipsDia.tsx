'use client'

import Image from 'next/image'
import Link from 'next/link'
import TipsDiaDesktop from './desktop/TipsDiaDesktop'
import TipsDiaMobile from './mobile/TipsDiaMobile'
import type { TipCard } from './types'

const MAX_CARDS = 6

// Se quiser, pode apagar o mock — fica só como fallback
const mockTips: TipCard[] = []

const TOP_LINKS = [
  { label: 'Futebol', href: '/tips/futebol' },
  { label: 'Ténis', href: '/tips/tenis' },
  { label: 'Basquete', href: '/tips/basquete' },
  { label: 'E-sports', href: '/tips/esports' },
  { label: 'Ver todas', href: '/tips' },
]

export default function TipsDia({ tips }: { tips?: TipCard[] }) {
  const items = (tips?.length ? tips : mockTips).slice(0, MAX_CARDS)

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      {/* BG desktop decor */}
      <div className="pointer-events-none absolute left-0 top-4 hidden md:block opacity-90">
        <Image
          src="/tips/TIPS_menu.png"
          alt=""
          width={1000}
          height={300}
          className="h-auto w-[1200px] object-contain"
          sizes="520px"
          priority
        />
      </div>

      {/* BG mobile */}
      <div className="md:hidden absolute inset-0 -z-10 pointer-events-none select-none">
        <Image
          src="/tips/TIPS_menu.png"
          alt="Tips BG"
          fill
          sizes="100vw"
          className="object-contain object-center opacity-10 scale-[1.35] translate-y-6"
          priority
        />
      </div>

      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-3xl font-bold text-white">Tips do Dia</h2>

          {/* Botões "Ver mais" por categoria (topo) */}
          <div className="flex flex-wrap items-center gap-2">
            {TOP_LINKS.map((b) => (
              <Link
                key={b.label}
                href={b.href}
                className="inline-flex items-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-3 py-1.5 transition"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden md:block">
          <TipsDiaDesktop tips={items} />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <TipsDiaMobile tips={items} />
        </div>
      </div>
    </section>
  )
}
