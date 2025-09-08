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
  FaChevronDown,
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
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => setMounted(true), []);
  const isActive = (href: string) => (href ? pathname.startsWith(href) : false);

  useEffect(() => {
    const auth = searchParams.get('auth');
    if (!auth) return;
    setLoginTab(auth === 'register' ? 'register' : 'login');
    setLoginOpen(true);
    router.replace(pathname || '/', { scroll: false });
  }, [searchParams, router, pathname]);

  const scrollToHome = () => {
    if (pathname !== '/') router.push('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  return (
    <>
      <header className="w-full fixed inset-x-0 top-0 z-50 ">
        {/* TOP BAR */}
        <div className="bg-[#1E1E1E] px-4 py-4 flex justify-between items-center ">
          {/* Logo */}
          <div className="flex items-center gap-4 ml-10 md:ml-44 mt-3 p-[11px]">
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

          {/* Botão hamburguer (mobile) */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-white text-2xl"
            aria-label="Abrir menu"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* NAV PRINCIPAL */}
        <nav ref={navRef} className="relative bg-[#1E10C7] text-white py-3 px-0 sm:px-4 w-full h-[55px]">
          <div className="max-w-7xl mx-auto relative flex items-center gap-4">
            {/* MENU DESKTOP (CENTRADO) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-7 text-sm font-semibold uppercase tracking-wide ">
              {menuItems.map((item) => (
                <div
                  key={item.title}
                  className="group relative "
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
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-orange-600 text-white">
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* PESQUISA + LOGIN / PERFIL (DIREITA) */}
            <div className="ml-auto flex items-center gap-4">
              {/* Botão de pesquisa */}
              <div className="relative hidden sm:flex items-center ">
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  aria-label="Pesquisar"
                  className="w-8 h-8  hover:bg-white/30 grid place-items-center rounded"
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
                      animate={{ width: 150, opacity: 1 }}
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
              className="md:hidden px-8 py-8 bg-neutral-900/80 backdrop-blur-md space-y-2 border-t border-white/10"
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
                      {opened && (
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
                                href={sub.href}
                                key={i}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"
                              >
                                <span className="grid h-7 w-7 place-items-center rounded  text-[#FF4500]">
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

              {/* Redes sociais no mobile */}
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

              {/* CTA login/registro no mobile */}
              <div className="flex gap-2">
                <button
                  onClick={() => setLoginOpen(true)}
                  className="flex-1 bg-[#1E10C7] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-2 text-white text-sm rounded"
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
      <LoginPanel isOpen={loginOpen} onClose={() => setLoginOpen(false)} initialTab={loginTab} />
    </>
  );
}
