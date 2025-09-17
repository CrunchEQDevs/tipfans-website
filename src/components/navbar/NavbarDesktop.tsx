'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import type { MenuItem } from './Navbar';

type Props = {
  menuItems: MenuItem[];
  user: any;
  onOpenLogin: (tab?: 'login' | 'register') => void;
  onScrollHome: () => void;
};

export default function NavbarDesktop({
  menuItems,
  user,
  onOpenLogin,
  onScrollHome,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (href?: string) => (href ? pathname.startsWith(href) : false);

  return (
    <header className="w-full">
      {/* Barra preta com LOGO */}
      <div className="bg-[#1E1E1E] py-3 2xl:py-5">
        <div className="w-full max-w-6xl mx-0 sm:mx-4 md:mx-8 lg:mx-12 lg:p-0 xl:mx-48  px-4 sm:px-6 md:px-8 flex items-center">
          <Link href="/" onClick={onScrollHome} className="block">
            <Image
              src="/Logo_TipFans.png"
              alt="Logo TipFans"
              width={450}
              height={60}
              className="h-auto cursor-pointer max-w-[300px] 2xl-w-[350px] p-0 m-0"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Barra azul com MENU central + ações à direita */}
      <nav className="bg-[#1E10C7] text-white">
        <div className="max-w-7xl mx-auto px-6 py-0 flex items-center gap-6">
          {/* MENU (CENTRO) */}
          <div className="flex-1 flex items-center justify-center gap-10 text-xl uppercase tracking-wide font-bold">
            {menuItems.map((item) => (
              <div
                key={item.title}
                className="group relative"
                onMouseEnter={() => setOpenMenu(item.title)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  onClick={(e) => {
                    if (item.submenu?.length && (!item.href || item.href === '//' || item.href === '#')) {
                      e.preventDefault();
                      setOpenMenu(openMenu === item.title ? null : item.title);
                      return;
                    }
                    if (item.href && item.href !== '//') router.push(item.href);
                  }}
                  aria-expanded={openMenu === item.title}
                  className={[
                    'transition hover:text-yellow-300 inline-flex items-center gap-2',
                    isActive(item.href) ? 'text-yellow-300' : '',
                  ].join(' ')}
                >
                  {item.title}
                </button>

                {/* Submenu (mega) */}
                <AnimatePresence>
                  {openMenu === item.title && item.submenu && (
                    <motion.div
                      className="absolute left-1/2 top-full z-50 mt-3 w-[560px] -translate-x-1/2"
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                    >
                      <div className="rounded-2xl border border-white/10 bg-neutral-900/90 backdrop-blur-xl shadow-2xl shadow-black/40">
                        <div className="grid grid-cols-2 gap-1 p-3">
                          {item.submenu.map((sub, i) => (
                            <Link
                              key={i}
                              href={sub.href}
                              className="group flex items-center gap-3 rounded-xl px-3 py-3 text-white/90 hover:bg-white/10"
                            >
                              <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-white">
                                <span className="text-[16px] leading-none [&_svg]:align-middle">
                                  {sub.icon}
                                </span>
                              </span>
                              <span className="text-[16px] font-medium group-hover:text-white">
                                {sub.label}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* AÇÕES (DIREITA) */}
          <div className="ml-auto flex items-center gap-4">
            {/* Pesquisa desktop */}
            <div className="relative flex items-center text-xl">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Pesquisar"
                className="w-12 h-12 hover:bg-white/30 grid place-items-center rounded"
              >
                <FaSearch className="text-white" />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.input
                    key="search-input-right"
                    type="text"
                    placeholder="Pesquisar…"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 160, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.25 }}
                    className="ml-2 px-3 py-1 rounded bg-white/95 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none"
                    autoFocus
                    onBlur={() => setSearchOpen(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center gap-3 text-xl">
                <span className="hidden lg:inline">👋 Olá, {user.name?.split(' ')[0] || 'User'}</span>
                <button
                  onClick={() => router.push('/perfil')}
                  className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white font-bold text-sm"
                >
                  Perfil
                </button>
                <Link href="/logout" className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white font-bold text-sm">
                  Sair
                </Link>
              </div>
            ) : (
              <div className="flex gap-2 text-xl font-bold">
                <button
                  onClick={() => onOpenLogin('login')}
                  className="bg-[#1E1E1E] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-1.5 text-white rounded text-xl "
                >
                  Entrar
                </button>
                <Link
                  href="/registro"
                  className="bg-[#ff4500] hover:bg-gray-700 font-bold transition px-4 py-1.5 text-white rounded text-xl"
                >
                  Registar
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
