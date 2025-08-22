'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
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
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPanel from './LoginPanel';
import { useAuth } from '@/context/AuthContext';

/* ====== APENAS ESTE BLOCO FOI AJUSTADO (submenu como strings) ====== */
const menuItems = [
  {
    title: 'ÚLTIMAS',
    href: '/latest',
    submenu: [
      { label: 'Futebol', href: '/latest/futebol' },
      { label: 'Tênis', href: '/latest/tennis' },
      { label: 'Basquete', href: '/latest/basketball' },
      { label: 'E-sports', href: '/latest/esports' },
    ],
  },
  {
    title: 'TIPS',
    href: '/tips',
    submenu: [
      { label: 'Futebol', href: '/tips/futebol/' },
      { label: 'Tênis', href: '/tips/tennis' },
      { label: 'Basquete', href: '/tips/basketball' },
      { label: 'Esports', href: '/tips/esports' },
      { label: 'Dicas de Hoje', href: '/tips/hoje' },
      { label: 'Dicas de Amanhã', href: '/tips/amanha' },
      { label: 'Em breve', href: '/tips/embreve' },
    ],
  },    
  {
    title: 'TIPSTERS',
    href: '/tipsters',
    submenu: [
      { label: 'Nuno Cunha', href: '/tipsters/nunocunha' },
      { label: 'Domenico Pepe', href: '/tipsters/domenicopepe' },
      { label: 'Amanda vidigal', href: '/tipsters/amandavidigal' },
    ],
  },
  {
    title: 'DESAFIOS',
    href: '/challenges',
    submenu: [
      { label: 'Página de Desafios', href: '/challenges' },
      { label: 'Ranking de Desafios', href: '/challenges/ranking' },
    ],
  },
  {
    title: 'COMUNIDADE',
    href: '/community',
    submenu: [
      { label: 'Links das redes sociais', href: '/community' },
    ],
  },
];
/* ==================================================================== */

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const scrollToHome = () => {
    if (pathname !== '/') {
      router.push('/');
    }
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <header className="w-full fixed inset-x-0 top-0 z-50">
        {/* Topo */}
        <div className="bg-[#1E1E1E] px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 ml-4 md:ml-32">
            {mounted && (
              <Image
                onClick={scrollToHome}
                src="/Logo_TipFans.png"
                alt="Logo"
                width={220}
                height={60}
                className="h-auto cursor-pointer"
                priority
              />
            )}
          </div>
          <div className=" md:flex items-center gap-3 text-black text-lg mr-32">
            <FaDiscord className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            <FaFacebookF className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            <FaInstagram className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
            <FaYoutube className="cursor-pointer hover:scale-110 transition bg-[#EBEBEB] w-6 h-6 rounded-[3px]" />
          </div>

          {/* Botão hamburguer para mobile */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white text-2xl">
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Barra principal */}
        <nav className="bg-[#1E10C7] text-white py-3 px-4 w-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Dark Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="bg-orange-500 p-1 rounded-full text-white"
                aria-label="Toggle Dark Mode"
              >
                <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} />
              </button>
            </div>

            {/* Menu Desktop */}
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold uppercase tracking-wide">
              {menuItems.map((item) => (
                <div
                  key={item.title}
                  className="relative group"
                  onMouseEnter={() => setOpenMenu(item.title)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    className={`transition hover:text-yellow-300 ${
                      pathname.includes(item.title.toLowerCase()) ? 'text-yellow-300' : ''
                    }`}
                  >
                    {item.title}
                  </button>

                  <AnimatePresence>
                    {openMenu === item.title && (
                      <motion.div
                        className="absolute bg-white dark:bg-gray-900 border border-gray-300 mt-2 py-2 w-56 z-50 shadow-lg rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        {item.submenu.map((subItem, index) => (
                          <a 
                            key={index}
                            href={subItem.href}
                            className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer"
                          >
                            {subItem.label}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Pesquisa e Login */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar"
                  className="pl-8 pr-3 py-1 rounded bg-transparent text-white placeholder:text-gray-400 text-sm focus:outline-none"  />
              </div>

              {user ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="hidden md:inline">👋 Olá, {user.name.split(' ')[0]}</span>
                  <Link href="/perfil" className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-white">Perfil</Link>
                  <Link href="/logout" className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-white">Sair</Link>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setLoginOpen(true)}
                    className="bg-[#1E1E1E] hover:bg-gray-700 font-bold hover:opacity-90 transition px-4 py-1.5 text-white text-sm rounded flex items-center gap-2"
                  >
                    Entrar
                  </button>
                  <Link
                    href="/registro"
                    className="bg-[#ff4500] hover:bg-gray-700 font-bold transition px-4 py-1.5 text-white text-sm rounded flex items-center gap-2 "
                  >
                    Registar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Menu Mobile Expandido */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              className="md:hidden px-4 py-4 bg-[#1E1E1E] dark:bg-black space-y-4 text-rose-700"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              {menuItems.map((item) => (
                <div key={item.title}>
                  <p className="font-bold uppercase text-sm tracking-wide text-brandBlue dark:text-brandOrange">
                    {item.title}
                  </p>
                  <div className="pl-4 space-y-1">
                    {item.submenu.map((subItem, index) => (
                      <a href={`${subItem.href}`}
                        key={index}
                        className="block text-sm opacity-80 text-gray-100 dark:text-gray-100"
                      >
                        {subItem.href}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Painel de login lateral */}
      <LoginPanel isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
