'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaSearch,
  FaBars,
  FaTimes,
  FaDiscord,
  FaFutbol,
  FaBasketballBall,
  FaGamepad,
  FaUser,
  FaMoon,
} from 'react-icons/fa';
import { FaXTwitter } from "react-icons/fa6";
import { FaTableTennisPaddleBall } from 'react-icons/fa6';
import { BsSun } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPanel from './LoginPanel';
import { useAuth } from '@/context/AuthContext';

/* ===========================
   MENU (títulos SEM ícones)
   — Ícones só nos subitens
=========================== */
const menuItems = [
  {
    title: 'ÚLTIMAS',
    href: '/latest',
    submenu: [
      { label: 'Futebol', href: '/latest/futebol', icon: <FaFutbol /> },
      { label: 'Tênis', href: '/latest/tennis', icon: <FaTableTennisPaddleBall /> },
      { label: 'Basquete', href: '/latest/basketball', icon: <FaBasketballBall /> },
      { label: 'E-sports', href: '/latest/esports', icon: <FaGamepad /> },
    ],
  },
  {
    title: 'TIPS',
    href: '/tips/dicas/futebol',
    submenu: [
      { label: 'Futebol', href: '/tips/futebol', icon: <FaFutbol /> },
      { label: 'Ténis', href: '/tips/tenis', icon: <FaTableTennisPaddleBall /> },
      { label: 'Basquete', href: '/tips/basquete', icon: <FaBasketballBall /> },
      { label: 'Esports', href: '/tips/esports', icon: <FaGamepad /> },
      { label: 'Dicas de Hoje', href: '/tips/dicas/futebol?when=today', icon: <FaFutbol /> },
      { label: 'Dicas de Amanhã', href: '/tips/dicas/futebol?when=tomorrow', icon: <FaFutbol /> },
      { label: 'Em Breve', href: '/tips/dicas/futebol?when=soon', icon: <FaFutbol /> },
    ],
  },
  {
    title: 'TIPSTERS',
    href: '/tipsters',
    submenu: [
      { label: 'Nuno Cunha', href: '/tipsters/nunocunha', icon: <FaUser /> },
      { label: 'Domenico Pepe', href: '/tipsters/domenicopepe', icon: <FaUser /> },
      { label: 'Amanda Vidigal', href: '/tipsters/amandavidigal', icon: <FaUser /> },
    ],
  },
  {
    title: 'DESAFIOS',
    href: '/challenges',
    submenu: [
      { label: 'Página de Desafios', href: '/challenges', icon: <FaGamepad /> },
      { label: 'Ranking de Desafios', href: '/challenges/ranking', icon: <FaGamepad /> },
    ],
  },
  {
    title: 'COMUNIDADE',
    href: '/community',
    submenu: [{ label: 'Links das redes sociais', href: '/community', icon: <FaUser /> }],
  },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);
  const isActive = (href: string) => pathname.startsWith(href);

  const scrollToHome = () => {
    if (pathname !== '/') router.push('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <>
      <header className="w-full fixed inset-x-0 top-0 z-50">
        {/* TOP BAR */}
        <div className="bg-[#1E1E1E] px-4 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-4 ml-10 md:ml-64 mt-3 mb-[13px]">
            {mounted && (
              <Image
                onClick={scrollToHome}
                src="/Logo_TipFans.png"
                alt="Logo TipFans"
                width={220}
                height={60}
                className="h-auto cursor-pointer"
                priority
              />
            )}
          </div>

          {/* Redes (desktop) — levemente mais alto */}
          <div className="hidden md:flex items-center gap-3 text-black text-lg mr-80 -mt-10">
            <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
              <FaDiscord className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            </a>
            <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
              <FaFacebookF className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            </a>
            <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
              <FaInstagram className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            </a>
            <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
             <FaXTwitter className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            </a>
            <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
              <FaYoutube className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            </a>
          </div>

          {/* Botão hamburguer (mobile) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-white text-2xl"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* NAV PRINCIPAL — bg azul (relative para o mega-submenu) */}
        <nav ref={navRef} className="relative bg-[#1E10C7] text-white py-3 px-4 w-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Toggle: SOL (branco) + LUA (laranja) sempre visíveis */}
            <div className="flex items-center">
              <div className=" p-1 flex items-center gap-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-8 h-8 rounded-full grid place-items-center ${
                    theme === 'light' ? ' text-black' : 'text-white'
                  }`}
                  aria-label="Modo claro"
                  title="Modo claro"
                >
                  <BsSun className="text-white" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-8 h-8 rounded-full grid place-items-center ${
                    theme === 'dark' ? ' text-black' : ''
                  }`}
                  aria-label="Modo escuro"
                  title="Modo escuro"
                >
                  <FaMoon className="text-[#ED4F00]" />
                </button>
              </div>
            </div>

            {/* MENU DESKTOP (títulos SEM ícones) */}
            <div className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wide">
              {menuItems.map((item) => (
                <div
                  key={item.title}
                  className="group"
                  onMouseEnter={() => setOpenMenu(item.title)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    onClick={() => router.push(item.href)}
                    className={[
                      'transition hover:text-yellow-300',
                      isActive(item.href) ? 'text-yellow-300' : '',
                    ].join(' ')}
                  >
                    {item.title}
                  </button>

                  {/* ===== Mega-submenu FULL-WIDTH ===== */}
                  <AnimatePresence>
                    {openMenu === item.title && (
                      <motion.div
                        className="absolute left-0 right-0 top-full"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                      >
                    <div className="w-full bg-[#1E10C7] border-t border-[#1E10C7] shadow-lg">
                        <div className="mx-auto px-4 py-3 flex flex-col gap-1 items-center">
                            {item.submenu.map((sub, i) => (
                            <Link
                                key={i}
                                href={sub.href}
                                className="px-3 py-2 inline-flex items-center gap-2 text-[#ED4F00] hover:bg-white/10 rounded transition"
                            >
                                <span className="inline-flex w-4 h-4 items-center justify-center text-white">
                                <span className="[&_svg]:w-4 [&_svg]:h-4 [&_svg]:align-middle">
                                    {sub.icon}
                                </span>
                                </span>
                                <span className="whitespace-nowrap">{sub.label}</span>
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

            {/* PESQUISA + LOGIN */}
            <div className="flex items-center gap-4">
              {/* Botão redondo; expande input ao clicar */}
              <div className="relative flex items-center">
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Pesquisar"
                  className="w-8 h-8  bg-white/20 hover:bg-white/30 grid place-items-center"
                >
                  <FaSearch className="text-white" />
                </button>

                <AnimatePresence>
                  {searchOpen && (
                    <motion.input
                      key="search-input"
                      type="text"
                      placeholder="Pesquisar…"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
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
                <div className="hidden sm:flex items-center gap-3 text-sm">
                  <span className="hidden md:inline">👋 Olá, {user.name.split(' ')[0]}</span>
                  <Link href="/perfil" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white">
                    Perfil
                  </Link>
                  <Link href="/logout" className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">
                    Sair
                  </Link>
                </div>
              ) : (
                <div className="hidden sm:flex gap-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="bg-[#1E1E1E] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-1.5 text-white text-sm rounded flex items-center gap-2"
                  >
                    Entrar
                  </button>
                  <Link
                    href="/registro"
                    className="bg-[#ff4500] hover:bg-gray-700 font-bold transition px-4 py-1.5 text-white text-sm rounded flex items-center gap-2"
                  >
                    Registar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MENU MOBILE */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden px-4 py-4 bg-[#1E1E1E] dark:bg-black space-y-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {/* Pesquisa mobile */}
              <div className="flex items-center">
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Pesquisar"
                  className="w-9 h-9 rounded-full bg-white/20 grid place-items-center mr-2"
                >
                  <FaSearch className="text-white" />
                </button>
                <AnimatePresence>
                  {searchOpen && (
                    <motion.input
                      key="search-input-m"
                      type="text"
                      placeholder="Pesquisar…"
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ type: 'tween', duration: 0.25 }}
                      className="px-3 py-2 rounded bg-white/95 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Itens do menu */}
              {menuItems.map((item) => (
                <div key={item.title} className="space-y-2">
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-bold uppercase text-sm tracking-wide text-white"
                  >
                    {item.title}
                  </Link>

                  {/* Submenu azul largo com grid responsivo e ícones laranja */}
                  <div className="bg-[#1E10C7] rounded-md p-2">
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-1">
                      {item.submenu.map((sub, i) => (
                        <Link
                          href={sub.href}
                          key={i}
                          onClick={() => setMobileOpen(false)}
                          className="inline-flex items-center gap-2 px-2 py-2 rounded hover:bg-white/10"
                        >
                          <span className="inline-flex w-4 h-4 items-center justify-center text-[#FF4500]">
                            <span className="[&_svg]:w-4 [&_svg]:h-4 [&_svg]:align-middle">{sub.icon}</span>
                          </span>
                          <span className="text-[#FF4500]">{sub.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Redes sociais no mobile */}
              <div className="pt-2 border-t border-white/10">
                <p className="text-xs uppercase tracking-widest text-white/70 mb-2">Siga-nos</p>
                <div className="flex items-center gap-3">
                  <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
                    <FaDiscord className="bg-white w-8 h-8 p-1.5 rounded" />
                  </a>
                  <a aria-label="Facebook" href="https://facebook.com" target="_blank" rel="noreferrer">
                    <FaFacebookF className="bg-white w-8 h-8 p-1.5 rounded" />
                  </a>
                  <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
                    <FaInstagram className="bg-white w-8 h-8 p-1.5 rounded" />
                  </a>
                  <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
                    <FaYoutube className="bg-white w-8 h-8 p-1.5 rounded" />
                  </a>
                </div>
              </div>

              {/* CTA login/registro no mobile */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex-1 bg-[#1E1E1E] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-2 text-white text-sm rounded"
                >
                  Entrar
                </button>
                <Link
                  href="/registro"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center bg-[#ff4500] hover:bg-gray-700 font-bold transition px-4 py-2 text-white text-sm rounded"
                >
                  Registar
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Painel de login lateral */}
      <LoginPanel isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
