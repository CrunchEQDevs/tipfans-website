'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { FaXTwitter, FaTableTennisPaddleBall } from 'react-icons/fa6';
import { BsSun } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPanel from './LoginPanel';
import { useAuth } from '@/context/AuthContext';

/* ===========================
   MENU CONFIG
=========================== */
const menuItems = [
  {
    title: 'ÚLTIMAS',
    href: '',
    submenu: [
      { label: 'Futebol', href: '/latest/futebol', icon: <FaFutbol /> },
      { label: 'Tênis', href: '/latest/tennis', icon: <FaTableTennisPaddleBall /> },
      { label: 'Basquete', href: '/latest/basketball', icon: <FaBasketballBall /> },
      { label: 'E-sports', href: '/latest/esports', icon: <FaGamepad /> },
    ],
  },
  {
    title: 'TIPS',
    href: '//',
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
    href: '',
    submenu: [
      { label: 'Nuno Cunha', href: '/tipsters/nunocunha', icon: <FaUser /> },
      { label: 'Domenico Pepe', href: '/tipsters/domenicopepe', icon: <FaUser /> },
      { label: 'Amanda Vidigal', href: '/tipsters/amandavidigal', icon: <FaUser /> },
    ],
  },
  {
    title: 'DESAFIOS',
    href: '',
    submenu: [
      { label: 'Página de Desafios', href: '/challenges', icon: <FaGamepad /> },
      { label: 'Ranking de Desafios', href: '/challenges/ranking', icon: <FaGamepad /> },
    ],
  },
  {
    title: 'COMUNIDADE',
    href: '',
    submenu: [{ label: 'Links das redes sociais', href: '/community', icon: <FaUser /> }],
  },
];

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login'); // << novo
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams(); // << novo
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);
  const isActive = (href: string) => (href ? pathname.startsWith(href) : false);

  // Abre o painel conforme a query (?auth=register|login)
  useEffect(() => {
    const auth = searchParams.get('auth');
    if (!auth) return;
    setLoginTab(auth === 'register' ? 'register' : 'login');
    setLoginOpen(true);
    // limpa a query para não reabrir ao navegar
    router.replace(pathname || '/', { scroll: false });
  }, [searchParams, router, pathname]);

  const scrollToHome = () => {
    if (pathname !== '/') router.push('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <>
      <header className="w-full fixed inset-x-0 top-0 z-50">
        {/* TOP BAR */}
        <div className="bg-[#1E1E1E] px-4 py-4 flex justify-between items-center ">
          {/* Logo */}
          <div className="flex items-center gap-4 ml-10 md:ml-64 mt-3 p-[11px]">
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

          {/* Redes (desktop) */}
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
            <a aria-label="X" href="https://twitter.com" target="_blank" rel="noreferrer">
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

        {/* NAV PRINCIPAL (tema + busca na MESMA LINHA) */}
        <nav ref={navRef} className="relative bg-[#1E10C7] text-white py-3 px-4 w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Tema + Busca (sempre lado a lado) */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`w-8 h-8 rounded-full grid place-items-center ${
                    theme === 'light' ? 'text-black' : 'text-white'
                  }`}
                  aria-label="Modo claro"
                  title="Modo claro"
                >
                  <BsSun className="text-white" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`w-8 h-8 rounded-full grid place-items-center ${
                    theme === 'dark' ? 'text-black' : ''
                  }`}
                  aria-label="Modo escuro"
                  title="Modo escuro"
                >
                  <FaMoon className="text-[#ED4F00]" />
                </button>
              </div>

              {/* Busca ao lado — input só aparece em sm+ */}
              <div className="relative flex items-center shrink-0">
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Pesquisar"
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 grid place-items-center"
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
                      className="ml-2 hidden sm:block px-3 py-1 rounded bg-white/95 text-gray-900 placeholder:text-gray-500 text-sm focus:outline-none"
                      autoFocus
                      onBlur={() => setSearchOpen(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* MENU DESKTOP */}
            <div className="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wide">
              {menuItems.map((item) => (
                <div
                  key={item.title}
                  className="group relative"
                  onMouseEnter={() => setOpenMenu(item.title)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    onClick={() => item.href && router.push(item.href)}
                    className={[
                      'transition hover:text-yellow-300 inline-flex items-center gap-2',
                      isActive(item.href) ? 'text-yellow-300' : '',
                    ].join(' ')}
                  >
                    {item.title}
                  </button>

                  {/* Submenu desktop com ícones */}
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
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white">
                                  <span className="text-[16px] leading-none [&_svg]:align-middle">
                                    {sub.icon}
                                  </span>
                                </span>
                                <span className="text-[13px] font-medium group-hover:text-white">
                                  {sub.label}
                                </span>
                              </Link>
                            ))}
                          </div>

                          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                            <span className="text-xs text-white/60">Descubra mais conteúdos</span>
                            <div className="flex items-center gap-2 text-white/90">
                              <a aria-label="Discord" href="https://discord.com" target="_blank" rel="noreferrer">
                                <FaDiscord className="h-5 w-5 hover:text-white" />
                              </a>
                              <a aria-label="X" href="https://twitter.com" target="_blank" rel="noreferrer">
                                <FaXTwitter className="h-5 w-5 hover:text-white" />
                              </a>
                              <a aria-label="Instagram" href="https://instagram.com" target="_blank" rel="noreferrer">
                                <FaInstagram className="h-5 w-5 hover:text-white" />
                              </a>
                              <a aria-label="YouTube" href="https://youtube.com" target="_blank" rel="noreferrer">
                                <FaYoutube className="h-5 w-5 hover:text-white" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* LOGIN / PERFIL */}
            <div className="flex items-center gap-4 ">
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
                    className="bg-[#1E1E1E] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-1.5 text-white text-sm rounded"
                  >
                    Entrar
                  </button>
                  <Link
                    href="/registro"
                    className="bg-[#ff4500] hover:bg-gray-700 font-bold transition px-4 py-1.5 text-white text-sm rounded"
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
              {/* Itens do menu */}
              {menuItems.map((item) => (
                <div key={item.title} className="space-y-2">
                  <Link
                    href={item.href || '#'}
                    onClick={() => setMobileOpen(false)}
                    className="font-bold uppercase text-sm tracking-wide text-white"
                  >
                    {item.title}
                  </Link>

                  {/* FAIXA AZUL — uma linha, com scroll horizontal */}
                  <div className="bg-[#1E10C7] rounded-md p-2">
                    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto py-1">
                      {item.submenu.map((sub, i) => (
                        <Link
                          href={sub.href}
                          key={i}
                          onClick={() => setMobileOpen(false)}
                          className="flex shrink-0 items-center gap-2 rounded bg-white/5 px-3 py-2 hover:bg-white/10"
                        >
                          <span className="grid h-6 w-6 place-items-center rounded bg-white/10 text-white">
                            <span className="text-[14px] leading-none [&_svg]:align-middle">
                              {sub.icon}
                            </span>
                          </span>
                          <span className="text-white text-sm whitespace-nowrap">{sub.label}</span>
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
      <LoginPanel
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        initialTab={loginTab} // << passa a aba correta
      />
    </>
  );
}
