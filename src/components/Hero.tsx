// src/components/Hero2.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchHeroSlides, type HeroSlide } from '@/lib/fetchHeroSlides'

const FALLBACK: HeroSlide[] = [
  { title: 'Como funcionam os contratos publicitários dos jogadores de futebol', description: 'Lorem Ipsum…', image: '/noticia3.jpg', href: '/tips/futebol' },
  { title: 'Ranking dos Tipsters Atualizado!', description: 'Veja quem lidera…', image: '/noticia2.jpg', href: '/tips/basquete' },
  { title: 'Participe dos Desafios Semanais', description: 'Ganhe tokens…', image: '/noticia3.jpg', href: '/tips/tenis' },
]

export default function Hero2() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [index, setIndex] = useState(0)

  // Busca do WP
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await fetchHeroSlides(3)
        if (alive) setSlides(data.length ? data : FALLBACK)
      } catch {
        if (alive) setSlides(FALLBACK)
      }
    })()
    return () => { alive = false }
  }, [])

  // autoplay
  useEffect(() => {
    const size = Math.max(slides.length, 1)
    const t = setInterval(() => setIndex(prev => (prev + 1) % size), 7000)
    return () => clearInterval(t)
  }, [slides.length])

  const active = useMemo(() => (slides.length ? slides : FALLBACK), [slides])
  const cur = active[index % active.length]
  const targetHref = cur?.href || '/tips/futebol'

  return (
    <section className="relative w-full h-[56vh] sm:h-[58vh] md:h-[60vh] lg:h-[90vh] 2xl:h-[90vh] overflow-hidden bg-black">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={cur?.title || 'fallback'}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          {cur?.image && (
            <Image
              src={cur.image}
              alt={cur.title}
              fill
              sizes="100vw"
              className="object-cover z-0"
              priority
            />
          )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 sm:h-96 bg-gradient-to-t from-black/90 to-transparent z-10" />

       <div className="absolute inset-0 z-20 flex items-end justify-start pb-12 sm:pb-16 lg:pb-10">
  {/* <<< AJUSTE DE RESPONSIVIDADE AQUI >>> */}
  <div className="w-full max-w-6xl mx-0 sm:mx-4 md:mx-8 lg:mx-12 xl:mx-40 px-4 sm:px-6 md:px-8">
    <div className="p-6 sm:p-8 md:p-10 rounded-lg text-left">
      {/* TÍTULO */}
      <h2 className="text-left text-white font-bold text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl line-clamp-2">
        {cur?.title}
      </h2>

      {/* DESCRIÇÃO */}
      {cur?.description && (
        <p className="mt-4 text-left text-white/90 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl line-clamp-2">
          {cur?.description}
        </p>
      )}

      {/* BOTÃO */}
      <Link
        href={targetHref}
        className="mt-6 inline-block px-5 py-2 md:px-6 md:py-3 bg-[#ED4F00] text-white text-base sm:text-lg md:text-xl xl:text-2xl 2xl:text-3xl font-semibold rounded hover:opacity-90 transition"
      >
        Saiba mais
      </Link>
    </div>
  </div>
</div>




          <Link href={targetHref} aria-label="Abrir página" className="absolute inset-0 z-30" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {active.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-1 w-4 rounded-full transition-all duration-300 ${i === index ? 'bg-[#ED4F00] w-8' : 'bg-gray-400'}`}
          />
        ))}
      </div>
    </section>
  )
}
