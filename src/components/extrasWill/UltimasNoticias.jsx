'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

const noticias = [
  {
    id: 1,
    slug: 'contratos-publicitarios-futebol-brasil',
    titulo: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    resumo: 'Entenda como grandes atletas negociam seus contratos com marcas milionárias.',
    autor: 'Por Autor',
    data: '27 de Setembro de 2023 | 10:30',
    imagem: '/ultimas1.jpg',
    categoria: 'Portugal',
  },
  {
    id: 2,
    slug: 'contratos-internacionais-futebol',
    titulo: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    resumo: 'Saiba mais sobre os bastidores das negociações internacionais no futebol.',
    autor: 'Por Autor',
    data: '27 de Setembro de 2023 | 10:30',
    imagem: '/ultimas2.jpg',
    categoria: 'Internacional',
  },
  {
    id: 3,
    slug: 'transferencias-contratos-jogadores',
    titulo: 'Como funcionam os contratos publicitários dos jogadores de futebol',
    resumo: 'Transferências e contratos: o que está por trás das cifras bilionárias?',
    autor: 'Por Autor',
    data: '27 de Setembro de 2023 | 10:30',
    imagem: '/ultimas3.jpg',
    categoria: 'Transferências',
  },
];

const categoryColors = {
  Brasil: 'bg-green-600',
  Internacional: 'bg-blue-600',
  Transferências: 'bg-orange-500',
  Portugal: 'bg-red-600',
};

export default function UltimasNoticias() {
  return (
    <section className="relative py-20 px-4 sm:px-8 lg:px-16 xl:px-24 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 overflow-hidden">
      <h2 className="absolute top-8 left-4 text-[20vw] font-black text-gray-300 dark:text-gray-700 opacity-10 select-none uppercase z-0">
        Últimas
      </h2>

      <div className="relative z-10 flex justify-between items-center mb-12">
        <h3 className="text-3xl md:text-4xl font-extrabold text-gray-800 dark:text-white">Últimas Notícias</h3>
        <Link href="/noticias" className="text-sm font-semibold text-brandBlue hover:underline transition">
          Ver tudo
        </Link>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        {noticias.map((noticia, i) => (
          <motion.div
            key={noticia.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.2 }}
            className="rounded-2xl overflow-hidden shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700 transition-all hover:scale-[1.02]"
          >
            <div className="relative w-full h-60">
              <Image
                src={noticia.imagem}
                alt={noticia.titulo}
                fill
                className="object-cover"
              />
              <span className={`absolute top-3 right-3 px-3 py-1 text-xs font-semibold text-white rounded-full ${categoryColors[noticia.categoria] || 'bg-gray-600'}`}>
                {noticia.categoria}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <h4 className="text-lg font-bold text-gray-800 dark:text-white">{noticia.titulo}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{noticia.resumo}</p>
              <p className="text-xs text-gray-500">{noticia.autor} - {noticia.data}</p>

              <Link
                href={`/noticia/${noticia.slug}`}
                className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brandOrange to-orange-600 rounded-full hover:opacity-90 transition"
              >
                Ver mais <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
