'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaSearch,
  FaBars,
  FaTimes,
  FaDiscord,
  FaUser,
  FaChevronDown,
} from 'react-icons/fa';
import type { MenuItem } from './Navbar';

type Props = {
  menuItems: MenuItem[];
  user: any;
  onOpenLogin: (tab?: 'login' | 'register') => void;
  onScrollHome: () => void;
};

export default function NavbarMobile({
  menuItems,
  user,
  onOpenLogin,
  onScrollHome,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchOpenM, setSearchOpenM] = useState(false);

  return (
    <header className="w-full">
      {/* Top bar preta com logo + ícones */}
      <div className="bg-[#1E1E1E] px-4 py-3 flex justify-between items-center">
        {/* LOGO */}
        <div className="flex items-center">
          <Link href="/" onClick={onScrollHome}>
            <Image
                src="/Logo_TipFans.png"
                alt="Logo TipFans"
                width={200}
                height={48}
                className="h-auto cursor-pointer"
                priority
            />
            </Link>
        </div>

        {/* Ícones à direita */}
        <div className="flex items-center gap-3">
          {/* Avatar/Login */}
          {user ? (
            <Link
              href="/perfil"
              aria-label="Perfil"
              className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-white"
            >
              <FaUser />
            </Link>
          ) : (
            <button
              onClick={() => onOpenLogin('login')}
              aria-label="Entrar"
              className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-white"
            >
              <FaUser />
            </button>
          )}

          {/* Busca */}
          <div className="relative">
            <button
              onClick={() => setSearchOpenM((v) => !v)}
              aria-label="Pesquisar"
              className="grid place-items-center w-9 h-9 rounded-full bg-white/10 text-white"
            >
              <FaSearch />
            </button>
            <AnimatePresence>
              {searchOpenM && (
                <motion.input
                  key="search-input-mobile"
                  type="text"
                  placeholder="Pesquisar…"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 180, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'tween', duration: 0.22 }}
                  className="absolute right-0 top-10 px-3 py-2 rounded bg-white text-gray-900 placeholder:text-gray-500 text-sm shadow-lg focus:outline-none"
                  autoFocus
                  onBlur={() => setSearchOpenM(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Hamburguer */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="text-white text-2xl"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Menu expansível */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="px-6 py-8 bg-neutral-900/80 backdrop-blur-md space-y-2 border-t border-white/10"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {menuItems.map((item) => {
              const opened = mobileExpanded === item.title;
              return (
                <div key={item.title} className="rounded-xl border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setMobileExpanded(opened ? null : item.title)}
                    className="w-full flex items-center justify-between px-3 py-3 text-white font-semibold uppercase tracking-wide"
                    aria-expanded={opened}
                    aria-controls={`m-sub-${item.title}`}
                  >
                    <span>{item.title}</span>
                    <FaChevronDown className={`transition-transform ${opened ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence initial={false}>
                    {opened && item.submenu && (
                      <motion.div
                        id={`m-sub-${item.title}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'tween', duration: 0.2 }}
                        className="bg-neutral-900/90"
                      >
                        <div className="p-2 grid grid-cols-1 xs:grid-cols-2 gap-2">
                          {item.submenu.map((sub, i) => (
                            <Link
                              key={i}
                              href={sub.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"
                            >
                              <span className="grid h-7 w-7 place-items-center rounded text-[#ED4F00]">
                                <span className="text-[16px] leading-none [&_svg]:align-middle">
                                  {sub.icon}
                                </span>
                              </span>
                              <span className="text-white text-sm">{sub.label}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Redes sociais */}
            <div className="pt-3 border-t border-white/10">
              <p className="text-xs uppercase tracking-widest text-white mb-2">Siga-nos</p>
              <div className="flex items-center gap-3">
                <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
                  <FaDiscord className="text-white w-8 h-8 p-1.5 rounded" />
                </a>
                <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
                  <FaFacebookF className="text-white w-8 h-8 p-1.5 rounded" />
                </a>
                <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
                  <FaInstagram className="text-white w-8 h-8 p-1.5 rounded" />
                </a>
                <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
                  <FaYoutube className="text-white w-8 h-8 p-1.5 rounded" />
                </a>
              </div>
            </div>

            {/* CTA login/registro ou perfil/logout */}
            {user ? (
              <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
                <p className="text-white text-sm">👋 Olá, {user.name?.split(' ')[0] || 'User'}</p>
                <Link
                  href="/perfil"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm"
                >
                  Perfil
                </Link>
                <Link
                  href="/logout"
                  onClick={() => setMobileOpen(false)}
                  className="w-full text-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm"
                >
                  Sair
                </Link>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenLogin('login')}
                  className="flex-1 bg-[#1E10C7] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-2 text-white text-sm rounded"
                >
                  Entrar
                </button>
                <Link
                  href="/registro"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-[#ED4F00] hover:bg-gray-700 font-bold transition px-4 py-2 text-white text-sm rounded"
                >
                  Registar
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
