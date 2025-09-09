'use client';

import Image from 'next/image';
import { FaCrown } from 'react-icons/fa';

export default function Loja() {
  const items = [
    { id: 'badge-pro',   title: 't-shirt - Black',  price: 120, img: '/loja/t-shirt 1.png', tag: 'Emblema' },
    { id: 'avatar-neon', title: 't-shirt - Banner', price: 200, img: '/loja/t-shirt 2.png', tag: 'Avatar'  },
    { id: 'boost-7d',    title: 't-shirt - white',  price: 300, img: '/loja/t-shit 3.png',  tag: 'Boost'   },
    { id: 'badge-master',title: 'Boné',             price: 450, img: '/loja/bone.png',      tag: 'Emblema' },
    { id: 'avatar-pro',  title: 'casaco',           price: 220, img: '/loja/casaco1.png',   tag: 'Avatar'  },
    { id: 'boost-30d',   title: 'casaco',           price: 900, img: '/loja/casaco2.png',   tag: 'Boost'   },
  ];

  return (
    <section className="max-w-5xl mx-auto px-4 md:px-6">
      <div className="rounded-xl border border-white/10 bg-[#1E1E1E] p-6 text-gray-100">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Loja</h2>
          <div className="text-xs flex items-center gap-2 text-gray-300">
            <span>Saldo</span>
            <FaCrown className="opacity-90" />
            <span className="font-semibold">100</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-5">
          Troque as suas moedas por Bones e T-shirts.
        </p>

        {/* Grid de itens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-white/10 bg-[#2A2A2A] overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition"
            >
              <div className="relative aspect-[12/11]">
                <Image src={item.img} alt={item.title} fill className="object-cover" />
                <span className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-md bg-black/60 text-white/90">
                  {item.tag}
                </span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold">{item.title}</h3>

                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs opacity-90 inline-flex items-center gap-1">
                    <FaCrown /> {item.price} moedas
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-orange-600 hover:bg-orange-500 transition"
                    onClick={() => alert(`Item selecionado: ${item.title}`)}
                  >
                    Adquirir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Observação */}
        <p className="mt-4 text-[11px] text-gray-400">
          A compra é feita através das coins.
        </p>
      </div>
    </section>
  );
}
