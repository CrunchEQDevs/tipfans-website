'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { HiOutlinePlay } from 'react-icons/hi2'
import type { NewsCard } from './types'

async function fetchJson(url: string) {
  const u = new URL(url, window.location.origin)
  u.searchParams.set('_', String(Date.now()))
  const r = await fetch(u.toString(), { cache: 'no-store' })
  const ct = r.headers.get('content-type') || ''
  if (!ct.includes('application/json')) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

/* SKELETONS */
function BigSkeleton() {
  return (
    <article className="overflow-hidden">
      <div className="relative h-[220px] sm:h-[360px] md:h-[400px] lg:h-[430px]">
        <div className="h-full w-full rounded-xl bg-white/10 animate-pulse" />
      </div>
      <div className="space-y-3 p-5">
        <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
        <div className="h-5 w-2/3 bg-white/10 rounded animate-pulse" />
        <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
        <div className="h-8 w-28 bg-white/10 rounded animate-pulse" />
      </div>
    </article>
  )
}

function SmallSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border ">
      <div className="flex flex-col md:flex-row h-full">
        <div className="relative w-full md:w-[46%] lg:w-[42%] h-48 sm:h-56 md:h-[240px] lg:h-[260px]">
          <div className="h-full w-full rounded-xl bg-white/10 animate-pulse" />
        </div>
        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="pt-3">
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Hero() {
  // NENHUM MOCK: começa vazio e “loading=true”
  const [items, setItems] = useState<NewsCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        setLoading(true)
        // sempre pegar os 3 MAIS RECENTES de todas as categorias
        const json = await fetchJson(
          '/api/wp/news?sport=todos&per_page=3&orderby=date&order=desc'
        )
        const list: NewsCard[] = Array.isArray(json?.items) ? json.items : []
        if (!canceled) setItems(list.slice(0, 3))
      } catch {
        if (!canceled) setItems([])
      } finally {
        if (!canceled) setLoading(false)
      }
    })()
    return () => { canceled = true }
  }, [])

  // Nunca preenche com mock: se não vier item, continua skeleton
  const [first, second, third] = useMemo(() => {
    const a = Array.isArray(items) ? items.slice(0, 3) : []
    return [a[0], a[1], a[2]]
  }, [items])

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
            href="/latest/todos"
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white"
          >
            Ver todos
            <HiOutlinePlay className="h-5 w-5 text-orange-300 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.12fr_1fr]">
          {/* ESQUERDA */}
          {loading || !first ? (
            <BigSkeleton />
          ) : (
            <article className="overflow-hidden">
              <div className="relative h-[220px] sm:h-[360px] md:h-[400px] lg:h-[430px]">
                <Image
                  src={first.image ?? '/noticia1.jpg'}
                  alt={first.titulo || 'Notícia'}
                  fill
                  className="object-cover object-center "
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 60vw, 720px"
                  priority
                />
              </div>

              <div className="space-y-3 p-5">
                <p className="text-[11px] sm:text-[12px] text-gray-400">
                  <span className="font-semibold text-orange-400">
                    {first.categoria || 'Futebol'}
                  </span>{' '}
                  | {first.data || ''}
                </p>
                <h2 className="text-[15px] sm:text-lg md:text-xl font-semibold text-white leading-snug">
                  {first.titulo}
                </h2>
                <p className="text-[13px] sm:text-sm text-gray-300">{first.resumo}</p>
                <Link
                  href={first.hrefPost || '/latest/todos'}
                  className="inline-block bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 mb-10"
                >
                  Ver mais
                </Link>
              </div>
            </article>
          )}

          {/* DIREITA */}
          <div className="grid grid-rows-2 gap-6">
            {loading || !second ? (
              <SmallSkeleton />
            ) : (
              <article className="overflow-hidden  ">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="relative w-full md:w-[46%] lg:w-[42%] h-60 sm:h-56 md:h-[240px] lg:h-[360px]">
                    <Image
                      src={second.image ?? '/noticia2.jpg'}
                      alt={second.titulo || 'Notícia'}
                      fill
                      className="object-cover object-center "
                      sizes="(max-width: 768px) 100vw, 320px"
                      priority
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-gray-400">
                        <span className="font-semibold text-orange-400">
                          {second.categoria || 'Futebol'}
                        </span>{' '}
                        | {second.data || ''}
                      </p>
                      <h3 className="mt-1 text-[15px] sm:text-base font-semibold text-white leading-snug">
                        {second.titulo}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-300">
                        {second.resumo}
                      </p>
                    </div>
                    <div className="pt-3">
                      <Link
                        href={second.hrefPost || '/latest/todos'}
                        className="inline-block bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        Ver mais
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {loading || !third ? (
              <SmallSkeleton />
            ) : (
              <article className="overflow-hidden rounded-xl ">
                <div className="flex flex-col md:flex-row h-full">
                  <div className="relative w-full md:w-[46%] lg:w-[42%] h-48 sm:h-56 md:h-[240px] lg:h-[260px]">
                    <Image
                      src={third.image ?? '/noticia2.jpg'}
                      alt={third.titulo || 'Notícia'}
                      fill
                      className="object-cover object-center rounded-xl"
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] sm:text-[12px] text-gray-400">
                        <span className="font-semibold text-orange-400">
                          {third.categoria || 'Futebol'}
                        </span>{' '}
                        | {third.data || ''}
                      </p>
                      <h3 className="mt-1 text-[15px] sm:text-base font-semibold text-white leading-snug">
                        {third.titulo}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-gray-300">
                        {third.resumo}
                      </p>
                    </div>
                    <div className="pt-3">
                      <Link
                        href={third.hrefPost || '/latest/todos'}
                        className="inline-block bg-orange-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-orange-700"
                      >
                        Ver mais
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
