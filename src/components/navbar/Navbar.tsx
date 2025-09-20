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
   MENU BASE (sem nomes fixos)
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
    ],
  },
  {
    title: 'TIPSTERS',
    href: '',
    submenu: [], // será preenchido via API
  },
  {
    title: 'COMUNIDADE',
    href: '/community',
    // sem "submenu" para evitar dropdown e garantir navegação direta
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

  // menu dinâmico (TIPSTERS será preenchido via WP)
  const [dynamicMenu, setDynamicMenu] = useState<MenuItem[]>(menuItems);

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

  // (Opcional) também permite abrir o login via CustomEvent('open-login')
  useEffect(() => {
    const onOpen = () => setLoginOpen(true);
    document.addEventListener('open-login' as any, onOpen);
    return () => document.removeEventListener('open-login' as any, onOpen);
  }, []);

  const openLogin = (tab: 'login' | 'register' = 'login') => {
    setLoginTab(tab);
    setLoginOpen(true);
  };

  const scrollToHome = () => {
    if (pathname !== '/') router.push('/');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  // 🔥 Carrega autores do WordPress (sempre atualizados) e injeta no submenu TIPSTERS
  useEffect(() => {
    let cancel = false;

    async function fetchWpAuthors(): Promise<{ slug: string; name: string }[]> {
      const out: { slug: string; name: string }[] = [];
      let page = 1;
      while (true) {
        const url =
          `/wp-api/wp/v2/users?who=authors&per_page=100&page=${page}` +
          `&orderby=name&order=asc&_fields=slug,name&_=${Date.now()}`;
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error('wp-users-blocked');
        const arr = (await r.json()) as any[];
        for (const u of Array.isArray(arr) ? arr : []) {
          const slug = String(u?.slug || '').trim();
          const name = String(u?.name || u?.display_name || slug).trim();
          if (slug) out.push({ slug, name });
        }
        const totalPages = Number(r.headers.get('x-wp-totalpages') || '1') || 1;
        if (page >= totalPages) break;
        page += 1;
      }
      const map = new Map<string, string>();
      for (const a of out) if (!map.has(a.slug)) map.set(a.slug, a.name);
      return Array.from(map, ([slug, name]) => ({ slug, name }));
    }

    async function loadAuthors() {
      try {
        const fresh = await fetchWpAuthors();
        if (cancel) return;
        if (fresh.length) {
          const authorsSubmenu: SubItem[] = fresh.map((a) => ({
            label: a.name,
            href: `/tipsters/${encodeURIComponent(a.slug)}`,
            icon: <FaUser />,
          }));
          setDynamicMenu((prev) => {
            const copy = prev.map((m) => ({ ...m, submenu: m.submenu ? [...m.submenu] : undefined }));
            const idx = copy.findIndex((m) => m.title.toUpperCase() === 'TIPSTERS');
            if (idx >= 0) copy[idx] = { ...copy[idx], submenu: authorsSubmenu };
            return copy;
          });
          return;
        }
      } catch {
        // fallback abaixo
      }

      try {
        const r = await fetch(`/api/wp/tipsters?_=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return;
        const data = await r.json();
        const listRaw: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.authors)
          ? data.authors
          : [];

        const items = listRaw
          .map((a) => ({
            slug: String(a?.slug || '').trim(),
            name: String(a?.name || a?.display_name || a?.slug || '').trim(),
          }))
          .filter((a) => a.slug && a.name);

        if (cancel || !items.length) return;

        const map = new Map<string, string>();
        for (const a of items) map.set(a.slug, a.name);
        const norm = Array.from(map, ([slug, name]) => ({ slug, name })).sort((a, b) =>
          a.name.localeCompare(b.name, 'pt')
        );

        const authorsSubmenu: SubItem[] = norm.map((a) => ({
          label: a.name,
          href: `/tipsters/${encodeURIComponent(a.slug)}`,
          icon: <FaUser />,
        }));

        setDynamicMenu((prev) => {
          const copy = prev.map((m) => ({ ...m, submenu: m.submenu ? [...m.submenu] : undefined }));
          const idx = copy.findIndex((m) => m.title.toUpperCase() === 'TIPSTERS');
          if (idx >= 0) copy[idx] = { ...copy[idx], submenu: authorsSubmenu };
          return copy;
        });
      } catch {
        // silencioso
      }
    }

    loadAuthors();
    return () => {
      cancel = true;
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-40">
        {/* Desktop */}
        <div className="hidden md:block">
          <NavbarDesktop
            menuItems={dynamicMenu}
            user={user}
            onOpenLogin={openLogin}
            onScrollHome={scrollToHome}
          />
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <NavbarMobile
            menuItems={dynamicMenu}
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
