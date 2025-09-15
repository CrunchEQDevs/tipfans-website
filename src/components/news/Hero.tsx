'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { HiOutlinePlay } from 'react-icons/hi2'
import type { NewsCard } from './types'

const FALLBACK_NEWS: NewsCard[] = [
  {
    id: 'f1',
    categoria: 'Futebol',
    categorySlug: 'futebol',
    categoryLink: '/latest/futebol',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Redação · 20 Maio 2025',
    data: '20 Maio 2025',
    image: '/noticia1.jpg',
    hrefPost: '/latest/futebol',
  },
  {
    id: 'f2',
    categoria: 'Futebol',
    categorySlug: 'futebol',
    categoryLink: '/latest/futebol',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Redação · 22 Maio 2025',
    data: '22 Maio 2025',
    image: '/noticia2.jpg',
    hrefPost: '/latest/futebol',
  },
  {
    id: 'f3',
    categoria: 'Futebol',
    categorySlug: 'futebol',
    categoryLink: '/latest/futebol',
    titulo: 'Palpite, odds e dicas de apostas Nice x Benfica 06/08/2025',
    resumo: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
    autorLinha: 'Por Redação · 27 Maio 2025',
    data: '27 Maio 2025',
    image: '/noticia3.jpg',
    hrefPost: '/latest/futebol',
  },
]

async function fetchJson(url: string) {
  const u = new URL(url, window.location.origin)
  u.searchParams.set('_', String(Date.now()))
  const r = await fetch(u.toString(), { cache: 'no-store' })
  const ct = r.headers.get('content-type') || ''
  if (!ct.includes('application/json')) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

export default function Hero() {
  const [items, setItems] = useState<NewsCard[]>(FALLBACK_NEWS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setLoading(true)
        const json = await fetchJson('/api/wp/news?sport=futebol&per_page=3')
        const list: NewsCard[] = Array.isArray(json?.items) ? json.items : []
        if (!canceled && list.length) {
          // garante 3 cards
          const out = [...list]
          for (let i = list.length; i < 3; i++) out.push(FALLBACK_NEWS[i])
          setItems(out.slice(0, 3))
        }
      } catch {
        /* usa fallback */
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [])

  const news = useMemo(
    () => (items.length >= 3 ? items.slice(0, 3) : FALLBACK_NEWS),
    [items]
  )

  return (
    <section className="relative w-full bg-[#1E1E1E] py-10 overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-4 hidden md:block opacity-90">
        <Image
          src="/NEWS.png"
          alt=""
          width={1000}
          height={300}
          className="h-auto w-[1200px] object-contain"
          sizes="520px"
          priority
        />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Últimas</h1>
          <Link
            href="/latest/futebol"
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Ver Mais
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.12fr_1fr]">
          {/* ESQUERDA */}
          <article className="overflow-hidden">
            <div className="relative h-[220px] sm:h-[360px] md:h-[400px] lg:h-[430px]">
              <Image
                src={news[0].image ?? '/noticia1.jpg'}
                alt={news[0].titulo}
                fill
                className="object-cover object-center rounded-xl"
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
                priority
              />
            </div>

            <div className="space-y-3 p-5">
              <p className="text-[11px] sm:text-[12px] text-gray-400">
                <span className="font-semibold text-orange-400">{news[0].categoria}</span> | {news[0].data}
              </p>
              <h2 className="text-[15px] sm:text-lg md:text-xl font-semibold text-white leading-snug">
                {news[0].titulo}
              </h2>
              <p className="text-[13px] sm:text-sm text-gray-300">{news[0].resumo}</p>
              <Link
                href={news[0].hrefPost}
                className="inline-block bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 mb-10"
              >
                Ver mais
              </Link>
            </div>
          </article>

          {/* DIREITA */}
          <div className="grid grid-rows-2 gap-6">
            {[news[1], news[2]].map((item, idx) => (
              <article key={String(item.id)} className="overflow-hidden rounded-xl border border-gray-800/40">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="relative w-full md:w-[46%] lg:w-[42%] h-48 sm:h-56 md:h-[240px] lg:h-[260px]">
                    <Image
                      src={item.image ?? '/noticia2.jpg'}
                      alt={item.titulo}
                      fill
                      className="object-cover object-center rounded-xl"
                      sizes="(max-width: 768px) 100vw, 320px"
                      priority={idx === 0}
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-gray-400">
                        <span className="font-semibold text-orange-400">{item.categoria}</span> | {item.data}
                      </p>
                      <h3 className="mt-1 text-[15px] sm:text-base font-semibold text-white leading-snug">
                        {item.titulo}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-300">{item.resumo}</p>
                    </div>
                    <div className="pt-3">
                      <Link
                        href={item.hrefPost}
                        className="inline-block bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        Ver mais
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
