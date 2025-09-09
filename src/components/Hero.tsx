'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Slide = {
  title: string
  description: string
  image: string
  href: string
}

const slides: Slide[] = [
  { title: 'Como funcionam os contratos publicitários dos jogadores de futebol', description: 'Lorem Ipsum...', image: '/noticia3.jpg', href: '/tips/futebol' },
  { title: 'Ranking dos Tipsters Atualizado!', description: 'Veja quem lidera...', image: '/noticia2.jpg', href: '/tips/basquete' },
  { title: 'Participe dos Desafios Semanais', description: 'Ganhe tokens...', image: '/noticia3.jpg', href: '/tips/tenis' },
]

export default function Hero2() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const i = setInterval(() => setIndex(prev => (prev + 1) % slides.length), 7000)
    return () => clearInterval(i)
  }, [])

  const targetHref = slides[index]?.href || '/tips/futebol'

  return (
   <section className="relative w-full h-[56vh] sm:h-[58vh] md:h-[62vh] lg:h-[90vh] overflow-hidden bg-black">

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={slides[index].title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={slides[index].image}
            alt={slides[index].title}
            fill
            sizes="100vw"
            className="object-cover z-0"
            priority
          />

          {/* Gradiente bottom → top (fade out) */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 sm:h-96 bg-gradient-to-t from-black/90 to-transparent z-10" />

          {/* Texto + CTA (ALINHADO À ESQUERDA NO MOBILE) */}
          <div className="absolute inset-0 z-20 flex items-end pb-16 sm:pb-20">
            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="max-w-2xl p-0 sm:p-2 md:p-4 rounded-lg ml-0 md:ml-16 text-left lg:ml-0 2xl:ml-0 ">
                <h2 className="text-white font-bold text-2xl sm:text-3xl md:text-4xl leading-tight ">
                  {slides[index].title}
                </h2>
                <p className="mt-2 text-white/90 text-sm sm:text-base">
                  {slides[index].description}
                </p>

                <Link
                  href={targetHref}
                  className="mt-4 inline-block px-5 py-2 bg-[#ED4F00] text-white text-sm font-semibold rounded hover:opacity-90 transition"
                >
                  Saiba mais
                </Link>
              </div>
            </div>
          </div>

          {/* Overlay: slide inteiro clicável */}
          <Link href={targetHref} aria-label="Abrir página de Tips" className="absolute inset-0 z-30" />
        </motion.div>
      </AnimatePresence>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ir para slide ${i + 1}`}
            className={`h-1 w-4 rounded-full transition-all duration-300 ${
              i === index ? 'bg-[#ED4F00] w-8' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
