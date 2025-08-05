'use client'

import Image from 'next/image'

const news = [
  {
    title: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    date: '27 de Setembro de 2023 | 10:30',
    tag: 'Portugal',
    tagColor: 'bg-red-600',
    image: '/noticia1.jpg',
  },
  {
    title: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    date: '27 de Setembro de 2023 | 10:30',
    tag: 'Internacional',
    tagColor: 'bg-blue-600',
    image: '/noticia2.jpg',
  },
  {
    title: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    date: '27 de Setembro de 2023 | 10:30',
    tag: 'Transferências',
    tagColor: 'bg-orange-400',
    image: '/noticia3.jpg',
  },
  {
    title: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    date: '27 de Setembro de 2023 | 10:30',
    tag: 'Brasil',
    tagColor: 'bg-green-600',
    image: '/noticia2.jpg',
  },
]

export default function Hero() {
  return (
    <section className="w-full bg-white py-8 px-4 md:px-12 mt-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Card principal */}
        <div className="md:col-span-2 relative group overflow-hidden rounded-lg shadow-lg">
          <Image
            src={news[0].image}
            alt={news[0].title}
            width={1200}
            height={600}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 text-white">
            <h2 className="text-xl font-bold leading-snug">{news[0].title}</h2>
            <div className="flex justify-between items-center mt-2 text-sm">
              <span>Por Autor - {news[0].date}</span>
              <span className={`px-2 py-1 text-xs rounded ${news[0].tagColor}`}>
                {news[0].tag}
              </span>
            </div>
          </div>
        </div>

        {/* Cards secundários */}
        <div className="flex flex-col gap-6">
          {/* Notícia 2 */}
          <div className="relative group overflow-hidden rounded-lg shadow-lg">
            <Image
              src={news[1].image}
              alt={news[1].title}
              width={400}
              height={200}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-white">
              <h3 className="text-sm font-bold">{news[1].title}</h3>
              <div className="flex justify-between items-center mt-1 text-xs">
                <span>Por Autor - {news[1].date}</span>
                <span className={`px-2 py-0.5 rounded ${news[1].tagColor}`}>
                  {news[1].tag}
                </span>
              </div>
            </div>
          </div>

          {/* Notícia 3 */}
          <div className="relative group overflow-hidden rounded-lg shadow-lg">
            <Image
              src={news[2].image}
              alt={news[2].title}
              width={400}
              height={200}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-white">
              <h3 className="text-sm font-bold">{news[2].title}</h3>
              <div className="flex justify-between items-center mt-1 text-xs">
                <span>Por Autor - {news[2].date}</span>
                <span className={`px-2 py-0.5 rounded ${news[2].tagColor}`}>
                  {news[2].tag}
                </span>
              </div>
            </div>
          </div>

          {/* Notícia 4 */}
          <div className="relative group overflow-hidden rounded-lg shadow-lg">
            <Image
              src={news[3].image}
              alt={news[3].title}
              width={400}
              height={200}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 text-white">
              <h3 className="text-sm font-bold">{news[3].title}</h3>
              <div className="flex justify-between items-center mt-1 text-xs">
                <span>Por Autor - {news[3].date}</span>
                <span className={`px-2 py-0.5 rounded ${news[3].tagColor}`}>
                  {news[3].tag}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
