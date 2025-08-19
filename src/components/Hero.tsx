'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const slides = [
  {
    title: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    description: 'Lorem Ipsum é simplesmente um texto fictício da indústria de impressão e composição.',
    image: '/noticia3.jpg',
  },
  {
    title: 'Ranking dos Tipsters Atualizado!',
    description: 'Veja quem lidera o ranking semanal de apostas.',
    image: '/noticia2.jpg',
  },
  {
    title: 'Participe dos Desafios Semanais',
    description: 'Ganhe tokens e suba no ranking com suas dicas!',
    image: '/noticia3.jpg',
  },
]

export default function Hero2() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative w-full h-[50vh] overflow-hidden b ">
      <AnimatePresence initial={false}>
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
            layout="fill"
            objectFit="cover"
            className="z-0"
            priority
          />

          {/* Gradiente branco inferior */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />

          {/* Texto sobreposto */}
          <div className="absolute inset-0 flex items-end z-20 px-6 md:px-16 pb-20">
            <div className="max-w-2xl bg-white/80 p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl md:text-4xl font-bold text-black">{slides[index].title}</h2>
              <p className="mt-2 text-gray-700 text-sm md:text-base">{slides[index].description}</p>
              <button className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition">
                Saiba mais
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'bg-purple-700 w-6' : 'bg-gray-400'
            }`}
          />
        ))}
      </div>
    </section>
  )
}
