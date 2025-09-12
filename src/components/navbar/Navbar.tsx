'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NavbarDesktop from './NavbarDesktop';
import NavbarMobile from './NavbarMobile';
import LoginPanel from '@/components/LoginPanel';
import {
  FaFutbol,
  FaBasketballBall,
  FaGamepad,
  FaUser,
} from 'react-icons/fa';
import { FaTableTennisPaddleBall } from 'react-icons/fa6';

export type SubItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export type MenuItem = {
  title: string;
  href: string;
  submenu?: SubItem[];
};

/* ===========================
   MENU CONFIG (único lugar)
=========================== */
export const menuItems: MenuItem[] = [
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
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');

  useEffect(() => setMounted(true), []);

  // abre o painel de login se vier ?auth=login|register
  useEffect(() => {
    const auth = searchParams.get('auth');
    if (!auth) return;
    setLoginTab(auth === 'register' ? 'register' : 'login');
    setLoginOpen(true);
    router.replace(pathname || '/', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openLogin = (tab: 'login' | 'register' = 'login') => {
    setLoginTab(tab);
    setLoginOpen(true);
  };

  const scrollToHome = () => {
    if (pathname !== '/') router.push('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  if (!mounted) return null;

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40">
        {/* Desktop */}
        <div className="hidden md:block">
          <NavbarDesktop
            menuItems={menuItems}
            user={user}
            onOpenLogin={openLogin}
            onScrollHome={scrollToHome}
          />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <NavbarMobile
            menuItems={menuItems}
            user={user}
            onOpenLogin={openLogin}
            onScrollHome={scrollToHome}
          />
        </div>
      </div>

      {/* Painel de login lateral */}
      <LoginPanel isOpen={loginOpen} onClose={() => setLoginOpen(false)} initialTab={loginTab} />
    </>
  );
}
